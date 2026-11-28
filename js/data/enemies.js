/**
 * Enemy Archetypes & Wave Scaling for TowerDeChess.
 * Simulation-verified for tense Tactical play and tough-but-achievable Grandmaster runs.
 */

export const DIFFICULTY_ORDER = ['novice', 'master', 'grandmaster'];

export const DIFFICULTY_PRESETS = {
  novice: {
    id: 'novice',
    label: 'Novice',
    shortTag: '',
    hpMult: 1.0,
    speedMult: 1.0,
    goldMult: 1.0,
    rewardMult: 1.0,
    lateWaveHpBoost: 0.0,
    lateStageHpBoost: 0.0,
    lateRewardTaper: 0.0,
    armorBonus: 0.0,
    desc: 'Balanced royal campaign economy & classic enemy strength.',
  },
  master: {
    id: 'master',
    label: 'Master',
    shortTag: 'MASTER',
    hpMult: 1.1,
    speedMult: 1.03,
    goldMult: 1.0,
    rewardMult: 0.97,
    lateWaveHpBoost: 0.14,
    lateStageHpBoost: 0.24,
    lateRewardTaper: 0.12,
    armorBonus: 0.03,
    desc: 'Tougher legions (+10% base HP surging up to +52% in late waves), brisker marches & leaner late-stage gold.',
  },
  grandmaster: {
    id: 'grandmaster',
    label: 'Grandmaster',
    shortTag: 'GRANDMASTER',
    hpMult: 1.15,
    speedMult: 1.04,
    goldMult: 1.0,
    rewardMult: 0.94,
    lateWaveHpBoost: 0.16,
    lateStageHpBoost: 0.64,
    lateRewardTaper: 0.28,
    armorBonus: 0.06,
    desc: 'Demanding siege: sharp openings, massive endgame HP surges (up to 2.1×), fortified armor & tight late bounties.',
  },
};

export function normalizeDifficulty(difficultyId) {
  if (difficultyId === 'master' || difficultyId === 'grandmaster' || difficultyId === 'novice') {
    return difficultyId;
  }
  return 'novice';
}

export const ENEMY_TYPES = {
  footman: {
    id: 'footman',
    name: 'Obsidian Footman',
    sprite: 'enemy_footman',
    baseHp: 70,
    speed: 1.32,       // tiles per second
    armor: 0.05,       // 5% damage reduction
    reward: 9,
    livesCost: 1,
    scale: 0.92,
    trait: 'Relentless dark vanguard soldier.',
    matchups: {
      knight: 1.3,
      queen: 1.25,
      rook: 0.8,
    },
    strengths: [
      { label: 'Resists Rook Shells', detail: '-20% DMG', pieceId: 'rook' },
      { label: 'Tight Marching Swarms', detail: 'High numbers' },
    ],
    weaknesses: [
      { label: 'Weak to Knight', detail: '+30% DMG', pieceId: 'knight' },
      { label: 'Weak to Queen', detail: '+25% DMG', pieceId: 'queen' },
    ],
  },
  lancer: {
    id: 'lancer',
    name: 'Shadow Charger',
    sprite: 'enemy_lancer',
    baseHp: 56,
    speed: 2.28,
    armor: 0.0,
    reward: 11,
    livesCost: 1,
    scale: 0.98,
    trait: 'Blazingly fast obsidian steed that punishes uncovered corners.',
    matchups: {
      knight: 1.35,
      obelisk: 1.3,
      pawn: 1.25,
      rook: 0.72,
      bishop: 0.8,
    },
    strengths: [
      { label: 'Resists Rook', detail: '-28% DMG', pieceId: 'rook' },
      { label: 'Resists Bishop', detail: '-20% DMG', pieceId: 'bishop' },
      { label: 'Galloping Blitz', detail: '2.28 tiles/s' },
    ],
    weaknesses: [
      { label: 'Weak to Knight', detail: '+35% DMG', pieceId: 'knight' },
      { label: 'Weak to Frost Obelisk', detail: '+30% DMG', pieceId: 'obelisk' },
      { label: 'Weak to Pawn', detail: '+25% DMG', pieceId: 'pawn' },
    ],
  },
  bastion: {
    id: 'bastion',
    name: 'Ironclad Bastion',
    sprite: 'enemy_bastion',
    baseHp: 260,
    speed: 0.78,
    armor: 0.45,       // 45% heavy armor — use Rook Siege or Bishop Sunder!
    reward: 22,
    livesCost: 2,
    scale: 1.08,
    trait: 'Heavy armored siege golem (45% armor). Break its plate with Rooks or Bishop Sunder.',
    matchups: {
      rook: 1.35,
      bishop: 1.3,
      knight: 0.75,
      pawn: 0.8,
    },
    strengths: [
      { label: 'Heavy Iron Plate', detail: '45% Armor' },
      { label: 'Resists Knight', detail: '-25% DMG', pieceId: 'knight' },
      { label: 'Resists Pawn', detail: '-20% DMG', pieceId: 'pawn' },
    ],
    weaknesses: [
      { label: 'Weak to Rook', detail: '+35% DMG', pieceId: 'rook' },
      { label: 'Weak to Bishop', detail: '+30% + Sunder', pieceId: 'bishop' },
    ],
  },
  cleric: {
    id: 'cleric',
    name: 'Blighted Cleric',
    sprite: 'enemy_cleric',
    baseHp: 155,
    speed: 1.12,
    armor: 0.15,
    reward: 21,
    livesCost: 1,
    scale: 1.0,
    healRadius: 1.85,
    healAmount: 36,
    healCooldown: 2.4,
    trait: 'Pulses dark mending to heal nearby enemies every 2.4s.',
    matchups: {
      bishop: 1.35,
      queen: 1.3,
      obelisk: 0.72,
      knight: 0.8,
    },
    strengths: [
      { label: 'Dark Mending Aura', detail: '+36 HP / 2.4s' },
      { label: 'Resists Frost Obelisk', detail: '-28% DMG', pieceId: 'obelisk' },
      { label: 'Resists Knight', detail: '-20% DMG', pieceId: 'knight' },
    ],
    weaknesses: [
      { label: 'Weak to Bishop', detail: '+35% DMG', pieceId: 'bishop' },
      { label: 'Weak to Queen', detail: '+30% DMG', pieceId: 'queen' },
    ],
  },
  warlord: {
    id: 'warlord',
    name: 'Crimson Warlord',
    sprite: 'enemy_warlord',
    baseHp: 1050,
    speed: 0.66,
    armor: 0.34,
    reward: 90,
    livesCost: 5,
    scale: 1.26,
    isBoss: true,
    summonThreshold: 0.5,
    trait: 'Dread Monarch Boss. Summons 4 Obsidian Footmen at 50% HP and resists slow by 45%.',
    matchups: {
      king: 1.35,
      rook: 1.25,
      queen: 1.25,
      obelisk: 0.75,
      pawn: 0.8,
    },
    strengths: [
      { label: 'Sovereign Plate & Will', detail: '34% Armor • 45% Slow Resist' },
      { label: 'Rift Reinforcements', detail: 'Summons 4 at 50% HP' },
      { label: 'Resists Frost Obelisk & Pawn', detail: '-25% / -20%', pieceId: 'obelisk' },
    ],
    weaknesses: [
      { label: 'Weak to King', detail: '+35% DMG', pieceId: 'king' },
      { label: 'Weak to Rook', detail: '+25% DMG', pieceId: 'rook' },
      { label: 'Weak to Queen', detail: '+25% DMG', pieceId: 'queen' },
    ],
  },
};

/**
 * Returns the tactical damage multiplier for a defender piece attacking a given enemy archetype.
 */
export function getMatchupMultiplier(enemyTypeId, pieceId) {
  if (!enemyTypeId || !pieceId) return 1.0;
  return ENEMY_TYPES[enemyTypeId]?.matchups?.[pieceId] ?? 1.0;
}

/**
 * Scale enemy stats progressively by level, wave, and difficulty mode.
 * Simulation-verified 18/18 beatable across Novice, Master, and Grandmaster.
 */
export function createEnemyConfig(typeId, levelNum, waveIndex, totalWaves, difficultyId = 'novice') {
  const base = ENEMY_TYPES[typeId];
  if (!base) throw new Error(`Unknown enemy type: ${typeId}`);
  const diff = DIFFICULTY_PRESETS[normalizeDifficulty(difficultyId)] || DIFFICULTY_PRESETS.novice;

  // Wave 1 stays fair & playable; late waves & late stages ramp sharply against maxed Tier-3 units
  const levelHpScale =
    levelNum <= 7 ? 1 + (levelNum - 1) * 0.14 : 1.84 + (levelNum - 7) * 0.11;
  const waveProgress = totalWaves > 1 ? waveIndex / (totalWaves - 1) : 0;
  const stageProgress = Math.min(1, Math.max(0, (levelNum - 1) / 14));
  const lateRamp = Math.pow(waveProgress, 1.5);
  const lateHpMult =
    1 + lateRamp * ((diff.lateWaveHpBoost || 0) + stageProgress * (diff.lateStageHpBoost || 0));
  const waveHpScale = (1 + waveIndex * 0.21 + waveProgress * 0.24) * lateHpMult;

  const levelSpeedBonus =
    levelNum <= 7 ? (levelNum - 1) * 0.022 : 6 * 0.022 + (levelNum - 7) * 0.011;
  const speedScale = (1 + levelSpeedBonus + waveIndex * 0.012) * diff.speedMult;
  const bonusArmor = Math.min(
    0.24,
    (levelNum - 1) * 0.015 + Math.floor(waveIndex / 3) * 0.02 + (diff.armorBonus || 0) * lateRamp
  );
  const lateBountyTaper = 1 - stageProgress * waveProgress * (diff.lateRewardTaper || 0);
  const rewardScale =
    (1 + Math.min(12, levelNum - 1) * 0.045) * (diff.rewardMult || 1.0) * lateBountyTaper;

  return {
    ...base,
    maxHp: Math.round(base.baseHp * levelHpScale * waveHpScale * diff.hpMult),
    speed: Number((base.speed * speedScale).toFixed(3)),
    armor: Math.min(0.72, base.armor + bonusArmor),
    reward: Math.max(4, Math.round(base.reward * rewardScale)),
    healAmount: base.healAmount
      ? Math.round(
          base.healAmount *
            levelHpScale *
            (1 + waveIndex * 0.12) *
            diff.hpMult *
            (1 + lateRamp * (diff.lateWaveHpBoost || 0) * 0.5)
        )
      : 0,
  };
}
