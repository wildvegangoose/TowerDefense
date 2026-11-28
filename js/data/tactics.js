/**
 * Progressive Timed Chess Tactics (Royal Gambits) — Unlocked after Level 5.
 *
 * Pure stockpile inventory:
 * - Never shown on Levels 1–5.
 * - First introduced at Level 6 (Pin), then progressively expanded at Levels 8, 11, 14, and 17.
 * - Charges are earned from unlock starter grants, Level 6+ victories, and optional between-level rewarded ads.
 */

export const TACTICS_MIN_LEVEL = 6;

export const TACTIC_ORDER = ['pin', 'fork', 'skewer', 'castling', 'checkmate'];

export const TACTICS = {
  pin: {
    id: 'pin',
    name: 'Pin',
    icon: 'tactic_pin',
    unlockLevel: 6,
    starterCharges: 2,
    duration: 7.0,
    cooldown: 8.5,
    accent: '#f0b848',
    badge: '7s LOCK',
    shortDesc: 'Freeze 2.5s, then 75% Slow',
    description:
      'Pins every invader on the board — locks them in place for 2.5s, then crushes movement speed by 75% for 4.5s.',
    flavor: '"A pinned piece dare not advance without exposing its king."',
  },
  fork: {
    id: 'fork',
    name: 'Fork',
    icon: 'tactic_fork',
    unlockLevel: 8,
    starterCharges: 2,
    duration: 8.5,
    cooldown: 10.0,
    accent: '#ffcf5c',
    badge: '8.5s TWIN',
    shortDesc: '+45% Haste & Twin-Strike',
    description:
      'Overcharges every defender for 8.5s: +45% attack speed and every hit forks golden lightning to a second enemy for 75% damage.',
    flavor: '"One piece threatens two ranks at once — neither can escape."',
  },
  skewer: {
    id: 'skewer',
    name: 'Skewer',
    icon: 'tactic_skewer',
    unlockLevel: 11,
    starterCharges: 2,
    duration: 6.0,
    cooldown: 8.0,
    accent: '#ff7d52',
    badge: '6s RAYS',
    shortDesc: '3 Piercing True-DMG Lances',
    description:
      'Sweeps 3 blazing royal lance-rays down the enemy march over 6s, dealing heavy armor-piercing true damage to every foe in line.',
    flavor: '"Drive the spear straight through the vanguard into the armor behind it."',
  },
  castling: {
    id: 'castling',
    name: 'Castling',
    icon: 'tactic_castling',
    unlockLevel: 14,
    starterCharges: 2,
    duration: 10.0,
    cooldown: 12.0,
    accent: '#78d4ff',
    badge: '10s AEGIS',
    shortDesc: '+3 Lives, Gate Shield & +30% DMG',
    description:
      'Restores +3 Citadel Lives (or +1 shield life above max), repels up to 2 gate breaches for 10s, and empowers all defenders by +30% damage.',
    flavor: '"Tuck the sovereign behind fortress stone and counterattack from safety."',
  },
  checkmate: {
    id: 'checkmate',
    name: 'Checkmate',
    icon: 'tactic_checkmate',
    unlockLevel: 17,
    starterCharges: 2,
    duration: 5.0,
    cooldown: 12.0,
    accent: '#ffd866',
    badge: '5s NUKE',
    shortDesc: 'Board Shockwave + 3s Stun',
    description:
      'Unleashes a royal crown shockwave dealing massive burst + 35% current HP to every enemy, stunning survivors for 3s and exposing them (+35% damage taken) for 5s.',
    flavor: '"Every flight square is covered. The obsidian crown shatters."',
  },
};

/**
 * Returns true if the given level context should expose Royal Tactics & rewarded restock ads.
 * Strictly disabled for Campaign Levels 1–5 (and Quick Match prior to reaching Level 6).
 */
export function areTacticsEnabledForLevel(level, highestUnlocked = 1) {
  if (!level) return highestUnlocked >= TACTICS_MIN_LEVEL;
  if (level.isQuickMatch) {
    return highestUnlocked >= TACTICS_MIN_LEVEL;
  }
  return (level.id || 1) >= TACTICS_MIN_LEVEL;
}

/**
 * Returns all unlocked tactics available for a given level context.
 */
export function getUnlockedTacticsForContext(level, highestUnlocked = 1) {
  if (!areTacticsEnabledForLevel(level, highestUnlocked)) return [];
  const effectiveLevel = level?.isQuickMatch
    ? highestUnlocked
    : Math.max(level?.id || 1, highestUnlocked);
  return TACTIC_ORDER.map((id) => TACTICS[id]).filter((t) => t.unlockLevel <= effectiveLevel);
}

/**
 * Returns all tactics unlocked across the campaign save up to highestUnlocked.
 */
export function getUnlockedTacticsForProgress(highestUnlocked = 1) {
  if (highestUnlocked < TACTICS_MIN_LEVEL) return [];
  return TACTIC_ORDER.map((id) => TACTICS[id]).filter((t) => t.unlockLevel <= highestUnlocked);
}

/**
 * Returns the tactic specifically unlocked at this exact level ID, or null.
 */
export function getTacticUnlockedAtLevel(levelId) {
  return TACTIC_ORDER.map((id) => TACTICS[id]).find((t) => t.unlockLevel === levelId) || null;
}

/**
 * Computes the stockpile reward earned upon winning a Campaign level (Level 6+ only).
 */
export function computeVictoryTacticReward(level, highestUnlocked, stars = 1) {
  if (!level || level.isQuickMatch || level.id < TACTICS_MIN_LEVEL) return null;
  const unlocked = getUnlockedTacticsForContext(level, highestUnlocked);
  if (unlocked.length === 0) return null;

  // Favor the tactic unlocked closest to (or at) this stage so higher stages reward higher tactics
  let chosen = unlocked[0];
  for (const t of unlocked) {
    if (t.unlockLevel <= level.id) chosen = t;
  }
  const amount = stars >= 3 ? 2 : 1;
  return { tacticId: chosen.id, tactic: chosen, amount };
}
