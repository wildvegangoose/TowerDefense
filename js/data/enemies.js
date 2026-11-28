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
    armorBonus: 0.0,
    desc: 'Balanced royal campaign economy & classic enemy strength.',
  },
  master: {
    id: 'master',
    label: 'Master',
    shortTag: 'MASTER',
    hpMult: 1.38,
    speedMult: 1.1,
    goldMult: 0.9,
    rewardMult: 0.88,
    lateWaveHpBoost: 0.28,
    armorBonus: 0.04,
    desc: '+38% enemy HP, faster marches, heavier armor & tighter bounties.',
  },
  grandmaster: {
    id: 'grandmaster',
    label: 'Grandmaster',
    shortTag: 'GRANDMASTER',
    hpMult: 1.78,
    speedMult: 1.18,
    goldMult: 0.82,
    rewardMult: 0.74,
    lateWaveHpBoost: 0.58,
    armorBonus: 0.08,
    desc: 'Brutal endgame siege: +78% HP surging in late waves, lean gold & fortified armor.',
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
  },
  bastion: {
    id: 'bastion',
    name: 'Ironclad Bastion',
    sprite: 'enemy_bastion',
    baseHp: 260,
    speed: 0.78,
    armor: 0.45,       // 45% heavy armor — use Promoted Pawns, Bishop Sunder, or Rook!
    reward: 22,
    livesCost: 2,
    scale: 1.08,
    trait: 'Heavy armored siege golem (45% armor). Promote Pawns or bring Bishop Sunder / Rooks.',
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
  },
};

/**
 * Scale enemy stats progressively by level, wave, and difficulty mode.
 */
export function createEnemyConfig(typeId, levelNum, waveIndex, totalWaves, difficultyId = 'novice') {
  const base = ENEMY_TYPES[typeId];
  if (!base) throw new Error(`Unknown enemy type: ${typeId}`);
  const diff = DIFFICULTY_PRESETS[normalizeDifficulty(difficultyId)] || DIFFICULTY_PRESETS.novice;

  // Sustainable per-level scaling + extra late-wave surge on Master & Grandmaster
  const levelHpScale =
    levelNum <= 7 ? 1 + (levelNum - 1) * 0.14 : 1.84 + (levelNum - 7) * 0.11;
  const waveProgress = totalWaves > 1 ? waveIndex / (totalWaves - 1) : 0;
  const lateSurge = 1 + waveProgress * waveProgress * (diff.lateWaveHpBoost || 0);
  const waveHpScale = (1 + waveIndex * 0.21 + waveProgress * 0.24) * lateSurge;

  const levelSpeedBonus =
    levelNum <= 7 ? (levelNum - 1) * 0.022 : 6 * 0.022 + (levelNum - 7) * 0.011;
  const speedScale = (1 + levelSpeedBonus + waveIndex * 0.012) * diff.speedMult;
  const bonusArmor = Math.min(
    0.24,
    (levelNum - 1) * 0.015 + Math.floor(waveIndex / 3) * 0.02 + (diff.armorBonus || 0)
  );
  const rewardScale = (1 + Math.min(12, levelNum - 1) * 0.045) * (diff.rewardMult || 1.0);

  return {
    ...base,
    maxHp: Math.round(base.baseHp * levelHpScale * waveHpScale * diff.hpMult),
    speed: Number((base.speed * speedScale).toFixed(3)),
    armor: Math.min(0.74, base.armor + bonusArmor),
    reward: Math.max(4, Math.round(base.reward * rewardScale)),
    healAmount: base.healAmount
      ? Math.round(base.healAmount * levelHpScale * (1 + waveIndex * 0.12) * diff.hpMult)
      : 0,
  };
}
