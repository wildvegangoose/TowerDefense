#!/usr/bin/env python3
"""
Generates all Android launcher icons, adaptive foregrounds, splash screens,
and Google Play Store listing graphics (512x512 icon, 1024x500 feature graphic).
"""

import glob
import os
from PIL import Image, ImageDraw

REPO_DIR = "/home/antigravity/wildvegangoose/TowerDefense"
ARTIFACT_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/1b32cacb-a6c7-43b3-aa5e-e6c6efd4fc68"
RES_DIR = os.path.join(REPO_DIR, "android", "app", "src", "main", "res")
STORE_DIR = os.path.join(REPO_DIR, "store-assets")

WALNUT_BG = (26, 18, 13, 255)  # #1a120d

LAUNCHER_SIZES = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}


def make_round(img: Image.Image) -> Image.Image:
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def make_adaptive_foreground(icon: Image.Image, fg_size: int) -> Image.Image:
    # Android Adaptive Icon safe zone is inner 66% (72/108) -> keep emblem neatly centered at 68%
    canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    inner = int(round(fg_size * 0.68))
    resized = icon.resize((inner, inner), Image.Resampling.LANCZOS)
    # Soft circular feather on edges of square icon so it melts cleanly onto walnut background
    mask = Image.new("L", (inner, inner), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, inner - 1, inner - 1), radius=int(inner * 0.22), fill=255)
    off = (fg_size - inner) // 2
    canvas.paste(resized, (off, off), mask)
    return canvas


def make_splash(icon: Image.Image, w: int, h: int) -> Image.Image:
    canvas = Image.new("RGB", (w, h), WALNUT_BG[:3])
    logo_sz = int(min(w, h) * 0.34)
    resized = icon.resize((logo_sz, logo_sz), Image.Resampling.LANCZOS)
    mask = Image.new("L", (logo_sz, logo_sz), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, logo_sz - 1, logo_sz - 1), radius=int(logo_sz * 0.22), fill=255)
    ox = (w - logo_sz) // 2
    oy = (h - logo_sz) // 2
    canvas.paste(resized, (ox, oy), mask)
    return canvas


def main():
    os.makedirs(STORE_DIR, exist_ok=True)
    icon_src = os.path.join(REPO_DIR, "assets", "icons", "icon-512.png")
    icon = Image.open(icon_src).convert("RGBA")

    # 1. Play Store 512x512 opaque PNG icon
    play_icon = Image.new("RGB", (512, 512), WALNUT_BG[:3])
    play_icon.paste(icon.resize((512, 512), Image.Resampling.LANCZOS), (0, 0))
    play_icon.save(os.path.join(STORE_DIR, "play-icon-512.png"), "PNG", optimize=True)

    # 2. Play Store 1024x500 Feature Graphic
    feat_matches = sorted(glob.glob(os.path.join(ARTIFACT_DIR, "play_feature_graphic_*.jpg")))
    if feat_matches:
        feat = Image.open(feat_matches[-1]).convert("RGB")
        fw, fh = feat.size
        target_ratio = 1024 / 500
        src_ratio = fw / fh
        if src_ratio > target_ratio:
            nw = int(fh * target_ratio)
            left = (fw - nw) // 2
            feat = feat.crop((left, 0, left + nw, fh))
        else:
            nh = int(fw / target_ratio)
            top = (fh - nh) // 2
            feat = feat.crop((0, top, fw, top + nh))
        feat = feat.resize((1024, 500), Image.Resampling.LANCZOS)
        feat.save(os.path.join(STORE_DIR, "feature-graphic-1024x500.png"), "PNG", optimize=True)
        print("Generated store-assets/feature-graphic-1024x500.png")

    # 3. Android Launcher Icons across all densities
    for folder, (legacy_sz, fg_sz) in LAUNCHER_SIZES.items():
        d = os.path.join(RES_DIR, folder)
        os.makedirs(d, exist_ok=True)
        legacy = icon.resize((legacy_sz, legacy_sz), Image.Resampling.LANCZOS)
        legacy.save(os.path.join(d, "ic_launcher.png"), "PNG", optimize=True)
        make_round(legacy).save(os.path.join(d, "ic_launcher_round.png"), "PNG", optimize=True)
        make_adaptive_foreground(icon, fg_sz).save(
            os.path.join(d, "ic_launcher_foreground.png"), "PNG", optimize=True
        )

    # 4. Replace every Capacitor splash.png with Crownward walnut splash
    for root, _, files in os.walk(RES_DIR):
        if "splash.png" in files:
            sp_path = os.path.join(root, "splash.png")
            with Image.open(sp_path) as existing:
                w, h = existing.size
            make_splash(icon, w, h).save(sp_path, "PNG", optimize=True)

    print("All Android icons, splash screens, and Play Store graphics generated!")


if __name__ == "__main__":
    main()
