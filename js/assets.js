/**
 * Sprite & Directional Animation Sheet Asset Loader for TowerDeChess.
 * Preloads all 3D miniature icons (`SPRITES`) and 4x2 animated directional sprite sheets (`SHEETS`).
 * Also resolves URLs for cutscene paintings, cinematic videos and the streamed soundtrack.
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

export const SHEET_META = {
  enemy_footman: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: true, fps: 7.5 },
  enemy_lancer: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: true, fps: 10.5 },
  enemy_bastion: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: true, fps: 5.2 },
  enemy_cleric: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: false, fps: 6.2 },
  enemy_warlord: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: true, fps: 5.5 },

  piece_pawn: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: false, isTower: true },
  piece_knight: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: true, isTower: true },
  piece_bishop: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: true, isTower: true },
  piece_rook: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: true, isTower: true },
  piece_queen: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: false, isTower: true },
  piece_king: { cols: 4, rows: 2, frontFacesRight: true, backFacesRight: true, isTower: true },
  piece_obelisk: { cols: 4, rows: 2, radial: true, fps: 5.5, isTower: true },
};

export const SPRITES = {};
export const SHEETS = {};

export function getSpriteUrl(key) {
  return `assets/sprites/${key}.png`;
}

export function getSheetUrl(key) {
  return `assets/sheets/${key}.png`;
}

export function getSceneUrl(key) {
  return `assets/scenes/${key}.jpg`;
}

export function getVideoUrl(key) {
  return `assets/videos/${key}.mp4`;
}

export function getMusicUrl(key) {
  return `assets/audio/${key}.mp3`;
}

export function getMapBgUrl(theme) {
  return `assets/map/map_bg_${theme}.jpg`;
}

export function getMapNodeUrl(levelId) {
  return `assets/map/node_${String(levelId).padStart(2, '0')}.png`;
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function preloadAssets() {
  const spriteTasks = SPRITE_KEYS.map(async (key) => {
    const img = await loadImage(getSpriteUrl(key));
    if (img) SPRITES[key] = img;
  });

  const sheetTasks = Object.keys(SHEET_META).map(async (key) => {
    const img = await loadImage(getSheetUrl(key));
    if (img) SHEETS[key] = img;
  });

  await Promise.all([...spriteTasks, ...sheetTasks]);
  return SPRITES;
}
