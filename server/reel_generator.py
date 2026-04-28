#!/usr/bin/env python3
"""Python conversion of the Node reel helpers: HF image generation + FFmpeg rendering.

Provides:
- generate_huggingface_image_to_file
- download_image_with_retry
- render_cinematic_video_from_image

This file is intended to be a drop-in utility for scripting or later integration.
"""

from __future__ import annotations

import math
import os
import shutil
import subprocess
import time
from pathlib import Path
from typing import Optional

import requests


HF_API_TOKEN = os.environ.get("HF_API_TOKEN") or os.environ.get("HF_TOKEN")
HF_IMAGE_MODEL = os.environ.get("HF_IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell")


def resolve_ffmpeg_executable() -> str:
    """Resolve ffmpeg executable path across Windows/local setups.

    Resolution order:
    1) FFMPEG_PATH env var
    2) ffmpeg on PATH
    3) local node_modules/ffmpeg-static binary
    """

    env_path = os.environ.get("FFMPEG_PATH")
    if env_path and Path(env_path).exists():
        return str(Path(env_path))

    on_path = shutil.which("ffmpeg")
    if on_path:
        return on_path

    project_root = Path(__file__).resolve().parent.parent
    static_candidates = [
        project_root / "node_modules" / "ffmpeg-static" / "ffmpeg.exe",
        project_root / "node_modules" / "ffmpeg-static" / "ffmpeg",
    ]

    for candidate in static_candidates:
        if candidate.exists():
            return str(candidate)

    raise RuntimeError(
        "FFmpeg executable not found. Install ffmpeg on PATH, set FFMPEG_PATH, or run npm install for ffmpeg-static."
    )


def wait(ms: int) -> None:
    time.sleep(ms / 1000.0)


def generate_huggingface_image_to_file(scene_prompt: str, width: int, height: int, output_path: Path, max_attempts: int = 2) -> None:
    if not HF_API_TOKEN:
        raise RuntimeError("HF_API_TOKEN is not configured in environment")

    endpoint = f"https://router.huggingface.co/hf-inference/models/{HF_IMAGE_MODEL}"
    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "image/png",
    }

    last_error: Optional[Exception] = None
    payload = {"inputs": scene_prompt, "parameters": {"width": width, "height": height}}

    for attempt in range(1, max_attempts + 1):
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=30)
            if not resp.ok:
                text = resp.text[:300]
                raise RuntimeError(f"Hugging Face API status {resp.status_code}: {text}")

            content_type = (resp.headers.get("content-type") or "").lower()
            if not content_type.startswith("image/"):
                raise RuntimeError(f"Hugging Face returned non-image response: {resp.text[:300]}")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(resp.content)
            return
        except Exception as exc:  # pragma: no cover - bubble retries
            last_error = exc
            if attempt < max_attempts:
                wait(1500 * attempt)

    raise last_error or RuntimeError("Unknown Hugging Face error")


def download_image_with_retry(url: str, output_path: Path, max_attempts: int = 2, wait_ms: int = 500) -> None:
    last_error: Optional[Exception] = None
    for attempt in range(1, max_attempts + 1):
        try:
            resp = requests.get(url, timeout=25)
            if not resp.ok:
                raise RuntimeError(f"Image download failed with status {resp.status_code}")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(resp.content)
            return
        except Exception as exc:
            last_error = exc
            if attempt < max_attempts:
                wait(wait_ms * attempt)

    raise last_error or RuntimeError("Unknown download error")


def render_cinematic_fallback_clip(output_path: Path, width: int, height: int, duration_seconds: float, motion_preset: int = 0) -> None:
    """Render a no-network fallback clip when image generation fails.

    This prevents a 500 for transient provider/network timeouts by creating
    a simple cinematic color clip.
    """

    normalized_preset = (int(motion_preset) % 5 + 5) % 5
    palette = ["#0f172a", "#1f2937", "#172554", "#3f1d2e", "#1b4332"]
    color = palette[normalized_preset]
    fade_out_start = max(0.18, round(duration_seconds - 0.24, 2))

    ffmpeg_exe = resolve_ffmpeg_executable()
    source = f"color=c={color}:s={width}x{height}:r=30:d={duration_seconds}"
    video_filter = f"fade=t=in:st=0:d=0.14,fade=t=out:st={fade_out_start}:d=0.18,format=yuv420p"

    cmd = [
        ffmpeg_exe,
        "-y",
        "-f",
        "lavfi",
        "-i",
        source,
        "-vf",
        video_filter,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        str(output_path),
    ]

    subprocess.run(cmd, check=True)


def render_cinematic_video_from_image(input_path: Path, output_path: Path, width: int, height: int, duration_seconds: float, motion_preset: int = 0) -> None:
    # Mirror JS logic: compute frames and motion frequencies
    total_frames = max(1, math.floor(duration_seconds * 30))
    normalized_preset = (int(motion_preset) % 4 + 4) % 4
    fade_out_start = max(0.18, round(duration_seconds - 0.24, 2))
    x_freq = 18 + normalized_preset * 2
    y_freq = 20 + normalized_preset * 2

    # Build the zoompan-style filter and fades (kept compatible with ffmpeg cli)
    scale_filter = f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"
    zoompan = (
        "zoompan="
        f"z='min(1.08,1+on/{total_frames}*0.08)':"
        f"x='iw/2-(iw/zoom/2)+sin(on/{x_freq})*4':"
        f"y='ih/2-(ih/zoom/2)+cos(on/{y_freq})*4':"
        f"d=1:s={width}x{height}:fps=30"
    )
    fade_in = "fade=t=in:st=0:d=0.14"
    fade_out = f"fade=t=out:st={fade_out_start}:d=0.18"
    format_filter = "format=yuv420p"

    motion_filter = ",".join([scale_filter, zoompan, fade_in, fade_out, format_filter])

    ffmpeg_exe = resolve_ffmpeg_executable()

    cmd = [
        ffmpeg_exe,
        "-y",
        "-loop",
        "1",
        "-i",
        str(input_path),
        "-t",
        str(duration_seconds),
        "-vf",
        motion_filter,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        str(output_path),
    ]

    # Run ffmpeg and raise on errors
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    # quick demo when run directly (requires HF token or will bail to user)
    import argparse

    parser = argparse.ArgumentParser(description="Render one image into a short cinematic clip")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--width", type=int, default=720)
    parser.add_argument("--height", type=int, default=1280)
    parser.add_argument("--duration", type=float, default=3.0)
    parser.add_argument("--preset", type=int, default=0)
    args = parser.parse_args()

    render_cinematic_video_from_image(Path(args.input), Path(args.output), args.width, args.height, args.duration, args.preset)
