/**
 * Sprite asset loader for TowerDeChess.
 * Preloads all 3D miniature PNG sprites with clean fallback handling.
 */

const SPRITE_KEYS = [
  'piece_pawn',
  'piece_knight',
  'piece_bishop',
  'piece_rook',
  'piece_queen',
  'piece_king',
  'piece_obelisk',
  'enemy_footman',
  'enemy_lancer',
  'enemy_bastion',
  'enemy_cleric',
  'enemy_warlord',
  'citadel_gate',
];

export const SPRITES = {};

export function getSpriteUrl(key) {
  return `assets/sprites/${key}.png`;
}

export async function preloadAssets() {
  const tasks = SPRITE_KEYS.map(
    (key) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          SPRITES[key] = img;
          resolve(true);
        };
        img.onerror = () => {
          console.warn(`[Assets] Failed to load sprite: ${key}`);
          resolve(false);
        };
        img.src = getSpriteUrl(key);
      })
  );
  await Promise.all(tasks);
  return SPRITES;
}
