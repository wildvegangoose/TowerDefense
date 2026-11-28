#!/usr/bin/env python3
"""
Processes generated Campaign Map backgrounds and 18 story-matched circular level button emblems.
Pure Pillow (zero extra dependencies):
- Converts 3 illustrated realm cartography maps into progressive JPEGs in assets/map/.
- Chroma-keys, despills, and geometrically normalizes all 18 level button emblems onto an
  identical 224x224 RGBA canvas where the base circular scene sits at center (112, 120) with
  radius 88px (diameter 176px), allowing tall spires/spears/crowns to subtly peek out the top rim
  while every button shares the exact same circular casing & outer glow envelope.
"""

from __future__ import annotations

import math
from pathlib import Path
from PIL import Image, ImageFilter

ARTIFACTS_DIR = Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/1b32cacb-a6c7-43b3-aa5e-e6c6efd4fc68"
)
REPO_DIR = Path("/home/antigravity/wildvegangoose/TowerDefense")
OUT_DIR = REPO_DIR / "assets" / "map"

CANVAS_SIZE = 224
TARGET_CX = 112.0
TARGET_CY = 120.0
TARGET_R = 88.0


def find_latest(prefix: str) -> Path:
    matches = sorted(ARTIFACTS_DIR.glob(f"{prefix}_*.jpg"))
    if not matches:
        raise FileNotFoundError(f"No artifact found for prefix '{prefix}' in {ARTIFACTS_DIR}")
    return matches[-1]


def chroma_key_pil(im: Image.Image) -> Image.Image:
    """Border flood-fill chroma key for #00D040 with edge feathering and green spill suppression."""
    # Downscale to 512x512 first for fast, crisp anti-aliased keying
    work = im.convert("RGBA").resize((512, 512), Image.Resampling.LANCZOS)
    w, h = work.size
    px = work.load()

    def is_bg(r: int, g: int, b: int) -> bool:
        return g > 105 and (g - max(r, b)) > 30

    visited = bytearray(w * h)
    stack: list[int] = []

    for x in range(w):
        for y in (0, h - 1):
            r, g, b, _ = px[x, y]
            if is_bg(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    stack.append(idx)
    for y in range(h):
        for x in (0, w - 1):
            r, g, b, _ = px[x, y]
            if is_bg(r, g, b):
                idx = y * w + x
                if not visited[idx]:
                    visited[idx] = 1
                    stack.append(idx)

    while stack:
        idx = stack.pop()
        x = idx % w
        y = idx // w
        if x > 0:
            n = idx - 1
            if not visited[n] and is_bg(*px[x - 1, y][:3]):
                visited[n] = 1
                stack.append(n)
        if x + 1 < w:
            n = idx + 1
            if not visited[n] and is_bg(*px[x + 1, y][:3]):
                visited[n] = 1
                stack.append(n)
        if y > 0:
            n = idx - w
            if not visited[n] and is_bg(*px[x, y - 1][:3]):
                visited[n] = 1
                stack.append(n)
        if y + 1 < h:
            n = idx + w
            if not visited[n] and is_bg(*px[x, y + 1][:3]):
                visited[n] = 1
                stack.append(n)

    bg_mask = Image.frombytes("L", (w, h), bytes(255 if v else 0 for v in visited))
    edge_px = bg_mask.filter(ImageFilter.MaxFilter(5)).load()
    near_px = bg_mask.filter(ImageFilter.MaxFilter(7)).load()

    for y in range(h):
        row = y * w
        for x in range(w):
            if visited[row + x]:
                px[x, y] = (0, 0, 0, 0)
                continue
            r, g, b, a = px[x, y]
            if near_px[x, y]:
                max_rb = r if r > b else b
                excess = g - max_rb
                if edge_px[x, y] and excess > 8:
                    fa = int(max(0.0, min(1.0, 1.0 - (excess - 8.0) / 48.0)) * 255)
                    a = fa
                if excess > 4:
                    g = min(g, max_rb + 4)
                px[x, y] = (r, g, b, a)

    return work


def normalize_emblem(src_path: Path, dst_path: Path) -> None:
    keyed = chroma_key_pil(Image.open(src_path))
    w, h = keyed.size
    px = keyed.load()

    min_y_all = h
    max_y_all = 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 128:
                if y < min_y_all:
                    min_y_all = y
                if y > max_y_all:
                    max_y_all = y

    if max_y_all <= min_y_all:
        raise ValueError(f"Empty foreground for {src_path}")

    # Measure horizontal extent in the lower 56% of the silhouette (pure circular disc)
    band_top = int(max_y_all - (max_y_all - min_y_all) * 0.56)
    band_bot = int(max_y_all - (max_y_all - min_y_all) * 0.14)
    min_x = w
    max_x = 0
    for y in range(max(0, band_top), min(h, band_bot)):
        for x in range(w):
            if px[x, y][3] > 128:
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x

    r_est = max(1.0, (max_x - min_x) * 0.5)
    cx_est = (min_x + max_x) * 0.5
    cy_est = max_y_all - r_est

    scale = TARGET_R / r_est
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    resized = keyed.resize((new_w, new_h), Image.Resampling.LANCZOS)

    paste_x = int(round(TARGET_CX - cx_est * scale))
    paste_y = int(round(TARGET_CY - cy_est * scale))

    top_y_mapped = min_y_all * scale + paste_y
    if top_y_mapped < 2:
        extra_top = 2 - top_y_mapped
        if extra_top <= 8:
            paste_y += int(round(extra_top * 0.45))

    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(resized, (paste_x, paste_y))

    # Smooth circular clip on left/right/bottom so edges never leak outside the uniform casing,
    # while allowing upper crests (above cy - 14) to subtly peek past the top rim!
    cpx = canvas.load()
    for y in range(CANVAS_SIZE):
        dy = y - TARGET_CY
        top_allow = max(0.0, min(1.0, (TARGET_CY - 14.0 - y) / 16.0))
        for x in range(CANVAS_SIZE):
            r, g, b, a = cpx[x, y]
            if a == 0:
                continue
            dx = x - TARGET_CX
            dist = math.hypot(dx, dy)
            side_clip = max(0.0, min(1.0, (TARGET_R + 1.5 - dist) / 1.8))
            upper_cap = max(0.0, min(1.0, (TARGET_R + 30.0 - dist) / 3.0))
            mask = max(side_clip, top_allow * upper_cap)
            if mask < 0.999:
                cpx[x, y] = (r, g, b, int(round(a * mask)))

    canvas.save(dst_path, format="PNG", optimize=True)


def process_backgrounds() -> None:
    for name in ("map_bg_ivory", "map_bg_glacial", "map_bg_crimson"):
        src = find_latest(name)
        dst = OUT_DIR / f"{name}.jpg"
        im = Image.open(src).convert("RGB").resize((768, 1024), Image.Resampling.LANCZOS)
        im.save(dst, format="JPEG", quality=82, optimize=True, progressive=True)
        print(f"Background {dst.name}: {dst.stat().st_size // 1024} KB")


def process_nodes() -> None:
    prefixes = {
        1: "map_node_01",
        2: "map_node_02_v2",
        3: "map_node_03_v2",
        **{i: f"map_node_{i:02d}" for i in range(4, 19)},
    }
    for lvl_id, prefix in prefixes.items():
        src = find_latest(prefix)
        dst = OUT_DIR / f"node_{lvl_id:02d}.png"
        normalize_emblem(src, dst)
        print(f"Node {lvl_id:02d} ({src.name}) -> {dst.name} ({dst.stat().st_size // 1024} KB)")


def make_contact_sheet() -> None:
    cols, rows = 6, 3
    cell = 116
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (28, 20, 14, 255))
    for i in range(1, 19):
        im = Image.open(OUT_DIR / f"node_{i:02d}.png").resize((96, 96), Image.Resampling.LANCZOS)
        c = (i - 1) % cols
        r = (i - 1) // cols
        sheet.alpha_composite(im, (c * cell + 10, r * cell + 10))
    out = ARTIFACTS_DIR / "scratch" / "map_nodes_contact_sheet.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"Contact sheet saved to {out}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    process_backgrounds()
    process_nodes()
    make_contact_sheet()


if __name__ == "__main__":
    main()
