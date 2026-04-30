import os
import random
import shutil
import sys
import json
import traceback
import subprocess
import tempfile
import time
from pathlib import Path
from typing import List
import uuid

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
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

# Create tables
with app.app_context():
    db.create_all()

# SETTINGS_FILE = Path("data/settings.json")

# SETTINGS_FILE = Path("data/settings.json")
# DEFAULT_SETTINGS = {
#     "reminderTime": "09:00",
#     "reminderEnabled": True,
#     "reminderFrequency": "daily",
#     "artStyle": "Realistic",
#     "duration": "10 seconds",
#     "quality": "High (1080p)",
#     "showQuickTips": True,
#     "focusPromptOnCreate": True,
# }

# @app.route("/api/settings", methods=["GET"])
# def load_settings():
#     if SETTINGS_FILE.exists():
#         with SETTINGS_FILE.open("r", encoding="utf-8") as file:
#             return jsonify(json.load(file))
#     return jsonify(DEFAULT_SETTINGS)

# @app.route("/api/settings", methods=["POST"])
# def save_settings():
#     settings = request.json
#     with SETTINGS_FILE.open("w", encoding="utf-8") as file:
#         json.dump(settings, file, indent=2)
#     return jsonify({"success": True})

# GENERATED_DIR = Path(__file__).parent.joinpath("generated")
# GENERATED_DIR.mkdir(parents=True, exist_ok=True)
# DATA_DIR = Path(__file__).parent.joinpath("data")
# DATA_DIR.mkdir(parents=True, exist_ok=True)
# SETTINGS_FILE = DATA_DIR.joinpath("settings.json")
# GALLERY_FILE = DATA_DIR.joinpath("gallery.json")
# EVENTS_FILE = DATA_DIR.joinpath("events.json")

# DEFAULT_SETTINGS = {
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


# def load_gallery() -> list:
#     if not GALLERY_FILE.exists():
#         return []

#     try:
#         with GALLERY_FILE.open("r", encoding="utf-8") as fh:
#             return json.load(fh)
#     except Exception:
#         return []


# def save_gallery(items: list) -> None:
#     with GALLERY_FILE.open("w", encoding="utf-8") as fh:
#         json.dump(items, fh, indent=2)


# def load_events() -> list:
#     if not EVENTS_FILE.exists():
#         return []

#     try:
#         with EVENTS_FILE.open("r", encoding="utf-8") as fh:
#             return json.load(fh)
#     except Exception:
#         return []


# def save_events(items: list) -> None:
#     with EVENTS_FILE.open("w", encoding="utf-8") as fh:
#         json.dump(items, fh, indent=2)


# def clamp_number(value: float, minimum: float, maximum: float) -> float:
#     return max(minimum, min(value, maximum))


# def get_dimensions(aspect_ratio: str):
#     if aspect_ratio == "landscape":
#         return 1280, 720
#     if aspect_ratio == "square":
#         return 1024, 1024
#     return 720, 1280


# def get_scene_count_for_duration(duration_seconds: float) -> int:
#     normalized_duration = clamp_number(float(duration_seconds or 15), 5, 15)
#     if normalized_duration <= 5:
#         return 2
#     if normalized_duration <= 10:
#         return 4
#     return 6


# def compute_scene_length_by_speed(scene_length: float, speed: int) -> float:
#     normalized = clamp_number((float(speed) - 50) / 50, -1, 1)
#     adjusted = scene_length * (1 - normalized * 0.35)
#     return clamp_number(round(adjusted, 2), 1.8, 6)


# def build_scene_prompts(prompt: str, style: str | None, theme: str | None, scene_count: int) -> List[str]:
#     camera_directions = [
#         "wide establishing shot from a camera tripod",
#         "slow cinematic push-in toward the main subject",
#         "medium documentary-style shot with natural movement",
#         "gentle side-tracking camera movement",
#         "low-angle cinematic shot with depth and atmosphere",
#         "over-the-shoulder composition with environmental depth",
#         "long lens cinematic shot with shallow depth of field",
#         "final reveal shot with a realistic handheld camera feel",
#     ]

#     narrative_beats = [
#         "opening moment that establishes the setting",
#         "subject moves slightly forward with clearer focus",
#         "mid-sequence emotional beat with environmental depth",
#         "supporting detail shot that still keeps subject identity",
#         "climactic moment with cinematic tension",
#         "calm resolution shot that feels complete",
#     ]

#     prompts: List[str] = []
#     for i in range(scene_count):
#         continuity_instruction = (
#             "introduce one clear main subject and keep identity consistent"
#             if i == 0
#             else "continuation of previous scene, same subject, same outfit, same location"
#         )

#         parts = [
#             f"photorealistic scene based on: {prompt}",
#             f"{style} style" if style else None,
#             theme or None,
#             camera_directions[i % len(camera_directions)],
#             narrative_beats[i % len(narrative_beats)],
#             continuity_instruction,
#             f"scene {i + 1} of {scene_count}",
#             "same location, same subject, same environment",
#             "cinematic lighting",
#             "high detail",
#             "realistic motion blur",
#             "no text, no watermark",
#         ]
#         prompts.append(", ".join([p for p in parts if p]))

#     return prompts


# def build_pollinations_image_url(prompt: str, width: int, height: int, seed: int) -> str:
#     from urllib.parse import quote
#     return f"https://image.pollinations.ai/prompt/{quote(prompt)}?width={width}&height={height}&seed={seed}&model=flux&nologo=true"


# @app.route("/generated/<path:filename>")
# def generated_static(filename: str):
#     return send_from_directory(GENERATED_DIR, filename)


# @app.route("/api/settings", methods=["GET"])
# def api_settings():
#     if request.method == "GET":
#         return jsonify({"success": True, "settings": load_settings()})

#     data = request.get_json(force=True) or {}
#     current = load_settings()
#     for key in DEFAULT_SETTINGS:
#         if key in data:
#             current[key] = data[key]

#     save_settings(current)
#     return jsonify({"success": True, "settings": current})


# @app.route("/api/dashboard", methods=["GET"])
# def api_dashboard():
#     """Return basic dashboard metrics and recent reels found in the generated folder.

#     This endpoint intentionally keeps things simple: it scans files in
#     `server/generated`, returns counts, recent items (filename/url/size/createdAt),
#     and a small 7-day histogram for reels created.
#     """
#     try:
#         files = [p for p in GENERATED_DIR.iterdir() if p.is_file() and p.name.startswith("reel-") and p.suffix == ".mp4"]
#         files_sorted = sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)

#         recent = []
#         for p in files_sorted[:6]:
#             st = p.stat()
#             recent.append({
#                 "filename": p.name,
#                 "url": f"/generated/{p.name}",
#                 "size": st.st_size,
#                 "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(st.st_mtime)),
#             })

#         total = len(files)

#         # 7-day histogram (UTC days)
#         now = time.time()
#         counts = {}
#         for i in range(7):
#             day = time.strftime("%Y-%m-%d", time.gmtime(now - i * 86400))
#             counts[day] = 0

#         for p in files:
#             day = time.strftime("%Y-%m-%d", time.gmtime(p.stat().st_mtime))
#             if day in counts:
#                 counts[day] += 1

#         chart = [{"day": d, "reels": counts[d]} for d in sorted(counts.keys())]

#         stats = {
#             "totalReels": total,
#             "totalViews": None,
#             "engagement": None,
#             "avgWatchTime": None,
#         }

#         return jsonify({"success": True, "stats": stats, "recent": recent, "chart": chart})
#     except Exception as e:
#         tb = traceback.format_exc()
#         print(tb, file=sys.stderr)
#         return jsonify({"success": False, "error": str(e)}), 500



# @app.route("/api/gallery", methods=["GET", "POST"])
# def api_gallery():
#     try:
#         if request.method == "GET":
#             items = load_gallery()
#             # sort by createdAt desc
#             items_sorted = sorted(items, key=lambda it: it.get("createdAt", ""), reverse=True)
#             return jsonify({"success": True, "items": items_sorted})

#         # POST: save a new gallery item
#         data = request.get_json(force=True) or {}
#         filename = data.get("filename") or ""
#         title = data.get("title") or "Untitled"
#         caption = data.get("caption") or ""
#         style = data.get("style") or ""

#         # Normalize filename (only allow files under GENERATED_DIR)
#         safe_name = os.path.basename(filename)
#         if not safe_name.startswith("reel-") or not (GENERATED_DIR.joinpath(safe_name)).exists():
#             return jsonify({"success": False, "error": "File not found in generated folder"}), 400

#         items = load_gallery()
#         item = {
#             "id": uuid.uuid4().hex,
#             "filename": safe_name,
#             "url": f"/generated/{safe_name}",
#             "title": title,
#             "caption": caption,
#             "style": style,
#             "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
#             "size": GENERATED_DIR.joinpath(safe_name).stat().st_size,
#         }
#         items.insert(0, item)
#         save_gallery(items)
#         return jsonify({"success": True, "item": item})
#     except Exception as e:
#         tb = traceback.format_exc()
#         print(tb, file=sys.stderr)
#         return jsonify({"success": False, "error": str(e)}), 500


# @app.route("/api/event", methods=["POST"])
# def api_event():
#     try:
#         data = request.get_json(force=True) or {}
#         event_type = (data.get("type") or "").strip()
#         filename = os.path.basename((data.get("filename") or "").strip())

#         if event_type not in {"view", "download"}:
#             return jsonify({"success": False, "error": "Invalid event type"}), 400

#         events = load_events()
#         events.append({
#             "id": uuid.uuid4().hex,
#             "type": event_type,
#             "filename": filename,
#             "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
#         })
#         save_events(events)
#         return jsonify({"success": True})
#     except Exception as e:
#         tb = traceback.format_exc()
#         print(tb, file=sys.stderr)
#         return jsonify({"success": False, "error": str(e)}), 500


# @app.route("/api/reel-generator", methods=["POST"])
# def reel_generator():
#     data = request.get_json(force=True)
#     prompt = (data.get("prompt") or "").strip()
#     style = (data.get("style") or "").strip() or None
#     theme = (data.get("theme") or "").strip() or None
#     aspect = data.get("aspectRatio") or "portrait"
#     duration = float(data.get("duration") or 12)
#     speed = int(data.get("speed") or 50)
#     scene_count = int(data.get("sceneCount") or 0)

#     width, height = get_dimensions(aspect)
#     scene_count = scene_count if scene_count > 0 else get_scene_count_for_duration(duration)
#     scene_prompts = build_scene_prompts(prompt, style, theme, scene_count)
#     base_scene_length = float(duration) / max(scene_count, 1)
#     effective_scene_length = compute_scene_length_by_speed(base_scene_length, speed)

#     temp_dir = Path(tempfile.mkdtemp(prefix="python-reel-"))
#     images_dir = temp_dir / "images"
#     clips_dir = temp_dir / "clips"
#     images_dir.mkdir(parents=True, exist_ok=True)
#     clips_dir.mkdir(parents=True, exist_ok=True)

#     clip_paths: List[Path] = []

#     try:
#         ffmpeg_exe = resolve_ffmpeg_executable()

#         for idx, scene_prompt in enumerate(scene_prompts, start=1):
#             seed = random.randint(1, 1_000_000)
#             frame_path = images_dir / f"frame-{idx:03d}.jpg"

#             rendered_from_image = False

#             # Try Hugging Face first if configured
#             try:
#                 if os.environ.get("HF_API_TOKEN") or os.environ.get("HF_TOKEN"):
#                     generate_huggingface_image_to_file(scene_prompt, width, height, frame_path, max_attempts=2)
#                     rendered_from_image = True
#                 else:
#                     image_url = build_pollinations_image_url(scene_prompt, width, height, seed)
#                     download_image_with_retry(image_url, frame_path, max_attempts=4, wait_ms=1200)
#                     rendered_from_image = True
#             except Exception as primary_err:
#                 # fallback to Pollinations
#                 try:
#                     image_url = build_pollinations_image_url(scene_prompt, width, height, seed)
#                     download_image_with_retry(image_url, frame_path, max_attempts=4, wait_ms=1200)
#                     rendered_from_image = True
#                 except Exception as fallback_err:
#                     print(
#                         f"Scene {idx} image providers failed. primary={primary_err} fallback={fallback_err}. Using offline fallback clip.",
#                         file=sys.stderr,
#                     )

#             clip_path = clips_dir / f"clip-{idx:03d}.mp4"
#             if rendered_from_image:
#                 render_cinematic_video_from_image(
#                     frame_path,
#                     clip_path,
#                     width,
#                     height,
#                     effective_scene_length,
#                     motion_preset=idx,
#                 )
#             else:
#                 render_cinematic_fallback_clip(
#                     clip_path,
#                     width,
#                     height,
#                     effective_scene_length,
#                     motion_preset=idx,
#                 )
#             clip_paths.append(clip_path)

#         # concatenate clips
#         output_name = f"reel-{int(time.time())}.mp4"
#         output_path = GENERATED_DIR / output_name

#         list_file = temp_dir / "clips.txt"
#         with list_file.open("w", encoding="utf-8") as f:
#             for p in clip_paths:
#                 f.write(f"file '{p.as_posix()}'\n")

#         concat_cmd = [
#             ffmpeg_exe,
#             "-y",
#             "-f",
#             "concat",
#             "-safe",
#             "0",
#             "-i",
#             str(list_file),
#             "-c",
#             "copy",
#             str(output_path),
#         ]

#         try:
#             subprocess.run(concat_cmd, check=True)
#         except subprocess.CalledProcessError:
#             # fallback: re-encode (more compatible)
#             reencode_cmd = [
#                 ffmpeg_exe,
#                 "-y",
#                 "-f",
#                 "concat",
#                 "-safe",
#                 "0",
#                 "-i",
#                 str(list_file),
#                 "-c:v",
#                 "libx264",
#                 "-pix_fmt",
#                 "yuv420p",
#                 str(output_path),
#             ]
#             subprocess.run(reencode_cmd, check=True)

#         public_url = f"/generated/{output_name}"

#         # Save generation metadata into gallery.json so dashboard/gallery can show it
#         try:
#             items = load_gallery()
#             item = {
#                 "id": uuid.uuid4().hex,
#                 "filename": output_name,
#                 "url": public_url,
#                 "title": (prompt[:60] + "...") if prompt and len(prompt) > 60 else (prompt or output_name),
#                 "caption": "",
#                 "style": style or "",
#                 "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
#                 "size": output_path.stat().st_size if output_path.exists() else 0,
#                 "generated": True,
#             }
#             items.insert(0, item)
#             save_gallery(items)
#         except Exception as e:
#             print("Failed to save gallery metadata:", e, file=sys.stderr)

#         return jsonify({"success": True, "videoUrl": public_url})
#     except Exception as e:
#         tb = traceback.format_exc()
#         print(tb, file=sys.stderr)
#         return jsonify({"success": False, "error": str(e), "trace": tb}), 500
#     finally:
#         shutil.rmtree(temp_dir, ignore_errors=True)

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

    access_token = create_access_token(identity=new_user.id)
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

    access_token = create_access_token(identity=user.id)
    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }), 200


@app.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
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