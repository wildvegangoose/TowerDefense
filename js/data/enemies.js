/**
 * Enemy Archetypes & Wave Scaling for TowerDeChess.
 * Simulation-verified for tense Tactical play and tough-but-achievable Grandmaster runs.
 */

export const DIFFICULTY_PRESETS = {
  standard: {
    id: 'standard',
    label: 'Tactical',
    hpMult: 1.0,
    speedMult: 1.0,
    goldMult: 1.0,
  },
  grandmaster: {
    id: 'grandmaster',
    label: 'Grandmaster',
    hpMult: 1.32,
    speedMult: 1.09,
    goldMult: 0.9,
  },
};

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
export function createEnemyConfig(typeId, levelNum, waveIndex, totalWaves, difficultyId = 'standard') {
  const base = ENEMY_TYPES[typeId];
  if (!base) throw new Error(`Unknown enemy type: ${typeId}`);
  const diff = DIFFICULTY_PRESETS[difficultyId] || DIFFICULTY_PRESETS.standard;

  // Sustainable per-level scaling: identical on Lv1-7 (1.0x -> 1.84x), smoothly tapered across Lv8-18 (up to 2.94x)
  const levelHpScale =
    levelNum <= 7 ? 1 + (levelNum - 1) * 0.14 : 1.84 + (levelNum - 7) * 0.1;
  const waveProgress = totalWaves > 1 ? waveIndex / (totalWaves - 1) : 0;
  const waveHpScale = 1 + waveIndex * 0.2 + waveProgress * 0.22;

  const levelSpeedBonus =
    levelNum <= 7 ? (levelNum - 1) * 0.022 : 6 * 0.022 + (levelNum - 7) * 0.011;
  const speedScale = (1 + levelSpeedBonus + waveIndex * 0.012) * diff.speedMult;
  const bonusArmor = Math.min(0.2, (levelNum - 1) * 0.015 + Math.floor(waveIndex / 3) * 0.02);
  const rewardScale = 1 + Math.min(12, levelNum - 1) * 0.05;

  return {
    ...base,
    maxHp: Math.round(base.baseHp * levelHpScale * waveHpScale * diff.hpMult),
    speed: Number((base.speed * speedScale).toFixed(3)),
    armor: Math.min(0.68, base.armor + bonusArmor),
    reward: Math.max(5, Math.round(base.reward * rewardScale)),
    healAmount: base.healAmount
      ? Math.round(base.healAmount * levelHpScale * (1 + waveIndex * 0.1) * diff.hpMult)
      : 0,
  };
}
