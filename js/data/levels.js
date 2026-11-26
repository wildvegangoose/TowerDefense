/**
 * Handcrafted 8x8 Chessboard Campaign Levels for TowerDeChess.
 * 18 levels spanning 3 themed Realms (Chapters) with escalating wave pressure,
 * diverse path geometries, and rewarding chess & mythic relic synergies.
 */

export const BOARD_SIZE = 8;

export const CHAPTERS = [
  {
    id: 1,
    roman: 'I',
    name: 'The Ivory Ranks',
    subtitle: 'Sunlit Marble Lowlands',
    theme: 'ivory',
    levelIds: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 2,
    roman: 'II',
    name: 'The Glacial Rift',
    subtitle: 'Frosted Obsidian Passes',
    theme: 'glacial',
    levelIds: [7, 8, 9, 10, 11, 12],
  },
  {
    id: 3,
    roman: 'III',
    name: 'The Crimson Citadel',
    subtitle: 'Ember Basalt Stronghold',
    theme: 'crimson',
    levelIds: [13, 14, 15, 16, 17, 18],
  },
];

export function getChapterForLevel(levelId) {
  return CHAPTERS.find((ch) => ch.levelIds.includes(levelId)) || CHAPTERS[0];
}

/**
 * Expand orthogonal corner waypoints into every consecutive grid tile along the path.
 */
export function expandWaypoints(waypoints) {
  const tiles = [];
  for (let i = 0; i < waypoints.length; i++) {
    const [cx, cy] = waypoints[i];
    if (i === 0) {
      tiles.push([cx, cy]);
      continue;
    }
    const [px, py] = waypoints[i - 1];
    const dx = Math.sign(cx - px);
    const dy = Math.sign(cy - py);
    let x = px;
    let y = py;
    while (x !== cx || y !== cy) {
      x += dx;
      y += dy;
      tiles.push([x, y]);
    }
  }
  return tiles;
}

export const LEVELS = [
  // ==================== CHAPTER I: THE IVORY RANKS (Levels 1-6) ====================
  {
    id: 1,
    chapter: 1,
    mapX: 30,
    name: "The Pawn's Bastion",
    subtitle: 'Opening Rank',
    unlocksPiece: 'pawn',
    featuredPiece: 'pawn',
    startingGold: 125,
    startingLives: 15,
    description: 'Hold the winding opening lanes with steadfast Pawns. Place them on inner corners (like E6 & D4) so their 4 diagonal capture squares land critical strikes — and promote them before heavy Bastions arrive!',
    waypoints: [
      [0, 1], [5, 1], [5, 3], [2, 3], [2, 5], [6, 5], [6, 7], [7, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 7, interval: 0.92 }] },
      { groups: [{ type: 'footman', count: 9, interval: 0.78 }, { type: 'lancer', count: 3, interval: 0.68, delay: 1.1 }] },
      { groups: [{ type: 'lancer', count: 6, interval: 0.56 }, { type: 'footman', count: 9, interval: 0.7, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 2, interval: 2.0 }, { type: 'footman', count: 8, interval: 0.68, delay: 0.9 }, { type: 'lancer', count: 5, interval: 0.54, delay: 1.1 }] },
      { groups: [{ type: 'bastion', count: 3, interval: 1.8 }, { type: 'lancer', count: 8, interval: 0.48, delay: 1.1 }, { type: 'footman', count: 10, interval: 0.56, delay: 0.9 }] },
    ],
  },

  {
    id: 2,
    chapter: 1,
    mapX: 68,
    name: "The Knight's Fork",
    subtitle: 'Twin Hairpins',
    unlocksPiece: 'knight',
    featuredPiece: 'knight',
    startingGold: 145,
    startingLives: 12,
    description: 'Unlock the Knight! Place armored warhorses on the central ridges so their L-jump splash attacks fork both the upper and lower corridors against fast Charger packs.',
    waypoints: [
      [0, 0], [7, 0], [7, 2], [1, 2], [1, 5], [6, 5], [6, 7], [0, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 10, interval: 0.75 }, { type: 'lancer', count: 3, interval: 0.6, delay: 0.9 }] },
      { groups: [{ type: 'lancer', count: 9, interval: 0.52 }, { type: 'footman', count: 10, interval: 0.65, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 3, interval: 1.85 }, { type: 'footman', count: 12, interval: 0.6, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 14, interval: 0.44 }, { type: 'bastion', count: 3, interval: 1.7, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 4, interval: 1.55 }, { type: 'footman', count: 16, interval: 0.48, delay: 0.8 }, { type: 'lancer', count: 10, interval: 0.44, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 6, interval: 1.4 }, { type: 'lancer', count: 14, interval: 0.38, delay: 1.0 }, { type: 'footman', count: 14, interval: 0.45, delay: 0.8 }] },
    ],
  },

  {
    id: 3,
    chapter: 1,
    mapX: 34,
    name: "The Bishop's Diagonal",
    subtitle: 'Sunbeam Staircase',
    unlocksPiece: 'bishop',
    featuredPiece: 'bishop',
    startingGold: 165,
    startingLives: 12,
    description: 'Unlock the Bishop! Sight along the long marble diagonals to pierce columns of foes and sunder heavy armor while Blighted Clerics march to mend their allies.',
    waypoints: [
      [0, 1], [2, 1], [2, 3], [4, 3], [4, 5], [6, 5], [6, 2], [7, 2], [7, 7], [5, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 12, interval: 0.68 }, { type: 'cleric', count: 2, interval: 1.6, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 3, interval: 1.75 }, { type: 'cleric', count: 2, interval: 1.5, delay: 0.7 }, { type: 'lancer', count: 8, interval: 0.48, delay: 1.0 }] },
      { groups: [{ type: 'lancer', count: 14, interval: 0.42 }, { type: 'cleric', count: 3, interval: 1.3, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 5, interval: 1.5 }, { type: 'cleric', count: 4, interval: 1.25, delay: 0.7 }, { type: 'footman', count: 14, interval: 0.48, delay: 0.9 }] },
      { groups: [{ type: 'footman', count: 18, interval: 0.4 }, { type: 'bastion', count: 5, interval: 1.35, delay: 0.8 }, { type: 'lancer', count: 12, interval: 0.4, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 6, interval: 1.3 }, { type: 'cleric', count: 5, interval: 1.1, delay: 0.7 }, { type: 'lancer', count: 14, interval: 0.38, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'bastion', count: 4, interval: 1.45, delay: 1.2 }, { type: 'cleric', count: 4, interval: 1.2, delay: 0.8 }] },
    ],
  },

  {
    id: 4,
    chapter: 1,
    mapX: 70,
    name: "The Rook's Siege",
    subtitle: 'Grand Straightaways',
    unlocksPiece: 'rook',
    featuredPiece: 'rook',
    startingGold: 245,
    startingLives: 12,
    description: 'Unlock the Rook! Anchor heavy fortress artillery at the ends of these long straight ranks to pound armored Bastions and Warlords into rubble.',
    waypoints: [
      [0, 1], [6, 1], [6, 3], [1, 3], [1, 6], [7, 6], [7, 4],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 12, interval: 0.62 }, { type: 'bastion', count: 3, interval: 1.7, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 3, interval: 1.75 }, { type: 'cleric', count: 2, interval: 1.7, delay: 0.9 }, { type: 'footman', count: 8, interval: 0.6, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 16, interval: 0.4 }, { type: 'footman', count: 14, interval: 0.48, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 6, interval: 1.38 }, { type: 'cleric', count: 4, interval: 1.25, delay: 0.7 }, { type: 'lancer', count: 12, interval: 0.42, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'footman', count: 16, interval: 0.42, delay: 1.0 }, { type: 'cleric', count: 3, interval: 1.2, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 8, interval: 1.2 }, { type: 'cleric', count: 5, interval: 1.15, delay: 0.6 }, { type: 'lancer', count: 14, interval: 0.38, delay: 1.0 }] },
      { groups: [{ type: 'lancer', count: 22, interval: 0.34 }, { type: 'bastion', count: 6, interval: 1.25, delay: 1.0 }, { type: 'cleric', count: 4, interval: 1.1, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 4.0 }, { type: 'bastion', count: 6, interval: 1.3, delay: 1.2 }, { type: 'cleric', count: 4, interval: 1.2, delay: 0.8 }] },
    ],
  },

  {
    id: 5,
    chapter: 1,
    mapX: 32,
    name: "The Queen's Gambit",
    subtitle: 'Royal Spiral Court',
    unlocksPiece: 'queen',
    featuredPiece: 'queen',
    startingGold: 265,
    startingLives: 10,
    description: 'Unlock the Queen! Command the central throne tiles where all 8 orthogonal and diagonal rays rain ricocheting royal bolts across the spiral.',
    waypoints: [
      [0, 0], [7, 0], [7, 7], [0, 7], [0, 2], [5, 2], [5, 5], [2, 5], [2, 4], [3, 4],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 16, interval: 0.56 }, { type: 'lancer', count: 10, interval: 0.44, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 4, interval: 1.6 }, { type: 'cleric', count: 2, interval: 1.5, delay: 0.9 }, { type: 'footman', count: 10, interval: 0.52, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 20, interval: 0.36 }, { type: 'footman', count: 14, interval: 0.44, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 7, interval: 1.25 }, { type: 'cleric', count: 5, interval: 1.15, delay: 0.7 }, { type: 'footman', count: 16, interval: 0.42, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'lancer', count: 14, interval: 0.4, delay: 1.2 }, { type: 'cleric', count: 4, interval: 1.1, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 9, interval: 1.1 }, { type: 'cleric', count: 5, interval: 1.05, delay: 0.7 }, { type: 'lancer', count: 16, interval: 0.36, delay: 1.0 }] },
      { groups: [{ type: 'footman', count: 26, interval: 0.32 }, { type: 'cleric', count: 6, interval: 1.0, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.8 }, { type: 'bastion', count: 7, interval: 1.15, delay: 1.0 }, { type: 'cleric', count: 5, interval: 1.05, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.5 }, { type: 'bastion', count: 8, interval: 1.1, delay: 1.0 }, { type: 'lancer', count: 18, interval: 0.34, delay: 1.0 }] },
    ],
  },

  {
    id: 6,
    chapter: 1,
    mapX: 54,
    isChapterBoss: true,
    name: "The King's Citadel",
    subtitle: 'Sovereign Courtyard',
    unlocksPiece: 'king',
    featuredPiece: 'king',
    startingGold: 270,
    startingLives: 10,
    description: 'Unlock the King! Crown your central courtyard to supercharge all adjacent chess defenders with Royal Decree speed, damage, and treasury gold.',
    waypoints: [
      [0, 1], [2, 1], [2, 6], [0, 6], [0, 7], [7, 7], [7, 5], [5, 5], [5, 1], [7, 1],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 18, interval: 0.5 }, { type: 'bastion', count: 4, interval: 1.45, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 20, interval: 0.36 }, { type: 'cleric', count: 4, interval: 1.15, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 7, interval: 1.2 }, { type: 'cleric', count: 5, interval: 1.1, delay: 0.7 }] },
      { groups: [{ type: 'footman', count: 24, interval: 0.34 }, { type: 'lancer', count: 18, interval: 0.36, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'bastion', count: 6, interval: 1.25, delay: 1.0 }, { type: 'cleric', count: 5, interval: 1.05, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 26, interval: 0.3 }, { type: 'bastion', count: 7, interval: 1.1, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 9, interval: 1.0 }, { type: 'cleric', count: 6, interval: 0.95, delay: 0.7 }, { type: 'footman', count: 22, interval: 0.34, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.6 }, { type: 'cleric', count: 6, interval: 0.95, delay: 0.9 }, { type: 'lancer', count: 18, interval: 0.34, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 12, interval: 0.92 }, { type: 'lancer', count: 22, interval: 0.3, delay: 0.9 }, { type: 'cleric', count: 6, interval: 0.9, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.2 }, { type: 'bastion', count: 10, interval: 1.0, delay: 1.0 }, { type: 'cleric', count: 7, interval: 0.9, delay: 0.7 }] },
    ],
  },

  // ==================== CHAPTER II: THE GLACIAL RIFT (Levels 7-12) ====================
  {
    id: 7,
    chapter: 2,
    mapX: 28,
    name: 'Beyond the Board',
    subtitle: 'Mythic Rift Trial',
    unlocksPiece: 'obelisk',
    featuredPiece: 'obelisk',
    startingGold: 320,
    startingLives: 10,
    description: 'Unlock the first Non-Chess Relic — the Frost Obelisk! Chill relentless obsidian legions in glacial choke points while your royal chess pieces shatter them.',
    waypoints: [
      [1, 0], [1, 5], [3, 5], [3, 1], [6, 1], [6, 4], [4, 4], [4, 7], [7, 7],
    ],
    waves: [
      { groups: [{ type: 'lancer', count: 18, interval: 0.38 }, { type: 'footman', count: 16, interval: 0.44, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 5, interval: 1.45 }, { type: 'cleric', count: 2, interval: 1.4, delay: 0.9 }, { type: 'footman', count: 10, interval: 0.48, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 24, interval: 0.32 }, { type: 'bastion', count: 6, interval: 1.15, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 4.0 }, { type: 'cleric', count: 5, interval: 1.05, delay: 0.9 }, { type: 'lancer', count: 16, interval: 0.34, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 10, interval: 1.0 }, { type: 'cleric', count: 6, interval: 0.95, delay: 0.7 }, { type: 'footman', count: 24, interval: 0.32, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.5 }, { type: 'lancer', count: 24, interval: 0.3, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 12, interval: 0.9 }, { type: 'cleric', count: 7, interval: 0.9, delay: 0.6 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.2 }, { type: 'bastion', count: 10, interval: 0.95, delay: 0.9 }, { type: 'cleric', count: 6, interval: 0.9, delay: 0.7 }] },
      { groups: [{ type: 'lancer', count: 34, interval: 0.24 }, { type: 'warlord', count: 2, interval: 3.0, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.8 }, { type: 'bastion', count: 12, interval: 0.85, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.85, delay: 0.7 }] },
    ],
  },

  {
    id: 8,
    chapter: 2,
    mapX: 68,
    name: 'Frozen Switchback',
    subtitle: 'Glacial Crevasse',
    unlocksPiece: null,
    featuredPiece: 'obelisk',
    startingGold: 350,
    startingLives: 10,
    description: 'Icy switchbacks carve deep pockets across the pass. Anchor Frost Obelisks inside the hairpins so your Rooks and Queens can harvest slowed columns.',
    waypoints: [
      [0, 1], [4, 1], [4, 0], [7, 0], [7, 3], [2, 3], [2, 5], [7, 5], [7, 7], [3, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 20, interval: 0.44 }, { type: 'lancer', count: 10, interval: 0.42, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 5, interval: 1.4 }, { type: 'footman', count: 14, interval: 0.44, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 24, interval: 0.34 }, { type: 'cleric', count: 4, interval: 1.1, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 8, interval: 1.15 }, { type: 'cleric', count: 5, interval: 1.05, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 4.2 }, { type: 'lancer', count: 18, interval: 0.34, delay: 1.0 }, { type: 'cleric', count: 4, interval: 1.05, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 10, interval: 0.98 }, { type: 'footman', count: 24, interval: 0.32, delay: 0.8 }, { type: 'cleric', count: 5, interval: 0.95, delay: 0.7 }] },
      { groups: [{ type: 'lancer', count: 30, interval: 0.28 }, { type: 'bastion', count: 8, interval: 1.0, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.4 }, { type: 'bastion', count: 9, interval: 0.95, delay: 1.0 }, { type: 'cleric', count: 6, interval: 0.9, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.9 }, { type: 'bastion', count: 11, interval: 0.88, delay: 0.9 }, { type: 'lancer', count: 22, interval: 0.28, delay: 1.0 }] },
    ],
  },

  {
    id: 9,
    chapter: 2,
    mapX: 34,
    name: 'Cavalry Crossing',
    subtitle: 'Twin Frost Canyons',
    unlocksPiece: null,
    featuredPiece: 'knight',
    startingGold: 390,
    startingLives: 10,
    description: 'Two narrow canyons snake past elevated ridges. Position Knights and a buffing King on the high ground to stagger Shadow Chargers across multiple lanes at once.',
    waypoints: [
      [0, 2], [2, 2], [2, 0], [5, 0], [5, 3], [1, 3], [1, 6], [6, 6], [6, 2], [7, 2], [7, 5],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 16, interval: 0.48 }, { type: 'lancer', count: 10, interval: 0.46, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 4, interval: 1.5 }, { type: 'cleric', count: 2, interval: 1.4, delay: 0.9 }, { type: 'lancer', count: 10, interval: 0.42, delay: 0.9 }] },
      { groups: [{ type: 'footman', count: 24, interval: 0.36 }, { type: 'cleric', count: 4, interval: 1.1, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 26, interval: 0.32 }, { type: 'bastion', count: 7, interval: 1.1, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.8 }, { type: 'bastion', count: 7, interval: 1.05, delay: 1.0 }, { type: 'cleric', count: 5, interval: 1.0, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 32, interval: 0.26 }, { type: 'cleric', count: 6, interval: 0.92, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 12, interval: 0.9 }, { type: 'footman', count: 24, interval: 0.32, delay: 0.8 }, { type: 'cleric', count: 6, interval: 0.9, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.2 }, { type: 'lancer', count: 24, interval: 0.28, delay: 1.0 }, { type: 'cleric', count: 5, interval: 0.92, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.8 }, { type: 'bastion', count: 12, interval: 0.86, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.85, delay: 0.7 }] },
    ],
  },

  {
    id: 10,
    chapter: 2,
    mapX: 70,
    name: 'Cathedral of Rays',
    subtitle: 'Prism Staircase',
    unlocksPiece: null,
    featuredPiece: 'bishop',
    startingGold: 430,
    startingLives: 10,
    description: 'A sweeping diagonal staircase descends into the frost sanctuary. Line up Bishops and Queens along the prism steps to cleave entire legions and shatter Bastion armor.',
    waypoints: [
      [0, 0], [2, 0], [2, 2], [4, 2], [4, 4], [6, 4], [6, 6], [2, 6], [2, 4], [0, 4], [0, 7], [7, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 16, interval: 0.5 }, { type: 'lancer', count: 8, interval: 0.48, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 4, interval: 1.55 }, { type: 'footman', count: 12, interval: 0.48, delay: 0.9 }, { type: 'lancer', count: 8, interval: 0.46, delay: 0.9 }] },
      { groups: [{ type: 'lancer', count: 24, interval: 0.32 }, { type: 'cleric', count: 4, interval: 1.1, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 8, interval: 1.1 }, { type: 'cleric', count: 5, interval: 1.0, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.8 }, { type: 'footman', count: 24, interval: 0.32, delay: 1.0 }, { type: 'cleric', count: 5, interval: 0.95, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 11, interval: 0.92 }, { type: 'lancer', count: 22, interval: 0.28, delay: 0.9 }, { type: 'cleric', count: 5, interval: 0.9, delay: 0.7 }] },
      { groups: [{ type: 'lancer', count: 34, interval: 0.24 }, { type: 'bastion', count: 8, interval: 0.95, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.2 }, { type: 'bastion', count: 10, interval: 0.9, delay: 0.9 }, { type: 'cleric', count: 6, interval: 0.88, delay: 0.7 }] },
      { groups: [{ type: 'bastion', count: 14, interval: 0.82 }, { type: 'cleric', count: 7, interval: 0.82, delay: 0.6 }, { type: 'lancer', count: 24, interval: 0.26, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.7 }, { type: 'bastion', count: 12, interval: 0.84, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.82, delay: 0.7 }] },
    ],
  },

  {
    id: 11,
    chapter: 2,
    mapX: 30,
    name: 'Iron Ramparts',
    subtitle: 'Siege Trench Line',
    unlocksPiece: null,
    featuredPiece: 'rook',
    startingGold: 415,
    startingLives: 10,
    description: 'Long fortified battlements reward decisive Rook cannon lines. Combine chilling Frost Obelisks on the outer corners with Rook fire down every straightaway.',
    waypoints: [
      [0, 6], [0, 0], [6, 0], [6, 2], [2, 2], [2, 4], [7, 4], [7, 7], [3, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 22, interval: 0.38 }, { type: 'bastion', count: 4, interval: 1.4, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 24, interval: 0.32 }, { type: 'cleric', count: 4, interval: 1.15, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 8, interval: 1.1 }, { type: 'cleric', count: 5, interval: 1.0, delay: 0.7 }, { type: 'footman', count: 18, interval: 0.36, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 4.0 }, { type: 'bastion', count: 7, interval: 1.05, delay: 1.0 }] },
      { groups: [{ type: 'lancer', count: 32, interval: 0.26 }, { type: 'bastion', count: 8, interval: 0.95, delay: 0.9 }, { type: 'cleric', count: 5, interval: 0.92, delay: 0.7 }] },
      { groups: [{ type: 'bastion', count: 12, interval: 0.88 }, { type: 'cleric', count: 6, interval: 0.88, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.3 }, { type: 'footman', count: 28, interval: 0.28, delay: 0.9 }, { type: 'cleric', count: 6, interval: 0.88, delay: 0.7 }] },
      { groups: [{ type: 'lancer', count: 36, interval: 0.23 }, { type: 'bastion', count: 10, interval: 0.88, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.0 }, { type: 'bastion', count: 12, interval: 0.84, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.82, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 5, interval: 2.6 }, { type: 'bastion', count: 12, interval: 0.82, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.8, delay: 0.7 }] },
    ],
  },

  {
    id: 12,
    chapter: 2,
    mapX: 52,
    isChapterBoss: true,
    name: 'The Twin Monoliths',
    subtitle: 'Glacial Rift Finale',
    unlocksPiece: null,
    featuredPiece: 'queen',
    startingGold: 435,
    startingLives: 10,
    description: 'The final stronghold of the Glacial Rift! Two symmetrical frozen islands divide the enemy march — crown them with Queens, a King, and Frost Obelisks to break the Warlord vanguard.',
    waypoints: [
      [0, 3], [0, 0], [3, 0], [3, 3], [4, 3], [4, 0], [7, 0], [7, 4], [5, 4], [5, 7], [2, 7], [2, 5], [0, 5], [0, 7],
    ],
    waves: [
      { groups: [{ type: 'lancer', count: 24, interval: 0.32 }, { type: 'footman', count: 20, interval: 0.36, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 7, interval: 1.15 }, { type: 'cleric', count: 4, interval: 1.1, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 28, interval: 0.28 }, { type: 'bastion', count: 7, interval: 1.05, delay: 0.9 }, { type: 'cleric', count: 5, interval: 0.95, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.6 }, { type: 'cleric', count: 5, interval: 0.95, delay: 0.9 }, { type: 'footman', count: 22, interval: 0.3, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 12, interval: 0.88 }, { type: 'cleric', count: 6, interval: 0.88, delay: 0.6 }, { type: 'lancer', count: 20, interval: 0.28, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.2 }, { type: 'lancer', count: 28, interval: 0.25, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 14, interval: 0.82 }, { type: 'cleric', count: 7, interval: 0.82, delay: 0.6 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.9 }, { type: 'bastion', count: 10, interval: 0.86, delay: 0.9 }, { type: 'cleric', count: 6, interval: 0.84, delay: 0.7 }] },
      { groups: [{ type: 'lancer', count: 40, interval: 0.21 }, { type: 'warlord', count: 3, interval: 2.8, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 5, interval: 2.5 }, { type: 'bastion', count: 14, interval: 0.78, delay: 0.9 }, { type: 'cleric', count: 8, interval: 0.78, delay: 0.6 }] },
    ],
  },

  // ==================== CHAPTER III: THE CRIMSON CITADEL (Levels 13-18) ====================
  {
    id: 13,
    chapter: 3,
    mapX: 28,
    name: 'Ember Gauntlet',
    subtitle: 'Basalt Serpentine',
    unlocksPiece: null,
    featuredPiece: 'king',
    startingGold: 465,
    startingLives: 10,
    description: 'Enter the Crimson Citadel! Steep vertical corridors channel relentless Charger packs past ember ridges — build a Royal Decree core in the center to dominate every file.',
    waypoints: [
      [0, 0], [0, 6], [2, 6], [2, 1], [4, 1], [4, 6], [6, 6], [6, 1], [7, 1], [7, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 20, interval: 0.4 }, { type: 'lancer', count: 14, interval: 0.38, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 5, interval: 1.35 }, { type: 'cleric', count: 2, interval: 1.3, delay: 0.9 }, { type: 'footman', count: 14, interval: 0.42, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 26, interval: 0.28 }, { type: 'bastion', count: 7, interval: 1.05, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.6 }, { type: 'bastion', count: 7, interval: 1.0, delay: 0.9 }, { type: 'cleric', count: 4, interval: 0.95, delay: 0.7 }] },
      { groups: [{ type: 'bastion', count: 12, interval: 0.85 }, { type: 'cleric', count: 6, interval: 0.85, delay: 0.6 }, { type: 'footman', count: 26, interval: 0.28, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 36, interval: 0.22 }, { type: 'warlord', count: 2, interval: 3.2, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.0 }, { type: 'bastion', count: 12, interval: 0.84, delay: 0.9 }, { type: 'cleric', count: 6, interval: 0.82, delay: 0.7 }] },
      { groups: [{ type: 'bastion', count: 15, interval: 0.78 }, { type: 'cleric', count: 7, interval: 0.78, delay: 0.6 }, { type: 'lancer', count: 26, interval: 0.24, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.7 }, { type: 'lancer', count: 32, interval: 0.22, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.78, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 5, interval: 2.4 }, { type: 'bastion', count: 14, interval: 0.76, delay: 0.9 }, { type: 'cleric', count: 8, interval: 0.75, delay: 0.6 }] },
    ],
  },

  {
    id: 14,
    chapter: 3,
    mapX: 68,
    name: 'Obsidian Labyrinth',
    subtitle: 'Double-Coil Vault',
    unlocksPiece: null,
    featuredPiece: 'queen',
    startingGold: 485,
    startingLives: 10,
    description: 'A coiled dark-stone labyrinth wraps twice around an inner throne vault. Place your Sovereign Queen and King in the inner sanctum to shred enemies on both rings.',
    waypoints: [
      [7, 0], [0, 0], [0, 7], [7, 7], [7, 2], [2, 2], [2, 5], [5, 5], [5, 4],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 26, interval: 0.32 }, { type: 'lancer', count: 18, interval: 0.32, delay: 0.7 }] },
      { groups: [{ type: 'bastion', count: 8, interval: 1.05 }, { type: 'cleric', count: 5, interval: 0.98, delay: 0.7 }] },
      { groups: [{ type: 'lancer', count: 32, interval: 0.25 }, { type: 'cleric', count: 5, interval: 0.92, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.4 }, { type: 'bastion', count: 9, interval: 0.92, delay: 0.9 }, { type: 'cleric', count: 6, interval: 0.88, delay: 0.7 }] },
      { groups: [{ type: 'bastion', count: 14, interval: 0.82 }, { type: 'footman', count: 28, interval: 0.26, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.0 }, { type: 'lancer', count: 32, interval: 0.23, delay: 0.9 }, { type: 'cleric', count: 6, interval: 0.84, delay: 0.7 }] },
      { groups: [{ type: 'bastion', count: 16, interval: 0.76 }, { type: 'cleric', count: 8, interval: 0.76, delay: 0.6 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.7 }, { type: 'bastion', count: 12, interval: 0.8, delay: 0.9 }, { type: 'lancer', count: 28, interval: 0.24, delay: 0.9 }] },
      { groups: [{ type: 'lancer', count: 42, interval: 0.2 }, { type: 'warlord', count: 3, interval: 2.6, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.76, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 6, interval: 2.3 }, { type: 'bastion', count: 14, interval: 0.75, delay: 0.8 }, { type: 'cleric', count: 8, interval: 0.74, delay: 0.6 }] },
    ],
  },

  {
    id: 15,
    chapter: 3,
    mapX: 34,
    name: "Cleric's Conclave",
    subtitle: 'Blighted Cloister',
    unlocksPiece: null,
    featuredPiece: 'bishop',
    startingGold: 515,
    startingLives: 10,
    description: 'Blighted Clerics march in tight healing phalanxes alongside armored Bastions. Piercing Bishops and heavy Rook bursts are vital to outpace their dark mending.',
    waypoints: [
      [0, 1], [3, 1], [3, 0], [6, 0], [6, 3], [2, 3], [2, 5], [7, 5], [7, 7], [1, 7], [1, 4], [0, 4],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 20, interval: 0.42 }, { type: 'cleric', count: 2, interval: 1.35, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 5, interval: 1.35 }, { type: 'cleric', count: 2, interval: 1.3, delay: 0.9 }, { type: 'footman', count: 14, interval: 0.42, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 26, interval: 0.28 }, { type: 'cleric', count: 5, interval: 0.96, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.5 }, { type: 'cleric', count: 6, interval: 0.9, delay: 0.8 }, { type: 'bastion', count: 7, interval: 0.98, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 12, interval: 0.86 }, { type: 'cleric', count: 7, interval: 0.82, delay: 0.6 }] },
      { groups: [{ type: 'lancer', count: 36, interval: 0.24 }, { type: 'bastion', count: 9, interval: 0.88, delay: 0.8 }, { type: 'cleric', count: 6, interval: 0.84, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 2.9 }, { type: 'bastion', count: 12, interval: 0.82, delay: 0.9 }, { type: 'cleric', count: 8, interval: 0.76, delay: 0.6 }] },
      { groups: [{ type: 'footman', count: 36, interval: 0.22 }, { type: 'cleric', count: 9, interval: 0.72, delay: 0.6 }, { type: 'bastion', count: 12, interval: 0.8, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.6 }, { type: 'cleric', count: 9, interval: 0.72, delay: 0.7 }, { type: 'lancer', count: 30, interval: 0.22, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 16, interval: 0.74 }, { type: 'warlord', count: 3, interval: 2.6, delay: 0.9 }, { type: 'cleric', count: 9, interval: 0.72, delay: 0.6 }] },
      { groups: [{ type: 'warlord', count: 6, interval: 2.3 }, { type: 'bastion', count: 14, interval: 0.74, delay: 0.8 }, { type: 'cleric', count: 10, interval: 0.7, delay: 0.6 }] },
    ],
  },

  {
    id: 16,
    chapter: 3,
    mapX: 70,
    name: 'Castle Perimeter',
    subtitle: 'Inner Keep Moat',
    unlocksPiece: null,
    featuredPiece: 'rook',
    startingGold: 540,
    startingLives: 10,
    description: 'The obsidian host marches along the outer battlements before breaching straight into the inner keep. Build a layered Rook and Frost Obelisk killbox at the core.',
    waypoints: [
      [0, 7], [0, 2], [2, 2], [2, 0], [7, 0], [7, 5], [5, 5], [5, 7], [3, 7], [3, 4], [4, 4], [4, 2],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 22, interval: 0.38 }, { type: 'lancer', count: 14, interval: 0.36, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 6, interval: 1.2 }, { type: 'cleric', count: 3, interval: 1.15, delay: 0.8 }, { type: 'footman', count: 14, interval: 0.38, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.5 }, { type: 'lancer', count: 22, interval: 0.28, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 12, interval: 0.86 }, { type: 'cleric', count: 6, interval: 0.85, delay: 0.6 }] },
      { groups: [{ type: 'lancer', count: 36, interval: 0.22 }, { type: 'bastion', count: 10, interval: 0.86, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 2.9 }, { type: 'bastion', count: 12, interval: 0.82, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.78, delay: 0.6 }] },
      { groups: [{ type: 'bastion', count: 16, interval: 0.74 }, { type: 'cleric', count: 8, interval: 0.74, delay: 0.6 }, { type: 'footman', count: 28, interval: 0.25, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.6 }, { type: 'lancer', count: 34, interval: 0.21, delay: 0.9 }, { type: 'cleric', count: 7, interval: 0.76, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.5 }, { type: 'bastion', count: 14, interval: 0.76, delay: 0.8 }, { type: 'cleric', count: 8, interval: 0.72, delay: 0.6 }] },
      { groups: [{ type: 'lancer', count: 46, interval: 0.19 }, { type: 'warlord', count: 4, interval: 2.4, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 6, interval: 2.2 }, { type: 'bastion', count: 16, interval: 0.72, delay: 0.8 }, { type: 'cleric', count: 9, interval: 0.7, delay: 0.6 }] },
    ],
  },

  {
    id: 17,
    chapter: 3,
    mapX: 30,
    name: 'The Dread March',
    subtitle: 'Shattered Battlements',
    unlocksPiece: null,
    featuredPiece: 'obelisk',
    startingGold: 565,
    startingLives: 10,
    description: 'Staggered battlements weave across every rank of the board. Only complete synergy between Frost Obelisks, Bishops, Rooks, Knights, Queens, and the King can halt the Dread March.',
    waypoints: [
      [0, 0], [3, 0], [3, 2], [6, 2], [6, 0], [7, 0], [7, 4], [4, 4], [4, 6], [7, 6], [7, 7], [1, 7], [1, 3], [0, 3],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 22, interval: 0.38 }, { type: 'lancer', count: 14, interval: 0.36, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 7, interval: 1.15 }, { type: 'cleric', count: 3, interval: 1.15, delay: 0.8 }, { type: 'footman', count: 14, interval: 0.38, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.3 }, { type: 'lancer', count: 24, interval: 0.26, delay: 0.8 }, { type: 'cleric', count: 5, interval: 0.88, delay: 0.7 }] },
      { groups: [{ type: 'bastion', count: 13, interval: 0.82 }, { type: 'cleric', count: 7, interval: 0.8, delay: 0.6 }, { type: 'footman', count: 26, interval: 0.26, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 2.8 }, { type: 'bastion', count: 12, interval: 0.82, delay: 0.8 }, { type: 'lancer', count: 24, interval: 0.24, delay: 0.9 }] },
      { groups: [{ type: 'lancer', count: 44, interval: 0.19 }, { type: 'cleric', count: 8, interval: 0.74, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.6 }, { type: 'bastion', count: 14, interval: 0.76, delay: 0.8 }, { type: 'cleric', count: 8, interval: 0.72, delay: 0.6 }] },
      { groups: [{ type: 'bastion', count: 18, interval: 0.72 }, { type: 'cleric', count: 9, interval: 0.7, delay: 0.6 }] },
      { groups: [{ type: 'warlord', count: 5, interval: 2.4 }, { type: 'lancer', count: 36, interval: 0.2, delay: 0.8 }, { type: 'cleric', count: 8, interval: 0.72, delay: 0.6 }] },
      { groups: [{ type: 'warlord', count: 5, interval: 2.3 }, { type: 'bastion', count: 16, interval: 0.72, delay: 0.8 }, { type: 'cleric', count: 9, interval: 0.7, delay: 0.6 }] },
      { groups: [{ type: 'warlord', count: 7, interval: 2.1 }, { type: 'bastion', count: 16, interval: 0.7, delay: 0.8 }, { type: 'cleric', count: 10, interval: 0.68, delay: 0.6 }] },
    ],
  },

  {
    id: 18,
    chapter: 3,
    mapX: 52,
    isChapterBoss: true,
    name: 'Crown of Ash',
    subtitle: 'Grand Sovereign Finale',
    unlocksPiece: null,
    featuredPiece: 'king',
    startingGold: 610,
    startingLives: 10,
    description: 'The final battle for the Royal Board! Four sweeping siege ranks stand between the Crimson Warlord armada and your Citadel Gate. Marshal every promoted piece for checkmate!',
    waypoints: [
      [0, 0], [7, 0], [7, 2], [1, 2], [1, 4], [6, 4], [6, 6], [0, 6], [0, 7], [7, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 24, interval: 0.34 }, { type: 'lancer', count: 16, interval: 0.34, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 7, interval: 1.15 }, { type: 'cleric', count: 4, interval: 1.1, delay: 0.8 }, { type: 'footman', count: 14, interval: 0.36, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.2 }, { type: 'bastion', count: 9, interval: 0.9, delay: 0.8 }, { type: 'cleric', count: 6, interval: 0.86, delay: 0.7 }] },
      { groups: [{ type: 'lancer', count: 38, interval: 0.21 }, { type: 'bastion', count: 12, interval: 0.82, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 2.8 }, { type: 'cleric', count: 8, interval: 0.76, delay: 0.7 }, { type: 'footman', count: 32, interval: 0.24, delay: 0.8 }] },
      { groups: [{ type: 'bastion', count: 16, interval: 0.74 }, { type: 'cleric', count: 8, interval: 0.72, delay: 0.6 }, { type: 'lancer', count: 30, interval: 0.22, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 4, interval: 2.5 }, { type: 'bastion', count: 14, interval: 0.76, delay: 0.8 }, { type: 'cleric', count: 8, interval: 0.72, delay: 0.6 }] },
      { groups: [{ type: 'lancer', count: 48, interval: 0.18 }, { type: 'warlord', count: 4, interval: 2.4, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 5, interval: 2.3 }, { type: 'bastion', count: 16, interval: 0.72, delay: 0.8 }, { type: 'cleric', count: 9, interval: 0.68, delay: 0.6 }] },
      { groups: [{ type: 'bastion', count: 20, interval: 0.68 }, { type: 'cleric', count: 10, interval: 0.66, delay: 0.6 }, { type: 'lancer', count: 36, interval: 0.2, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 6, interval: 2.15 }, { type: 'bastion', count: 16, interval: 0.7, delay: 0.8 }, { type: 'cleric', count: 10, interval: 0.66, delay: 0.6 }] },
      { groups: [{ type: 'warlord', count: 8, interval: 2.0 }, { type: 'bastion', count: 18, interval: 0.68, delay: 0.8 }, { type: 'cleric', count: 10, interval: 0.65, delay: 0.6 }] },
    ],
  },
];
