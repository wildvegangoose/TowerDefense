#!/usr/bin/env python3
"""
Chroma-key and optimize generated 3D miniature sprites into clean transparent PNGs.
Also reusable when adding future Blender renders or AI-generated non-chess pieces!
"""

import glob
import os
from collections import deque
from PIL import Image

ARTIFACT_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/1b32cacb-a6c7-43b3-aa5e-e6c6efd4fc68"
OUT_DIR = "/home/antigravity/wildvegangoose/TowerDefense/assets/sprites"
ICON_DIR = "/home/antigravity/wildvegangoose/TowerDefense/assets/icons"

SPRITE_NAMES = [
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


def find_latest_image(prefix: str) -> str:
    matches = sorted(glob.glob(os.path.join(ARTIFACT_DIR, f"{prefix}_*.jpg")))
    if not matches:
        matches = sorted(glob.glob(os.path.join(ARTIFACT_DIR, f"{prefix}_*.png")))
    if not matches:
        raise FileNotFoundError(f"No image found for prefix {prefix}")
    return matches[-1]


def remove_chroma_green(img: Image.Image, target_size: int = 256) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    # Sample background green from corners
    corners = [px[4, 4], px[w - 5, 4], px[4, h - 5], px[w - 5, h - 5]]
    bg_r = sum(c[0] for c in corners) / 4.0
    bg_g = sum(c[1] for c in corners) / 4.0
    bg_b = sum(c[2] for c in corners) / 4.0

    def green_excess(r, g, b):
        return g - max(r, b)

    # 1. Flood-fill definite background starting from all border pixels
    bg_mask = [[False] * w for _ in range(h)]
    q = deque()

    def is_bg_candidate(r, g, b):
        ge = green_excess(r, g, b)
        # Definitely green-screen background or strong green fringe
        return ge > 38 and g > 80

    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = px[x, y]
            if is_bg_candidate(r, g, b) and not bg_mask[y][x]:
                bg_mask[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = px[x, y]
            if is_bg_candidate(r, g, b) and not bg_mask[y][x]:
                bg_mask[y][x] = True
                q.append((x, y))

    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg_mask[ny][nx]:
                r, g, b, _ = px[nx, ny]
                if is_bg_candidate(r, g, b):
                    bg_mask[ny][nx] = True
                    q.append((nx, ny))

    # Also catch isolated green pockets (e.g. between Knight's legs or staff & cloak)
    for y in range(h):
        for x in range(w):
            if not bg_mask[y][x]:
                r, g, b, _ = px[x, y]
                dist = abs(r - bg_r) + abs(g - bg_g) + abs(b - bg_b)
                if dist < 95 and green_excess(r, g, b) > 75:
                    bg_mask[y][x] = True

    # 2. Compute soft edge alpha & aggressive despill near background boundary
    # Mark pixels within 3px of bg_mask as edge zone
    edge_dist = [[99] * w for _ in range(h)]
    eq = deque()
    for y in range(h):
        for x in range(w):
            if bg_mask[y][x]:
                edge_dist[y][x] = 0
                eq.append((x, y))

    while eq:
        cx, cy = eq.popleft()
        d = edge_dist[cy][cx]
        if d >= 5:
            continue
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h and edge_dist[ny][nx] > d + 1:
                edge_dist[ny][nx] = d + 1
                eq.append((nx, ny))

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = edge_dist[y][x]
            if d == 0:
                px[x, y] = (0, 0, 0, 0)
                continue

            ge = green_excess(r, g, b)
            if d <= 4:
                # Feather anti-aliased green border smoothly
                if ge > 18:
                    # Map ge in [18..55] -> alpha in [255..0]
                    new_a = int(max(0, min(255, 255 * (1.0 - (ge - 18.0) / 36.0))))
                else:
                    new_a = 255
                # Despill green channel cleanly so no green halo remains
                max_rb = max(r, b)
                if g > max_rb:
                    # Blend green down to neutral average of max(r,b) and slight warmth
                    avg_rb = (r + b) // 2
                    new_g = min(g, int(max_rb * 0.85 + avg_rb * 0.15))
                else:
                    new_g = g
                px[x, y] = (r, new_g, b, new_a)
            else:
                # Gentle interior despill if chroma bounce hit ivory/metal
                if ge > 12:
                    max_rb = max(r, b)
                    new_g = int(max_rb + (g - max_rb) * 0.25)
                    px[x, y] = (r, new_g, b, 255)

    # 3. Trim bounding box cleanly and center onto square canvas aligned near bottom plinth
    bbox = rgba.getbbox()
    if bbox:
        cropped = rgba.crop(bbox)
    else:
        cropped = rgba

    cw, ch = cropped.size
    # Pad so sprite fills ~88% of max dimension, anchored slightly low for tabletop groundedness
    scale = (target_size * 0.88) / max(cw, ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    ox = (target_size - nw) // 2
    oy = int(target_size * 0.94) - nh
    oy = max(int(target_size * 0.04), min(target_size - nh, oy))
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(ICON_DIR, exist_ok=True)

    for name in SPRITE_NAMES:
        src = find_latest_image(name)
        print(f"Processing {name} <- {os.path.basename(src)}")
        img = Image.open(src)
        clean = remove_chroma_green(img, target_size=256)
        out_path = os.path.join(OUT_DIR, f"{name}.png")
        clean.save(out_path, "PNG", optimize=True)

    # App icons for Android PWA
    icon_src = find_latest_image("app_icon")
    icon_img = Image.open(icon_src).convert("RGBA")
    for sz in (192, 512):
        resized = icon_img.resize((sz, sz), Image.Resampling.LANCZOS)
        resized.save(os.path.join(ICON_DIR, f"icon-{sz}.png"), "PNG", optimize=True)
    print("All assets processed successfully!")


if __name__ == "__main__":
    main()
