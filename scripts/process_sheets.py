#!/usr/bin/env python3
"""
Chroma-key, seam-slice, and anchor-align all 12 directional 4x2 animation sprite sheets
(5 enemies + 7 defenders) into uniform 640x320 (4 cols x 2 rows of 160x160) transparent PNGs.
"""

import glob
import os
from collections import deque
from PIL import Image

ARTIFACT_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/1b32cacb-a6c7-43b3-aa5e-e6c6efd4fc68"
OUT_DIR = "/home/antigravity/wildvegangoose/TowerDefense/assets/sheets"

SHEET_CONFIGS = [
    ("enemy_footman", "enemy"),
    ("enemy_lancer", "enemy"),
    ("enemy_bastion", "enemy"),
    ("enemy_cleric", "enemy"),
    ("enemy_warlord", "enemy"),
    ("piece_pawn", "tower"),
    ("piece_knight", "tower"),
    ("piece_bishop", "tower"),
    ("piece_rook", "tower"),
    ("piece_queen", "tower"),
    ("piece_king", "tower"),
    ("piece_obelisk", "tower"),
]

CELL_SIZE = 160


def find_latest_sheet(name: str) -> str:
    matches = sorted(glob.glob(os.path.join(ARTIFACT_DIR, f"sheet_{name}_*.jpg")))
    if not matches:
        matches = sorted(glob.glob(os.path.join(ARTIFACT_DIR, f"sheet_{name}_*.png")))
    if not matches:
        raise FileNotFoundError(f"No sprite sheet found for sheet_{name}")
    return matches[-1]


def chroma_key_sheet(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    corners = [px[4, 4], px[w - 5, 4], px[4, h - 5], px[w - 5, h - 5]]
    bg_r = sum(c[0] for c in corners) / 4.0
    bg_g = sum(c[1] for c in corners) / 4.0
    bg_b = sum(c[2] for c in corners) / 4.0

    def green_excess(r, g, b):
        return g - max(r, b)

    bg_mask = [[False] * w for _ in range(h)]
    q = deque()

    def is_bg_candidate(r, g, b):
        return green_excess(r, g, b) > 36 and g > 80

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

    # Catch isolated green pockets between legs, handles, capes
    for y in range(h):
        for x in range(w):
            if not bg_mask[y][x]:
                r, g, b, _ = px[x, y]
                dist = abs(r - bg_r) + abs(g - bg_g) + abs(b - bg_b)
                if dist < 105 and green_excess(r, g, b) > 65:
                    bg_mask[y][x] = True

    # Distance from background for clean alpha feathering + despill
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
                if ge > 16:
                    new_a = int(max(0, min(255, 255 * (1.0 - (ge - 16.0) / 34.0))))
                else:
                    new_a = 255
                max_rb = max(r, b)
                if g > max_rb:
                    avg_rb = (r + b) // 2
                    new_g = min(g, int(max_rb * 0.88 + avg_rb * 0.12))
                else:
                    new_g = g
                px[x, y] = (r, new_g, b, new_a)
            else:
                if ge > 14:
                    max_rb = max(r, b)
                    new_g = int(max_rb + (g - max_rb) * 0.2)
                    px[x, y] = (r, new_g, b, 255)

    return rgba


def find_best_seam_y(rgba: Image.Image) -> int:
    w, h = rgba.size
    alpha = rgba.getchannel("A")
    px = alpha.load()
    lo, hi = int(h * 0.42), int(h * 0.58)
    best_y = h // 2
    best_score = 10**12
    for y in range(lo, hi):
        score = sum(px[x, y] for x in range(0, w, 2))
        if score < best_score:
            best_score = score
            best_y = y
    return best_y


def find_best_seams_x(row_img: Image.Image) -> list[int]:
    w, h = row_img.size
    alpha = row_img.getchannel("A")
    px = alpha.load()
    seams = [0]
    for i in (1, 2, 3):
        nominal = int(w * i / 4.0)
        lo = max(1, int(nominal - w * 0.06))
        hi = min(w - 1, int(nominal + w * 0.06))
        best_x = nominal
        best_score = 10**12
        for x in range(lo, hi):
            score = sum(px[x, y] for y in range(0, h, 2))
            if score < best_score:
                best_score = score
                best_x = x
        seams.append(best_x)
    seams.append(w)
    return seams


def measure_frame_anchor(cell: Image.Image, kind: str):
    """Find stable body anchor (anchor_x, anchor_y, body_h) resistant to protruding weapons/effects."""
    bbox = cell.getbbox()
    if not bbox:
        return None
    cropped = cell.crop(bbox)
    cw, ch = cropped.size
    alpha = cropped.getchannel("A")
    px = alpha.load()

    # Collect solid opaque pixels (alpha > 150 ignores soft magic glows!)
    xs_body = []
    ys_all = []
    xs_base = []

    y_mid_lo = int(ch * 0.30)
    y_mid_hi = int(ch * 0.85)
    y_base_lo = int(ch * 0.78)

    for y in range(ch):
        for x in range(cw):
            if px[x, y] > 150:
                ys_all.append(y)
                if y_mid_lo <= y <= y_mid_hi:
                    xs_body.append(x)
                if y >= y_base_lo:
                    xs_base.append(x)

    if not ys_all:
        return (cropped, cw / 2.0, ch * 0.95, float(ch))

    ys_all.sort()
    y_top = ys_all[int(len(ys_all) * 0.02)]
    y_bot = ys_all[int(len(ys_all) * 0.985)]
    body_h = max(10.0, float(y_bot - y_top))

    if kind == "tower" and xs_base:
        xs_base.sort()
        # Median X of the round walnut pedestal stays rock-solid across attack frames!
        anchor_x = float(xs_base[len(xs_base) // 2])
    elif xs_body:
        xs_body.sort()
        anchor_x = float(xs_body[len(xs_body) // 2])
    else:
        anchor_x = cw / 2.0

    anchor_y = float(y_bot)
    return (cropped, anchor_x, anchor_y, body_h)


def process_one_sheet(name: str, kind: str):
    src = find_latest_sheet(name)
    print(f"Processing sheet {name} ({kind}) <- {os.path.basename(src)}")
    img = Image.open(src)
    clean = chroma_key_sheet(img)
    w, h = clean.size

    mid_y = find_best_seam_y(clean)
    rows = [clean.crop((0, 0, w, mid_y)), clean.crop((0, mid_y, w, h))]

    raw_frames = []
    for r_idx, row_img in enumerate(rows):
        seams = find_best_seams_x(row_img)
        for c_idx in range(4):
            cell = row_img.crop((seams[c_idx], 0, seams[c_idx + 1], row_img.size[1]))
            measured = measure_frame_anchor(cell, kind)
            raw_frames.append((r_idx, c_idx, measured))

    # Compute uniform character scale from median solid body height across all 8 frames
    body_heights = sorted(m[3] for _, _, m in raw_frames if m is not None)
    med_body_h = body_heights[len(body_heights) // 2] if body_heights else 100.0
    target_body_h = CELL_SIZE * (0.76 if kind == "tower" else 0.78)
    base_scale = target_body_h / max(1.0, med_body_h)

    # Ensure even the widest/tallest attack frame still fits comfortably inside 160x160!
    max_fit_scale = base_scale
    for _, _, m in raw_frames:
        if not m:
            continue
        cropped, ax, ay, _ = m
        cw, ch = cropped.size
        left_ext = ax
        right_ext = cw - ax
        # Need both sides to fit within half cell width (with 2px margin), and height within 94%
        fit_w = (CELL_SIZE * 0.48) / max(1.0, left_ext, right_ext)
        fit_h = (CELL_SIZE * 0.90) / max(1.0, ay)
        max_fit_scale = min(max_fit_scale, fit_w, fit_h)

    # Blend slightly so normal bodies stay large while extreme blasts barely clip or stay crisp
    final_scale = max(base_scale * 0.82, max_fit_scale)

    sheet = Image.new("RGBA", (CELL_SIZE * 4, CELL_SIZE * 2), (0, 0, 0, 0))
    dest_anchor_x = CELL_SIZE * 0.5
    dest_anchor_y = CELL_SIZE * 0.90

    for r_idx, c_idx, m in raw_frames:
        if not m:
            continue
        cropped, ax, ay, _ = m
        cw, ch = cropped.size
        nw = max(1, int(round(cw * final_scale)))
        nh = max(1, int(round(ch * final_scale)))
        resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

        ox = int(round(dest_anchor_x - ax * final_scale))
        oy = int(round(dest_anchor_y - ay * final_scale))

        cell_canvas = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
        cell_canvas.paste(resized, (ox, oy), resized)
        sheet.paste(cell_canvas, (c_idx * CELL_SIZE, r_idx * CELL_SIZE), cell_canvas)

    out_path = os.path.join(OUT_DIR, f"{name}.png")
    sheet.save(out_path, "PNG", optimize=True)
    print(f"  -> saved {out_path} ({os.path.getsize(out_path):,} bytes)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, kind in SHEET_CONFIGS:
        process_one_sheet(name, kind)
    print("All 12 animation sprite sheets processed cleanly!")


if __name__ == "__main__":
    main()
