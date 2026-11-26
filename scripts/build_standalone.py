#!/usr/bin/env python3
"""
Builds a single-file, zero-dependency, CSP-safe standalone HTML version of Crownward
with all CSS, JS modules, and WebP miniature sprites inlined.
"""

import base64
import io
import json
import os
import re
from PIL import Image

REPO_DIR = "/home/antigravity/wildvegangoose/TowerDefense"
OUT_PATH = os.path.join(REPO_DIR, "dist", "crownward-standalone.html")

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

JS_FILES_IN_ORDER = [
    "js/data/levels.js",
    "js/data/pieces.js",
    "js/data/enemies.js",
    "js/audio.js",
    "js/engine/targeting.js",
    "js/engine/game.js",
    "js/main.js",
]


def encode_webp_data_uri(path: str, size: int = 96, quality: int = 82) -> str:
    im = Image.open(path).convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="WEBP", quality=quality, method=6)
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
const SPRITES = {{}};
function getSpriteUrl(key) {{
  return INLINE_SPRITE_URIS[key] || '';
}}
async function preloadAssets() {{
  const tasks = Object.entries(INLINE_SPRITE_URIS).map(
    ([key, uri]) =>
      new Promise((resolve) => {{
        const img = new Image();
        img.onload = () => {{ SPRITES[key] = img; resolve(true); }};
        img.onerror = () => resolve(false);
        img.src = uri;
      }})
  );
  await Promise.all(tasks);
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
  <title>Crownward — Chess Tower Defense</title>
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
