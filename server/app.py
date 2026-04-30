import os
import random
import shutil
import sys
import json
import traceback
import subprocess
import tempfile
import time
from copy import deepcopy
from pathlib import Path
from typing import List
import uuid


from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token
import jwt as pyjwt
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from reel_generator import (
    download_image_with_retry,
    generate_huggingface_image_to_file,
    render_cinematic_video_from_image,
    render_cinematic_fallback_clip,
    resolve_ffmpeg_executable,
)

app = Flask(__name__)
# Use a deterministic sqlite file located next to server/app.py for easy inspection with SQLite tools
DB_FILE = Path(__file__).parent.joinpath("app.db").resolve()
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{DB_FILE.as_posix()}"
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'  # Change this in production
db = SQLAlchemy(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)
CORS(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    profile_picture = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def __repr__(self):
        return f'<User {self.username}>'

class Setting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<Setting {self.key}>'

class Gallery(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(200), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    caption = db.Column(db.Text, nullable=True)
    style = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    size = db.Column(db.Integer, nullable=False)
    generated = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Gallery {self.title}>'

class Event(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return f'<Event {self.type} {self.filename}>'


class ReelTemplate(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False, default="General")
    prompt = db.Column(db.Text, nullable=False)
    style = db.Column(db.String(80), nullable=False, default="Realistic")
    theme = db.Column(db.String(120), nullable=False, default="Sunset Beach")
    duration = db.Column(db.String(20), nullable=False, default="10 seconds")
    quality = db.Column(db.String(30), nullable=False, default="High (1080p)")
    aspect_ratio = db.Column(db.String(30), nullable=False, default="9:16 (Vertical)")
    speed = db.Column(db.Integer, nullable=False, default=50)
    auto_captions = db.Column(db.Boolean, default=True)
    auto_hashtags = db.Column(db.Boolean, default=True)
    bg_music = db.Column(db.Boolean, default=True)
    thumbnail_url = db.Column(db.String(500), nullable=True)
    uses_count = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "category": self.category,
            "prompt": self.prompt,
            "style": self.style,
            "theme": self.theme,
            "duration": self.duration,
            "quality": self.quality,
            "aspectRatio": self.aspect_ratio,
            "speed": self.speed,
            "autoCaptions": bool(self.auto_captions),
            "autoHashtags": bool(self.auto_hashtags),
            "bgMusic": bool(self.bg_music),
            "thumbnailUrl": self.thumbnail_url,
            "uses": int(self.uses_count or 0),
            "popular": bool(self.is_featured),
            "createdAt": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }

# Create tables
with app.app_context():
    db.create_all()
    # Ensure `profile_picture` column exists for older DBs (SQLite only)
    try:
        if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite:'):
            cur = db.engine.execute("PRAGMA table_info('user')")
            cols = [r[1] for r in cur.fetchall()]
            if 'profile_picture' not in cols:
                try:
                    db.engine.execute('ALTER TABLE user ADD COLUMN profile_picture TEXT')
                except Exception:
                    pass
    except Exception:
        pass

GENERATED_DIR = Path(__file__).parent.joinpath("generated")
GENERATED_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = Path(__file__).parent.joinpath("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
SETTINGS_FILE = DATA_DIR.joinpath("settings.json")
GALLERY_FILE = DATA_DIR.joinpath("gallery.json")
EVENTS_FILE = DATA_DIR.joinpath("events.json")

DEFAULT_SETTINGS = {
    "version": 2,
    "profile": {
        "displayName": "",
        "username": "",
        "email": "",
        "bio": "",
        "niche": "",
        "creatorType": "Individual",
        "timezone": "Asia/Kolkata",
        "language": "English",
    },
    "brandKit": {
        "brandName": "",
        "primaryColor": "#7c3aed",
        "secondaryColor": "#2563eb",
        "accentColor": "#0ea5e9",
        "watermarkEnabled": False,
        "watermarkPosition": "bottom-right",
        "watermarkOpacity": 0.65,
        "outroText": "Follow for more",
        "defaultCTA": "Save and share this reel",
    },
    "generationDefaults": {
        "artStyle": "Realistic",
        "theme": "Sunset Beach",
        "duration": "10 seconds",
        "quality": "High (1080p)",
        "aspectRatio": "9:16 (Vertical)",
        "speed": 50,
        "autoCaptions": True,
        "autoHashtags": True,
        "bgMusic": True,
        "showQuickTips": True,
        "focusPromptOnCreate": True,
    },
    "platformPresets": {
        "instagram": {
            "enabled": True,
            "maxDuration": 90,
            "captionStyle": "Short + hooks",
            "defaultAspectRatio": "9:16 (Vertical)",
        },
        "tiktok": {
            "enabled": True,
            "maxDuration": 60,
            "captionStyle": "Trendy + punchy",
            "defaultAspectRatio": "9:16 (Vertical)",
        },
        "youtubeShorts": {
            "enabled": True,
            "maxDuration": 60,
            "captionStyle": "Keyword rich",
            "defaultAspectRatio": "9:16 (Vertical)",
        },
    },
    "publishingAutomation": {
        "reminderTime": "09:00",
        "reminderEnabled": True,
        "reminderFrequency": "daily",
        "selectedDates": [],
        "selectedDays": [],
        "desktopNotificationsEnabled": True,
        "autoScheduleEnabled": False,
        "postingFrequency": "daily",
    },
    "mediaStorage": {
        "autoThumbnailSecond": 1.0,
        "autoCleanupEnabled": False,
        "keepGeneratedDays": 30,
        "keepTempDays": 7,
        "storageWarningGB": 5,
    },
    "security": {
        "twoFactorEnabled": False,
        "loginAlertsEnabled": True,
    },
    "notifications": {
        "inAppEnabled": True,
        "emailEnabled": False,
        "desktopEnabled": True,
        "reelCompleteAlert": True,
        "reelFailedAlert": True,
        "storageAlert": True,
        "weeklyDigestEnabled": False,
    },
    "integrations": {
        "instagramConnected": False,
        "tiktokConnected": False,
        "youtubeConnected": False,
        "driveConnected": False,
        "webhookUrl": "",
    },
    "advanced": {
        "debugMode": False,
        "apiTimeoutMs": 420000,
        "maxConcurrentJobs": 2,
        "experimentalFeaturesEnabled": False,
    },
}


def deep_merge_settings(target: dict, source: dict) -> dict:
    for key, value in source.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            deep_merge_settings(target[key], value)
        else:
            target[key] = value
    return target


def sync_legacy_setting_aliases(settings: dict) -> dict:
    generation = settings.get("generationDefaults", {})
    publishing = settings.get("publishingAutomation", {})

    settings["artStyle"] = generation.get("artStyle", "Realistic")
    settings["duration"] = generation.get("duration", "10 seconds")
    settings["quality"] = generation.get("quality", "High (1080p)")
    settings["autoCaptions"] = bool(generation.get("autoCaptions", True))
    settings["autoHashtags"] = bool(generation.get("autoHashtags", True))
    settings["bgMusic"] = bool(generation.get("bgMusic", True))
    settings["showQuickTips"] = bool(generation.get("showQuickTips", True))
    settings["focusPromptOnCreate"] = bool(generation.get("focusPromptOnCreate", True))

    settings["reminderTime"] = publishing.get("reminderTime", "09:00")
    settings["reminderEnabled"] = bool(publishing.get("reminderEnabled", True))
    settings["reminderFrequency"] = publishing.get("reminderFrequency", "daily")
    settings["selectedDates"] = publishing.get("selectedDates", [])
    settings["selectedDays"] = publishing.get("selectedDays", [])
    settings["desktopNotificationsEnabled"] = bool(publishing.get("desktopNotificationsEnabled", True))
    return settings


def normalize_settings_payload(raw: dict | None) -> dict:
    settings = deepcopy(DEFAULT_SETTINGS)
    if isinstance(raw, dict):
        deep_merge_settings(settings, raw)

        # Legacy flat keys -> nested settings mapping.
        generation = settings.get("generationDefaults", {})
        publishing = settings.get("publishingAutomation", {})

        if isinstance(raw.get("artStyle"), str):
            generation["artStyle"] = raw["artStyle"]
        if isinstance(raw.get("duration"), str):
            generation["duration"] = raw["duration"]
        if isinstance(raw.get("quality"), str):
            generation["quality"] = raw["quality"]
        if isinstance(raw.get("autoCaptions"), bool):
            generation["autoCaptions"] = raw["autoCaptions"]
        if isinstance(raw.get("autoHashtags"), bool):
            generation["autoHashtags"] = raw["autoHashtags"]
        if isinstance(raw.get("bgMusic"), bool):
            generation["bgMusic"] = raw["bgMusic"]
        if isinstance(raw.get("showQuickTips"), bool):
            generation["showQuickTips"] = raw["showQuickTips"]
        if isinstance(raw.get("focusPromptOnCreate"), bool):
            generation["focusPromptOnCreate"] = raw["focusPromptOnCreate"]

        if isinstance(raw.get("reminderTime"), str):
            publishing["reminderTime"] = raw["reminderTime"]
        if isinstance(raw.get("reminderEnabled"), bool):
            publishing["reminderEnabled"] = raw["reminderEnabled"]
        if isinstance(raw.get("reminderFrequency"), str):
            publishing["reminderFrequency"] = raw["reminderFrequency"]
        if isinstance(raw.get("selectedDates"), list):
            publishing["selectedDates"] = raw["selectedDates"]
        if isinstance(raw.get("selectedDays"), list):
            publishing["selectedDays"] = raw["selectedDays"]
        if isinstance(raw.get("desktopNotificationsEnabled"), bool):
            publishing["desktopNotificationsEnabled"] = raw["desktopNotificationsEnabled"]

    return sync_legacy_setting_aliases(settings)


def read_settings() -> dict:
    if not SETTINGS_FILE.exists():
        return normalize_settings_payload({})

    try:
        with SETTINGS_FILE.open("r", encoding="utf-8") as file:
            stored = json.load(file)
    except Exception:
        return normalize_settings_payload({})

    return normalize_settings_payload(stored)


def write_settings(raw: dict | None) -> dict:
    normalized = normalize_settings_payload(raw)
    with SETTINGS_FILE.open("w", encoding="utf-8") as file:
        json.dump(normalized, file, indent=2)
    return normalized

DEFAULT_TEMPLATES = [
    {
        "name": "Product Spotlight",
        "description": "Highlight one product with premium cinematic transitions.",
        "category": "Business",
        "prompt": "A premium product reveal with dramatic lighting, close-up details, and elegant cinematic motion.",
        "style": "Realistic",
        "theme": "City Night",
        "duration": "10 seconds",
        "quality": "High (1080p)",
        "aspect_ratio": "9:16 (Vertical)",
        "speed": 56,
        "is_featured": True,
    },
    {
        "name": "Travel Teaser",
        "description": "Fast-paced travel reel with scenic transitions.",
        "category": "Travel",
        "prompt": "Cinematic travel teaser through mountains, city streets, and ocean cliffs during golden hour.",
        "style": "Realistic",
        "theme": "Mountains",
        "duration": "15 seconds",
        "quality": "High (1080p)",
        "aspect_ratio": "9:16 (Vertical)",
        "speed": 62,
        "is_featured": True,
    },
    {
        "name": "Motivation Burst",
        "description": "High-energy motivational visual with bold style.",
        "category": "Inspiration",
        "prompt": "Dynamic motivational story visual with sunrise, running silhouettes, and uplifting atmosphere.",
        "style": "Cyberpunk",
        "theme": "City Night",
        "duration": "10 seconds",
        "quality": "High (1080p)",
        "aspect_ratio": "9:16 (Vertical)",
        "speed": 70,
        "is_featured": False,
    },
]


def ensure_default_templates() -> None:
    if ReelTemplate.query.count() > 0:
        return

    for payload in DEFAULT_TEMPLATES:
        template = ReelTemplate(
            id=uuid.uuid4().hex,
            name=payload.get("name", "Untitled Template"),
            description=payload.get("description", ""),
            category=payload.get("category", "General"),
            prompt=payload.get("prompt", ""),
            style=payload.get("style", "Realistic"),
            theme=payload.get("theme", "Sunset Beach"),
            duration=payload.get("duration", "10 seconds"),
            quality=payload.get("quality", "High (1080p)"),
            aspect_ratio=payload.get("aspect_ratio", "9:16 (Vertical)"),
            speed=int(payload.get("speed", 50)),
            auto_captions=bool(payload.get("auto_captions", True)),
            auto_hashtags=bool(payload.get("auto_hashtags", True)),
            bg_music=bool(payload.get("bg_music", True)),
            thumbnail_url=payload.get("thumbnail_url"),
            uses_count=int(payload.get("uses_count", 0)),
            is_featured=bool(payload.get("is_featured", False)),
        )
        db.session.add(template)

    db.session.commit()


with app.app_context():
    ensure_default_templates()
#     "reminderTime": "09:00",
#     "reminderEnabled": True,
#     "reminderFrequency": "daily",
#     "selectedDates": [],
#     "selectedDays": [],
#     "artStyle": "Realistic",
#     "duration": "10 seconds",
#     "quality": "High (1080p)",
#     "autoCaptions": True,
#     "autoHashtags": True,
#     "bgMusic": True,
#     "notifGen": True,
#     "notifSched": True,
#     "notifTemp": False,
# }


# def load_settings() -> dict:
#     if not SETTINGS_FILE.exists():
#         return DEFAULT_SETTINGS.copy()

#     try:
#         with SETTINGS_FILE.open("r", encoding="utf-8") as handle:
#             stored = json.load(handle)
#     except Exception:
#         return DEFAULT_SETTINGS.copy()

#     settings = DEFAULT_SETTINGS.copy()
#     for key, value in stored.items():
#         if key in settings:
#             settings[key] = value
#     return settings


# def save_settings(settings: dict) -> None:
#     merged = DEFAULT_SETTINGS.copy()
#     for key, value in settings.items():
#         if key in merged:
#             merged[key] = value

#     with SETTINGS_FILE.open("w", encoding="utf-8") as handle:
#         json.dump(merged, handle, indent=2)


def load_gallery() -> list:
    if not GALLERY_FILE.exists():
        return []

    try:
        with GALLERY_FILE.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return []


def save_gallery(items: list) -> None:
    with GALLERY_FILE.open("w", encoding="utf-8") as fh:
        json.dump(items, fh, indent=2)


def load_events() -> list:
    if not EVENTS_FILE.exists():
        return []

    try:
        with EVENTS_FILE.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return []


def save_events(items: list) -> None:
    with EVENTS_FILE.open("w", encoding="utf-8") as fh:
        json.dump(items, fh, indent=2)


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


VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".m4v", ".mkv"}


def is_video_filename(filename: str) -> bool:
    return Path(filename or "").suffix.lower() in VIDEO_EXTENSIONS


def thumbnail_name_for_video(filename: str) -> str:
    safe = os.path.basename(filename or "")
    return f"thumb-{Path(safe).stem}.jpg"


def extract_thumbnail_for_video(video_path: Path, thumbnail_path: Path, second: float = 1.0) -> bool:
    ffmpeg_exe = resolve_ffmpeg_executable()

    primary_cmd = [
        ffmpeg_exe,
        "-y",
        "-ss",
        str(second),
        "-i",
        str(video_path),
        "-frames:v",
        "1",
        "-q:v",
        "3",
        str(thumbnail_path),
    ]

    fallback_cmd = [
        ffmpeg_exe,
        "-y",
        "-i",
        str(video_path),
        "-vf",
        "thumbnail,scale=720:-1",
        "-frames:v",
        "1",
        str(thumbnail_path),
    ]

    try:
        subprocess.run(primary_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        try:
            subprocess.run(fallback_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            return False

    return thumbnail_path.exists()


def get_or_create_thumbnail_url(filename: str) -> str | None:
    safe_name = os.path.basename(filename or "")
    if not safe_name or not is_video_filename(safe_name):
        return None

    video_path = GENERATED_DIR.joinpath(safe_name)
    if not video_path.exists():
        return None

    thumb_name = thumbnail_name_for_video(safe_name)
    thumb_path = GENERATED_DIR.joinpath(thumb_name)
    if not thumb_path.exists():
        extract_thumbnail_for_video(video_path, thumb_path, second=1.0)

    if thumb_path.exists():
        return f"/generated/{thumb_name}"
    return None


@app.route("/generated/<path:filename>")
def generated_static(filename: str):
    return send_from_directory(GENERATED_DIR, filename)


@app.route("/api/settings", methods=["GET"])
def load_settings():
    settings = read_settings()
    # Include both top-level keys and nested `settings` for backward compatibility.
    return jsonify({"success": True, "settings": settings, **settings})

@app.route("/api/settings", methods=["POST", "PUT", "PATCH"])
def save_settings():
    incoming = request.get_json(silent=True) or {}
    current = read_settings()
    merged = deep_merge_settings(current, incoming)
    saved = write_settings(merged)
    return jsonify({"success": True, "settings": saved})


@app.route("/api/settings/reset", methods=["POST"])
def reset_settings():
    saved = write_settings({})
    return jsonify({"success": True, "settings": saved})


@app.route("/api/templates", methods=["GET", "POST"])
def api_templates():
    try:
        if request.method == "GET":
            category = (request.args.get("category") or "").strip()
            search = (request.args.get("search") or "").strip().lower()
            featured = (request.args.get("featured") or "").strip().lower()

            query = ReelTemplate.query
            if category and category.lower() != "all":
                query = query.filter(ReelTemplate.category == category)
            if featured in {"1", "true", "yes"}:
                query = query.filter(ReelTemplate.is_featured.is_(True))

            templates = query.order_by(ReelTemplate.uses_count.desc(), ReelTemplate.created_at.desc()).all()
            items = [t.to_dict() for t in templates]
            if search:
                items = [
                    it for it in items
                    if search in (it.get("name") or "").lower()
                    or search in (it.get("description") or "").lower()
                    or search in (it.get("prompt") or "").lower()
                    or search in (it.get("category") or "").lower()
                ]

            return jsonify({"success": True, "items": items})

        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        prompt = (data.get("prompt") or "").strip()

        if not name:
            return jsonify({"success": False, "error": "Template name is required"}), 400
        if not prompt:
            return jsonify({"success": False, "error": "Template prompt is required"}), 400

        template = ReelTemplate(
            id=uuid.uuid4().hex,
            name=name,
            description=(data.get("description") or "").strip(),
            category=(data.get("category") or "General").strip() or "General",
            prompt=prompt,
            style=(data.get("style") or "Realistic").strip() or "Realistic",
            theme=(data.get("theme") or "Sunset Beach").strip() or "Sunset Beach",
            duration=(data.get("duration") or "10 seconds").strip() or "10 seconds",
            quality=(data.get("quality") or "High (1080p)").strip() or "High (1080p)",
            aspect_ratio=(data.get("aspectRatio") or "9:16 (Vertical)").strip() or "9:16 (Vertical)",
            speed=int(data.get("speed") or 50),
            auto_captions=bool(data.get("autoCaptions", True)),
            auto_hashtags=bool(data.get("autoHashtags", True)),
            bg_music=bool(data.get("bgMusic", True)),
            thumbnail_url=(data.get("thumbnailUrl") or "").strip() or None,
            is_featured=bool(data.get("popular", False)),
        )
        db.session.add(template)
        db.session.commit()
        return jsonify({"success": True, "item": template.to_dict()}), 201
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/templates/<template_id>", methods=["GET", "PUT", "DELETE"])
def api_template_detail(template_id: str):
    try:
        template = ReelTemplate.query.get(template_id)
        if not template:
            return jsonify({"success": False, "error": "Template not found"}), 404

        if request.method == "GET":
            return jsonify({"success": True, "item": template.to_dict()})

        if request.method == "DELETE":
            db.session.delete(template)
            db.session.commit()
            return jsonify({"success": True})

        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        prompt = (data.get("prompt") or "").strip()
        if not name:
            return jsonify({"success": False, "error": "Template name is required"}), 400
        if not prompt:
            return jsonify({"success": False, "error": "Template prompt is required"}), 400

        template.name = name
        template.description = (data.get("description") or "").strip()
        template.category = (data.get("category") or "General").strip() or "General"
        template.prompt = prompt
        template.style = (data.get("style") or "Realistic").strip() or "Realistic"
        template.theme = (data.get("theme") or "Sunset Beach").strip() or "Sunset Beach"
        template.duration = (data.get("duration") or "10 seconds").strip() or "10 seconds"
        template.quality = (data.get("quality") or "High (1080p)").strip() or "High (1080p)"
        template.aspect_ratio = (data.get("aspectRatio") or "9:16 (Vertical)").strip() or "9:16 (Vertical)"
        template.speed = int(data.get("speed") or 50)
        template.auto_captions = bool(data.get("autoCaptions", True))
        template.auto_hashtags = bool(data.get("autoHashtags", True))
        template.bg_music = bool(data.get("bgMusic", True))
        template.thumbnail_url = (data.get("thumbnailUrl") or "").strip() or None
        template.is_featured = bool(data.get("popular", False))

        db.session.commit()
        return jsonify({"success": True, "item": template.to_dict()})
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/templates/<template_id>/use", methods=["POST"])
def api_template_use(template_id: str):
    try:
        template = ReelTemplate.query.get(template_id)
        if not template:
            return jsonify({"success": False, "error": "Template not found"}), 404

        template.uses_count = int(template.uses_count or 0) + 1
        db.session.commit()

        return jsonify({
            "success": True,
            "item": template.to_dict(),
            "apply": {
                "prompt": template.prompt,
                "artStyle": template.style,
                "scene": template.theme,
                "duration": template.duration,
                "quality": template.quality,
                "ratio": template.aspect_ratio,
                "speed": template.speed,
                "autoCaptions": bool(template.auto_captions),
                "autoHashtags": bool(template.auto_hashtags),
                "bgMusic": bool(template.bg_music),
            },
        })
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    """Return basic dashboard metrics and recent reels found in the generated folder.

    This endpoint intentionally keeps things simple: it scans files in
    `server/generated`, returns counts, recent items (filename/url/size/createdAt),
    and a small 7-day histogram for reels created.
    """
    try:
        files = [p for p in GENERATED_DIR.iterdir() if p.is_file() and p.name.startswith("reel-") and p.suffix == ".mp4"]
        files_sorted = sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)

        recent = []
        for p in files_sorted[:6]:
            st = p.stat()
            recent.append({
                "filename": p.name,
                "url": f"/generated/{p.name}",
                "size": st.st_size,
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(st.st_mtime)),
            })

        total = len(files)

        # 7-day histogram (UTC days)
        now = time.time()
        counts = {}
        for i in range(7):
            day = time.strftime("%Y-%m-%d", time.gmtime(now - i * 86400))
            counts[day] = 0

        for p in files:
            day = time.strftime("%Y-%m-%d", time.gmtime(p.stat().st_mtime))
            if day in counts:
                counts[day] += 1

        chart = [{"day": d, "reels": counts[d]} for d in sorted(counts.keys())]

        stats = {
            "totalReels": total,
            "totalViews": None,
            "engagement": None,
            "avgWatchTime": None,
        }

        return jsonify({"success": True, "stats": stats, "recent": recent, "chart": chart})
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500



@app.route("/api/gallery", methods=["GET", "POST", "DELETE"])
def api_gallery():
    try:
        if request.method == "GET":
            items = Gallery.query.order_by(Gallery.created_at.desc()).all()
            items_data = [{
                "id": item.id,
                "filename": item.filename,
                "url": item.url,
                "thumbnailUrl": get_or_create_thumbnail_url(item.filename),
                "title": item.title,
                "caption": item.caption,
                "style": item.style,
                "createdAt": item.created_at.isoformat() + 'Z' if item.created_at else None,
                "size": item.size,
                "generated": item.generated
            } for item in items]
            return jsonify({"success": True, "items": items_data})

        elif request.method == "POST":
            # POST supports two formats:
            # 1) JSON metadata for already-generated files.
            # 2) Raw binary upload body with metadata in query params (frontend upload form).
            if request.is_json:
                data = request.get_json(silent=True) or {}
                filename = data.get("filename") or ""
                title = data.get("title") or "Untitled"
                caption = data.get("caption") or ""
                style = data.get("style") or ""

                safe_name = os.path.basename(filename)
                target_path = GENERATED_DIR.joinpath(safe_name)
                if not safe_name or not safe_name.startswith("reel-") or not target_path.exists():
                    return jsonify({"success": False, "error": "File not found in generated folder"}), 400

                size_bytes = target_path.stat().st_size
                generated_flag = True
            else:
                original_name = request.headers.get("X-Filename") or request.args.get("filename") or "upload.mp4"
                original_name = os.path.basename(original_name)
                ext = Path(original_name).suffix.lower() or ".mp4"

                # Keep uploads deterministic and safe under generated/ for serving via /generated/*
                safe_name = f"upload-{int(time.time())}-{uuid.uuid4().hex[:8]}{ext}"
                target_path = GENERATED_DIR.joinpath(safe_name)

                payload = request.get_data(cache=False)
                if not payload:
                    return jsonify({"success": False, "error": "No file data received"}), 400

                with target_path.open("wb") as out:
                    out.write(payload)

                title = request.args.get("title") or Path(original_name).stem or "Untitled"
                caption = request.args.get("caption") or ""
                style = request.args.get("style") or ""
                size_bytes = target_path.stat().st_size
                generated_flag = False

            item = Gallery(
                id=uuid.uuid4().hex,
                filename=safe_name,
                url=f"/generated/{safe_name}",
                title=title,
                caption=caption,
                style=style,
                created_at=db.func.current_timestamp(),
                size=size_bytes,
                generated=generated_flag
            )
            db.session.add(item)
            db.session.commit()
            thumbnail_url = get_or_create_thumbnail_url(item.filename)
            return jsonify({"success": True, "item": {
                "id": item.id,
                "filename": item.filename,
                "url": item.url,
                "thumbnailUrl": thumbnail_url,
                "title": item.title,
                "caption": item.caption,
                "style": item.style,
                "createdAt": item.created_at.isoformat() + 'Z' if item.created_at else None,
                "size": item.size,
                "generated": item.generated
            }})

        elif request.method == "DELETE":
            # DELETE: remove a gallery item
            data = request.get_json(force=True) or {}
            item_id = data.get("id")
            if not item_id:
                return jsonify({"success": False, "error": "Item ID required"}), 400

            item = Gallery.query.get(item_id)
            if not item:
                return jsonify({"success": False, "error": "Item not found"}), 404

            # Optionally delete the file
            file_path = GENERATED_DIR.joinpath(item.filename)
            if file_path.exists():
                file_path.unlink()

            thumb_path = GENERATED_DIR.joinpath(thumbnail_name_for_video(item.filename))
            if thumb_path.exists():
                thumb_path.unlink()

            db.session.delete(item)
            db.session.commit()
            return jsonify({"success": True})

    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/event", methods=["POST"])
def api_event():
    try:
        data = request.get_json(force=True) or {}
        event_type = (data.get("type") or "").strip()
        filename = os.path.basename((data.get("filename") or "").strip())

        if event_type not in {"view", "download"}:
            return jsonify({"success": False, "error": "Invalid event type"}), 400

        events = load_events()
        events.append({
            "id": uuid.uuid4().hex,
            "type": event_type,
            "filename": filename,
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })
        save_events(events)
        return jsonify({"success": True})
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/reel-generator", methods=["POST"])
def reel_generator():
    data = request.get_json(force=True)
    prompt = (data.get("prompt") or "").strip()
    style = (data.get("style") or "").strip() or None
    theme = (data.get("theme") or "").strip() or None
    aspect = data.get("aspectRatio") or "portrait"
    duration = float(data.get("reelDurationSeconds") or 12)
    speed = int(data.get("speed") or 50)
    scene_count = int(data.get("sceneCount") or 0)
    quality = data.get("quality") or "High (1080p)"

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

            # Try primary provider
            try:
                if os.environ.get("HF_API_TOKEN") or os.environ.get("HF_TOKEN"):
                    generate_huggingface_image_to_file(scene_prompt, width, height, frame_path, max_attempts=2)
                    rendered_from_image = True
                else:
                    image_url = build_pollinations_image_url(scene_prompt, width, height, seed)
                    download_image_with_retry(image_url, frame_path, max_attempts=4, wait_ms=1200)
                    rendered_from_image = True
            except Exception as primary_err:
                # fallback to alternative provider
                try:
                    if os.environ.get("HF_API_TOKEN") or os.environ.get("HF_TOKEN"):
                        # HF failed, try Pollinations as fallback
                        image_url = build_pollinations_image_url(scene_prompt, width, height, seed)
                        download_image_with_retry(image_url, frame_path, max_attempts=4, wait_ms=1200)
                        rendered_from_image = True
                    else:
                        # Pollinations was primary, try again or use fallback clip
                        raise primary_err
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
                    quality=quality,
                )
            else:
                render_cinematic_fallback_clip(
                    clip_path,
                    width,
                    height,
                    effective_scene_length,
                    motion_preset=idx,
                    quality=quality,
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

        # Save generation metadata into gallery database
        try:
            item = Gallery(
                id=uuid.uuid4().hex,
                filename=output_name,
                url=public_url,
                title=(prompt[:60] + "...") if prompt and len(prompt) > 60 else (prompt or output_name),
                caption="",
                style=style or "",
                created_at=db.func.current_timestamp(),
                size=output_path.stat().st_size if output_path.exists() else 0,
                generated=True,
            )
            db.session.add(item)
            db.session.commit()
        except Exception as e:
            print("Failed to save gallery metadata:", e, file=sys.stderr)

        return jsonify({"success": True, "videoUrl": public_url})
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e), "trace": tb}), 500
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

# Authentication routes
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "Username, email, and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already taken"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        "message": "User created successfully",
        "token": access_token,
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email
        }
    }), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200


def _get_user_from_bearer():
    auth = request.headers.get('Authorization') or request.args.get('token')
    if not auth:
        return None
    if auth.startswith('Bearer '):
        token = auth.split(None, 1)[1]
    else:
        token = auth
    try:
        payload = pyjwt.decode(token, app.config.get('JWT_SECRET_KEY'), algorithms=[app.config.get('JWT_ALGORITHM', 'HS256')])
    except Exception:
        return None
    sub = payload.get('sub')
    try:
        uid = int(sub)
    except Exception:
        try:
            uid = int(str(sub))
        except Exception:
            return None
    return User.query.get(uid)


@app.route("/api/user", methods=["GET", "PUT"])
def api_user():
    """Get or update the current user's profile (username/email).

    PUT accepts JSON: { username, email }
    """
    try:
        user = _get_user_from_bearer()
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        if request.method == "GET":
            return jsonify({
                "success": True,
                "user": {"id": user.id, "username": user.username, "email": user.email, "profilePicture": user.profile_picture}
            })

        data = request.get_json(silent=True) or {}
        new_email = (data.get("email") or "").strip()
        new_username = (data.get("username") or data.get("displayName") or "").strip()

        # Email uniqueness check
        if new_email and new_email != user.email:
            if User.query.filter(User.email == new_email, User.id != user.id).first():
                return jsonify({"success": False, "error": "Email already in use"}), 400
            user.email = new_email

        # Username uniqueness check
        if new_username and new_username != user.username:
            if User.query.filter(User.username == new_username, User.id != user.id).first():
                return jsonify({"success": False, "error": "Username already taken"}), 400
            user.username = new_username

        db.session.commit()
        return jsonify({"success": True, "user": {"id": user.id, "username": user.username, "email": user.email, "profilePicture": user.profile_picture}})
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/user/password", methods=["PUT"])
def api_user_password():
    """Change the current user's password. Expects JSON: { currentPassword, newPassword }"""
    try:
        user = _get_user_from_bearer()
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        data = request.get_json(force=True) or {}
        current = data.get("currentPassword") or data.get("current_password")
        new_pw = data.get("newPassword") or data.get("new_password")

        if not current or not new_pw:
            return jsonify({"success": False, "error": "currentPassword and newPassword are required"}), 400

        if not check_password_hash(user.password_hash, current):
            return jsonify({"success": False, "error": "Current password is incorrect"}), 401

        # Basic validation
        if len(new_pw) < 6:
            return jsonify({"success": False, "error": "New password must be at least 6 characters"}), 400

        user.password_hash = generate_password_hash(new_pw)
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/user/avatar', methods=['POST'])
def api_user_avatar():
    try:
        user = _get_user_from_bearer()
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Accept multipart file or raw body
        file = None
        if 'file' in request.files:
            file = request.files['file']
        else:
            # try to read raw bytes
            data = request.get_data()
            if data:
                # write raw data to temp file, but require filename param
                filename = request.args.get('filename') or f"avatar-{user.id}.jpg"
                file_path = GENERATED_DIR.joinpath(filename)
                with file_path.open('wb') as fh:
                    fh.write(data)
                user.profile_picture = f"/generated/{file_path.name}"
                db.session.commit()
                return jsonify({"success": True, "profilePicture": user.profile_picture})

        if not file:
            return jsonify({"success": False, "error": "No file provided"}), 400

        # save file
        ext = Path(file.filename or '').suffix or '.jpg'
        safe_name = f"avatar-{user.id}{ext}"
        target = GENERATED_DIR.joinpath(safe_name)
        file.save(str(target))
        user.profile_picture = f"/generated/{safe_name}"
        db.session.commit()
        return jsonify({"success": True, "profilePicture": user.profile_picture})
    except Exception as e:
        tb = traceback.format_exc()
        print(tb, file=sys.stderr)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/protected", methods=["GET"])
def protected():
    user = _get_user_from_bearer()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    return jsonify({
        "message": f"Hello {user.username}!",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200

if __name__ == "__main__":
    # Run on port 5000 to match original backend
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))