/**
 * Chess Pattern Geometry & Targeting Engine for Crownward.
 * Computes exact threatened tiles for board overlays and real-time enemy checks.
 */

import { BOARD_SIZE } from '../data/levels.js';

const ORTHO_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const DIAG_DIRS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const ALL_DIRS = [...ORTHO_DIRS, ...DIAG_DIRS];

const KNIGHT_OFFSETS = [
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
];

function inBounds(c, r) {
  return c >= 0 && c < BOARD_SIZE && r >= 0 && r < BOARD_SIZE;
}

/**
 * Returns an array of threatened grid tiles `{ col, row, kind }` for a piece
 * placed at (col, row) with given stats. Used both for tactical preview highlights
 * and targeting geometry.
 */
export function getPatternTiles(col, row, stats) {
  const tiles = [];
  const pattern = stats.pattern;

  if (pattern === 'pawn') {
    for (const [dc, dr] of ORTHO_DIRS) {
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr)) tiles.push({ col: nc, row: nr, kind: 'normal' });
    }
    for (const [dc, dr] of DIAG_DIRS) {
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr)) tiles.push({ col: nc, row: nr, kind: 'crit' });
    }
    return tiles;
  }

  if (pattern === 'king') {
    for (const [dc, dr] of ALL_DIRS) {
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr)) tiles.push({ col: nc, row: nr, kind: 'aura' });
    }
    return tiles;
  }

  if (pattern === 'knight') {
    for (const [dc, dr] of KNIGHT_OFFSETS) {
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr)) tiles.push({ col: nc, row: nr, kind: 'jump' });
    }
    return tiles;
  }

  if (pattern === 'bishop' || pattern === 'rook' || pattern === 'queen') {
    const dirs =
      pattern === 'bishop' ? DIAG_DIRS : pattern === 'rook' ? ORTHO_DIRS : ALL_DIRS;
    const maxRay = stats.maxRay || 6;
    for (const [dc, dr] of dirs) {
      for (let step = 1; step <= maxRay; step++) {
        const nc = col + dc * step;
        const nr = row + dr * step;
        if (!inBounds(nc, nr)) break;
        tiles.push({ col: nc, row: nr, kind: 'ray', dc, dr, step });
      }
    }
    return tiles;
  }

  if (pattern === 'radial') {
    const radius = stats.range || 2.15;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (c === col && r === row) continue;
        const dist = Math.hypot(c - col, r - row);
        if (dist <= radius) {
          tiles.push({ col: c, row: r, kind: 'frost' });
        }
      }
    }
    return tiles;
  }

  return tiles;
}

/**
 * Checks whether an enemy at continuous tile coordinates (ex, ey) — where
 * tile center of (col, row) is (col + 0.5, row + 0.5) — is hitable by a tower.
 * Returns null if out of pattern, or metadata `{ isCrit, dir, dist }`.
 */
export function evaluateTargetHit(tower, stats, enemy) {
  const tx = tower.col + 0.5;
  const ty = tower.row + 0.5;
  const dx = enemy.x - tx;
  const dy = enemy.y - ty;
  const pattern = stats.pattern;

  if (pattern === 'radial') {
    const dist = Math.hypot(dx, dy);
    if (dist <= (stats.range || 2.15) + 0.28) {
      return { dist, isCrit: false };
    }
    return null;
  }

  // Tile-matching check with generous hitbox tolerance so moving enemies feel crisp
  const tolerance = 0.62;

  if (pattern === 'pawn' || pattern === 'king') {
    if (Math.abs(dx) <= 1.55 && Math.abs(dy) <= 1.55) {
      const ec = Math.floor(enemy.x);
      const er = Math.floor(enemy.y);
      const isDiag = Math.abs(ec - tower.col) === 1 && Math.abs(er - tower.row) === 1;
      return { dist: Math.hypot(dx, dy), isCrit: pattern === 'pawn' && isDiag };
    }
    return null;
  }

  if (pattern === 'knight') {
    for (const [oc, or] of KNIGHT_OFFSETS) {
      const tc = tower.col + oc;
      const tr = tower.row + or;
      if (!inBounds(tc, tr)) continue;
      const distToJump = Math.hypot(enemy.x - (tc + 0.5), enemy.y - (tr + 0.5));
      if (distToJump <= 0.72) {
        return { dist: Math.hypot(dx, dy), jumpCol: tc, jumpRow: tr, isCrit: false };
      }
    }
    return null;
  }

  if (pattern === 'rook' || pattern === 'bishop' || pattern === 'queen') {
    const dirs =
      pattern === 'bishop' ? DIAG_DIRS : pattern === 'rook' ? ORTHO_DIRS : ALL_DIRS;
    const maxRay = stats.maxRay || 6;

    for (const [dc, dr] of dirs) {
      const len = Math.hypot(dc, dr);
      const ux = dc / len;
      const uy = dr / len;
      // Project (dx, dy) onto unit ray direction
      const proj = dx * ux + dy * uy;
      if (proj < 0.35 || proj > (maxRay + 0.45) * len) continue;
      const perp = Math.abs(dx * -uy + dy * ux);
      if (perp <= tolerance) {
        return { dist: proj, dc, dr, isCrit: false };
      }
    }
    return null;
  }

  return null;
}

/**
 * Selects the best target from in-range candidates according to tower priority.
 */
export function selectTarget(tower, stats, enemies) {
  const candidates = [];
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const hit = evaluateTargetHit(tower, stats, enemy);
    if (hit) {
      candidates.push({ enemy, hit });
    }
  }
  if (candidates.length === 0) return null;

  const mode = tower.targetMode || 'first';
  candidates.sort((a, b) => {
    if (mode === 'first') return b.enemy.pathProgress - a.enemy.pathProgress;
    if (mode === 'last') return a.enemy.pathProgress - b.enemy.pathProgress;
    if (mode === 'strongest') return b.enemy.hp - a.enemy.hp;
    if (mode === 'closest') return a.hit.dist - b.hit.dist;
    return b.enemy.pathProgress - a.enemy.pathProgress;
  });

  return candidates[0];
}

/**
 * Returns all enemies lying along a specific ray (dc, dr) from a tower — used by Bishop piercing beam!
 */
export function getEnemiesOnRay(tower, stats, dc, dr, enemies) {
  const tx = tower.col + 0.5;
  const ty = tower.row + 0.5;
  const len = Math.hypot(dc, dr);
  const ux = dc / len;
  const uy = dr / len;
  const maxProj = ((stats.maxRay || 6) + 0.5) * len;
  const hits = [];

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = enemy.x - tx;
    const dy = enemy.y - ty;
    const proj = dx * ux + dy * uy;
    if (proj < 0.3 || proj > maxProj) continue;
    const perp = Math.abs(dx * -uy + dy * ux);
    if (perp <= 0.68) {
      hits.push({ enemy, proj });
    }
  }
  hits.sort((a, b) => a.proj - b.proj);
  return hits;
}
