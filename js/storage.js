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

const DIFFICULTY_MODES = ['novice', 'master', 'grandmaster'];

export function createEmptyProgress() {
  return {
    version: 4,
    highestUnlocked: 1,
    stars: {}, // levelId -> best stars across difficulties (0..3)
    starsByDifficulty: {
      novice: {},
      master: {},
      grandmaster: {},
    },
    bestScores: {}, // levelId -> highest score
    seenCutscenes: [],
    tacticCharges: {}, // tacticId -> consumable charge count (0..99)
    grantedTacticUnlocks: [], // tacticIds that already received their one-time starter grant
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

  const copyModeStars = (src, targetMode) => {
    if (!src || typeof src !== 'object') return;
    for (const [k, v] of Object.entries(src)) {
      const n = Math.max(0, Math.min(3, Number(v) || 0));
      if (n > 0) {
        base.starsByDifficulty[targetMode][k] = Math.max(base.starsByDifficulty[targetMode][k] || 0, n);
        base.stars[k] = Math.max(base.stars[k] || 0, n);
      }
    }
  };

  if (raw.starsByDifficulty && typeof raw.starsByDifficulty === 'object') {
    const rawVer = Number(raw.version) || 1;
    // Migrate legacy `standard` -> `novice`, and pre-v3 `grandmaster` -> `master`
    copyModeStars(raw.starsByDifficulty.standard, 'novice');
    copyModeStars(raw.starsByDifficulty.novice, 'novice');
    copyModeStars(raw.starsByDifficulty.master, 'master');
    copyModeStars(raw.starsByDifficulty.grandmaster, rawVer < 3 ? 'master' : 'grandmaster');
  } else {
    // Legacy save only had top-level `stars` — mirror into `novice` so nothing looks empty
    for (const [k, v] of Object.entries(base.stars)) {
      base.starsByDifficulty.novice[k] = v;
    }
  }

  if (raw.bestScores && typeof raw.bestScores === 'object') {
    for (const [k, v] of Object.entries(raw.bestScores)) {
      const n = Math.max(0, Number(v) || 0);
      if (n > 0) base.bestScores[k] = n;
    }
  }

  if (Array.isArray(raw.seenCutscenes)) {
    base.seenCutscenes = [...new Set(raw.seenCutscenes.filter((s) => typeof s === 'string'))];
  }

  if (raw.tacticCharges && typeof raw.tacticCharges === 'object') {
    for (const [k, v] of Object.entries(raw.tacticCharges)) {
      const n = Math.max(0, Math.min(99, Math.floor(Number(v) || 0)));
      base.tacticCharges[k] = n;
    }
  }

  if (Array.isArray(raw.grantedTacticUnlocks)) {
    base.grantedTacticUnlocks = [
      ...new Set(raw.grantedTacticUnlocks.filter((s) => typeof s === 'string')),
    ];
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

  for (const mode of DIFFICULTY_MODES) {
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

  out.seenCutscenes = [...new Set([...pA.seenCutscenes, ...pB.seenCutscenes])];
  out.grantedTacticUnlocks = [
    ...new Set([...pA.grantedTacticUnlocks, ...pB.grantedTacticUnlocks]),
  ];

  // Prefer the fresher stockpile when both saves have tactic data so spent charges stay spent
  const aHasTactics =
    pA.grantedTacticUnlocks.length > 0 || Object.keys(pA.tacticCharges).length > 0;
  const bHasTactics =
    pB.grantedTacticUnlocks.length > 0 || Object.keys(pB.tacticCharges).length > 0;
  const tacticSource =
    aHasTactics && bHasTactics
      ? pA.updatedAt >= pB.updatedAt
        ? pA
        : pB
      : aHasTactics
      ? pA
      : pB;
  out.tacticCharges = { ...tacticSource.tacticCharges };

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
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(progress, IDB_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function deleteIdb() {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Permanently wipe all saved progress from localStorage (primary + legacy) and IndexedDB.
 */
export async function clearProgress() {
  const fresh = createEmptyProgress();
  try {
    localStorage.removeItem(PRIMARY_KEY);
    for (const legacyKey of LEGACY_KEYS) {
      localStorage.removeItem(legacyKey);
    }
  } catch {
    // ignore storage errors
  }
  await deleteIdb();
  return fresh;
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

function normalizeMode(difficulty) {
  if (difficulty === 'master' || difficulty === 'grandmaster' || difficulty === 'novice') {
    return difficulty;
  }
  return 'novice';
}

export function recordLevelVictory(
  progress,
  { levelId, stars, score, difficulty, totalLevels, allowUnlockAdvance = true }
) {
  const next = normalizeProgress(progress);
  const key = String(levelId);
  const mode = normalizeMode(difficulty);

  next.stars[key] = Math.max(next.stars[key] || 0, stars);
  next.starsByDifficulty[mode][key] = Math.max(next.starsByDifficulty[mode][key] || 0, stars);
  if (score > 0) {
    next.bestScores[key] = Math.max(next.bestScores[key] || 0, Math.round(score));
  }
  if (allowUnlockAdvance && levelId <= next.highestUnlocked && levelId + 1 <= totalLevels) {
    next.highestUnlocked = Math.max(next.highestUnlocked, levelId + 1);
  }
  return saveProgress(next);
}

export function markCutsceneSeen(progress, cutsceneId) {
  const next = normalizeProgress(progress);
  if (!next.seenCutscenes.includes(cutsceneId)) {
    next.seenCutscenes.push(cutsceneId);
    return saveProgress(next);
  }
  return next;
}

export function getTacticCharges(progress, tacticId) {
  return Math.max(0, Math.floor(Number(progress?.tacticCharges?.[tacticId]) || 0));
}

export function addTacticCharges(progress, tacticId, delta = 1) {
  const next = normalizeProgress(progress);
  const current = Math.max(0, Math.floor(Number(next.tacticCharges[tacticId]) || 0));
  next.tacticCharges[tacticId] = Math.max(0, Math.min(99, current + Math.floor(Number(delta) || 0)));
  return saveProgress(next);
}

export function consumeTacticCharge(progress, tacticId) {
  const next = normalizeProgress(progress);
  const current = Math.max(0, Math.floor(Number(next.tacticCharges[tacticId]) || 0));
  if (current <= 0) {
    return { progress: next, ok: false };
  }
  next.tacticCharges[tacticId] = current - 1;
  return { progress: saveProgress(next), ok: true };
}

export function ensureTacticStarterGrants(progress, unlockedTactics = []) {
  const next = normalizeProgress(progress);
  const newlyGranted = [];
  for (const t of unlockedTactics) {
    if (!t?.id) continue;
    if (!next.grantedTacticUnlocks.includes(t.id)) {
      next.grantedTacticUnlocks.push(t.id);
      const current = Math.max(0, Math.floor(Number(next.tacticCharges[t.id]) || 0));
      const grant = Math.max(1, Number(t.starterCharges) || 2);
      next.tacticCharges[t.id] = Math.min(99, current + grant);
      newlyGranted.push({ tactic: t, amount: grant });
    }
  }
  if (newlyGranted.length > 0) {
    return { progress: saveProgress(next), newlyGranted };
  }
  return { progress: next, newlyGranted: [] };
}

export function getStarsForLevel(progress, levelId, difficulty = null) {
  const key = String(levelId);
  if (difficulty) {
    const mode = normalizeMode(difficulty);
    return progress?.starsByDifficulty?.[mode]?.[key] || 0;
  }
  return progress?.stars?.[key] || 0;
}

export function getTotalStars(progress, difficulty = null) {
  const map = difficulty
    ? progress?.starsByDifficulty?.[normalizeMode(difficulty)] || {}
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
