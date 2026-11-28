/**
 * Extensible Piece Registry for TowerDeChess.
 *
 * Chess pieces (category: 'chess') unlock one per campaign level (Levels 1-6).
 * Non-chess mythic/custom pieces (category: 'mythic') plug into the exact same
 * data-driven schema — simply add an entry here and drop a sprite in assets/sprites/!
 */

export const PIECE_CATEGORIES = {
  chess: {
    label: 'Royal Chess Set',
    badge: 'CHESS',
    description: 'Classic chess defenders whose attack patterns honor authentic board geometry.',
  },
  mythic: {
    label: 'Relics Beyond the Board',
    badge: 'NON-CHESS',
    description: 'Experimental mythic constructs forged beyond traditional chess rules.',
  },
};

export const PIECE_REGISTRY = {
  pawn: {
    id: 'pawn',
    name: 'Pawn',
    title: 'Frontline Spearman',
    category: 'chess',
    unlockLevel: 1,
    sprite: 'piece_pawn',
    cost: 40,
    limit: null,
    pattern: 'pawn',
    maxRay: 1,
    attackType: 'spear',
    damage: 18,
    fireRate: 1.22,
    diagonalCritMult: 1.38,
    splashRadius: 0,
    armorPierce: 0.15,
    accentColor: '#d4a348',
    patternLabel: 'Adjacent 8 Tiles (+38% on Diagonals)',
    tacticalTip: 'Cheap frontline workhorse. Strikes all 8 neighboring squares and deals +38% Critical Thrust damage on its 4 diagonal capture squares.',
    lore: 'Humble ivory infantry sworn to hold the first rank until promotion.',
    upgrades: [
      {
        tier: 2,
        name: 'Halberd Pawn',
        cost: 55,
        damage: 32,
        fireRate: 1.45,
        diagonalCritMult: 1.45,
        armorPierce: 0.3,
        desc: '+75% DMG, faster strikes, 30% armor pierce',
      },
      {
        tier: 3,
        name: 'Promoted Vanguard',
        cost: 90,
        damage: 54,
        fireRate: 1.75,
        armorPierce: 0.5,
        diagonalCritMult: 1.65,
        desc: 'Heavy armor-piercing thrust & +65% diagonal crits',
      },
    ],
  },

  knight: {
    id: 'knight',
    name: 'Knight',
    title: 'L-Leap Shock Cavalry',
    category: 'chess',
    unlockLevel: 2,
    sprite: 'piece_knight',
    cost: 80,
    limit: null,
    pattern: 'knight',
    maxRay: 0,
    attackType: 'leap_slam',
    damage: 38,
    fireRate: 0.78,
    splashRadius: 0.68,
    armorPierce: 0.12,
    accentColor: '#c9883a',
    patternLabel: 'Classic L-Jump (8 Fork Squares + Tight Splash)',
    tacticalTip: 'Leaps over obstacles to strike enemies on its 8 L-shape squares with a compact flank splash. Ideal for forking parallel lanes and sniping Chargers & Clerics — bring Rooks or Bishops for armored Bastions.',
    lore: 'Carved warhorses that vault cleanly across rank and file to crush enemy flanks.',
    upgrades: [
      {
        tier: 2,
        name: 'Gilded Charger',
        cost: 95,
        damage: 64,
        fireRate: 0.88,
        splashRadius: 0.78,
        armorPierce: 0.18,
        desc: 'Sharper L-fork strikes & quicker leaps',
      },
      {
        tier: 3,
        name: 'Paladin Steed',
        cost: 150,
        damage: 102,
        fireRate: 1.0,
        splashRadius: 0.88,
        armorPierce: 0.24,
        desc: 'Relentless precision cavalry assault across 8 fork tiles',
      },
    ],
  },

  bishop: {
    id: 'bishop',
    name: 'Bishop',
    title: 'Solar Diagonal Seer',
    category: 'chess',
    unlockLevel: 3,
    sprite: 'piece_bishop',
    cost: 105,
    limit: null,
    pattern: 'bishop',
    maxRay: 6,
    attackType: 'diagonal_beam',
    damage: 40,
    fireRate: 0.9,
    splashRadius: 0,
    armorPierce: 0.4,
    sunderAmount: 0.38,
    sunderDuration: 3.8,
    accentColor: '#e5a93c',
    patternLabel: '4 Diagonal Rays (Piercing + Armor Sunder)',
    tacticalTip: 'Channels a piercing amber beam along all 4 diagonals, hitting every enemy in line and sundering their armor by 38%.',
    lore: 'Amber-crowned seers who bend sunbeams diagonally across marble halls.',
    upgrades: [
      {
        tier: 2,
        name: 'Sunfire Prelate',
        cost: 115,
        damage: 68,
        fireRate: 1.05,
        sunderAmount: 0.52,
        sunderDuration: 4.5,
        desc: 'Higher piercing beam DMG & 52% armor sunder',
      },
      {
        tier: 3,
        name: 'Archbishop of Dawn',
        cost: 185,
        damage: 112,
        fireRate: 1.22,
        maxRay: 8,
        armorPierce: 0.68,
        sunderAmount: 0.68,
        sunderDuration: 5.5,
        desc: 'Full-board diagonal pierce & shattering armor melt',
      },
    ],
  },

  rook: {
    id: 'rook',
    name: 'Rook',
    title: 'Siege Bastion Artillery',
    category: 'chess',
    unlockLevel: 4,
    sprite: 'piece_rook',
    cost: 135,
    limit: null,
    pattern: 'rook',
    maxRay: 7,
    attackType: 'cannon_line',
    damage: 86,
    fireRate: 0.66,
    splashRadius: 1.15,
    armorPierce: 0.68,
    accentColor: '#b56e35',
    patternLabel: '4 Straight Ranks & Files (Heavy AoE Cannon)',
    tacticalTip: 'Fires devastating wide-blast bronze cannonballs down straight ranks and files, ignoring 68% armor. Place at the end of long straightaways to shatter Bastions and packed waves.',
    lore: 'Mobile ivory watchtowers bristling with four bronze siege culverins.',
    upgrades: [
      {
        tier: 2,
        name: 'Ironwall Keep',
        cost: 145,
        damage: 145,
        fireRate: 0.76,
        splashRadius: 1.32,
        armorPierce: 0.8,
        desc: 'Crushing siege blast & 80% armor-piercing shells',
      },
      {
        tier: 3,
        name: 'Grand Citadel Tower',
        cost: 225,
        damage: 245,
        fireRate: 0.88,
        splashRadius: 1.55,
        armorPierce: 0.92,
        desc: 'Cataclysmic corridor barrage ignoring 92% enemy armor',
      },
    ],
  },

  queen: {
    id: 'queen',
    name: 'Queen',
    title: 'Sovereign Starlight Striker',
    category: 'chess',
    unlockLevel: 5,
    sprite: 'piece_queen',
    cost: 230,
    limit: null,
    pattern: 'queen',
    maxRay: 5,
    attackType: 'royal_volley',
    damage: 56,
    fireRate: 1.32,
    chainCount: 2,
    splashRadius: 0,
    armorPierce: 0.45,
    accentColor: '#f0c050',
    patternLabel: 'All 8 Compass Rays (Ricochet Bolts)',
    tacticalTip: 'Commands orthogonal and diagonal sightlines simultaneously, unleashing rapid royal bolts that ricochet between enemies.',
    lore: 'Unrivaled ruler of the board — wherever rank, file, or diagonal meets, she strikes.',
    upgrades: [
      {
        tier: 2,
        name: 'Empress Radiant',
        cost: 220,
        damage: 92,
        fireRate: 1.52,
        maxRay: 6,
        chainCount: 3,
        armorPierce: 0.6,
        desc: 'Bolts ricochet to 3 targets with extended range',
      },
      {
        tier: 3,
        name: 'Ascendant Sovereign',
        cost: 340,
        damage: 148,
        fireRate: 1.8,
        maxRay: 8,
        chainCount: 4,
        armorPierce: 0.75,
        desc: 'Full-board 8-ray supremacy & 4-target royal cascade',
      },
    ],
  },

  king: {
    id: 'king',
    name: 'King',
    title: 'Royal Aura Commander',
    category: 'chess',
    unlockLevel: 6,
    sprite: 'piece_king',
    cost: 180,
    limit: 1,
    pattern: 'king',
    maxRay: 1,
    attackType: 'aura_smite',
    damage: 54,
    fireRate: 0.9,
    splashRadius: 0.75,
    armorPierce: 0.5,
    auraBuff: {
      damageMult: 1.2,
      rateMult: 1.25,
      goldPerWave: 25,
    },
    accentColor: '#c44536',
    patternLabel: '3×3 Royal Court Aura + Gold Treasury',
    tacticalTip: 'Limit 1 per board. Empowers all adjacent pieces (+20% DMG, +25% Speed), generates +25 Gold each wave, and smites nearby foes.',
    lore: 'Where the Crown stands, every loyal defender fights with twice the fervor.',
    upgrades: [
      {
        tier: 2,
        name: 'High Monarch',
        cost: 175,
        damage: 88,
        fireRate: 1.05,
        auraBuff: { damageMult: 1.32, rateMult: 1.36, goldPerWave: 45 },
        desc: 'Aura boosts to +32% DMG / +36% Speed & +45g/wave',
      },
      {
        tier: 3,
        name: 'Eternal Emperor',
        cost: 280,
        damage: 145,
        fireRate: 1.25,
        auraBuff: { damageMult: 1.48, rateMult: 1.5, goldPerWave: 75 },
        desc: 'Supreme +48% DMG / +50% Speed aura & +75g/wave',
      },
    ],
  },

  // --- NON-CHESS MYTHIC PIECES (Extensible Framework Showcase) ---
  obelisk: {
    id: 'obelisk',
    name: 'Frost Obelisk',
    title: 'Glacial Rift Monolith',
    category: 'mythic',
    unlockLevel: 7,
    sprite: 'piece_obelisk',
    cost: 135,
    limit: null,
    pattern: 'radial',
    range: 2.15,
    attackType: 'frost_pulse',
    damage: 24,
    fireRate: 0.78,
    splashRadius: 2.15,
    armorPierce: 0.5,
    slowAmount: 0.42,
    slowDuration: 2.6,
    accentColor: '#4fa8d6',
    patternLabel: 'Radial Frost Nova (42% AoE Slow)',
    tacticalTip: 'First Non-Chess Relic! Pulses freezing waves across a wide circle, chilling all nearby enemies so your Rooks and Bishops can shatter them.',
    lore: 'Forged from glacial alabaster outside the rules of chess — a glimpse of new pieces to come.',
    upgrades: [
      {
        tier: 2,
        name: 'Permafrost Spire',
        cost: 130,
        damage: 42,
        fireRate: 0.9,
        range: 2.45,
        splashRadius: 2.45,
        slowAmount: 0.52,
        slowDuration: 3.2,
        desc: 'Wider chill field & 52% heavy frost slow',
      },
      {
        tier: 3,
        name: 'Absolute Zero Relic',
        cost: 205,
        damage: 74,
        fireRate: 1.05,
        range: 2.75,
        splashRadius: 2.75,
        slowAmount: 0.62,
        slowDuration: 3.8,
        desc: '62% deep freeze nova that cripples entire waves',
      },
    ],
  },
};

/**
 * Planned / Future non-chess blueprints displayed in the Codex
 * to show how easily new non-chess pieces can be forged next.
 */
export const FUTURE_BLUEPRINTS = [
  {
    id: 'alchemist_mortar',
    name: 'Alchemist Mortar',
    category: 'mythic',
    role: 'Corrosive Siege Lobber',
    desc: 'Lobs bubbling ember-acid flasks that leave burning puddles across path tiles.',
  },
  {
    id: 'clockwork_prism',
    name: 'Clockwork Prism',
    category: 'mythic',
    role: 'Beam Refractor',
    desc: 'Redirects Bishop & Queen beams around corners to create custom crossfire webs.',
  },
];

export const PIECE_ORDER = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'obelisk'];

export function getPieceStats(pieceId, tier = 1) {
  const base = PIECE_REGISTRY[pieceId];
  if (!base) return null;
  const stats = {
    ...base,
    tier,
    displayName: base.name,
    auraBuff: base.auraBuff ? { ...base.auraBuff } : null,
  };
  if (tier >= 2 && base.upgrades[0]) {
    Object.assign(stats, base.upgrades[0]);
    stats.displayName = base.upgrades[0].name;
    stats.tier = 2;
  }
  if (tier >= 3 && base.upgrades[1]) {
    Object.assign(stats, base.upgrades[1]);
    stats.displayName = base.upgrades[1].name;
    stats.tier = 3;
  }
  return stats;
}

export function getUpgradeInfo(pieceId, currentTier) {
  const base = PIECE_REGISTRY[pieceId];
  if (!base || currentTier >= 3) return null;
  return base.upgrades[currentTier - 1] || null;
}

export function getUnlockedPiecesForLevel(levelNumber) {
  return PIECE_ORDER.filter((id) => PIECE_REGISTRY[id].unlockLevel <= levelNumber);
}
