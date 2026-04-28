#!/usr/bin/env python3
"""Flask server that implements the /api/reel-generator route in Python.

This mirrors the Node flow: build scene prompts, generate or download images,
render cinematic clips with FFmpeg, concatenate clips, and expose the final
video under /generated/.
"""

from __future__ import annotations

import os
import random
import shutil
import sys
import traceback
import subprocess
import tempfile
import time
from pathlib import Path
from typing import List

from flask import Flask, jsonify, request, send_from_directory

from reel_generator import (
    download_image_with_retry,
    generate_huggingface_image_to_file,
    render_cinematic_fallback_clip,
    resolve_ffmpeg_executable,
    render_cinematic_video_from_image,
)

app = Flask(__name__)

GENERATED_DIR = Path(__file__).parent.joinpath("generated")
GENERATED_DIR.mkdir(parents=True, exist_ok=True)


def clamp_number(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def get_dimensions(aspect_ratio: str):
    if aspect_ratio == "landscape":
        return 1280, 720
    if aspect_ratio == "square":
        return 1024, 1024
    return 720, 1280


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


def build_scene_prompts(prompt: str, style: str | None, theme: str | None, scene_count: int) -> List[str]:
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

    prompts: List[str] = []
    for i in range(scene_count):
        continuity_instruction = (
            "introduce one clear main subject and keep identity consistent"
            if i == 0
            else "continuation of previous scene, same subject, same outfit, same location"
        )

        parts = [
            f"photorealistic scene based on: {prompt}",
            f"{style} style" if style else None,
            theme or None,
            camera_directions[i % len(camera_directions)],
            narrative_beats[i % len(narrative_beats)],
            continuity_instruction,
            f"scene {i + 1} of {scene_count}",
            "same location, same subject, same environment",
            "cinematic lighting",
            "high detail",
            "realistic motion blur",
            "no text, no watermark",
        ]
        prompts.append(", ".join([p for p in parts if p]))

    return prompts


def build_pollinations_image_url(prompt: str, width: int, height: int, seed: int) -> str:
    from urllib.parse import quote

    return f"https://image.pollinations.ai/prompt/{quote(prompt)}?width={width}&height={height}&seed={seed}&model=flux&nologo=true"


@app.route("/generated/<path:filename>")
def generated_static(filename: str):
    return send_from_directory(GENERATED_DIR, filename)


@app.route("/api/reel-generator", methods=["POST"])
def reel_generator():
    data = request.get_json(force=True)
    prompt = (data.get("prompt") or "").strip()
    style = (data.get("style") or "").strip() or None
    theme = (data.get("theme") or "").strip() or None
    aspect = data.get("aspectRatio") or "portrait"
    duration = float(data.get("duration") or 12)
    speed = int(data.get("speed") or 50)
    scene_count = int(data.get("sceneCount") or 0)

    width, height = get_dimensions(aspect)
    scene_count = scene_count if scene_count > 0 else get_scene_count_for_duration(duration)
    scene_prompts = build_scene_prompts(prompt, style, theme, scene_count)
    base_scene_length = float(duration) / max(scene_count, 1)
    effective_scene_length = compute_scene_length_by_speed(base_scene_length, speed)

    temp_dir = Path(tempfile.mkdtemp(prefix="python-reel-"))
    images_dir = temp_dir / "images"
    clips_dir = temp_dir / "clips"
    images_dir.mkdir(parents=True, exist_ok=True)
    clips_dir.mkdir(parents=True, exist_ok=True)

    clip_paths: List[Path] = []

    try:
        ffmpeg_exe = resolve_ffmpeg_executable()

        for idx, scene_prompt in enumerate(scene_prompts, start=1):
            seed = random.randint(1, 1_000_000)
            frame_path = images_dir / f"frame-{idx:03d}.jpg"

            rendered_from_image = False

            # Try Hugging Face first if configured
            try:
                if os.environ.get("HF_API_TOKEN") or os.environ.get("HF_TOKEN"):
                    generate_huggingface_image_to_file(scene_prompt, width, height, frame_path, max_attempts=2)
                    rendered_from_image = True
                else:
                    image_url = build_pollinations_image_url(scene_prompt, width, height, seed)
                    download_image_with_retry(image_url, frame_path, max_attempts=4, wait_ms=1200)
                    rendered_from_image = True
            except Exception as primary_err:
                # fallback to Pollinations
                try:
                    image_url = build_pollinations_image_url(scene_prompt, width, height, seed)
                    download_image_with_retry(image_url, frame_path, max_attempts=4, wait_ms=1200)
                    rendered_from_image = True
                except Exception as fallback_err:
                    print(
                        f"Scene {idx} image providers failed. primary={primary_err} fallback={fallback_err}. Using offline fallback clip.",
                        file=sys.stderr,
                    )

            clip_path = clips_dir / f"clip-{idx:03d}.mp4"
            if rendered_from_image:
                render_cinematic_video_from_image(
                    frame_path,
                    clip_path,
                    width,
                    height,
                    effective_scene_length,
                    motion_preset=idx,
                )
            else:
                render_cinematic_fallback_clip(
                    clip_path,
                    width,
                    height,
                    effective_scene_length,
                    motion_preset=idx,
                )
            clip_paths.append(clip_path)

        # concatenate clips
        output_name = f"reel-{int(time.time())}.mp4"
        output_path = GENERATED_DIR / output_name

        list_file = temp_dir / "clips.txt"
        with list_file.open("w", encoding="utf-8") as f:
            for p in clip_paths:
                f.write(f"file '{p.as_posix()}'\n")

        concat_cmd = [
            ffmpeg_exe,
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-c",
            "copy",
            str(output_path),
        ]

        try:
            subprocess.run(concat_cmd, check=True)
        except subprocess.CalledProcessError:
            # fallback: re-encode (more compatible)
            reencode_cmd = [
                ffmpeg_exe,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(list_file),
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                str(output_path),
            ]
            subprocess.run(reencode_cmd, check=True)

        public_url = f"/generated/{output_name}"
        return jsonify({"success": True, "videoUrl": public_url})
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e), "trace": tb}), 500
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    # Run on port 5000 to match original backend
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
