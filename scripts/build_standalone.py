#!/usr/bin/env python3
"""
Builds a single-file, zero-dependency, CSP-safe standalone HTML version of TowerDeChess
with all CSS, JS modules, WebP miniature sprites and a compact copy of the soundtrack inlined.

Cinematic videos are too large to inline, so video cutscenes fall back to their painted slides.
The soundtrack is re-encoded to a lighter MP3 when ffmpeg is on PATH (otherwise inlined as-is).
"""

import base64
import io
import json
import os
import re
import shutil
import subprocess
import tempfile
from PIL import Image

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(REPO_DIR, "dist", "towerdechess-standalone.html")

MUSIC_KEY = "before_the_gates_break"
STANDALONE_MUSIC_BITRATE = "96k"

SPRITE_KEYS = [
    "piece_pawn",
    "piece_knight",
    "piece_bishop",
    "piece_rook",
    "piece_queen",
    "piece_king",
    "piece_obelisk",
    "enemy_footman",
    "enemy_lancer",
    "enemy_bastion",
    "enemy_cleric",
    "enemy_warlord",
    "citadel_gate",
]

MAP_BG_KEYS = ["ivory", "glacial", "crimson"]

SCENE_KEYS = [
    "scene_prologue_1",
    "scene_prologue_2",
    "scene_chapter2_1",
    "scene_chapter2_2",
    "scene_chapter3_1",
    "scene_epilogue_1",
]

JS_FILES_IN_ORDER = [
    "js/data/levels.js",
    "js/data/pieces.js",
    "js/data/enemies.js",
    "js/data/story.js",
    "js/audio.js",
    "js/storage.js",
    "js/cutscene.js",
    "js/engine/targeting.js",
    "js/engine/game.js",
    "js/engine/weather.js",
    "js/main.js",
]


SHEET_META = {
    "enemy_footman": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": True, "fps": 7.5},
    "enemy_lancer": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": True, "fps": 10.5},
    "enemy_bastion": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": True, "fps": 5.2},
    "enemy_cleric": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": False, "fps": 6.2},
    "enemy_warlord": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": True, "fps": 5.5},
    "piece_pawn": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": False, "isTower": True},
    "piece_knight": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": True, "isTower": True},
    "piece_bishop": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": True, "isTower": True},
    "piece_rook": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": True, "isTower": True},
    "piece_queen": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": False, "isTower": True},
    "piece_king": {"cols": 4, "rows": 2, "frontFacesRight": True, "backFacesRight": True, "isTower": True},
    "piece_obelisk": {"cols": 4, "rows": 2, "radial": True, "fps": 5.5, "isTower": True},
}


def encode_webp_data_uri(path: str, size: int = 96, quality: int = 82) -> str:
    im = Image.open(path).convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="WEBP", quality=quality, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def encode_sheet_webp_data_uri(path: str, width: int = 416, height: int = 208, quality: int = 76) -> str:
    im = Image.open(path).convert("RGBA").resize((width, height), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="WEBP", quality=quality, method=4)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def encode_scene_webp_data_uri(path: str, width: int = 640, height: int = 360, quality: int = 74) -> str:
    im = Image.open(path).convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="WEBP", quality=quality, method=4)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def encode_music_base64(path: str, bitrate: str = STANDALONE_MUSIC_BITRATE) -> str:
    """Returns the soundtrack as base64 MP3, downsized with ffmpeg when available."""
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "music.mp3")
            subprocess.run(
                [ffmpeg, "-y", "-loglevel", "error", "-i", path, "-map", "0:a", "-c:a", "libmp3lame",
                 "-b:a", bitrate, "-map_metadata", "-1", out],
                check=True,
            )
            with open(out, "rb") as f:
                return base64.b64encode(f.read()).decode("ascii")
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


def strip_es_modules(js: str) -> str:
    # Remove import statements (single or multi-line)
    js = re.sub(r"^\s*import\s+[\s\S]*?from\s+['\"][^'\"]+['\"];?\s*$", "", js, flags=re.MULTILINE)
    # Strip export keywords while keeping declarations
    js = re.sub(r"^\s*export\s+(?=(const|let|var|function|async\s+function|class)\b)", "", js, flags=re.MULTILINE)
    return js


def build() -> str:
    inline_sprites = {}
    for key in SPRITE_KEYS:
        inline_sprites[key] = encode_webp_data_uri(
            os.path.join(REPO_DIR, "assets", "sprites", f"{key}.png"), size=96, quality=82
        )
    inline_sheets = {}
    for key in SHEET_META.keys():
        sheet_path = os.path.join(REPO_DIR, "assets", "sheets", f"{key}.png")
        if os.path.exists(sheet_path):
            inline_sheets[key] = encode_sheet_webp_data_uri(sheet_path, width=416, height=208, quality=76)
    inline_scenes = {}
    for key in SCENE_KEYS:
        scene_path = os.path.join(REPO_DIR, "assets", "scenes", f"{key}.jpg")
        if os.path.exists(scene_path):
            inline_scenes[key] = encode_scene_webp_data_uri(scene_path, width=640, height=360, quality=74)
    inline_map_bgs = {}
    for theme in MAP_BG_KEYS:
        bg_path = os.path.join(REPO_DIR, "assets", "map", f"map_bg_{theme}.jpg")
        if os.path.exists(bg_path):
            inline_map_bgs[theme] = encode_scene_webp_data_uri(bg_path, width=480, height=640, quality=72)
    inline_map_nodes = {}
    for lvl_id in range(1, 19):
        node_path = os.path.join(REPO_DIR, "assets", "map", f"node_{lvl_id:02d}.png")
        if os.path.exists(node_path):
            inline_map_nodes[str(lvl_id)] = encode_sheet_webp_data_uri(node_path, width=144, height=144, quality=80)
    inline_level_bgs = {}
    for lvl_id in range(1, 19):
        lbg_path = os.path.join(REPO_DIR, "assets", "backgrounds", f"level_{lvl_id:02d}.jpg")
        if os.path.exists(lbg_path):
            inline_level_bgs[str(lvl_id)] = encode_scene_webp_data_uri(lbg_path, width=480, height=270, quality=68)

    ui_icon_keys = [
        "settings", "back", "pause", "play", "speed",
        "music", "sfx", "codex", "restart", "scroll",
    ]
    inline_ui_icons = {}
    for key in ui_icon_keys:
        icon_path = os.path.join(REPO_DIR, "assets", "ui", f"ui_{key}.png")
        if os.path.exists(icon_path):
            inline_ui_icons[key] = encode_webp_data_uri(icon_path, size=96, quality=88)

    game_logo_path = os.path.join(REPO_DIR, "assets", "ui", "game_logo.png")
    game_logo_uri = (
        encode_webp_data_uri(game_logo_path, size=160, quality=90)
        if os.path.exists(game_logo_path)
        else ""
    )
    mode_banners = {}
    for bname in ("mode_campaign", "mode_quickmatch"):
        bpath = os.path.join(REPO_DIR, "assets", "ui", f"{bname}.jpg")
        if os.path.exists(bpath):
            mode_banners[bname] = encode_scene_webp_data_uri(bpath, width=640, height=360, quality=78)

    music_path = os.path.join(REPO_DIR, "assets", "audio", f"{MUSIC_KEY}.mp3")
    inline_music_b64 = encode_music_base64(music_path) if os.path.exists(music_path) else ""

    app_icon_uri = encode_webp_data_uri(
        os.path.join(REPO_DIR, "assets", "icons", "icon-192.png"), size=96, quality=82
    )
    studio_logo_path = os.path.join(REPO_DIR, "assets", "icons", "wildgoose_logo.png")
    studio_logo_uri = (
        encode_webp_data_uri(studio_logo_path, size=256, quality=90)
        if os.path.exists(studio_logo_path)
        else ""
    )

    with open(os.path.join(REPO_DIR, "css", "styles.css"), "r", encoding="utf-8") as f:
        css = f.read()

    with open(os.path.join(REPO_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()

    # Extract <body> inner HTML (excluding the module script tag)
    body_match = re.search(r"<body>([\s\S]*?)</body>", html)
    body_inner = body_match.group(1)
    body_inner = re.sub(r'<script\s+type="module"[\s\S]*?</script>', "", body_inner)
    body_inner = body_inner.replace('src="assets/icons/icon-192.png"', f'src="{app_icon_uri}"')
    if studio_logo_uri:
        body_inner = body_inner.replace('src="assets/icons/wildgoose_logo.png"', f'src="{studio_logo_uri}"')
    if game_logo_uri:
        body_inner = body_inner.replace('src="assets/ui/game_logo.png"', f'src="{game_logo_uri}"')
    for bname, uri in mode_banners.items():
        body_inner = body_inner.replace(f'src="assets/ui/{bname}.jpg"', f'src="{uri}"')
    for key, uri in inline_ui_icons.items():
        body_inner = body_inner.replace(f'src="assets/ui/ui_{key}.png"', f'src="{uri}"')

    # Inline assets.js replacement backed by base64 data URIs
    assets_js = f"""
const INLINE_SPRITE_URIS = {json.dumps(inline_sprites)};
const INLINE_SHEET_URIS = {json.dumps(inline_sheets)};
const INLINE_SCENE_URIS = {json.dumps(inline_scenes)};
const INLINE_MAP_BG_URIS = {json.dumps(inline_map_bgs)};
const INLINE_MAP_NODE_URIS = {json.dumps(inline_map_nodes)};
const INLINE_LEVEL_BG_URIS = {json.dumps(inline_level_bgs)};
const INLINE_UI_ICON_URIS = {json.dumps(inline_ui_icons)};
const SHEET_META = {json.dumps(SHEET_META)};
const SPRITES = {{}};
const SHEETS = {{}};
function getSpriteUrl(key) {{
  return INLINE_SPRITE_URIS[key] || '';
}}
function getSheetUrl(key) {{
  return INLINE_SHEET_URIS[key] || '';
}}
function getSceneUrl(key) {{
  return INLINE_SCENE_URIS[key] || '';
}}
function getMapBgUrl(theme) {{
  return INLINE_MAP_BG_URIS[theme] || '';
}}
function getMapNodeUrl(levelId) {{
  return INLINE_MAP_NODE_URIS[String(levelId)] || '';
}}
function getLevelBgUrl(levelId) {{
  return INLINE_LEVEL_BG_URIS[String(levelId)] || '';
}}
function getUiIconUrl(key) {{
  return INLINE_UI_ICON_URIS[key] || '';
}}
// Videos are not inlined: video cutscenes play their painted slides instead
function getVideoUrl(key) {{
  return '';
}}
const INLINE_MUSIC_B64 = {json.dumps({MUSIC_KEY: inline_music_b64} if inline_music_b64 else {})};
const MUSIC_BLOB_URLS = {{}};
// Blob URLs avoid browser size limits on large media data: URIs
function getMusicUrl(key) {{
  if (MUSIC_BLOB_URLS[key]) return MUSIC_BLOB_URLS[key];
  const b64 = INLINE_MUSIC_B64[key];
  if (!b64) return '';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  MUSIC_BLOB_URLS[key] = URL.createObjectURL(new Blob([bytes], {{ type: 'audio/mpeg' }}));
  return MUSIC_BLOB_URLS[key];
}}
async function preloadAssets() {{
  const loadInto = (map, dict) => Object.entries(map).map(
    ([key, uri]) =>
      new Promise((resolve) => {{
        const img = new Image();
        img.onload = () => {{ dict[key] = img; resolve(true); }};
        img.onerror = () => resolve(false);
        img.src = uri;
      }})
  );
  await Promise.all([...loadInto(INLINE_SPRITE_URIS, SPRITES), ...loadInto(INLINE_SHEET_URIS, SHEETS)]);
  return SPRITES;
}}
"""

    js_parts = [assets_js]
    for rel in JS_FILES_IN_ORDER:
        with open(os.path.join(REPO_DIR, rel), "r", encoding="utf-8") as f:
            code = strip_es_modules(f.read())
        # Skip service worker registration in standalone mode
        if rel == "js/main.js":
            code = code.replace("this._registerServiceWorker();", "// standalone mode")
        js_parts.append(f"// === {rel} ===\n{code}")

    bundled_js = "\n\n".join(js_parts)

    standalone = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>TowerDeChess — Chess Tower Defense</title>
  <style>
{css}
  </style>
</head>
<body>
{body_inner}
  <script>
(() => {{
{bundled_js}
}})();
  </script>
</body>
</html>
"""

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(standalone)
    print(f"Built {OUT_PATH} ({len(standalone):,} bytes)")
    return standalone


if __name__ == "__main__":
    build()
