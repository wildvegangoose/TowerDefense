/**
 * Enemy Archetypes & Wave Scaling for Crownward.
 * Tuned for genuine tactical challenge — enemies scale steeply in HP, speed, and armor.
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
    hpMult: 1.35,
    speedMult: 1.12,
    goldMult: 0.88,
  },
};

export const ENEMY_TYPES = {
  footman: {
    id: 'footman',
    name: 'Obsidian Footman',
    sprite: 'enemy_footman',
    baseHp: 88,
    speed: 1.4,        // tiles per second
    armor: 0.08,       // 8% damage reduction
    reward: 8,
    livesCost: 1,
    scale: 0.92,
    trait: 'Relentless dark vanguard soldier.',
  },
  lancer: {
    id: 'lancer',
    name: 'Shadow Charger',
    sprite: 'enemy_lancer',
    baseHp: 72,
    speed: 2.5,
    armor: 0.05,
    reward: 11,
    livesCost: 1,
    scale: 0.98,
    trait: 'Blazingly fast obsidian steed that punishes uncovered corners.',
  },
  bastion: {
    id: 'bastion',
    name: 'Ironclad Bastion',
    sprite: 'enemy_bastion',
    baseHp: 330,
    speed: 0.82,
    armor: 0.52,       // 52% heavy armor — use Rook / Bishop Sunder / Promoted pieces!
    reward: 20,
    livesCost: 2,
    scale: 1.08,
    trait: 'Heavy armored siege golem (52% armor). Shrugs off unpromoted Pawns.',
  },
  cleric: {
    id: 'cleric',
    name: 'Blighted Cleric',
    sprite: 'enemy_cleric',
    baseHp: 185,
    speed: 1.18,
    armor: 0.18,
    reward: 19,
    livesCost: 1,
    scale: 1.0,
    healRadius: 1.9,
    healAmount: 44,
    healCooldown: 2.3,
    trait: 'Pulses dark mending to heal nearby enemies every 2.3s.',
  },
  warlord: {
    id: 'warlord',
    name: 'Crimson Warlord',
    sprite: 'enemy_warlord',
    baseHp: 1320,
    speed: 0.7,
    armor: 0.38,
    reward: 85,
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

  const levelHpScale = Math.pow(1.3, levelNum - 1);
  const waveProgress = totalWaves > 1 ? waveIndex / (totalWaves - 1) : 0;
  const waveHpScale = 1 + waveIndex * 0.24 + waveProgress * 0.24;

  const speedScale = (1 + (levelNum - 1) * 0.045 + waveIndex * 0.018) * diff.speedMult;
  const bonusArmor = Math.min(0.24, (levelNum - 1) * 0.025 + Math.floor(waveIndex / 2) * 0.02);

  return {
    ...base,
    maxHp: Math.round(base.baseHp * levelHpScale * waveHpScale * diff.hpMult),
    speed: Number((base.speed * speedScale).toFixed(3)),
    armor: Math.min(0.74, base.armor + bonusArmor),
    reward: Math.max(4, Math.round(base.reward * (1 + (levelNum - 1) * 0.06))),
    healAmount: base.healAmount
      ? Math.round(base.healAmount * levelHpScale * (1 + waveIndex * 0.14) * diff.hpMult)
      : 0,
  };
}
