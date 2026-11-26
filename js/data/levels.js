/**
 * Handcrafted 8x8 Chessboard Campaign Levels for Crownward.
 * Every level unlocks a brand new defender piece and features path geometry
 * tailored to showcase that piece's authentic chess attack pattern.
 */

export const BOARD_SIZE = 8;

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
  {
    id: 1,
    name: "The Pawn's Bastion",
    subtitle: 'Opening Rank',
    unlocksPiece: 'pawn',
    startingGold: 135,
    startingLives: 18,
    description: 'Hold the winding opening lanes with steadfast Pawns. Place them on inner corners so their 4 diagonal capture squares strike enemies twice.',
    waypoints: [
      [0, 1], [5, 1], [5, 3], [2, 3], [2, 5], [6, 5], [6, 7], [7, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 6, interval: 1.05 }] },
      { groups: [{ type: 'footman', count: 9, interval: 0.9 }] },
      { groups: [{ type: 'footman', count: 7, interval: 0.85 }, { type: 'lancer', count: 3, interval: 0.75, delay: 1.4 }] },
      { groups: [{ type: 'lancer', count: 6, interval: 0.68 }, { type: 'footman', count: 8, interval: 0.78, delay: 1.2 }] },
      { groups: [{ type: 'footman', count: 8, interval: 0.7 }, { type: 'bastion', count: 2, interval: 2.2, delay: 1.5 }, { type: 'lancer', count: 5, interval: 0.65, delay: 1.0 }] },
    ],
  },

  {
    id: 2,
    name: "The Knight's Fork",
    subtitle: 'Twin Hairpins',
    unlocksPiece: 'knight',
    startingGold: 165,
    startingLives: 18,
    description: 'Unlock the Knight! Place armored warhorses on the central ridges so their L-jump splash attacks fork both the upper and lower lanes.',
    waypoints: [
      [0, 0], [7, 0], [7, 2], [1, 2], [1, 5], [6, 5], [6, 7], [0, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 8, interval: 0.9 }] },
      { groups: [{ type: 'footman', count: 8, interval: 0.8 }, { type: 'lancer', count: 5, interval: 0.65, delay: 1.2 }] },
      { groups: [{ type: 'bastion', count: 2, interval: 2.1 }, { type: 'footman', count: 10, interval: 0.72, delay: 1.0 }] },
      { groups: [{ type: 'lancer', count: 10, interval: 0.56 }, { type: 'bastion', count: 2, interval: 2.0, delay: 1.4 }] },
      { groups: [{ type: 'footman', count: 12, interval: 0.62 }, { type: 'bastion', count: 3, interval: 1.8, delay: 1.0 }, { type: 'lancer', count: 6, interval: 0.55, delay: 1.2 }] },
      { groups: [{ type: 'bastion', count: 4, interval: 1.65 }, { type: 'lancer', count: 10, interval: 0.5, delay: 1.4 }, { type: 'footman', count: 10, interval: 0.55, delay: 1.0 }] },
    ],
  },

  {
    id: 3,
    name: "The Bishop's Diagonal",
    subtitle: 'Sunbeam Staircase',
    unlocksPiece: 'bishop',
    startingGold: 195,
    startingLives: 16,
    description: 'Unlock the Bishop! Sight along the long marble diagonals to pierce entire columns of foes and shatter enemy armor while Blighted Clerics march.',
    waypoints: [
      [0, 1], [2, 1], [2, 3], [4, 3], [4, 5], [6, 5], [6, 2], [7, 2], [7, 7], [5, 7],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 10, interval: 0.8 }] },
      { groups: [{ type: 'footman', count: 8, interval: 0.75 }, { type: 'cleric', count: 2, interval: 1.8, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 3, interval: 1.9 }, { type: 'cleric', count: 2, interval: 1.6, delay: 0.8 }, { type: 'lancer', count: 6, interval: 0.58, delay: 1.4 }] },
      { groups: [{ type: 'lancer', count: 12, interval: 0.5 }, { type: 'cleric', count: 3, interval: 1.4, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 4, interval: 1.6 }, { type: 'cleric', count: 3, interval: 1.5, delay: 0.8 }, { type: 'footman', count: 12, interval: 0.58, delay: 1.2 }] },
      { groups: [{ type: 'footman', count: 14, interval: 0.5 }, { type: 'bastion', count: 4, interval: 1.5, delay: 1.0 }, { type: 'lancer', count: 10, interval: 0.48, delay: 1.2 }] },
      { groups: [{ type: 'bastion', count: 5, interval: 1.45 }, { type: 'cleric', count: 4, interval: 1.3, delay: 0.8 }, { type: 'lancer', count: 12, interval: 0.45, delay: 1.2 }] },
    ],
  },

  {
    id: 4,
    name: "The Rook's Siege",
    subtitle: 'Grand Straightaways',
    unlocksPiece: 'rook',
    startingGold: 225,
    startingLives: 16,
    description: 'Unlock the Rook! Anchor heavy fortress artillery at the ends of these long straight ranks to pound armored Bastions into rubble.',
    waypoints: [
      [0, 1], [6, 1], [6, 3], [1, 3], [1, 6], [7, 6], [7, 4],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 10, interval: 0.75 }, { type: 'bastion', count: 2, interval: 1.9, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 4, interval: 1.7 }, { type: 'cleric', count: 2, interval: 1.6, delay: 0.9 }] },
      { groups: [{ type: 'lancer', count: 12, interval: 0.48 }, { type: 'footman', count: 10, interval: 0.6, delay: 1.1 }] },
      { groups: [{ type: 'bastion', count: 5, interval: 1.5 }, { type: 'cleric', count: 3, interval: 1.4, delay: 0.8 }, { type: 'lancer', count: 8, interval: 0.5, delay: 1.3 }] },
      { groups: [{ type: 'footman', count: 16, interval: 0.46 }, { type: 'bastion', count: 5, interval: 1.45, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 6, interval: 1.35 }, { type: 'cleric', count: 4, interval: 1.3, delay: 0.7 }, { type: 'lancer', count: 10, interval: 0.46, delay: 1.2 }] },
      { groups: [{ type: 'lancer', count: 16, interval: 0.42 }, { type: 'bastion', count: 5, interval: 1.4, delay: 1.2 }, { type: 'cleric', count: 3, interval: 1.3, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'bastion', count: 4, interval: 1.6, delay: 1.5 }, { type: 'cleric', count: 3, interval: 1.5, delay: 1.0 }] },
    ],
  },

  {
    id: 5,
    name: "The Queen's Gambit",
    subtitle: 'Royal Spiral Court',
    unlocksPiece: 'queen',
    startingGold: 260,
    startingLives: 15,
    description: 'Unlock the Queen! Command the central throne tiles where all 8 orthogonal and diagonal rays rain ricocheting royal bolts across the spiral.',
    waypoints: [
      [0, 0], [7, 0], [7, 7], [0, 7], [0, 2], [5, 2], [5, 5], [2, 5], [2, 4], [3, 4],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 14, interval: 0.65 }, { type: 'lancer', count: 6, interval: 0.5, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 5, interval: 1.5 }, { type: 'cleric', count: 3, interval: 1.4, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 16, interval: 0.42 }, { type: 'footman', count: 12, interval: 0.5, delay: 1.1 }] },
      { groups: [{ type: 'bastion', count: 6, interval: 1.4 }, { type: 'cleric', count: 4, interval: 1.3, delay: 0.8 }, { type: 'footman', count: 12, interval: 0.5, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'lancer', count: 10, interval: 0.48, delay: 1.5 }] },
      { groups: [{ type: 'bastion', count: 7, interval: 1.25 }, { type: 'cleric', count: 4, interval: 1.2, delay: 0.8 }, { type: 'lancer', count: 12, interval: 0.44, delay: 1.2 }] },
      { groups: [{ type: 'footman', count: 22, interval: 0.36 }, { type: 'cleric', count: 5, interval: 1.1, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'bastion', count: 6, interval: 1.3, delay: 1.2 }, { type: 'cleric', count: 4, interval: 1.2, delay: 0.9 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 4.5 }, { type: 'bastion', count: 6, interval: 1.3, delay: 1.2 }, { type: 'lancer', count: 14, interval: 0.4, delay: 1.2 }] },
    ],
  },

  {
    id: 6,
    name: "The King's Citadel",
    subtitle: 'Sovereign Courtyard',
    unlocksPiece: 'king',
    startingGold: 290,
    startingLives: 15,
    description: 'Unlock the King! Crown your central courtyard to supercharge all adjacent chess defenders with Royal Decree speed, damage, and treasury gold.',
    waypoints: [
      [0, 1], [2, 1], [2, 6], [0, 6], [0, 7], [7, 7], [7, 5], [5, 5], [5, 1], [7, 1],
    ],
    waves: [
      { groups: [{ type: 'footman', count: 16, interval: 0.58 }, { type: 'bastion', count: 3, interval: 1.6, delay: 1.0 }] },
      { groups: [{ type: 'lancer', count: 16, interval: 0.42 }, { type: 'cleric', count: 3, interval: 1.3, delay: 0.9 }] },
      { groups: [{ type: 'bastion', count: 6, interval: 1.35 }, { type: 'cleric', count: 4, interval: 1.25, delay: 0.8 }] },
      { groups: [{ type: 'footman', count: 20, interval: 0.4 }, { type: 'lancer', count: 14, interval: 0.42, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'bastion', count: 5, interval: 1.4, delay: 1.2 }, { type: 'cleric', count: 4, interval: 1.2, delay: 0.9 }] },
      { groups: [{ type: 'lancer', count: 22, interval: 0.36 }, { type: 'bastion', count: 6, interval: 1.25, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 8, interval: 1.15 }, { type: 'cleric', count: 5, interval: 1.1, delay: 0.8 }, { type: 'footman', count: 18, interval: 0.4, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 4.2 }, { type: 'cleric', count: 5, interval: 1.1, delay: 1.0 }, { type: 'lancer', count: 14, interval: 0.4, delay: 1.2 }] },
      { groups: [{ type: 'bastion', count: 10, interval: 1.05 }, { type: 'lancer', count: 18, interval: 0.36, delay: 1.0 }, { type: 'cleric', count: 5, interval: 1.0, delay: 0.8 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.8 }, { type: 'bastion', count: 8, interval: 1.15, delay: 1.2 }, { type: 'cleric', count: 6, interval: 1.0, delay: 0.8 }] },
    ],
  },

  {
    id: 7,
    name: 'Beyond the Board',
    subtitle: 'Mythic Rift Trial',
    unlocksPiece: 'obelisk',
    startingGold: 330,
    startingLives: 15,
    description: 'Unlock the first Non-Chess Relic — the Frost Obelisk! Chill relentless obsidian legions in glacial choke points while your royal chess pieces shatter them.',
    waypoints: [
      [1, 0], [1, 5], [3, 5], [3, 1], [6, 1], [6, 4], [4, 4], [4, 7], [7, 7],
    ],
    waves: [
      { groups: [{ type: 'lancer', count: 14, interval: 0.45 }, { type: 'footman', count: 14, interval: 0.5, delay: 1.0 }] },
      { groups: [{ type: 'bastion', count: 6, interval: 1.35 }, { type: 'cleric', count: 4, interval: 1.2, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 20, interval: 0.36 }, { type: 'bastion', count: 5, interval: 1.3, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 1, interval: 2.0 }, { type: 'cleric', count: 4, interval: 1.2, delay: 1.0 }, { type: 'lancer', count: 14, interval: 0.4, delay: 1.2 }] },
      { groups: [{ type: 'bastion', count: 8, interval: 1.15 }, { type: 'cleric', count: 5, interval: 1.1, delay: 0.8 }, { type: 'footman', count: 20, interval: 0.36, delay: 1.0 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 4.0 }, { type: 'lancer', count: 18, interval: 0.36, delay: 1.2 }] },
      { groups: [{ type: 'bastion', count: 10, interval: 1.0 }, { type: 'cleric', count: 6, interval: 1.0, delay: 0.7 }] },
      { groups: [{ type: 'warlord', count: 2, interval: 3.6 }, { type: 'bastion', count: 8, interval: 1.1, delay: 1.0 }, { type: 'cleric', count: 5, interval: 1.0, delay: 0.8 }] },
      { groups: [{ type: 'lancer', count: 28, interval: 0.28 }, { type: 'warlord', count: 2, interval: 3.5, delay: 1.2 }] },
      { groups: [{ type: 'warlord', count: 3, interval: 3.2 }, { type: 'bastion', count: 10, interval: 0.95, delay: 1.0 }, { type: 'cleric', count: 6, interval: 0.95, delay: 0.8 }] },
    ],
  },
];
