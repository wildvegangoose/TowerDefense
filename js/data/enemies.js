/**
 * Enemy Archetypes & Wave Scaling for Crownward.
 * Enemies escalate in HP, armor, speed, and traits across waves and campaign levels.
 */

export const ENEMY_TYPES = {
  footman: {
    id: 'footman',
    name: 'Obsidian Footman',
    sprite: 'enemy_footman',
    baseHp: 58,
    speed: 1.25,       // tiles per second
    armor: 0.05,       // 5% damage reduction
    reward: 11,
    livesCost: 1,
    scale: 0.92,
    trait: 'Steady dark vanguard soldier.',
  },
  lancer: {
    id: 'lancer',
    name: 'Shadow Charger',
    sprite: 'enemy_lancer',
    baseHp: 46,
    speed: 2.15,
    armor: 0.0,
    reward: 14,
    livesCost: 1,
    scale: 0.98,
    trait: 'Blazingly fast obsidian steed that sprints past slow defenders.',
  },
  bastion: {
    id: 'bastion',
    name: 'Ironclad Bastion',
    sprite: 'enemy_bastion',
    baseHp: 210,
    speed: 0.72,
    armor: 0.42,       // 42% heavy armor — use Rook / Bishop Sunder!
    reward: 26,
    livesCost: 2,
    scale: 1.08,
    trait: 'Heavy armored siege golem (42% armor). Vulnerable to Rook cannons & Bishop Sunder.',
  },
  cleric: {
    id: 'cleric',
    name: 'Blighted Cleric',
    sprite: 'enemy_cleric',
    baseHp: 115,
    speed: 1.08,
    armor: 0.15,
    reward: 24,
    livesCost: 1,
    scale: 1.0,
    healRadius: 1.7,
    healAmount: 26,
    healCooldown: 2.8,
    trait: 'Pulses dark mending to heal nearby enemies every 2.8s.',
  },
  warlord: {
    id: 'warlord',
    name: 'Crimson Warlord',
    sprite: 'enemy_warlord',
    baseHp: 780,
    speed: 0.62,
    armor: 0.32,
    reward: 110,
    livesCost: 5,
    scale: 1.26,
    isBoss: true,
    summonThreshold: 0.5,
    trait: 'Dread Monarch Boss. Summons Obsidian Footmen at 50% HP and resists slow by 40%.',
  },
};

/**
 * Scale enemy stats progressively by level & wave so enemies genuinely grow stronger!
 */
export function createEnemyConfig(typeId, levelNum, waveIndex, totalWaves) {
  const base = ENEMY_TYPES[typeId];
  if (!base) throw new Error(`Unknown enemy type: ${typeId}`);

  // Exponential-gentle progression across levels + within-level wave escalation
  const levelHpScale = Math.pow(1.24, levelNum - 1);
  const waveProgress = totalWaves > 1 ? waveIndex / (totalWaves - 1) : 0;
  const waveHpScale = 1 + waveIndex * 0.17 + waveProgress * 0.15;

  const speedScale = 1 + (levelNum - 1) * 0.035 + waveIndex * 0.014;
  const bonusArmor = Math.min(0.2, (levelNum - 1) * 0.02 + Math.floor(waveIndex / 3) * 0.02);

  return {
    ...base,
    maxHp: Math.round(base.baseHp * levelHpScale * waveHpScale),
    speed: Number((base.speed * speedScale).toFixed(3)),
    armor: Math.min(0.68, base.armor + bonusArmor),
    reward: Math.round(base.reward * (1 + (levelNum - 1) * 0.08)),
    healAmount: base.healAmount ? Math.round(base.healAmount * levelHpScale * (1 + waveIndex * 0.1)) : 0,
  };
}
