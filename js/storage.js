/**
 * Persistent Save-State Manager for TowerDeChess.
 *
 * Features:
 * - Stores unlocked levels, stars per level (overall + per difficulty), and best scores.
 * - Automatically migrates & merges legacy `crownward_progress_v1` saves so no stars are lost.
 * - Dual-layer persistence: synchronous `localStorage` + durable `IndexedDB` mirror.
 * - Portable Base64 Save Code export/import to transfer progress between web, PWA, and Play Store.
 */

const PRIMARY_KEY = 'towerdechess_progress_v1';
const LEGACY_KEYS = ['crownward_progress_v1'];
const IDB_NAME = 'TowerDeChessDB';
const IDB_STORE = 'saves';
const IDB_KEY = 'campaign_progress';

export function createEmptyProgress() {
  return {
    version: 2,
    highestUnlocked: 1,
    stars: {}, // levelId -> best stars across difficulties (0..3)
    starsByDifficulty: {
      standard: {},
      grandmaster: {},
    },
    bestScores: {}, // levelId -> highest score
    updatedAt: Date.now(),
  };
}

function normalizeProgress(raw) {
  const base = createEmptyProgress();
  if (!raw || typeof raw !== 'object') return base;

  base.highestUnlocked = Math.max(1, Number(raw.highestUnlocked) || 1);
  if (raw.stars && typeof raw.stars === 'object') {
    for (const [k, v] of Object.entries(raw.stars)) {
      const n = Math.max(0, Math.min(3, Number(v) || 0));
      if (n > 0) base.stars[k] = n;
    }
  }

  if (raw.starsByDifficulty && typeof raw.starsByDifficulty === 'object') {
    for (const mode of ['standard', 'grandmaster']) {
      const src = raw.starsByDifficulty[mode];
      if (src && typeof src === 'object') {
        for (const [k, v] of Object.entries(src)) {
          const n = Math.max(0, Math.min(3, Number(v) || 0));
          if (n > 0) {
            base.starsByDifficulty[mode][k] = n;
            base.stars[k] = Math.max(base.stars[k] || 0, n);
          }
        }
      }
    }
  } else {
    // Legacy save only had top-level `stars` — mirror into `standard` so nothing looks empty
    for (const [k, v] of Object.entries(base.stars)) {
      base.starsByDifficulty.standard[k] = v;
    }
  }

  if (raw.bestScores && typeof raw.bestScores === 'object') {
    for (const [k, v] of Object.entries(raw.bestScores)) {
      const n = Math.max(0, Number(v) || 0);
      if (n > 0) base.bestScores[k] = n;
    }
  }

  base.updatedAt = Number(raw.updatedAt) || Date.now();
  return base;
}

export function mergeProgress(a, b) {
  const pA = normalizeProgress(a);
  const pB = normalizeProgress(b);
  const out = createEmptyProgress();

  out.highestUnlocked = Math.max(pA.highestUnlocked, pB.highestUnlocked);
  const allStarKeys = new Set([...Object.keys(pA.stars), ...Object.keys(pB.stars)]);
  for (const k of allStarKeys) {
    out.stars[k] = Math.max(pA.stars[k] || 0, pB.stars[k] || 0);
  }

  for (const mode of ['standard', 'grandmaster']) {
    const keys = new Set([
      ...Object.keys(pA.starsByDifficulty[mode]),
      ...Object.keys(pB.starsByDifficulty[mode]),
    ]);
    for (const k of keys) {
      const best = Math.max(
        pA.starsByDifficulty[mode][k] || 0,
        pB.starsByDifficulty[mode][k] || 0
      );
      if (best > 0) {
        out.starsByDifficulty[mode][k] = best;
        out.stars[k] = Math.max(out.stars[k] || 0, best);
      }
    }
  }

  const scoreKeys = new Set([...Object.keys(pA.bestScores), ...Object.keys(pB.bestScores)]);
  for (const k of scoreKeys) {
    out.bestScores[k] = Math.max(pA.bestScores[k] || 0, pB.bestScores[k] || 0);
  }

  out.updatedAt = Math.max(pA.updatedAt, pB.updatedAt);
  return out;
}

function readLocalKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function openDb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readIdb() {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeIdb(progress) {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(progress, IDB_KEY);
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Synchronous load from localStorage + automatic legacy Crownward migration.
 */
export function loadProgressSync() {
  let merged = createEmptyProgress();
  let migrated = false;

  const primary = readLocalKey(PRIMARY_KEY);
  if (primary) {
    merged = mergeProgress(merged, primary);
  }

  for (const legacyKey of LEGACY_KEYS) {
    const legacy = readLocalKey(legacyKey);
    if (legacy) {
      merged = mergeProgress(merged, legacy);
      migrated = true;
    }
  }

  if (migrated) {
    saveProgress(merged);
  }
  return merged;
}

/**
 * Async reconciliation with IndexedDB backup (recovers stars if localStorage was cleared).
 */
export async function hydrateProgressFromBackup(currentProgress) {
  const backup = await readIdb();
  if (!backup) {
    writeIdb(currentProgress);
    return { progress: currentProgress, changed: false };
  }
  const merged = mergeProgress(currentProgress, backup);
  const changed = JSON.stringify(merged.stars) !== JSON.stringify(currentProgress.stars) ||
    merged.highestUnlocked !== currentProgress.highestUnlocked ||
    JSON.stringify(merged.starsByDifficulty) !== JSON.stringify(currentProgress.starsByDifficulty);

  if (changed) {
    saveProgress(merged);
  }
  return { progress: merged, changed };
}

export function saveProgress(progress) {
  const normalized = normalizeProgress(progress);
  normalized.updatedAt = Date.now();
  try {
    localStorage.setItem(PRIMARY_KEY, JSON.stringify(normalized));
  } catch {
    // ignore storage errors
  }
  writeIdb(normalized);
  return normalized;
}

export function recordLevelVictory(progress, { levelId, stars, score, difficulty, totalLevels }) {
  const next = normalizeProgress(progress);
  const key = String(levelId);
  const mode = difficulty === 'grandmaster' ? 'grandmaster' : 'standard';

  next.stars[key] = Math.max(next.stars[key] || 0, stars);
  next.starsByDifficulty[mode][key] = Math.max(next.starsByDifficulty[mode][key] || 0, stars);
  if (score > 0) {
    next.bestScores[key] = Math.max(next.bestScores[key] || 0, Math.round(score));
  }
  if (levelId + 1 <= totalLevels) {
    next.highestUnlocked = Math.max(next.highestUnlocked, levelId + 1);
  }
  return saveProgress(next);
}

export function getStarsForLevel(progress, levelId, difficulty = null) {
  const key = String(levelId);
  if (difficulty && progress?.starsByDifficulty?.[difficulty]) {
    return progress.starsByDifficulty[difficulty][key] || 0;
  }
  return progress?.stars?.[key] || 0;
}

export function getTotalStars(progress, difficulty = null) {
  const map = difficulty
    ? progress?.starsByDifficulty?.[difficulty] || {}
    : progress?.stars || {};
  return Object.values(map).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export function exportSaveCode(progress) {
  const json = JSON.stringify(normalizeProgress(progress));
  return btoa(unescape(encodeURIComponent(json)));
}

export function importSaveCode(code, currentProgress) {
  const cleaned = String(code || '').trim();
  if (!cleaned) throw new Error('Please paste a Save Code first.');
  let parsed;
  try {
    const json = decodeURIComponent(escape(atob(cleaned)));
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid Save Code. Please check that you copied the full code.');
  }
  const merged = mergeProgress(currentProgress, parsed);
  return saveProgress(merged);
}
