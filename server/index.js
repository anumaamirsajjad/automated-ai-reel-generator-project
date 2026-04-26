// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");
// const fs = require("fs");
// const fsp = require("fs/promises");
// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegPath = require("ffmpeg-static");
// const { randomUUID } = require("crypto");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;
// const GENERATED_DIR = path.join(__dirname, "generated");
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";

// app.use(cors());
// app.use(express.json());
// fs.mkdirSync(GENERATED_DIR, { recursive: true });
// app.use("/generated", express.static(GENERATED_DIR));

// if (ffmpegPath) {
//   ffmpeg.setFfmpegPath(ffmpegPath);
// }

// function getDimensions(aspectRatio) {
//   if (aspectRatio === "landscape") {
//     return { width: 1280, height: 720 };
//   }

//   if (aspectRatio === "square") {
//     return { width: 1024, height: 1024 };
//   }

//   return { width: 720, height: 1280 };
// }

// function buildScenePrompts({ prompt, style, theme, sceneCount }) {
//   const cameraDirections = [
//     "wide establishing shot from a camera tripod",
//     "slow cinematic push-in toward the main subject",
//     "medium documentary-style shot with natural movement",
//     "gentle side-tracking camera movement",
//     "low-angle cinematic shot with depth and atmosphere",
//     "over-the-shoulder composition with environmental depth",
//     "long lens cinematic shot with shallow depth of field",
//     "final reveal shot with a realistic handheld camera feel",
//   ];

//   return Array.from({ length: sceneCount }, (_, i) => {
//     return [
//       `photorealistic scene based on: ${prompt}`,
//       style ? `${style} style` : null,
//       theme || null,
//       cameraDirections[i % cameraDirections.length],
//       `scene ${i + 1} of ${sceneCount}`,
//       "same location, same subject, same environment",
//       "cinematic lighting",
//       "high detail",
//       "realistic motion blur",
//       "no text, no watermark",
//     ]
//       .filter(Boolean)
//       .join(", ");
//   });
// }

// function clampNumber(value, min, max) {
//   return Math.min(Math.max(value, min), max);
// }

// function computeSceneLengthBySpeed(sceneLength, speed) {
//   const normalized = clampNumber((Number(speed) - 50) / 50, -1, 1);
//   const adjusted = sceneLength * (1 - normalized * 0.35);
//   return clampNumber(Number(adjusted.toFixed(2)), 1.8, 6);
// }

// function escapeDrawtext(text) {
//   return String(text || "")
//     .replace(/\\/g, "\\\\")
//     .replace(/:/g, "\\:")
//     .replace(/'/g, "\\'")
//     .replace(/,/g, "\\,")
//     .replace(/\[/g, "\\[")
//     .replace(/\]/g, "\\]")
//     .replace(/%/g, "\\%")
//     .replace(/\n/g, " ");
// }

// function generateHashtags({ prompt, theme, style, maxCount = 8 }) {
//   const words = [prompt, theme, style]
//     .filter(Boolean)
//     .join(" ")
//     .toLowerCase()
//     .replace(/[^a-z0-9\s]/g, " ")
//     .split(/\s+/)
//     .filter((word) => word.length > 2);

//   const common = new Set(["with", "from", "into", "your", "this", "that", "style", "scene", "camera", "video", "reel"]);
//   const unique = [...new Set(words.filter((w) => !common.has(w)))].slice(0, maxCount);
//   return unique.map((word) => `#${word}`);
// }

// function buildPrimaryPrompt({ prompt, style, theme }) {
//   return [
//     prompt,
//     style ? `${style} style` : null,
//     theme || null,
//     "ultra realistic",
//     "cinematic",
//     "natural lighting",
//     "high detail",
//   ]
//     .filter(Boolean)
//     .join(", ");
// }

// function buildPollinationsImageUrl({ prompt, width, height, seed }) {
//   return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
// }

// function buildGeminiImagePrompt({ scenePrompt, width, height }) {
//   return [
//     "Generate one photorealistic image frame for a vertical short-form reel.",
//     `Scene prompt: ${scenePrompt}`,
//     `Target resolution: ${width}x${height}`,
//     "No text, no watermark, cinematic realism, natural lighting.",
//   ].join("\n");
// }

// function buildFallbackQuery({ prompt, theme, style }) {
//   const raw = [prompt, theme, style].filter(Boolean).join(" ").toLowerCase();
//   const stopWords = new Set([
//     "a", "an", "the", "with", "and", "for", "from", "into", "over", "under", "between",
//     "realistic", "style", "scene", "shot", "camera", "video", "reel",
//   ]);

//   const keywords = raw
//     .replace(/[^a-z0-9\s]/g, " ")
//     .split(/\s+/)
//     .filter((word) => word.length > 2 && !stopWords.has(word));

//   const unique = [...new Set(keywords)].slice(0, 8);
//   return unique.length ? unique.join(" ") : "nature landscape";
// }

// async function fetchWikimediaImageUrls({ query, width, height, limit = 10 }) {
//   const params = new URLSearchParams({
//     action: "query",
//     generator: "search",
//     gsrnamespace: "6",
//     gsrlimit: String(limit),
//     gsrsearch: query,
//     prop: "imageinfo",
//     iiprop: "url",
//     iiurlwidth: String(width),
//     iiurlheight: String(height),
//     format: "json",
//     origin: "*",
//   });

//   const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
//   const response = await fetchWithTimeout(url, 15000);
//   if (!response.ok) {
//     throw new Error(`Wikimedia query failed with status ${response.status}`);
//   }

//   const data = await response.json();
//   const pages = Object.values(data?.query?.pages || {});
//   const urls = pages
//     .map((page) => page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url)
//     .filter(Boolean)
//     .filter((imgUrl) => !/\.svg($|\?)/i.test(imgUrl));

//   return urls;
// }

// function buildKeywordFallbackUrl({ query, width, height, seed }) {
//   const tags = query
//     .split(/\s+/)
//     .filter(Boolean)
//     .slice(0, 3)
//     .join(",");

//   return `https://loremflickr.com/${width}/${height}/${encodeURIComponent(tags || "landscape")}?lock=${seed}`;
// }

// function wait(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function fetchWithTimeout(url, timeoutMs = 15000, options = {}) {
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

//   try {
//     return await fetch(url, {
//       ...options,
//       signal: controller.signal,
//     });
//   } finally {
//     clearTimeout(timeoutId);
//   }
// }

// async function generateGeminiImageToFile({ scenePrompt, width, height, outputPath, maxAttempts = 2 }) {
//   if (!GEMINI_API_KEY) {
//     throw new Error("GEMINI_API_KEY is not configured");
//   }

//   const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_IMAGE_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
//   let lastError;

//   for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
//     try {
//       const response = await fetchWithTimeout(endpoint, 45000, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [
//             {
//               role: "user",
//               parts: [{ text: scenePrompt }],
//             },
//           ],
//           generationConfig: {
//             responseModalities: ["TEXT", "IMAGE"],
//           },
//         }),
//       });
//       if (!response.ok) {
//         const text = await response.text();
//         throw new Error(`Gemini API status ${response.status}: ${text.slice(0, 280)}`);
//       }

//       const data = await response.json();
//       const parts = data?.candidates?.[0]?.content?.parts || [];
//       const imagePart = parts.find((part) => part?.inlineData?.data && String(part?.inlineData?.mimeType || "").startsWith("image/"));

//       if (!imagePart?.inlineData?.data) {
//         throw new Error("Gemini returned no image bytes");
//       }

//       const buffer = Buffer.from(imagePart.inlineData.data, "base64");
//       await fsp.writeFile(outputPath, buffer);
//       return;
//     } catch (err) {
//       lastError = new Error(`Gemini attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
//       if (attempt < maxAttempts) {
//         await wait(1200 * attempt);
//       }
//     }
//   }

//   throw lastError;
// }

// async function downloadImageWithRetry(url, outputPath, maxAttempts = 4, waitMs = 1200) {
//   let lastError;

//   for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
//     try {
//       const response = await fetchWithTimeout(url, 15000);
//       if (!response.ok) {
//         const status = response.status;
//         throw new Error(`Image download failed with status ${status}`);
//       }

//       const buffer = Buffer.from(await response.arrayBuffer());
//       await fsp.writeFile(outputPath, buffer);
//       return;
//     } catch (err) {
//       lastError = new Error(`Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
//       if (attempt < maxAttempts) {
//         await wait(waitMs * attempt);
//       }
//     }
//   }

//   throw lastError;
// }

// function renderCinematicVideoFromImage({ inputPath, outputPath, width, height, durationSeconds }) {
//   const totalFrames = Math.max(1, Math.floor(durationSeconds * 30));
//   const scalePadFilter = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
//   const motionFilter = `zoompan=z='min(1.18,1+on/${Math.max(totalFrames, 1)}*0.18)':x='iw/2-(iw/zoom/2)+sin(on/22)*6':y='ih/2-(ih/zoom/2)+cos(on/18)*5':d=1:s=${width}x${height}:fps=30`;

//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(inputPath)
//       .loop(durationSeconds)
//       .outputOptions([
//         "-c:v libx264",
//         "-preset veryfast",
//         "-movflags +faststart",
//         "-pix_fmt yuv420p",
//         `-t ${durationSeconds}`,
//         `-vf ${scalePadFilter},${motionFilter},format=yuv420p`,
//       ])
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Video render failed: ${err.message}`)))
//       .save(outputPath);
//   });
// }

// function renderPromptFallbackVideo({ outputPath, width, height, durationSeconds, prompt, theme, style }) {
//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(`color=c=#111827:s=${width}x${height}:d=${durationSeconds}`)
//       .inputOptions(["-f lavfi"])
//       .outputOptions([
//         "-c:v libx264",
//         "-preset veryfast",
//         "-movflags +faststart",
//         "-pix_fmt yuv420p",
//       ])
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Prompt fallback render failed: ${err.message}`)))
//       .save(outputPath);
//   });
// }

// function renderVideoFromFrames({ inputPattern, outputPath, width, height, sceneLength }) {
//   const frameRate = 1 / Math.max(1, sceneLength);
//   const scalePadFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p`;

//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(inputPattern)
//       .inputOptions([`-framerate ${frameRate}`])
//       .outputOptions([
//         "-c:v libx264",
//         "-preset veryfast",
//         "-movflags +faststart",
//         "-pix_fmt yuv420p",
//         `-vf ${scalePadFilter}`,
//       ])
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Video render failed: ${err.message}`)))
//       .save(outputPath);
//   });
// }

// async function renderConcatVideo({ clipPaths, outputPath }) {
//   const listPath = `${outputPath}.txt`;
//   const listContent = clipPaths.map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`).join("\n");
//   await fsp.writeFile(listPath, listContent);

//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(listPath)
//       .inputOptions(["-f concat", "-safe 0"])
//       .outputOptions([
//         "-c copy",
//         "-movflags +faststart",
//       ])
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Video concat failed: ${err.message}`)))
//       .save(outputPath);
//   }).finally(async () => {
//     try {
//       await fsp.unlink(listPath);
//     } catch (err) {
//       console.warn("Failed to remove concat list:", err.message);
//     }
//   });
// }

// async function applyVideoEnhancements({
//   inputPath,
//   outputPath,
//   durationSeconds,
//   prompt,
//   addCaptions,
//   addMusic,
// }) {
//   if (!addCaptions && !addMusic) {
//     await fsp.copyFile(inputPath, outputPath);
//     return;
//   }

//   const caption = escapeDrawtext(String(prompt || "").trim().slice(0, 120));
//   const captionFilter = `drawtext=text='${caption}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h-text_h-50:box=1:boxcolor=black@0.45:boxborderw=14`;

//   return new Promise((resolve, reject) => {
//     const command = ffmpeg().input(inputPath);

//     if (addMusic) {
//       command.input(`sine=frequency=220:sample_rate=44100:duration=${Math.max(1, Math.round(durationSeconds))}`);
//       command.inputOptions(["-f lavfi"]);
//     }

//     const outputOptions = [
//       "-c:v libx264",
//       "-preset veryfast",
//       "-movflags +faststart",
//       "-pix_fmt yuv420p",
//     ];

//     if (addCaptions && caption) {
//     outputOptions.push("-vf", captionFilter);  // ← split into two separate args
//     }

//     if (addMusic) {
//       outputOptions.push("-map 0:v:0");
//       outputOptions.push("-map 1:a:0");
//       outputOptions.push("-shortest");
//       outputOptions.push("-c:a aac");
//       outputOptions.push("-b:a 128k");
//       outputOptions.push("-af volume=0.08");
//     } else {
//       outputOptions.push("-an");
//     }

//     command
//       .outputOptions(outputOptions)
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Enhancement render failed: ${err.message}`)))
//       .save(outputPath);
//   });
// }

// async function safeRemoveDir(dirPath) {
//   try {
//     await fsp.rm(dirPath, { recursive: true, force: true });
//   } catch (err) {
//     console.warn("Failed to clean temp dir:", err.message);
//   }
// }

// app.get("/api/health", (req, res) => {
//   res.json({
//     ok: true,
//     service: "reel-generator-backend",
//     ffmpeg: Boolean(ffmpegPath),
//     geminiConfigured: Boolean(GEMINI_API_KEY),
//   });
// });

// app.post("/api/reel-generator", async (req, res) => {
//   const { prompt, style, theme, aspectRatio } = req.body || {};
//   const captions = Boolean(req.body?.captions);
//   const music = Boolean(req.body?.music);
//   const hashtagsEnabled = Boolean(req.body?.hashtags);
//   const speed = clampNumber(Number(req.body?.speed) || 50, 0, 100);

//   const baseSceneLength = clampNumber(Number(req.body?.sceneLength) || 3, 2, 6);
//   const effectiveSceneLength = computeSceneLengthBySpeed(baseSceneLength, speed);
//   const sceneCount = clampNumber(Number(req.body?.sceneCount) || 7, 7, 8);
//   const requestedSeconds = clampNumber(effectiveSceneLength * sceneCount, 10, 30);

//   if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
//     return res.status(400).json({ success: false, error: "Prompt is required" });
//   }

//   const jobId = randomUUID();
//   const tempDir = path.join(GENERATED_DIR, `tmp-${jobId}`);
//   const { width, height } = getDimensions(aspectRatio);

//   try {
//     await fsp.mkdir(tempDir, { recursive: true });

//     const primaryPrompts = buildScenePrompts({
//       prompt: prompt.trim(),
//       style,
//       theme,
//       sceneCount,
//     });

//     const sceneSources = [];
//     const imageUrls = [];
//     const clipPaths = [];
//     const fallbackQuery = buildFallbackQuery({ prompt: prompt.trim(), theme, style });
//     let sharedFallbackUrls = [];

//     for (let index = 0; index < primaryPrompts.length; index += 1) {
//       const seed = Math.floor(Math.random() * 1000000);
//       const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, "0")}.jpg`);
//       const promptText = primaryPrompts[index];
//       let imageUrl = buildPollinationsImageUrl({
//         prompt: promptText,
//         width,
//         height,
//         seed,
//       });
//       let source = "pollinations";

//       try {
//         if (GEMINI_API_KEY) {
//           await generateGeminiImageToFile({
//             scenePrompt: buildGeminiImagePrompt({ scenePrompt: promptText, width, height }),
//             width,
//             height,
//             outputPath: framePath,
//             maxAttempts: 2,
//           });
//           source = "gemini";
//           imageUrl = null;
//         } else {
//           await downloadImageWithRetry(imageUrl, framePath, 4, 1000);
//         }
//       } catch (primaryErr) {
//         source = "pollinations";
//         imageUrl = buildPollinationsImageUrl({
//           prompt: promptText,
//           width,
//           height,
//           seed,
//         });

//         let fallbackImageUrl = null;
//         let fallbackSource = "none";

//         try {
//           await downloadImageWithRetry(imageUrl, framePath, 2, 600);
//           imageUrls.push(imageUrl);
//           sceneSources.push({ scene: index + 1, source, imageUrl });
//         } catch (pollinationsRetryErr) {
//           console.warn(`Scene ${index + 1} direct image retry failed: ${pollinationsRetryErr.message}`);
//         }

//         if (sceneSources.length >= index + 1) {
//           const clipPathFast = path.join(tempDir, `clip-${String(index + 1).padStart(3, "0")}.mp4`);
//           await renderCinematicVideoFromImage({
//             inputPath: framePath,
//             outputPath: clipPathFast,
//             width,
//             height,
//             durationSeconds: effectiveSceneLength,
//           });
//           clipPaths.push(clipPathFast);
//           continue;
//         }

//         try {
//           if (!sharedFallbackUrls.length) {
//             sharedFallbackUrls = await fetchWikimediaImageUrls({
//               query: fallbackQuery,
//               width,
//               height,
//               limit: Math.max(sceneCount + 2, 8),
//             });
//           }
//         } catch (wikimediaErr) {
//           console.warn(`Wikimedia fallback fetch failed: ${wikimediaErr.message}`);
//         }

//         if (sharedFallbackUrls.length) {
//           fallbackImageUrl = sharedFallbackUrls[index % sharedFallbackUrls.length];
//           fallbackSource = "wikimedia";
//         } else {
//           fallbackImageUrl = buildKeywordFallbackUrl({
//             query: fallbackQuery,
//             width,
//             height,
//             seed,
//           });
//           fallbackSource = "loremflickr";
//         }

//         try {
//           await downloadImageWithRetry(fallbackImageUrl, framePath, 2, 700);
//           console.warn(`Scene ${index + 1} switched to related-image fallback (${fallbackSource}): ${primaryErr.message}`);
//           imageUrls.push(fallbackImageUrl);
//           sceneSources.push({ scene: index + 1, source: fallbackSource, imageUrl: fallbackImageUrl });
//         } catch (fallbackErr) {
//           console.warn(`Scene ${index + 1} fallback image also failed: ${fallbackErr.message}`);
//           const outputFile = `reel-${jobId}.mp4`;
//           const outputPath = path.join(GENERATED_DIR, outputFile);
//           await renderPromptFallbackVideo({
//             outputPath,
//             width,
//             height,
//             durationSeconds: requestedSeconds,
//             prompt: prompt.trim(),
//             theme,
//             style,
//           });

//           const baseUrl = `${req.protocol}://${req.get("host")}`;
//           return res.json({
//             success: true,
//             mode: "video",
//             provider: "ffmpeg-prompt-fallback",
//             videoUrl: `${baseUrl}/generated/${outputFile}`,
//             imageUrls,
//             sceneSources,
//             note: "Generated a prompt-based cinematic fallback reel because all image sources were unavailable.",
//           });
//         }
//       }

//       if (sceneSources.length < index + 1) {
//         imageUrls.push(imageUrl);
//         sceneSources.push({ scene: index + 1, source, imageUrl });
//       }

//       const clipPath = path.join(tempDir, `clip-${String(index + 1).padStart(3, "0")}.mp4`);
//       await renderCinematicVideoFromImage({
//         inputPath: framePath,
//         outputPath: clipPath,
//         width,
//         height,
//         durationSeconds: effectiveSceneLength,
//       });
//       clipPaths.push(clipPath);
//     }

//     const baseOutputPath = path.join(tempDir, `reel-base-${jobId}.mp4`);
//     await renderConcatVideo({ clipPaths, outputPath: baseOutputPath });

//     const outputFile = `reel-${jobId}.mp4`;
//     const outputPath = path.join(GENERATED_DIR, outputFile);
//     await applyVideoEnhancements({
//       inputPath: baseOutputPath,
//       outputPath,
//       durationSeconds: requestedSeconds,
//       prompt: prompt.trim(),
//       addCaptions: captions,
//       addMusic: music,
//     });

//     const baseUrl = `${req.protocol}://${req.get("host")}`;
//     const generatedHashtags = hashtagsEnabled ? generateHashtags({ prompt: prompt.trim(), theme, style, maxCount: 8 }) : [];

//     return res.json({
//       success: true,
//       mode: "video",
//       provider: GEMINI_API_KEY ? "gemini+ffmpeg-cinematic-motion" : "pollinations+ffmpeg-cinematic-motion",
//       videoUrl: `${baseUrl}/generated/${outputFile}`,
//       imageUrls,
//       sceneSources,
//       hashtags: generatedHashtags,
//       settingsApplied: {
//         style,
//         theme,
//         aspectRatio,
//         sceneCount,
//         sceneLength: effectiveSceneLength,
//         speed,
//         captions,
//         music,
//       },
//       note: "Generated a cinematic camera-motion reel from an AI scene image.",
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       error: `Video render failed: ${err.message}`,
//     });
//   } finally {
//     await safeRemoveDir(tempDir);
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });


// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const path = require("path");
// const fs = require("fs");
// const fsp = require("fs/promises");
// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegPath = require("ffmpeg-static");
// const { randomUUID } = require("crypto");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;
// const GENERATED_DIR = path.join(__dirname, "generated");
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";

// app.use(cors());
// app.use(express.json());
// fs.mkdirSync(GENERATED_DIR, { recursive: true });
// app.use("/generated", express.static(GENERATED_DIR));

// if (ffmpegPath) {
//   ffmpeg.setFfmpegPath(ffmpegPath);
// }

// function getDimensions(aspectRatio) {
//   if (aspectRatio === "landscape") {
//     return { width: 1280, height: 720 };
//   }

//   if (aspectRatio === "square") {
//     return { width: 1024, height: 1024 };
//   }

//   return { width: 720, height: 1280 };
// }

// function buildScenePrompts({ prompt, style, theme, sceneCount }) {
//   const cameraDirections = [
//     "wide establishing shot from a camera tripod",
//     "slow cinematic push-in toward the main subject",
//     "medium documentary-style shot with natural movement",
//     "gentle side-tracking camera movement",
//     "low-angle cinematic shot with depth and atmosphere",
//     "over-the-shoulder composition with environmental depth",
//     "long lens cinematic shot with shallow depth of field",
//     "final reveal shot with a realistic handheld camera feel",
//   ];

//   return Array.from({ length: sceneCount }, (_, i) => {
//     return [
//       `photorealistic scene based on: ${prompt}`,
//       style ? `${style} style` : null,
//       theme || null,
//       cameraDirections[i % cameraDirections.length],
//       `scene ${i + 1} of ${sceneCount}`,
//       "same location, same subject, same environment",
//       "cinematic lighting",
//       "high detail",
//       "realistic motion blur",
//       "no text, no watermark",
//     ]
//       .filter(Boolean)
//       .join(", ");
//   });
// }

// function clampNumber(value, min, max) {
//   return Math.min(Math.max(value, min), max);
// }

// function computeSceneLengthBySpeed(sceneLength, speed) {
//   const normalized = clampNumber((Number(speed) - 50) / 50, -1, 1);
//   const adjusted = sceneLength * (1 - normalized * 0.35);
//   return clampNumber(Number(adjusted.toFixed(2)), 1.8, 6);
// }

// function escapeDrawtext(text) {
//   return String(text || "")
//     .replace(/\\/g, "\\\\")
//     .replace(/'/g, "\\'")
//     .replace(/:/g, "\\:")
//     .replace(/,/g, "\\,")
//     .replace(/\[/g, "\\[")
//     .replace(/\]/g, "\\]")
//     .replace(/%/g, "\\%")
//     .replace(/\n/g, " ");
// }

// function generateHashtags({ prompt, theme, style, maxCount = 8 }) {
//   const words = [prompt, theme, style]
//     .filter(Boolean)
//     .join(" ")
//     .toLowerCase()
//     .replace(/[^a-z0-9\s]/g, " ")
//     .split(/\s+/)
//     .filter((word) => word.length > 2);

//   const common = new Set(["with", "from", "into", "your", "this", "that", "style", "scene", "camera", "video", "reel"]);
//   const unique = [...new Set(words.filter((w) => !common.has(w)))].slice(0, maxCount);
//   return unique.map((word) => `#${word}`);
// }

// function buildPrimaryPrompt({ prompt, style, theme }) {
//   return [
//     prompt,
//     style ? `${style} style` : null,
//     theme || null,
//     "ultra realistic",
//     "cinematic",
//     "natural lighting",
//     "high detail",
//   ]
//     .filter(Boolean)
//     .join(", ");
// }

// function buildPollinationsImageUrl({ prompt, width, height, seed }) {
//   return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
// }

// function buildGeminiImagePrompt({ scenePrompt, width, height }) {
//   return [
//     "Generate one photorealistic image frame for a vertical short-form reel.",
//     `Scene prompt: ${scenePrompt}`,
//     `Target resolution: ${width}x${height}`,
//     "No text, no watermark, cinematic realism, natural lighting.",
//   ].join("\n");
// }

// function buildFallbackQuery({ prompt, theme, style }) {
//   const raw = [prompt, theme, style].filter(Boolean).join(" ").toLowerCase();
//   const stopWords = new Set([
//     "a", "an", "the", "with", "and", "for", "from", "into", "over", "under", "between",
//     "realistic", "style", "scene", "shot", "camera", "video", "reel",
//   ]);

//   const keywords = raw
//     .replace(/[^a-z0-9\s]/g, " ")
//     .split(/\s+/)
//     .filter((word) => word.length > 2 && !stopWords.has(word));

//   const unique = [...new Set(keywords)].slice(0, 8);
//   return unique.length ? unique.join(" ") : "nature landscape";
// }

// async function fetchWikimediaImageUrls({ query, width, height, limit = 10 }) {
//   const params = new URLSearchParams({
//     action: "query",
//     generator: "search",
//     gsrnamespace: "6",
//     gsrlimit: String(limit),
//     gsrsearch: query,
//     prop: "imageinfo",
//     iiprop: "url",
//     iiurlwidth: String(width),
//     iiurlheight: String(height),
//     format: "json",
//     origin: "*",
//   });

//   const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
//   const response = await fetchWithTimeout(url, 15000);
//   if (!response.ok) {
//     throw new Error(`Wikimedia query failed with status ${response.status}`);
//   }

//   const data = await response.json();
//   const pages = Object.values(data?.query?.pages || {});
//   const urls = pages
//     .map((page) => page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url)
//     .filter(Boolean)
//     .filter((imgUrl) => !/\.svg($|\?)/i.test(imgUrl));

//   return urls;
// }

// function buildKeywordFallbackUrl({ query, width, height, seed }) {
//   const tags = query
//     .split(/\s+/)
//     .filter(Boolean)
//     .slice(0, 3)
//     .join(",");

//   return `https://loremflickr.com/${width}/${height}/${encodeURIComponent(tags || "landscape")}?lock=${seed}`;
// }

// function wait(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function fetchWithTimeout(url, timeoutMs = 15000, options = {}) {
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

//   try {
//     return await fetch(url, {
//       ...options,
//       signal: controller.signal,
//     });
//   } finally {
//     clearTimeout(timeoutId);
//   }
// }

// async function generateGeminiImageToFile({ scenePrompt, width, height, outputPath, maxAttempts = 2 }) {
//   if (!GEMINI_API_KEY) {
//     throw new Error("GEMINI_API_KEY is not configured");
//   }

//   const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_IMAGE_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
//   let lastError;

//   for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
//     try {
//       const response = await fetchWithTimeout(endpoint, 45000, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [
//             {
//               role: "user",
//               parts: [{ text: scenePrompt }],
//             },
//           ],
//           generationConfig: {
//             responseModalities: ["TEXT", "IMAGE"],
//           },
//         }),
//       });
//       if (!response.ok) {
//         const text = await response.text();
//         throw new Error(`Gemini API status ${response.status}: ${text.slice(0, 280)}`);
//       }

//       const data = await response.json();
//       const parts = data?.candidates?.[0]?.content?.parts || [];
//       const imagePart = parts.find((part) => part?.inlineData?.data && String(part?.inlineData?.mimeType || "").startsWith("image/"));

//       if (!imagePart?.inlineData?.data) {
//         throw new Error("Gemini returned no image bytes");
//       }

//       const buffer = Buffer.from(imagePart.inlineData.data, "base64");
//       await fsp.writeFile(outputPath, buffer);
//       return;
//     } catch (err) {
//       lastError = new Error(`Gemini attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
//       if (attempt < maxAttempts) {
//         await wait(1200 * attempt);
//       }
//     }
//   }

//   throw lastError;
// }

// async function downloadImageWithRetry(url, outputPath, maxAttempts = 4, waitMs = 1200) {
//   let lastError;

//   for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
//     try {
//       const response = await fetchWithTimeout(url, 15000);
//       if (!response.ok) {
//         const status = response.status;
//         throw new Error(`Image download failed with status ${status}`);
//       }

//       const buffer = Buffer.from(await response.arrayBuffer());
//       await fsp.writeFile(outputPath, buffer);
//       return;
//     } catch (err) {
//       lastError = new Error(`Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
//       if (attempt < maxAttempts) {
//         await wait(waitMs * attempt);
//       }
//     }
//   }

//   throw lastError;
// }

// // FIX 2: Replaced slow zoompan with a fast scale+fps filter
// function renderCinematicVideoFromImage({ inputPath, outputPath, width, height, durationSeconds }) {
//   const scalePadFilter = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=30,format=yuv420p`;

//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(inputPath)
//       .loop(durationSeconds)
//       .outputOptions([
//         "-c:v libx264",
//         "-preset veryfast",
//         "-movflags +faststart",
//         "-pix_fmt yuv420p",
//         `-t ${durationSeconds}`,
//       ])
//       .videoFilter(scalePadFilter)
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Video render failed: ${err.message}`)))
//       .save(outputPath);
//   });
// }

// function renderPromptFallbackVideo({ outputPath, width, height, durationSeconds, prompt, theme, style }) {
//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(`color=c=#111827:s=${width}x${height}:d=${durationSeconds}`)
//       .inputOptions(["-f lavfi"])
//       .outputOptions([
//         "-c:v libx264",
//         "-preset veryfast",
//         "-movflags +faststart",
//         "-pix_fmt yuv420p",
//       ])
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Prompt fallback render failed: ${err.message}`)))
//       .save(outputPath);
//   });
// }

// function renderVideoFromFrames({ inputPattern, outputPath, width, height, sceneLength }) {
//   const frameRate = 1 / Math.max(1, sceneLength);
//   const scalePadFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p`;

//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(inputPattern)
//       .inputOptions([`-framerate ${frameRate}`])
//       .outputOptions([
//         "-c:v libx264",
//         "-preset veryfast",
//         "-movflags +faststart",
//         "-pix_fmt yuv420p",
//       ])
//       .videoFilter(scalePadFilter)
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Video render failed: ${err.message}`)))
//       .save(outputPath);
//   });
// }

// async function renderConcatVideo({ clipPaths, outputPath }) {
//   const listPath = `${outputPath}.txt`;
//   const listContent = clipPaths.map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`).join("\n");
//   await fsp.writeFile(listPath, listContent);

//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(listPath)
//       .inputOptions(["-f concat", "-safe 0"])
//       .outputOptions([
//         "-c copy",
//         "-movflags +faststart",
//       ])
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Video concat failed: ${err.message}`)))
//       .save(outputPath);
//   }).finally(async () => {
//     try {
//       await fsp.unlink(listPath);
//     } catch (err) {
//       console.warn("Failed to remove concat list:", err.message);
//     }
//   });
// }

// // FIX 1 (drawtext): Use .videoFilter() instead of outputOptions for -vf
// async function applyVideoEnhancements({
//   inputPath,
//   outputPath,
//   durationSeconds,
//   prompt,
//   addCaptions,
//   addMusic,
// }) {
//   if (!addCaptions && !addMusic) {
//     await fsp.copyFile(inputPath, outputPath);
//     return;
//   }

//   const caption = escapeDrawtext(String(prompt || "").trim().slice(0, 120));
//   const captionFilter = `drawtext=text='${caption}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h-text_h-50:box=1:boxcolor=black@0.45:boxborderw=14`;

//   return new Promise((resolve, reject) => {
//     const command = ffmpeg().input(inputPath);

//     if (addMusic) {
//       command.input(`sine=frequency=220:sample_rate=44100:duration=${Math.max(1, Math.round(durationSeconds))}`);
//       command.inputOptions(["-f lavfi"]);
//     }

//     const outputOptions = [
//       "-c:v libx264",
//       "-preset veryfast",
//       "-movflags +faststart",
//       "-pix_fmt yuv420p",
//     ];

//     if (addCaptions && caption) {
//       command.videoFilter(captionFilter);
//     }

//     if (addMusic) {
//       outputOptions.push("-map 0:v:0");
//       outputOptions.push("-map 1:a:0");
//       outputOptions.push("-shortest");
//       outputOptions.push("-c:a aac");
//       outputOptions.push("-b:a 128k");
//       outputOptions.push("-af volume=0.08");
//     } else {
//       outputOptions.push("-an");
//     }

//     command
//       .outputOptions(outputOptions)
//       .on("end", resolve)
//       .on("error", (err) => reject(new Error(`Enhancement render failed: ${err.message}`)))
//       .save(outputPath);
//   });
// }

// async function safeRemoveDir(dirPath) {
//   try {
//     await fsp.rm(dirPath, { recursive: true, force: true });
//   } catch (err) {
//     console.warn("Failed to clean temp dir:", err.message);
//   }
// }

// app.get("/api/health", (req, res) => {
//   res.json({
//     ok: true,
//     service: "reel-generator-backend",
//     ffmpeg: Boolean(ffmpegPath),
//     geminiConfigured: Boolean(GEMINI_API_KEY),
//   });
// });

// app.post("/api/reel-generator", async (req, res) => {
//   const { prompt, style, theme, aspectRatio } = req.body || {};
//   const captions = Boolean(req.body?.captions);
//   const music = Boolean(req.body?.music);
//   const hashtagsEnabled = Boolean(req.body?.hashtags);
//   const speed = clampNumber(Number(req.body?.speed) || 50, 0, 100);

//   const baseSceneLength = clampNumber(Number(req.body?.sceneLength) || 3, 2, 6);
//   const effectiveSceneLength = computeSceneLengthBySpeed(baseSceneLength, speed);

//   // FIX 3: Lowered minimum sceneCount from 7 to 3 for much faster generation
//   const sceneCount = clampNumber(Number(req.body?.sceneCount) || 4, 3, 8);
//   const requestedSeconds = clampNumber(effectiveSceneLength * sceneCount, 10, 30);

//   if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
//     return res.status(400).json({ success: false, error: "Prompt is required" });
//   }

//   const jobId = randomUUID();
//   const tempDir = path.join(GENERATED_DIR, `tmp-${jobId}`);
//   const { width, height } = getDimensions(aspectRatio);

//   try {
//     await fsp.mkdir(tempDir, { recursive: true });

//     const primaryPrompts = buildScenePrompts({
//       prompt: prompt.trim(),
//       style,
//       theme,
//       sceneCount,
//     });

//     const sceneSources = [];
//     const imageUrls = [];
//     const clipPaths = [];
//     const fallbackQuery = buildFallbackQuery({ prompt: prompt.trim(), theme, style });
//     let sharedFallbackUrls = [];

//     for (let index = 0; index < primaryPrompts.length; index += 1) {
//       const seed = Math.floor(Math.random() * 1000000);
//       const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, "0")}.jpg`);
//       const promptText = primaryPrompts[index];
//       let imageUrl = buildPollinationsImageUrl({
//         prompt: promptText,
//         width,
//         height,
//         seed,
//       });
//       let source = "pollinations";

//       try {
//         if (GEMINI_API_KEY) {
//           await generateGeminiImageToFile({
//             scenePrompt: buildGeminiImagePrompt({ scenePrompt: promptText, width, height }),
//             width,
//             height,
//             outputPath: framePath,
//             maxAttempts: 2,
//           });
//           source = "gemini";
//           imageUrl = null;
//         } else {
//           await downloadImageWithRetry(imageUrl, framePath, 4, 1000);
//         }
//       } catch (primaryErr) {
//         source = "pollinations";
//         imageUrl = buildPollinationsImageUrl({
//           prompt: promptText,
//           width,
//           height,
//           seed,
//         });

//         let fallbackImageUrl = null;
//         let fallbackSource = "none";

//         try {
//           await downloadImageWithRetry(imageUrl, framePath, 2, 600);
//           imageUrls.push(imageUrl);
//           sceneSources.push({ scene: index + 1, source, imageUrl });
//         } catch (pollinationsRetryErr) {
//           console.warn(`Scene ${index + 1} direct image retry failed: ${pollinationsRetryErr.message}`);
//         }

//         if (sceneSources.length >= index + 1) {
//           const clipPathFast = path.join(tempDir, `clip-${String(index + 1).padStart(3, "0")}.mp4`);
//           await renderCinematicVideoFromImage({
//             inputPath: framePath,
//             outputPath: clipPathFast,
//             width,
//             height,
//             durationSeconds: effectiveSceneLength,
//           });
//           clipPaths.push(clipPathFast);
//           continue;
//         }

//         try {
//           if (!sharedFallbackUrls.length) {
//             sharedFallbackUrls = await fetchWikimediaImageUrls({
//               query: fallbackQuery,
//               width,
//               height,
//               limit: Math.max(sceneCount + 2, 8),
//             });
//           }
//         } catch (wikimediaErr) {
//           console.warn(`Wikimedia fallback fetch failed: ${wikimediaErr.message}`);
//         }

//         if (sharedFallbackUrls.length) {
//           fallbackImageUrl = sharedFallbackUrls[index % sharedFallbackUrls.length];
//           fallbackSource = "wikimedia";
//         } else {
//           fallbackImageUrl = buildKeywordFallbackUrl({
//             query: fallbackQuery,
//             width,
//             height,
//             seed,
//           });
//           fallbackSource = "loremflickr";
//         }

//         try {
//           await downloadImageWithRetry(fallbackImageUrl, framePath, 2, 700);
//           console.warn(`Scene ${index + 1} switched to related-image fallback (${fallbackSource}): ${primaryErr.message}`);
//           imageUrls.push(fallbackImageUrl);
//           sceneSources.push({ scene: index + 1, source: fallbackSource, imageUrl: fallbackImageUrl });
//         } catch (fallbackErr) {
//           console.warn(`Scene ${index + 1} fallback image also failed: ${fallbackErr.message}`);
//           const outputFile = `reel-${jobId}.mp4`;
//           const outputPath = path.join(GENERATED_DIR, outputFile);
//           await renderPromptFallbackVideo({
//             outputPath,
//             width,
//             height,
//             durationSeconds: requestedSeconds,
//             prompt: prompt.trim(),
//             theme,
//             style,
//           });

//           const baseUrl = `${req.protocol}://${req.get("host")}`;
//           return res.json({
//             success: true,
//             mode: "video",
//             provider: "ffmpeg-prompt-fallback",
//             videoUrl: `${baseUrl}/generated/${outputFile}`,
//             imageUrls,
//             sceneSources,
//             note: "Generated a prompt-based cinematic fallback reel because all image sources were unavailable.",
//           });
//         }
//       }

//       if (sceneSources.length < index + 1) {
//         imageUrls.push(imageUrl);
//         sceneSources.push({ scene: index + 1, source, imageUrl });
//       }

//       const clipPath = path.join(tempDir, `clip-${String(index + 1).padStart(3, "0")}.mp4`);
//       await renderCinematicVideoFromImage({
//         inputPath: framePath,
//         outputPath: clipPath,
//         width,
//         height,
//         durationSeconds: effectiveSceneLength,
//       });
//       clipPaths.push(clipPath);
//     }

//     const baseOutputPath = path.join(tempDir, `reel-base-${jobId}.mp4`);
//     await renderConcatVideo({ clipPaths, outputPath: baseOutputPath });

//     const outputFile = `reel-${jobId}.mp4`;
//     const outputPath = path.join(GENERATED_DIR, outputFile);
//     await applyVideoEnhancements({
//       inputPath: baseOutputPath,
//       outputPath,
//       durationSeconds: requestedSeconds,
//       prompt: prompt.trim(),
//       addCaptions: captions,
//       addMusic: music,
//     });

//     const baseUrl = `${req.protocol}://${req.get("host")}`;
//     const generatedHashtags = hashtagsEnabled ? generateHashtags({ prompt: prompt.trim(), theme, style, maxCount: 8 }) : [];

//     return res.json({
//       success: true,
//       mode: "video",
//       provider: GEMINI_API_KEY ? "gemini+ffmpeg-cinematic-motion" : "pollinations+ffmpeg-cinematic-motion",
//       videoUrl: `${baseUrl}/generated/${outputFile}`,
//       imageUrls,
//       sceneSources,
//       hashtags: generatedHashtags,
//       settingsApplied: {
//         style,
//         theme,
//         aspectRatio,
//         sceneCount,
//         sceneLength: effectiveSceneLength,
//         speed,
//         captions,
//         music,
//       },
//       note: "Generated a cinematic camera-motion reel from an AI scene image.",
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       error: `Video render failed: ${err.message}`,
//     });
//   } finally {
//     await safeRemoveDir(tempDir);
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });


////////////////////////////////////////////////////
```js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const { randomUUID } = require("crypto");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GENERATED_DIR = path.join(__dirname, "generated");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";

app.use(cors());
app.use(express.json());
fs.mkdirSync(GENERATED_DIR, { recursive: true });
app.use("/generated", express.static(GENERATED_DIR));

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

function getDimensions(aspectRatio) {
  if (aspectRatio === "landscape") {
    return { width: 1280, height: 720 };
  }

  if (aspectRatio === "square") {
    return { width: 1024, height: 1024 };
  }

  return { width: 720, height: 1280 };
}

function buildScenePrompts({ prompt, style, theme, sceneCount }) {
  const cameraDirections = [
    "wide establishing shot from a camera tripod",
    "slow cinematic push-in toward the main subject",
    "medium documentary-style shot with natural movement",
    "gentle side-tracking camera movement",
    "low-angle cinematic shot with depth and atmosphere",
    "over-the-shoulder composition with environmental depth",
    "long lens cinematic shot with shallow depth of field",
    "final reveal shot with a realistic handheld camera feel",
  ];

  return Array.from({ length: sceneCount }, (_, i) => {
    return [
      `photorealistic scene based on: ${prompt}`,
      style ? `${style} style` : null,
      theme || null,
      cameraDirections[i % cameraDirections.length],
      `scene ${i + 1} of ${sceneCount}`,
      "same location, same subject, same environment",
      "cinematic lighting",
      "high detail",
      "realistic motion blur",
      "no text, no watermark",
    ]
      .filter(Boolean)
      .join(", ");
  });
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function computeSceneLengthBySpeed(sceneLength, speed) {
  const normalized = clampNumber((Number(speed) - 50) / 50, -1, 1);
  const adjusted = sceneLength * (1 - normalized * 0.35);
  return clampNumber(Number(adjusted.toFixed(2)), 1.8, 6);
}

/**
 * Escape text for ffmpeg drawtext.
 * Important: escape characters that break the filter or quoting.
 */
function escapeDrawtext(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\") // backslash
    .replace(/:/g, "\\:") // option separator in drawtext
    .replace(/'/g, "\\'") // single quote inside quoted string
    .replace(/%/g, "\\%"); // percent
}

/**
 * Escape drawtext filter string for use in a JS string.
 * We keep it simple and rely on escapeDrawtext() for the text itself.
 */
function buildCaptionFilter({ caption }) {
  const safeCaption = escapeDrawtext(caption);

  // Using a filter chain with drawtext only.
  // Using double quotes for text option value to avoid many single-quote issues.
  // NOTE: In ffmpeg filter syntax, we set text="...".
  return `drawtext=text="${safeCaption}":fontcolor=white:fontsize=34:x=(w-text_w)/2:y=h-text_h-50:box=1:boxcolor=black@0.45:boxborderw=14`;
}

function generateHashtags({ prompt, theme, style, maxCount = 8 }) {
  const words = [prompt, theme, style]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const common = new Set([
    "with",
    "from",
    "into",
    "your",
    "this",
    "that",
    "style",
    "scene",
    "camera",
    "video",
    "reel",
  ]);
  const unique = [...new Set(words.filter((w) => !common.has(w)))].slice(0, maxCount);
  return unique.map((word) => `#${word}`);
}

async function fetchWikimediaImageUrls({ query, width, height, limit = 10 }) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: String(limit),
    gsrsearch: query,
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: String(width),
    iiurlheight: String(height),
    format: "json",
    origin: "*",
  });

  const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
  const response = await fetchWithTimeout(url, 15000);
  if (!response.ok) {
    throw new Error(`Wikimedia query failed with status ${response.status}`);
  }

  const data = await response.json();
  const pages = Object.values(data?.query?.pages || {});
  const urls = pages
    .map((page) => page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url)
    .filter(Boolean)
    .filter((imgUrl) => !/\.svg($|\?)/i.test(imgUrl));

  return urls;
}

function buildPrimaryPrompt({ prompt, style, theme }) {
  return [
    prompt,
    style ? `${style} style` : null,
    theme || null,
    "ultra realistic",
    "cinematic",
    "natural lighting",
    "high detail",
  ]
    .filter(Boolean)
    .join(", ");
}

function buildPollinationsImageUrl({ prompt, width, height, seed }) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
}

function buildGeminiImagePrompt({ scenePrompt, width, height }) {
  return [
    "Generate one photorealistic image frame for a vertical short-form reel.",
    `Scene prompt: ${scenePrompt}`,
    `Target resolution: ${width}x${height}`,
    "No text, no watermark, cinematic realism, natural lighting.",
  ].join("\n");
}

function buildFallbackQuery({ prompt, theme, style }) {
  const raw = [prompt, theme, style].filter(Boolean).join(" ").toLowerCase();
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "with",
    "and",
    "for",
    "from",
    "into",
    "over",
    "under",
    "between",
    "realistic",
    "style",
    "scene",
    "shot",
    "camera",
    "video",
    "reel",
  ]);

  const keywords = raw
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const unique = [...new Set(keywords)].slice(0, 8);
  return unique.length ? unique.join(" ") : "nature landscape";
}

function buildKeywordFallbackUrl({ query, width, height, seed }) {
  const tags = query
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(",");

  return `https://loremflickr.com/${width}/${height}/${encodeURIComponent(tags || "landscape")}?lock=${seed}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeoutMs = 15000, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateGeminiImageToFile({ scenePrompt, width, height, outputPath, maxAttempts = 2 }) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_IMAGE_MODEL
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(endpoint, 45000, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: scenePrompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gemini API status ${response.status}: ${text.slice(0, 280)}`);
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(
        (part) =>
          part?.inlineData?.data && String(part?.inlineData?.mimeType || "").startsWith("image/")
      );

      if (!imagePart?.inlineData?.data) {
        throw new Error("Gemini returned no image bytes");
      }

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      await fsp.writeFile(outputPath, buffer);
      return;
    } catch (err) {
      lastError = new Error(`Gemini attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt < maxAttempts) {
        await wait(1200 * attempt);
      }
    }
  }

  throw lastError;
}

async function downloadImageWithRetry(url, outputPath, maxAttempts = 4, waitMs = 1200) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, 15000);
      if (!response.ok) {
        const status = response.status;
        throw new Error(`Image download failed with status ${status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await fsp.writeFile(outputPath, buffer);
      return;
    } catch (err) {
      lastError = new Error(`Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt < maxAttempts) {
        await wait(waitMs * attempt);
      }
    }
  }

  throw lastError;
}

// FIX 2: Replaced slow zoompan with a fast scale+fps filter
function renderCinematicVideoFromImage({ inputPath, outputPath, width, height, durationSeconds }) {
  const scalePadFilter = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=30,format=yuv420p`;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .loop(durationSeconds)
      .outputOptions([
        "-c:v libx264",
        "-preset veryfast",
        "-movflags +faststart",
        "-pix_fmt yuv420p",
        `-t ${durationSeconds}`,
      ])
      .videoFilter(scalePadFilter)
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`Video render failed: ${err.message}`)))
      .save(outputPath);
  });
}

function renderPromptFallbackVideo({ outputPath, width, height, durationSeconds, prompt, theme, style }) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`color=c=#111827:s=${width}x${height}:d=${durationSeconds}`)
      .inputOptions(["-f lavfi"])
      .outputOptions([
        "-c:v libx264",
        "-preset veryfast",
        "-movflags +faststart",
        "-pix_fmt yuv420p",
      ])
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`Prompt fallback render failed: ${err.message}`)))
      .save(outputPath);
  });
}

function renderVideoFromFrames({ inputPattern, outputPath, width, height, sceneLength }) {
  const frameRate = 1 / Math.max(1, sceneLength);
  const scalePadFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p`;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPattern)
      .inputOptions([`-framerate ${frameRate}`])
      .outputOptions([
        "-c:v libx264",
        "-preset veryfast",
        "-movflags +faststart",
        "-pix_fmt yuv420p",
      ])
      .videoFilter(scalePadFilter)
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`Video render failed: ${err.message}`)))
      .save(outputPath);
  });
}

async function renderConcatVideo({ clipPaths, outputPath }) {
  const listPath = `${outputPath}.txt`;
  const listContent = clipPaths.map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`).join("\n");
  await fsp.writeFile(listPath, listContent);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy", "-movflags +faststart"])
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`Video concat failed: ${err.message}`)))
      .save(outputPath);
  }).finally(async () => {
    try {
      await fsp.unlink(listPath);
    } catch (err) {
      console.warn("Failed to remove concat list:", err.message);
    }
  });
}

/**
 * FIX: Enhancement render fails with:
 * Unrecognized option 'vf drawtext=...'
 * Cause: drawtext filter is being passed incorrectly as an output option / 'vf' parsing.
 *
 * We ensure we call `.videoFilter(...)` with only the filter expression (no '-vf' prefix),
 * and we build a safe drawtext filter string.
 */
async function applyVideoEnhancements({
  inputPath,
  outputPath,
  durationSeconds,
  prompt,
  addCaptions,
  addMusic,
}) {
  if (!addCaptions && !addMusic) {
    await fsp.copyFile(inputPath, outputPath);
    return;
  }

  const caption = escapeDrawtext(String(prompt || "").trim().slice(0, 120));

  // If captions disabled or empty caption, just do music (if any)
  const hasCaption = Boolean(addCaptions && caption);

  // Build caption filter only if caption exists
  const captionFilter = hasCaption ? buildCaptionFilter({ caption }) : null;

  return new Promise((resolve, reject) => {
    const command = ffmpeg().input(inputPath);

    if (addMusic) {
      // Generate a sine wave as background music
      command.input(`sine=frequency=220:sample_rate=44100:duration=${Math.max(1, Math.round(durationSeconds))}`);
      command.inputOptions(["-f lavfi"]);
    }

    const outputOptions = [
      "-c:v libx264",
      "-preset veryfast",
      "-movflags +faststart",
      "-pix_fmt yuv420p",
    ];

    // Apply captions using videoFilter (NOT via outputOptions -vf)
    if (captionFilter) {
      command.videoFilter(captionFilter);
    }

    if (addMusic) {
      outputOptions.push("-map 0:v:0");
      outputOptions.push("-map 1:a:0");
      outputOptions.push("-shortest");
      outputOptions.push("-c:a aac");
      outputOptions.push("-b:a 128k");
      outputOptions.push("-af volume=0.08");
    } else {
      outputOptions.push("-an");
    }

    command
      .outputOptions(outputOptions)
      .on("end", resolve)
      .on("error", (err) => reject(new Error(`Enhancement render failed: ${err.message}`)))
      .save(outputPath);
  });
}

async function safeRemoveDir(dirPath) {
  try {
    await fsp.rm(dirPath, { recursive: true, force: true });
  } catch (err) {
    console.warn("Failed to clean temp dir:", err.message);
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "reel-generator-backend",
    ffmpeg: Boolean(ffmpegPath),
    geminiConfigured: Boolean(GEMINI_API_KEY),
  });
});

app.post("/api/reel-generator", async (req, res) => {
  const { prompt, style, theme, aspectRatio } = req.body || {};
  const captions = Boolean(req.body?.captions);
  const music = Boolean(req.body?.music);
  const hashtagsEnabled = Boolean(req.body?.hashtags);
  const speed = clampNumber(Number(req.body?.speed) || 50, 0, 100);

  const baseSceneLength = clampNumber(Number(req.body?.sceneLength) || 3, 2, 6);
  const effectiveSceneLength = computeSceneLengthBySpeed(baseSceneLength, speed);

  const sceneCount = clampNumber(Number(req.body?.sceneCount) || 4, 3, 8);
  const requestedSeconds = clampNumber(effectiveSceneLength * sceneCount, 10, 30);

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ success: false, error: "Prompt is required" });
  }

  const jobId = randomUUID();
  const tempDir = path.join(GENERATED_DIR, `tmp-${jobId}`);
  const { width, height } = getDimensions(aspectRatio);

  try {
    await fsp.mkdir(tempDir, { recursive: true });

    const primaryPrompts = buildScenePrompts({
      prompt: prompt.trim(),
      style,
      theme,
      sceneCount,
    });

    const sceneSources = [];
    const imageUrls = [];
    const clipPaths = [];
    const fallbackQuery = buildFallbackQuery({ prompt: prompt.trim(), theme, style });
    let sharedFallbackUrls = [];

    for (let index = 0; index < primaryPrompts.length; index += 1) {
      const seed = Math.floor(Math.random() * 1000000);
      const framePath = path.join(tempDir, `frame-${String(index + 1).padStart(3, "0")}.jpg`);
      const promptText = primaryPrompts[index];

      let imageUrl = buildPollinationsImageUrl({
        prompt: promptText,
        width,
        height,
        seed,
      });

      let source = "pollinations";

      try {
        if (GEMINI_API_KEY) {
          await generateGeminiImageToFile({
            scenePrompt: buildGeminiImagePrompt({ scenePrompt: promptText, width, height }),
            width,
            height,
            outputPath: framePath,
            maxAttempts: 2,
          });
          source = "gemini";
          imageUrl = null;
        } else {
          await downloadImageWithRetry(imageUrl, framePath, 4, 1000);
        }
      } catch (primaryErr) {
        source = "pollinations";
        imageUrl = buildPollinationsImageUrl({
          prompt: promptText,
          width,
          height,
          seed,
        });

        let fallbackImageUrl = null;
        let fallbackSource = "none";

        try {
          await downloadImageWithRetry(imageUrl, framePath, 2, 600);
          imageUrls.push(imageUrl);
          sceneSources.push({ scene: index + 1, source, imageUrl });
        } catch (pollinationsRetryErr) {
          console.warn(`Scene ${index + 1} direct image retry failed: ${pollinationsRetryErr.message}`);
        }

        if (sceneSources.length >= index + 1) {
          const clipPathFast = path.join(tempDir, `clip-${String(index + 1).padStart(3, "0")}.mp4`);
          await renderCinematicVideoFromImage({
            inputPath: framePath,
            outputPath: clipPathFast,
            width,
            height,
            durationSeconds: effectiveSceneLength,
          });
          clipPaths.push(clipPathFast);
          continue;
        }

        try {
          if (!sharedFallbackUrls.length) {
            sharedFallbackUrls = await fetchWikimediaImageUrls({
              query: fallbackQuery,
              width,
              height,
              limit: Math.max(sceneCount + 2, 8),
            });
          }
        } catch (wikimediaErr) {
          console.warn(`Wikimedia fallback fetch failed: ${wikimediaErr.message}`);
        }

        if (sharedFallbackUrls.length) {
          fallbackImageUrl = sharedFallbackUrls[index % sharedFallbackUrls.length];
          fallbackSource = "wikimedia";
        } else {
          fallbackImageUrl = buildKeywordFallbackUrl({
            query: fallbackQuery,
            width,
            height,
            seed,
          });
          fallbackSource = "loremflickr";
        }

        try {
          await downloadImageWithRetry(fallbackImageUrl, framePath, 2, 700);
          console.warn(
            `Scene ${index + 1} switched to related-image fallback (${fallbackSource}): ${primaryErr.message}`
          );
          imageUrls.push(fallbackImageUrl);
          sceneSources.push({ scene: index + 1, source: fallbackSource, imageUrl: fallbackImageUrl });
        } catch (fallbackErr) {
          console.warn(`Scene ${index + 1} fallback image also failed: ${fallbackErr.message}`);

          const outputFile = `reel-${jobId}.mp4`;
          const outputPath = path.join(GENERATED_DIR, outputFile);

          await renderPromptFallbackVideo({
            outputPath,
            width,
            height,
            durationSeconds: requestedSeconds,
            prompt: prompt.trim(),
            theme,
            style,
          });

          const baseUrl = `${req.protocol}://${req.get("host")}`;

          return res.json({
            success: true,
            mode: "video",
            provider: "ffmpeg-prompt-fallback",
            videoUrl: `${baseUrl}/generated/${outputFile}`,
            imageUrls,
            sceneSources,
            note: "Generated a prompt-based cinematic fallback reel because all image sources were unavailable.",
          });
        }
      }

      if (sceneSources.length < index + 1) {
        imageUrls.push(imageUrl);
        sceneSources.push({ scene: index + 1, source, imageUrl });
      }

      const clipPath = path.join(tempDir, `clip-${String(index + 1).padStart(3, "0")}.mp4`);
      await renderCinematicVideoFromImage({
        inputPath: framePath,
        outputPath: clipPath,
        width,
        height,
        durationSeconds: effectiveSceneLength,
      });
      clipPaths.push(clipPath);
    }

    const baseOutputPath = path.join(tempDir, `reel-base-${jobId}.mp4`);
    await renderConcatVideo({ clipPaths, outputPath: baseOutputPath });

    const outputFile = `reel-${jobId}.mp4`;
    const outputPath = path.join(GENERATED_DIR, outputFile);

    await applyVideoEnhancements({
      inputPath: baseOutputPath,
      outputPath,
      durationSeconds: requestedSeconds,
      prompt: prompt.trim(),
      addCaptions: captions,
      addMusic: music,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const generatedHashtags = hashtagsEnabled
      ? generateHashtags({ prompt: prompt.trim(), theme, style, maxCount: 8 })
      : [];

    return res.json({
      success: true,
      mode: "video",
      provider: GEMINI_API_KEY ? "gemini+ffmpeg-cinematic-motion" : "pollinations+ffmpeg-cinematic-motion",
      videoUrl: `${baseUrl}/generated/${outputFile}`,
      imageUrls,
      sceneSources,
      hashtags: generatedHashtags,
      settingsApplied: {
        style,
        theme,
        aspectRatio,
        sceneCount,
        sceneLength: effectiveSceneLength,
        speed,
        captions,
        music,
      },
      note: "Generated a cinematic camera-motion reel from an AI scene image.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Video render failed: ${err.message}`,
    });
  } finally {
    await safeRemoveDir(tempDir);
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});


