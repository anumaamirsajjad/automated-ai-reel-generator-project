#!/usr/bin/env python3
"""Generate reel images from a prompt and stitch them into an MP4.

This is a Python version of the project's prompt -> images -> reel flow.
It uses Pollinations for image generation and ffmpeg for rendering.

Example:
    python scripts/generate_reel.py --prompt "A futuristic street market at night" --output output/reel.mp4
"""

from __future__ import annotations

import argparse
import random
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Iterable
from urllib.parse import quote

import requests


ASPECT_RATIOS = {
    "portrait": (720, 1280),
    "square": (1024, 1024),
    "landscape": (1280, 720),
}


def clamp_number(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def get_dimensions(aspect_ratio: str) -> tuple[int, int]:
    return ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["portrait"])


def get_scene_count_for_duration(duration_seconds: float) -> int:
    normalized_duration = clamp_number(float(duration_seconds or 15), 5, 15)
    if normalized_duration <= 5:
        return 2
    if normalized_duration <= 10:
        return 4
    return 6


def compute_scene_length_by_speed(scene_length: float, speed: int) -> float:
    normalized = clamp_number((float(speed) - 50) / 50, -1, 1)
    adjusted = scene_length * (1 - normalized * 0.35)
    return clamp_number(round(adjusted, 2), 1.8, 6)


def build_scene_prompts(prompt: str, style: str | None, theme: str | None, scene_count: int) -> list[str]:
    camera_directions = [
        "wide establishing shot from a camera tripod",
        "slow cinematic push-in toward the main subject",
        "medium documentary-style shot with natural movement",
        "gentle side-tracking camera movement",
        "low-angle cinematic shot with depth and atmosphere",
        "over-the-shoulder composition with environmental depth",
        "long lens cinematic shot with shallow depth of field",
        "final reveal shot with a realistic handheld camera feel",
    ]

    narrative_beats = [
        "opening moment that establishes the setting",
        "subject moves slightly forward with clearer focus",
        "mid-sequence emotional beat with environmental depth",
        "supporting detail shot that still keeps subject identity",
        "climactic moment with cinematic tension",
        "calm resolution shot that feels complete",
    ]

    prompts: list[str] = []
    for index in range(scene_count):
        continuity_instruction = (
            "introduce one clear main subject and keep identity consistent"
            if index == 0
            else "continuation of previous scene, same subject, same outfit, same location"
        )

        parts = [
            f"photorealistic scene based on: {prompt}",
            f"{style} style" if style else None,
            theme or None,
            camera_directions[index % len(camera_directions)],
            narrative_beats[index % len(narrative_beats)],
            continuity_instruction,
            f"scene {index + 1} of {scene_count}",
            "same location, same subject, same environment",
            "cinematic lighting",
            "high detail",
            "realistic motion blur",
            "no text, no watermark",
        ]
        prompts.append(", ".join(part for part in parts if part))

    return prompts


def build_pollinations_image_url(prompt: str, width: int, height: int, seed: int) -> str:
    return (
        "https://image.pollinations.ai/prompt/"
        f"{quote(prompt)}?width={width}&height={height}&seed={seed}&model=flux&nologo=true"
    )


def download_image(url: str, output_path: Path, max_attempts: int = 3, wait_seconds: float = 1.0) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    last_error: Exception | None = None

    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            output_path.write_bytes(response.content)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < max_attempts:
                time.sleep(wait_seconds * attempt)

    assert last_error is not None
    raise last_error


def escape_drawtext(text: str) -> str:
    return (
        str(text or "")
        .replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\\'")
        .replace(",", "\\,")
        .replace("[", "\\[")
        .replace("]", "\\]")
        .replace("%", "\\%")
        .replace("\n", " ")
    )


def build_ffmpeg_command(image_pattern: Path, output_path: Path, frame_duration: float, width: int, height: int, title: str | None) -> list[str]:
    scale_filter = f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},format=yuv420p"
    if title:
        safe_title = escape_drawtext(title)
        video_filter = (
            f"{scale_filter},drawtext=text='{safe_title}':fontcolor=white:fontsize=34:"
            "x=(w-text_w)/2:y=h-text_h-50:box=1:boxcolor=black@0.45:boxborderw=14"
        )
    else:
        video_filter = scale_filter

    return [
        "ffmpeg",
        "-y",
        "-framerate",
        f"{1 / frame_duration:.6f}",
        "-i",
        str(image_pattern),
        "-vf",
        video_filter,
        "-r",
        "30",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        str(output_path),
    ]


def render_reel(image_paths: Iterable[Path], output_path: Path, frame_duration: float, width: int, height: int, title: str | None) -> None:
    paths = list(image_paths)
    if not paths:
        raise ValueError("At least one image is required to build a reel")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_dir = paths[0].parent
    image_pattern = temp_dir / "scene-%03d.jpg"

    command = build_ffmpeg_command(image_pattern, output_path, frame_duration, width, height, title)
    subprocess.run(command, check=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a reel from a prompt using Pollinations + ffmpeg")
    parser.add_argument("--prompt", required=True, help="Main prompt for the reel")
    parser.add_argument("--style", default="", help="Optional style modifier")
    parser.add_argument("--theme", default="", help="Optional theme modifier")
    parser.add_argument("--output", default="output/reel.mp4", help="Output MP4 path")
    parser.add_argument("--aspect-ratio", choices=sorted(ASPECT_RATIOS.keys()), default="portrait")
    parser.add_argument("--duration", type=float, default=12.0, help="Target reel duration in seconds")
    parser.add_argument("--speed", type=int, default=50, help="Scene speed from 0 to 100")
    parser.add_argument("--scene-count", type=int, default=0, help="Override scene count")
    parser.add_argument("--work-dir", default="generated/python-reel", help="Temporary working directory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        print("ffmpeg is not installed or not on PATH", file=sys.stderr)
        return 1

    width, height = get_dimensions(args.aspect_ratio)
    scene_count = args.scene_count if args.scene_count > 0 else get_scene_count_for_duration(args.duration)
    scene_prompts = build_scene_prompts(args.prompt.strip(), args.style.strip() or None, args.theme.strip() or None, scene_count)
    base_scene_length = float(args.duration) / max(scene_count, 1)
    frame_duration = compute_scene_length_by_speed(base_scene_length, args.speed)

    work_dir = Path(args.work_dir)
    images_dir = work_dir / "images"
    output_path = Path(args.output)
    image_paths: list[Path] = []

    print(f"Generating {scene_count} image(s) at {width}x{height}...")
    for index, scene_prompt in enumerate(scene_prompts, start=1):
        seed = random.randint(1, 1_000_000)
        image_url = build_pollinations_image_url(scene_prompt, width, height, seed)
        image_path = images_dir / f"scene-{index:03d}.jpg"
        print(f"  [{index}/{scene_count}] {scene_prompt}")
        download_image(image_url, image_path, max_attempts=3, wait_seconds=1.0)
        image_paths.append(image_path)

    print(f"Rendering reel to {output_path}...")
    render_reel(image_paths, output_path, frame_duration, width, height, args.prompt.strip())
    print(f"Done: {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())