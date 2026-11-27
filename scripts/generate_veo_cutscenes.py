#!/usr/bin/env python3
"""
Google Veo Cutscene Video Generator for TowerDeChess ("The Shattered Gambit").

Generates 16:9 cinematic MP4 shots using Google's Veo models via the official
`google-genai` Python SDK (supports both Gemini API and Vertex AI), anchored to
our existing painted keyframes in `assets/scenes/*.jpg` (image-to-video) or pure
text-to-video, then stitches multi-shot cutscenes with smooth crossfades via ffmpeg.

Prerequisites:
    pip install google-genai
    # Optional (for stitching multi-shot cutscenes into a single MP4):
    sudo apt-get install ffmpeg   # or `brew install ffmpeg`

Authentication (pick one):
    # Option A — Gemini API (Google AI Studio):
    export GEMINI_API_KEY="your-api-key"

    # Option B — Vertex AI (Google Cloud, recommended for Veo 3.1 GA):
    export GOOGLE_GENAI_USE_VERTEXAI="true"
    export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
    export GOOGLE_CLOUD_LOCATION="us-central1"
    gcloud auth application-default login

Usage Examples:
    # Preview all shot prompts without calling the API:
    python3 scripts/generate_veo_cutscenes.py --dry-run

    # Generate only the Prologue cutscene (3 x 8s shots -> assets/videos/prologue.mp4):
    python3 scripts/generate_veo_cutscenes.py --cutscene prologue

    # Generate all 4 cutscenes at 1080p using Vertex AI Veo 3.1 GA:
    python3 scripts/generate_veo_cutscenes.py --vertexai --model veo-3.1-generate-001 --resolution 1080p

    # Re-generate a single shot only:
    python3 scripts/generate_veo_cutscenes.py --shot prologue_02_shattering --force
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = Path(__file__).resolve().parent / "veo_shots.json"
SHOTS_OUT_DIR = REPO_ROOT / "assets" / "videos" / "shots"
VIDEOS_OUT_DIR = REPO_ROOT / "assets" / "videos"


def load_manifest(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_full_prompt(shot: dict[str, Any], style_bible: str) -> str:
    return f"{shot['prompt'].strip()} Style direction: {style_bible.strip()}"


def create_genai_client(use_vertexai: bool, project: str | None, location: str | None):
    try:
        from google import genai
    except ImportError:
        sys.exit(
            "Missing dependency: google-genai.\n"
            "Install it with:  pip install google-genai"
        )

    if use_vertexai or os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").lower() == "true":
        proj = project or os.environ.get("GOOGLE_CLOUD_PROJECT")
        loc = location or os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        if not proj:
            sys.exit(
                "Vertex AI mode requires --project or GOOGLE_CLOUD_PROJECT env var."
            )
        print(f"[Veo] Using Vertex AI (project={proj}, location={loc})")
        return genai.Client(vertexai=True, project=proj, location=loc)

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        sys.exit(
            "No credentials found.\n"
            "Set GEMINI_API_KEY for Gemini API, or pass --vertexai with GOOGLE_CLOUD_PROJECT."
        )
    print("[Veo] Using Gemini API (API key authentication)")
    return genai.Client(api_key=api_key)


def generate_shot(
    client,
    shot: dict[str, Any],
    style_bible: str,
    negative_prompt: str,
    out_path: Path,
    *,
    model: str,
    mode: str,
    resolution: str,
    duration_override: int | None,
    generate_audio: bool,
    poll_interval: int,
) -> Path:
    from google.genai import types

    duration = duration_override or int(shot.get("duration_seconds", 8))
    aspect_ratio = shot.get("aspect_ratio", "16:9")
    full_prompt = build_full_prompt(shot, style_bible)

    config_kwargs: dict[str, Any] = {
        "aspect_ratio": aspect_ratio,
        "duration_seconds": duration,
        "negative_prompt": negative_prompt,
        "number_of_videos": 1,
    }
    if resolution:
        config_kwargs["resolution"] = resolution
    if generate_audio is not None:
        config_kwargs["generate_audio"] = generate_audio

    # Filter out config keys unsupported by older SDK versions gracefully
    supported_fields = set(getattr(types.GenerateVideosConfig, "model_fields", {}).keys())
    if supported_fields:
        config_kwargs = {k: v for k, v in config_kwargs.items() if k in supported_fields}

    config = types.GenerateVideosConfig(**config_kwargs)

    call_kwargs: dict[str, Any] = {
        "model": model,
        "prompt": full_prompt,
        "config": config,
    }

    if mode == "image-to-video" and shot.get("keyframe"):
        keyframe_path = REPO_ROOT / shot["keyframe"]
        if not keyframe_path.exists():
            raise FileNotFoundError(f"Keyframe image not found: {keyframe_path}")
        print(f"  -> Image-to-Video keyframe: {shot['keyframe']}")
        call_kwargs["image"] = types.Image.from_file(location=str(keyframe_path))
    else:
        print("  -> Mode: text-to-video")

    print(f"  -> Submitting Veo job (model={model}, {duration}s, {aspect_ratio}, {resolution})...")
    operation = client.models.generate_videos(**call_kwargs)

    elapsed = 0
    while not operation.done:
        print(f"     Waiting for Veo render... ({elapsed}s elapsed)", flush=True)
        time.sleep(poll_interval)
        elapsed += poll_interval
        operation = client.operations.get(operation)

    if getattr(operation, "error", None):
        raise RuntimeError(f"Veo generation failed for {shot['id']}: {operation.error}")

    response = getattr(operation, "response", None) or getattr(operation, "result", None)
    generated_videos = getattr(response, "generated_videos", None) if response else None
    if not generated_videos:
        raise RuntimeError(f"No video returned by Veo for shot {shot['id']}")

    video_obj = generated_videos[0].video
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Support both Gemini API (client.files.download) and Vertex AI (inline bytes / save)
    if getattr(video_obj, "video_bytes", None):
        out_path.write_bytes(video_obj.video_bytes)
    else:
        try:
            client.files.download(file=video_obj)
        except Exception:
            pass
        video_obj.save(str(out_path))

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"  -> Saved shot: {out_path.relative_to(REPO_ROOT)} ({size_mb:.2f} MB)")
    return out_path


def probe_duration(video_path: Path) -> float:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return 8.0
    res = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(video_path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    try:
        return float(res.stdout.strip())
    except ValueError:
        return 8.0


def has_audio_stream(video_path: Path) -> bool:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return False
    res = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-select_streams",
            "a",
            "-show_entries",
            "stream=codec_type",
            "-of",
            "csv=p=0",
            str(video_path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    return bool(res.stdout.strip())


def stitch_cutscene(shot_paths: list[Path], out_path: Path, crossfade: float = 0.6) -> None:
    ffmpeg = shutil.which("ffmpeg")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not ffmpeg:
        print(
            "  [WARN] ffmpeg not found on PATH — skipping stitch/web-encode.\n"
            f"         Individual shots are saved in {SHOTS_OUT_DIR.relative_to(REPO_ROOT)}"
        )
        return

    # Single-shot cutscene: re-encode cleanly with web-streaming faststart + mobile-friendly CRF
    if len(shot_paths) == 1:
        cmd = [
            ffmpeg,
            "-y",
            "-i",
            str(shot_paths[0]),
            "-c:v",
            "libx264",
            "-profile:v",
            "main",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "22",
            "-movflags",
            "+faststart",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            str(out_path),
        ]
        subprocess.run(cmd, check=True)
        size_mb = out_path.stat().st_size / (1024 * 1024)
        print(f"  => Exported web cutscene: {out_path.relative_to(REPO_ROOT)} ({size_mb:.2f} MB)")
        return

    # Multi-shot cutscene: smooth video xfade + audio acrossfade chain
    durations = [probe_duration(p) for p in shot_paths]
    all_have_audio = all(has_audio_stream(p) for p in shot_paths)

    inputs: list[str] = []
    for p in shot_paths:
        inputs.extend(["-i", str(p)])

    filter_parts: list[str] = []
    # Normalize timestamps & fps to 24fps before xfade
    for idx in range(len(shot_paths)):
        filter_parts.append(f"[{idx}:v]fps=24,format=yuv420p,setpts=PTS-STARTPTS[v{idx}]")
        if all_have_audio:
            filter_parts.append(f"[{idx}:a]asetpts=PTS-STARTPTS[a{idx}]")

    prev_v = "v0"
    prev_a = "a0"
    running_dur = durations[0]

    for idx in range(1, len(shot_paths)):
        offset = max(0.1, running_dur - crossfade)
        out_v = f"xv{idx}"
        filter_parts.append(
            f"[{prev_v}][v{idx}]xfade=transition=fade:duration={crossfade:.2f}:offset={offset:.2f}[{out_v}]"
        )
        prev_v = out_v

        if all_have_audio:
            out_a = f"xa{idx}"
            filter_parts.append(
                f"[{prev_a}][a{idx}]acrossfade=d={crossfade:.2f}:c1=tri:c2=tri[{out_a}]"
            )
            prev_a = out_a

        running_dur = offset + durations[idx]

    cmd = [
        ffmpeg,
        "-y",
        *inputs,
        "-filter_complex",
        ";".join(filter_parts),
        "-map",
        f"[{prev_v}]",
    ]
    if all_have_audio:
        cmd.extend(["-map", f"[{prev_a}]", "-c:a", "aac", "-b:a", "128k"])
    else:
        cmd.append("-an")

    cmd.extend(
        [
            "-c:v",
            "libx264",
            "-profile:v",
            "main",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "22",
            "-movflags",
            "+faststart",
            str(out_path),
        ]
    )

    subprocess.run(cmd, check=True)
    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"  => Stitched {len(shot_paths)} shots -> {out_path.relative_to(REPO_ROOT)} ({size_mb:.2f} MB)")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate TowerDeChess cutscene videos using Google Veo (google-genai SDK)."
    )
    parser.add_argument(
        "--cutscene",
        default="all",
        help="Cutscene ID to generate: prologue | chapter2 | chapter3 | epilogue | all (default: all)",
    )
    parser.add_argument(
        "--shot",
        default=None,
        help="Generate only a single shot ID (e.g. prologue_02_shattering)",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("VEO_MODEL", "veo-3.1-generate-001"),
        help="Veo model ID (default: veo-3.1-generate-001; e.g. veo-3.1-fast-generate-001, veo-3.0-generate-001)",
    )
    parser.add_argument(
        "--mode",
        choices=["image-to-video", "text-to-video"],
        default="image-to-video",
        help="Anchor shots to existing assets/scenes/*.jpg paintings or use pure text-to-video (default: image-to-video)",
    )
    parser.add_argument(
        "--resolution",
        choices=["720p", "1080p"],
        default="720p",
        help="Output video resolution (default: 720p; 1080p requires 8s duration)",
    )
    parser.add_argument(
        "--duration",
        type=int,
        choices=[4, 6, 8],
        default=None,
        help="Override shot duration in seconds (default: use veo_shots.json, 8s)",
    )
    parser.add_argument(
        "--no-audio",
        action="store_true",
        help="Disable Veo native audio generation (useful if scoring purely with TowerDeChess Web Audio)",
    )
    parser.add_argument(
        "--vertexai",
        action="store_true",
        help="Use Vertex AI authentication (GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_LOCATION)",
    )
    parser.add_argument("--project", default=None, help="GCP Project ID (for --vertexai)")
    parser.add_argument("--location", default=None, help="GCP Region (default: us-central1)")
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=12,
        help="Seconds between operation status polls (default: 12)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-generate shots even if output MP4 already exists",
    )
    parser.add_argument(
        "--skip-stitch",
        action="store_true",
        help="Generate individual shot MP4s only without stitching full cutscenes",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print resolved prompts, keyframes, and output paths without calling the Veo API",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    manifest = load_manifest(MANIFEST_PATH)
    style_bible = manifest["style_bible"]
    negative_prompt = manifest["negative_prompt"]

    cutscenes = manifest["cutscenes"]
    if args.cutscene != "all":
        cutscenes = [c for c in cutscenes if c["id"] == args.cutscene]
        if not cutscenes:
            valid = ", ".join(c["id"] for c in manifest["cutscenes"])
            sys.exit(f"Unknown cutscene '{args.cutscene}'. Valid IDs: {valid}")

    client = None
    if not args.dry_run:
        client = create_genai_client(args.vertexai, args.project, args.location)

    for cs in cutscenes:
        shots = cs["shots"]
        if args.shot:
            shots = [s for s in shots if s["id"] == args.shot]
            if not shots:
                continue

        print(f"\n=== {cs['chapter_label']} — {cs['title']} ({len(shots)} shot(s)) ===")
        shot_files: list[Path] = []

        for shot in shots:
            shot_out = SHOTS_OUT_DIR / f"{shot['id']}.mp4"
            shot_files.append(shot_out)

            if args.dry_run:
                kf_exists = (REPO_ROOT / shot["keyframe"]).exists() if shot.get("keyframe") else False
                print(f"\n[DRY RUN] Shot: {shot['id']} ({shot['title']})")
                print(f"  Keyframe : {shot.get('keyframe')} (exists={kf_exists})")
                print(f"  Output   : {shot_out.relative_to(REPO_ROOT)}")
                print(f"  Duration : {args.duration or shot.get('duration_seconds', 8)}s | {args.resolution} | {args.mode}")
                print(f"  Caption  : {shot['speaker']}: {shot['caption']}")
                print(f"  Prompt   : {build_full_prompt(shot, style_bible)}")
                continue

            if shot_out.exists() and not args.force:
                print(f"  -> Skipping existing shot (use --force to overwrite): {shot_out.relative_to(REPO_ROOT)}")
                continue

            print(f"\n[Shot] {shot['id']} — {shot['title']}")
            generate_shot(
                client,
                shot,
                style_bible,
                negative_prompt,
                shot_out,
                model=args.model,
                mode=args.mode,
                resolution=args.resolution,
                duration_override=args.duration,
                generate_audio=not args.no_audio,
                poll_interval=args.poll_interval,
            )

        if args.dry_run:
            if not args.shot:
                print(f"\n[DRY RUN] Final stitched cutscene -> {cs['output_file']}")
            continue

        if not args.skip_stitch and not args.shot:
            final_out = REPO_ROOT / cs["output_file"]
            stitch_cutscene(shot_files, final_out, crossfade=float(cs.get("crossfade_seconds", 0.6)))

    print("\nDone.")


if __name__ == "__main__":
    main()
