#!/usr/bin/env python3
"""
Builds a single-file, zero-dependency, CSP-safe standalone HTML version of TowerDeChess
with all CSS, JS modules, and WebP miniature sprites inlined.
"""

import base64
import io
import json
import os
import re
from PIL import Image

REPO_DIR = "/home/antigravity/wildvegangoose/TowerDefense"
OUT_PATH = os.path.join(REPO_DIR, "dist", "towerdechess-standalone.html")

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

    app_icon_uri = encode_webp_data_uri(
        os.path.join(REPO_DIR, "assets", "icons", "icon-192.png"), size=96, quality=82
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

    # Inline assets.js replacement backed by base64 data URIs
    assets_js = f"""
const INLINE_SPRITE_URIS = {json.dumps(inline_sprites)};
const INLINE_SHEET_URIS = {json.dumps(inline_sheets)};
const INLINE_SCENE_URIS = {json.dumps(inline_scenes)};
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
