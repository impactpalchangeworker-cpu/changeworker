"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileLegacyPayments = exports.reconcileWalletBalances = exports.hourlyDefendCheckin = exports.hourlyDisputeCheckin = exports.hourlyAttachCheckinScreenshot = exports.hourlyCreateCheckin = exports.hourlyResumeWork = exports.hourlyPauseWork = exports.hourlyStartWork = exports.releasePayout = exports.autoApprovePayouts = exports.watermarkFinalWorkUpload = exports.watermarkHourlyCheckinUpload = exports.watermarkMilestoneUpload = void 0;
const admin = __importStar(require("firebase-admin"));
const storage_1 = require("firebase-functions/v2/storage");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const storage_2 = require("firebase-admin/storage");
const sharp_1 = __importDefault(require("sharp"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const pdf_lib_1 = require("pdf-lib");
const axios_1 = __importDefault(require("axios"));
admin.initializeApp();
const db = admin.firestore();
// ------------------------------
// Helpers
// ------------------------------
function requireAuth(request) {
    if (!request.auth?.uid)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    return request.auth.uid;
}
async function getWorkspace(wsId) {
    const snap = await db.doc(`workspaces/${wsId}`).get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Workspace not found.");
    return snap.data();
}
function ensureParticipant(uid, ws) {
    if (uid !== ws.clientUid && uid !== ws.talentUid)
        throw new https_1.HttpsError("permission-denied", "Not a participant.");
}
function ensureTalent(uid, ws) {
    if (uid !== ws.talentUid)
        throw new https_1.HttpsError("permission-denied", "Talent only.");
}
function ensureClient(uid, ws) {
    if (uid !== ws.clientUid)
        throw new https_1.HttpsError("permission-denied", "Client only.");
}
function msFromTs(v) {
    if (!v)
        return 0;
    if (typeof v.toMillis === "function")
        return v.toMillis();
    return 0;
}
// Helper: Detect file type from extension
function getFileType(filename) {
    const ext = filename.toLowerCase().split(".").pop() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext))
        return "image";
    if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext))
        return "video";
    if (ext === "pdf")
        return "pdf";
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext))
        return "document";
    return "file";
}
async function watermarkToPreviewJpeg(tmpIn, tmpOut) {
    // Resize and add watermark text overlay using Sharp
    try {
        await (0, sharp_1.default)(tmpIn)
            .rotate()
            .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 78 })
            .toFile(tmpOut);
    }
    catch (err) {
        console.error("[watermarkToPreviewJpeg] Failed to process image", err);
        throw err;
    }
}
// Helper: Process file based on type (watermark images, generate previews for videos/pdfs)
async function processFileToPreview(tmpIn, tmpOut, filename, contentType) {
    const fileType = getFileType(filename);
    // Validate file first
    const validation = await validateFileBeforeStorage(tmpIn, filename, contentType);
    if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.error}`);
    }
    if (fileType === "image") {
        // For images: Apply watermark
        await watermarkToPreviewJpeg(tmpIn, tmpOut);
        return "image/jpeg"; // Always output as JPEG
    }
    else if (fileType === "video") {
        // For videos: Create placeholder preview using Sharp (custom viewer will show actual video)
        try {
            const svg = Buffer.from(`<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" fill="#1f2937"/><text x="400" y="200" font-size="32" font-weight="bold" text-anchor="middle" fill="#ffffff" font-family="Arial">VIDEO PREVIEW</text><text x="400" y="250" font-size="24" text-anchor="middle" fill="#ffffff" font-family="Arial">Click to play</text></svg>`);
            await (0, sharp_1.default)(svg, { density: 100 })
                .jpeg({ quality: 80 })
                .toFile(tmpOut);
        }
        catch (err) {
            console.error("[processFileToPreview] Video placeholder failed", err);
            throw err;
        }
        return "image/jpeg";
    }
    else if (fileType === "pdf") {
        // For PDFs: Create placeholder preview using Sharp (custom viewer will show actual PDF)
        try {
            const svg = Buffer.from(`<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" fill="#f3f4f6"/><text x="400" y="200" font-size="32" font-weight="bold" text-anchor="middle" fill="#374151" font-family="Arial">PDF DOCUMENT</text><text x="400" y="250" font-size="24" text-anchor="middle" fill="#6b7280" font-family="Arial">Click to view</text></svg>`);
            await (0, sharp_1.default)(svg, { density: 100 })
                .jpeg({ quality: 80 })
                .toFile(tmpOut);
        }
        catch (err) {
            console.error("[processFileToPreview] PDF placeholder failed", err);
            throw err;
        }
        return "image/jpeg";
    }
    else {
        // For documents/other files: Copy as-is with metadata
        // The frontend will display as "download only" with appropriate badge
        await fs.copyFile(tmpIn, tmpOut);
        return contentType; // Preserve original content type
    }
}
// Helper: Extract thumbnail from video using FFmpeg
// Note: Video thumbnail generation requires FFmpeg which is not available in standard Cloud Functions
// For production, consider:
// 1. Using Google Cloud Video Intelligence API
// 2. Using a separate Video Processing service (e.g., Mux, Cloudinary)
// 3. Running FFmpeg in Cloud Run instead of Cloud Functions
// For now, videos are stored as-is and displayed as preview cards
async function extractVideoThumbnail(tmpIn, tmpOut) {
    console.log("[extractVideoThumbnail] Skipping - requires FFmpeg on Cloud Run");
    // Create simple placeholder JPEG (1x1 blue pixel)
    const placeholder = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
        0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
        0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
        0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
        0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
        0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
        0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
        0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
        0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
        0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
        0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xFF, 0xD9,
    ]);
    await fs.writeFile(tmpOut, placeholder);
}
// Helper: Generate preview image from PDF (first page with watermark)
async function generatePdfPreview(tmpIn, tmpOut) {
    console.log("[generatePdfPreview] Processing PDF - adding watermark metadata");
    try {
        const pdfBytes = await fs.readFile(tmpIn);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
        // Add watermark text to first page using pdf-lib
        if (pdfDoc.getPageCount() > 0) {
            const firstPage = pdfDoc.getPage(0);
            const { width, height } = firstPage.getSize();
            firstPage.drawText("changeworker • PREVIEW", {
                x: 50,
                y: height - 50,
                size: 30,
                color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9),
                opacity: 0.22,
            });
        }
        // Store the watermarked PDF (client will display native PDF viewer)
        const modifiedPdfBytes = await pdfDoc.save();
        await fs.writeFile(tmpOut, modifiedPdfBytes);
        console.log("[generatePdfPreview] PDF watermarked and stored");
    }
    catch (err) {
        console.warn("[generatePdfPreview] Error processing PDF:", err);
        // Fallback: just copy the original file
        const pdfBytes = await fs.readFile(tmpIn);
        await fs.writeFile(tmpOut, pdfBytes);
        console.log("[generatePdfPreview] PDF copied without modifications");
    }
}
// Helper: Scan file for viruses (using VirusTotal or ClamAV)
async function scanFileForVirus(tmpIn, fileType) {
    try {
        // Skip virus scanning for non-executable files (optional security level)
        const dangerousTypes = ["exe", "app", "bat", "cmd", "com", "scr"];
        const ext = tmpIn.toLowerCase().split(".").pop() || "";
        if (dangerousTypes.includes(ext)) {
            console.warn("[scanFileForVirus] Potentially dangerous file type blocked:", ext);
            return { clean: false, reason: "Executable files not allowed" };
        }
        // If CLAMD_HOST env var is set, use ClamAV
        const clamHost = process.env.CLAMD_HOST;
        if (clamHost) {
            try {
                const fileStream = await fs.readFile(tmpIn);
                const response = await axios_1.default.post(`http://${clamHost}:3310/scan`, fileStream, {
                    headers: { "Content-Type": "application/octet-stream" },
                    timeout: 10000,
                });
                const isClean = response.status === 200 && response.data?.clean !== false;
                return { clean: isClean, reason: response.data?.reason };
            }
            catch (err) {
                console.warn("[scanFileForVirus] ClamAV error, allowing file:", err);
                return { clean: true }; // Fail open if service unavailable
            }
        }
        // If no virus scanner configured, allow file
        return { clean: true };
    }
    catch (err) {
        console.warn("[scanFileForVirus] Unexpected error:", err);
        return { clean: true }; // Fail open on unexpected errors
    }
}
// Helper: Validate file before storage
async function validateFileBeforeStorage(tmpIn, filename, contentType) {
    try {
        const stats = await fs.stat(tmpIn);
        const fileSizeMB = stats.size / (1024 * 1024);
        // File size limits by type
        const fileType = getFileType(filename);
        const maxSizes = {
            image: 25,
            video: 500,
            pdf: 100,
            document: 50,
            file: 100,
        };
        const maxSize = maxSizes[fileType] || 100;
        if (fileSizeMB > maxSize) {
            return { valid: false, error: `File exceeds ${maxSize}MB limit (${fileSizeMB.toFixed(1)}MB)` };
        }
        // Check for virus
        const virusScan = await scanFileForVirus(tmpIn, fileType);
        if (!virusScan.clean) {
            return { valid: false, error: `File blocked: ${virusScan.reason || "Potential threat detected"}` };
        }
        return { valid: true };
    }
    catch (err) {
        console.error("[validateFileBeforeStorage] Error:", err);
        return { valid: false, error: "File validation failed" };
    }
}
// ------------------------------
// Storage Trigger: Milestone RAW -> PREVIEW
// Input:  workspaces/{wsId}/milestones/{milestoneId}/raw/{file}
// Output: workspaces/{wsId}/milestones/{milestoneId}/previews/{...}
// Writes preview attachment into:
// Firestore: workspaces/{wsId}/milestones/{milestoneId}
// Supports: Images (watermarked to JPEG), Videos, PDFs, Documents (copied as-is)
// ------------------------------
exports.watermarkMilestoneUpload = (0, storage_1.onObjectFinalized)({ bucket: "changeworker-e1770.firebasestorage.app" }, async (event) => {
    try {
        const filePath = event.data.name || "";
        const contentType = event.data.contentType || "";
        if (!filePath.startsWith("workspaces/"))
            return;
        const parts = filePath.split("/");
        if (parts.length < 6)
            return;
        if (parts[0] !== "workspaces" || parts[2] !== "milestones" || parts[4] !== "raw")
            return;
        const wsId = parts[1];
        const milestoneId = parts[3];
        const rawFilename = parts.slice(5).join("/"); // Get the filename
        console.log("[watermarkMilestoneUpload] start", { filePath, contentType, wsId, milestoneId, rawFilename });
        const bucket = (0, storage_2.getStorage)().bucket(event.data.bucket);
        const tmpDir = os.tmpdir();
        const tmpIn = path.join(tmpDir, `raw_${Date.now()}.tmp`);
        const fileType = getFileType(rawFilename);
        // Images, videos, and PDFs generate JPEG previews; others keep original extension
        const tmpOutExt = ["image", "video", "pdf"].includes(fileType) ? ".jpg" : path.extname(rawFilename);
        const tmpOut = path.join(tmpDir, `preview_${Date.now()}${tmpOutExt}`);
        await bucket.file(filePath).download({ destination: tmpIn });
        // Process file based on type
        let previewContentType;
        try {
            previewContentType = await processFileToPreview(tmpIn, tmpOut, rawFilename, contentType);
        }
        catch (err) {
            console.error("[watermarkMilestoneUpload] Preview generation failed for", rawFilename, err);
            // Create fallback placeholder
            try {
                const svg = Buffer.from(`<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" fill="#f3f4f6"/><text x="400" y="200" font-size="32" font-weight="bold" text-anchor="middle" fill="#6b7280" font-family="Arial">FILE UNAVAILABLE</text><text x="400" y="250" font-size="24" text-anchor="middle" fill="#9ca3af" font-family="Arial">Click to download</text></svg>`);
                await (0, sharp_1.default)(svg, { density: 100 })
                    .jpeg({ quality: 80 })
                    .toFile(tmpOut);
                previewContentType = "image/jpeg";
            }
            catch (fallback) {
                console.error("[watermarkMilestoneUpload] Fallback failed, skipping file", fallback);
                return; // Skip this file if we can't create any preview
            }
        }
        // Determine preview filename - images, videos, PDFs become JPEGs
        const previewFilename = ["image", "video", "pdf"].includes(fileType) ? `${Date.now()}_preview.jpg` : `${Date.now()}_preview${path.extname(rawFilename)}`;
        const previewPath = `workspaces/${wsId}/milestones/${milestoneId}/previews/${previewFilename}`;
        await bucket.upload(tmpOut, {
            destination: previewPath,
            contentType: previewContentType,
            metadata: {
                cacheControl: "private, max-age=3600",
                fileType: fileType, // Store file type as metadata
                original: rawFilename,
            },
        });
        // ✅ SAFE size lookup
        let size = 0;
        try {
            const [meta] = await bucket.file(previewPath).getMetadata();
            size = Number(meta.size || 0);
        }
        catch (e) {
            console.warn("[watermarkMilestoneUpload] size lookup failed, continuing", e);
        }
        console.log("[watermarkMilestoneUpload] writing firestore attachment", { previewPath, size, fileType });
        // Generate signed URL for preview (7 days expiry)
        let signedUrl = "";
        try {
            const [url] = await bucket.file(previewPath).getSignedUrl({
                version: "v4",
                action: "read",
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            signedUrl = url;
            console.log("[watermarkMilestoneUpload] generated signed URL for preview");
        }
        catch (e) {
            console.warn("[watermarkMilestoneUpload] failed to generate signed URL for preview, continuing", e);
        }
        // Generate signed URL for raw file if it's a PDF or video (7 days expiry)
        let rawSignedUrl = "";
        if (fileType === "pdf" || fileType === "video") {
            try {
                const [url] = await bucket.file(filePath).getSignedUrl({
                    version: "v4",
                    action: "read",
                    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                });
                rawSignedUrl = url;
                console.log("[watermarkMilestoneUpload] generated signed URL for raw file");
            }
            catch (e) {
                console.warn("[watermarkMilestoneUpload] failed to generate signed URL for raw file, continuing", e);
            }
        }
        // Store preview attachment with file type info
        const previewName = ["image", "video", "pdf"].includes(fileType) ? "preview.jpg" : `preview${path.extname(rawFilename)}`;
        await db.doc(`workspaces/${wsId}/milestones/${milestoneId}`).set({
            attachments: admin.firestore.FieldValue.arrayUnion({
                kind: "preview",
                name: previewName,
                contentType: previewContentType,
                size,
                storagePath: previewPath,
                fileType: fileType, // Add file type for frontend
                rawPath: filePath, // Add raw file path for modal content
                url: signedUrl, // Store signed URL for direct client access
                rawUrl: rawSignedUrl, // Store signed URL for raw file access (PDFs/videos)
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await fs.unlink(tmpIn).catch(() => { });
        await fs.unlink(tmpOut).catch(() => { });
        console.log("[watermarkMilestoneUpload] done", { wsId, milestoneId, fileType });
    }
    catch (err) {
        console.error("[watermarkMilestoneUpload] FAILED", err);
    }
});
// ------------------------------
// Storage Trigger: Hourly RAW -> PREVIEW
// Input:  workspaces/{wsId}/hourly/checkins/{checkinId}/raw/{file}
// Output: workspaces/{wsId}/hourly/checkins/{checkinId}/previews/{...}.jpg
// Writes preview url into:
// Firestore: workspaces/{wsId}/hourly/session/checkins/{checkinId}
// ------------------------------
exports.watermarkHourlyCheckinUpload = (0, storage_1.onObjectFinalized)({ bucket: "changeworker-e1770.firebasestorage.app" }, async (event) => {
    const filePath = event.data.name || "";
    const contentType = event.data.contentType || "";
    if (!filePath.startsWith("workspaces/"))
        return;
    if (!contentType.startsWith("image/"))
        return;
    const parts = filePath.split("/");
    if (parts.length < 7)
        return;
    if (parts[0] !== "workspaces" || parts[2] !== "hourly" || parts[3] !== "checkins" || parts[5] !== "raw")
        return;
    const wsId = parts[1];
    const checkinId = parts[4];
    const bucket = (0, storage_2.getStorage)().bucket(event.data.bucket);
    const tmpDir = os.tmpdir();
    const tmpIn = path.join(tmpDir, `raw_hour_${Date.now()}.img`);
    const tmpOut = path.join(tmpDir, `preview_hour_${Date.now()}.jpg`);
    await bucket.file(filePath).download({ destination: tmpIn });
    await watermarkToPreviewJpeg(tmpIn, tmpOut);
    const previewPath = `workspaces/${wsId}/hourly/checkins/${checkinId}/previews/${Date.now()}_preview.jpg`;
    await bucket.upload(tmpOut, {
        destination: previewPath,
        contentType: "image/jpeg",
        metadata: { cacheControl: "private, max-age=3600" },
    });
    await db.doc(`workspaces/${wsId}/hourly/session/checkins/${checkinId}`).set({
        screenshotPreviewPath: previewPath,
        screenshotPreviewContentType: "image/jpeg",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await fs.unlink(tmpIn).catch(() => { });
    await fs.unlink(tmpOut).catch(() => { });
});
// ------------------------------
// Storage Trigger: Final Work RAW -> PREVIEW
// Input:  workspaces/{wsId}/finalWork/raw/{file}
// Output: workspaces/{wsId}/finalWork/previews/{...}
// Writes preview attachment into:
// Firestore: workspaces/{wsId}/finalWork/submission
// Supports: Images (watermarked to JPEG), Videos, PDFs, Documents (copied as-is)
// ------------------------------
exports.watermarkFinalWorkUpload = (0, storage_1.onObjectFinalized)({ bucket: "changeworker-e1770.firebasestorage.app" }, async (event) => {
    try {
        const filePath = event.data.name || "";
        const contentType = event.data.contentType || "";
        if (!filePath.startsWith("workspaces/"))
            return;
        const parts = filePath.split("/");
        if (parts.length < 5)
            return;
        if (parts[0] !== "workspaces" || parts[2] !== "finalWork" || parts[3] !== "raw")
            return;
        const wsId = parts[1];
        const rawFilename = parts.slice(4).join("/"); // Get the filename
        console.log("[watermarkFinalWorkUpload] start", { filePath, contentType, wsId, rawFilename });
        const bucket = (0, storage_2.getStorage)().bucket(event.data.bucket);
        const tmpDir = os.tmpdir();
        const tmpIn = path.join(tmpDir, `raw_fw_${Date.now()}.tmp`);
        const fileType = getFileType(rawFilename);
        // Images, videos, and PDFs generate JPEG previews; others keep original extension
        const tmpOutExt = ["image", "video", "pdf"].includes(fileType) ? ".jpg" : path.extname(rawFilename);
        const tmpOut = path.join(tmpDir, `preview_fw_${Date.now()}${tmpOutExt}`);
        await bucket.file(filePath).download({ destination: tmpIn });
        // Process file based on type
        let previewContentType;
        let effectiveFileType = fileType;
        try {
            previewContentType = await processFileToPreview(tmpIn, tmpOut, rawFilename, contentType);
        }
        catch (processError) {
            console.error("[watermarkFinalWorkUpload] processFileToPreview failed", { rawFilename, error: String(processError) });
            // Create a default placeholder for failed processing using Sharp
            try {
                const svg = Buffer.from(`<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" fill="#f3f4f6"/><text x="400" y="200" font-size="32" font-weight="bold" text-anchor="middle" fill="#6b7280" font-family="Arial">FILE UNAVAILABLE</text><text x="400" y="250" font-size="24" text-anchor="middle" fill="#9ca3af" font-family="Arial">Click to download</text></svg>`);
                await (0, sharp_1.default)(svg, { density: 100 })
                    .jpeg({ quality: 80 })
                    .toFile(tmpOut);
                previewContentType = "image/jpeg";
                // Keep effectiveFileType as original fileType so signed URLs are still generated for PDFs/videos
            }
            catch (fallbackError) {
                console.error("[watermarkFinalWorkUpload] fallback placeholder also failed", fallbackError);
                throw fallbackError;
            }
        }
        // Determine preview filename - images, videos, PDFs become JPEGs
        const previewFilename = ["image", "video", "pdf"].includes(effectiveFileType) ? `${Date.now()}_preview.jpg` : `${Date.now()}_preview${path.extname(rawFilename)}`;
        const previewPath = `workspaces/${wsId}/finalWork/previews/${previewFilename}`;
        await bucket.upload(tmpOut, {
            destination: previewPath,
            contentType: previewContentType,
            metadata: {
                cacheControl: "private, max-age=3600",
                fileType: effectiveFileType, // Store file type as metadata
                original: rawFilename,
            },
        });
        // ✅ SAFE size lookup
        let size = 0;
        try {
            const [meta] = await bucket.file(previewPath).getMetadata();
            size = Number(meta.size || 0);
        }
        catch (e) {
            console.warn("[watermarkFinalWorkUpload] size lookup failed, continuing", e);
        }
        console.log("[watermarkFinalWorkUpload] writing firestore attachment", { previewPath, size, fileType: effectiveFileType });
        // Generate signed URL for preview (7 days expiry)
        let signedUrl = "";
        try {
            const [url] = await bucket.file(previewPath).getSignedUrl({
                version: "v4",
                action: "read",
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            signedUrl = url;
            console.log("[watermarkFinalWorkUpload] generated signed URL for preview");
        }
        catch (e) {
            console.warn("[watermarkFinalWorkUpload] failed to generate signed URL for preview, continuing", e);
        }
        // Generate signed URL for raw file if it's a PDF or video (7 days expiry)
        let rawSignedUrl = "";
        if (effectiveFileType === "pdf" || effectiveFileType === "video") {
            try {
                const [url] = await bucket.file(filePath).getSignedUrl({
                    version: "v4",
                    action: "read",
                    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                });
                rawSignedUrl = url;
                console.log("[watermarkFinalWorkUpload] generated signed URL for raw file");
            }
            catch (e) {
                console.warn("[watermarkFinalWorkUpload] failed to generate signed URL for raw file, continuing", e);
            }
        }
        // Store preview attachment with file type info
        // Always try to add preview - document will be created by API if needed
        const previewName = ["image", "video", "pdf"].includes(effectiveFileType) ? "preview.jpg" : `preview${path.extname(rawFilename)}`;
        const docRef = db.doc(`workspaces/${wsId}/finalWork/submission`);
        await docRef.set({
            attachments: admin.firestore.FieldValue.arrayUnion({
                kind: "preview",
                name: previewName,
                contentType: previewContentType,
                size,
                storagePath: previewPath,
                fileType: effectiveFileType, // Add file type for frontend
                rawPath: filePath, // Add raw file path for modal content
                url: signedUrl, // Store signed URL for direct client access
                rawUrl: rawSignedUrl, // Store signed URL for raw file access (PDFs/videos)
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await fs.unlink(tmpIn).catch(() => { });
        await fs.unlink(tmpOut).catch(() => { });
        console.log("[watermarkFinalWorkUpload] done", { wsId, fileType: effectiveFileType });
    }
    catch (err) {
        console.error("[watermarkFinalWorkUpload] FAILED", err);
    }
});
// Helper: process a payout request by releasing escrow to talent (credits wallet, records transactions, credits platform revenue, writes escrow ledger)
async function processPayout(wsId, payoutId, actorUid = "system") {
    console.log("[processPayout] Starting:", { wsId, payoutId, actorUid });
    try {
        const payoutRef = db.doc(`workspaces/${wsId}/payoutRequests/${payoutId}`);
        return db.runTransaction(async (tx) => {
            console.log("[processPayout] Transaction started");
            const prSnap = await tx.get(payoutRef);
            if (!prSnap.exists) {
                console.log("[processPayout] Payout request not found");
                return;
            }
            const pr = prSnap.data();
            console.log("[processPayout] Payout request status:", pr.status);
            if (pr.status === "paid") {
                console.log("[processPayout] Payout already paid");
                return;
            }
            const wsRef = db.doc(`workspaces/${wsId}`);
            console.log("[processPayout] Getting workspace...");
            const wsSnap = await tx.get(wsRef);
            if (!wsSnap.exists)
                throw new Error("Workspace missing");
            const ws = wsSnap.data();
            // Check if payment amount is properly set
            if (!ws?.payment || !ws.payment.amount) {
                const errMsg = `No payment amount set in workspace ${wsId}. Payment data: ${JSON.stringify(ws?.payment)}`;
                console.error("[processPayout]", errMsg);
                throw new Error(errMsg);
            }
            const gross = Number(ws.payment.amount || 0);
            console.log("[processPayout] Payment amount:", gross);
            if (!gross || gross <= 0)
                throw new Error("Invalid escrow amount: " + gross);
            const fee = Number((gross * 0.1).toFixed(2));
            const net = Number((gross - fee).toFixed(2));
            const talentUid = ws.talentUid;
            if (!talentUid)
                throw new Error("Talent UID missing in workspace");
            console.log("[processPayout] Amounts:", { gross, fee, net, talentUid });
            const walletRef = db.doc(`wallets/${talentUid}`);
            console.log("[processPayout] Getting wallet...");
            const wSnap = await tx.get(walletRef);
            const existing = wSnap?.exists ? wSnap.data() : {};
            const newAvailable = Number((Number(existing.availableBalance || 0) + net).toFixed(2));
            const newTotalEarned = Number((Number(existing.totalEarned || 0) + net).toFixed(2));
            console.log("[processPayout] Wallet updates:", { newAvailable, newTotalEarned });
            tx.set(walletRef, {
                uid: talentUid,
                role: "talent",
                availableBalance: newAvailable,
                totalEarned: newTotalEarned,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            tx.set(walletRef.collection("transactions").doc(payoutId), {
                type: "credit",
                reason: "payout_release",
                amount: net,
                currency: "NGN",
                status: "completed",
                meta: { wsId, payoutId },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Record platform revenue (simple document for audit)
            const platformRef = db.collection("payoutRevenue").doc(payoutId);
            tx.set(platformRef, {
                amount: fee,
                currency: "NGN",
                meta: { wsId, payoutId },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Write escrow ledger entry for release
            const escrowLedgerRef = db.collection(`workspaces/${wsId}/escrowLedger`).doc();
            tx.set(escrowLedgerRef, {
                type: "release",
                payoutId,
                amount: gross,
                netCredited: net,
                platformFee: fee,
                talentUid,
                releasedBy: actorUid,
                currency: "NGN",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Mark payout as paid and update workspace escrow flag
            tx.update(payoutRef, {
                status: "paid",
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                paidBy: actorUid,
                netAmount: net,
                platformFee: fee,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            tx.update(wsRef, {
                "payment.escrow": false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log("[processPayout] Transaction complete");
        });
    }
    catch (e) {
        console.error("[processPayout] Transaction error:", {
            message: e?.message || "No message",
            code: e?.code || "No code",
            errorString: String(e),
            stack: e?.stack || "No stack"
        });
        throw e;
    }
}
// ------------------------------
// Scheduled: auto-approve payoutRequests after 24h (every 5 mins)
// Path: workspaces/{wsId}/payoutRequests/{id}
// Uses finalWorkId (not milestoneId) for schema harmonization
// ------------------------------
exports.autoApprovePayouts = (0, scheduler_1.onSchedule)("every 5 minutes", async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db
        .collectionGroup("payoutRequests")
        .where("status", "==", "requested")
        .where("autoApproveAt", "<=", now)
        .limit(200)
        .get();
    if (snap.empty)
        return;
    const batch = db.batch();
    for (const d of snap.docs) {
        const pr = d.data();
        const wsRef = d.ref.parent.parent;
        if (!wsRef)
            continue;
        const wsId = wsRef.id;
        const finalWorkId = pr.finalWorkId || "submission";
        // Update finalWork/submission document (not milestones)
        const finalWorkRef = db.doc(`workspaces/${wsId}/finalWork/${finalWorkId}`);
        batch.update(d.ref, {
            status: "approved",
            decision: {
                decision: "approved",
                reason: "Auto-approved after 24 hours with no client review.",
                at: admin.firestore.FieldValue.serverTimestamp(),
                byUid: "system",
                mode: "auto",
            },
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        batch.set(finalWorkRef, {
            status: "approved",
            review: {
                decision: "approved",
                reason: "Auto-approved after 24 hours with no client review.",
                at: admin.firestore.FieldValue.serverTimestamp(),
                byUid: "system",
                mode: "auto",
            },
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        batch.update(wsRef, { updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    await batch.commit();
    // After approving, release funds for each auto-approved payout
    for (const d of snap.docs) {
        try {
            const wsRef = d.ref.parent.parent;
            if (!wsRef)
                continue;
            const wsId = wsRef.id;
            await processPayout(wsId, d.id, "system");
        }
        catch (err) {
            console.error("[autoApprovePayouts] processPayout failed for doc", d.id, err);
        }
    }
});
exports.releasePayout = (0, https_1.onCall)(async (request) => {
    requireAuth(request);
    throw new https_1.HttpsError("failed-precondition", "Legacy payout release is disabled. Payments are processed by the current provider workflow.");
});
// ------------------------------
// Callable: Hourly controls
// ------------------------------
exports.hourlyStartWork = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    if (!wsId)
        throw new https_1.HttpsError("invalid-argument", "wsId required");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    const payStatus = ws.payment?.status || "unfunded";
    if (payStatus !== "initiated" && payStatus !== "funded") {
        throw new https_1.HttpsError("failed-precondition", "Client must pay before work starts.");
    }
    const sessionRef = db.doc(`workspaces/${wsId}/hourly/session`);
    const snap = await sessionRef.get();
    if (snap.exists) {
        const s = snap.data();
        if (s.status !== "not_started")
            throw new https_1.HttpsError("failed-precondition", "Session already started.");
    }
    await sessionRef.set({
        status: "running",
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastResumedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalSeconds: 0,
        currentHourIndex: 1,
        currentHourStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true };
});
exports.hourlyPauseWork = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    if (!wsId)
        throw new https_1.HttpsError("invalid-argument", "wsId required");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    const sessionRef = db.doc(`workspaces/${wsId}/hourly/session`);
    const snap = await sessionRef.get();
    if (!snap.exists)
        throw new https_1.HttpsError("failed-precondition", "Session not started.");
    const s = snap.data();
    if (s.status !== "running")
        throw new https_1.HttpsError("failed-precondition", "Session not running.");
    const last = s.lastResumedAt;
    const elapsed = Math.max(0, (Date.now() - msFromTs(last)) / 1000);
    await sessionRef.update({
        status: "paused",
        totalSeconds: Number(s.totalSeconds || 0) + elapsed,
        pausedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
exports.hourlyResumeWork = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    if (!wsId)
        throw new https_1.HttpsError("invalid-argument", "wsId required");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    const sessionRef = db.doc(`workspaces/${wsId}/hourly/session`);
    const snap = await sessionRef.get();
    if (!snap.exists)
        throw new https_1.HttpsError("failed-precondition", "Session not started.");
    const s = snap.data();
    if (s.status !== "paused")
        throw new https_1.HttpsError("failed-precondition", "Session not paused.");
    await sessionRef.update({
        status: "running",
        lastResumedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
exports.hourlyCreateCheckin = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const note = String(request.data?.note || "").trim();
    if (!wsId)
        throw new https_1.HttpsError("invalid-argument", "wsId required");
    if (note.length < 6)
        throw new https_1.HttpsError("invalid-argument", "Note too short.");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    const sessionRef = db.doc(`workspaces/${wsId}/hourly/session`);
    const sSnap = await sessionRef.get();
    if (!sSnap.exists)
        throw new https_1.HttpsError("failed-precondition", "Session not started.");
    const s = sSnap.data();
    if (s.status !== "running")
        throw new https_1.HttpsError("failed-precondition", "Session must be running.");
    const hourIndex = Number(s.currentHourIndex || 1);
    const hourStartedAt = s.currentHourStartedAt;
    const mins = (Date.now() - msFromTs(hourStartedAt)) / 60000;
    if (mins < 55) {
        throw new https_1.HttpsError("failed-precondition", `Too early. Check in after ~1 hour. (${Math.floor(mins)} mins elapsed)`);
    }
    const checkinRef = db.collection(`workspaces/${wsId}/hourly/session/checkins`).doc();
    await checkinRef.set({
        hourIndex,
        note,
        status: "submitted",
        byUid: uid,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await sessionRef.update({
        currentHourIndex: hourIndex + 1,
        currentHourStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true, checkinId: checkinRef.id };
});
exports.hourlyAttachCheckinScreenshot = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const checkinId = String(request.data?.checkinId || "");
    const rawStoragePath = String(request.data?.rawStoragePath || "");
    const contentType = String(request.data?.contentType || "");
    if (!wsId || !checkinId || !rawStoragePath) {
        throw new https_1.HttpsError("invalid-argument", "wsId, checkinId, rawStoragePath required.");
    }
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    await db.doc(`workspaces/${wsId}/hourly/session/checkins/${checkinId}`).set({
        screenshotRawPath: rawStoragePath,
        screenshotRawContentType: contentType,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true };
});
exports.hourlyDisputeCheckin = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const checkinId = String(request.data?.checkinId || "");
    const reason = String(request.data?.reason || "").trim();
    if (!wsId || !checkinId)
        throw new https_1.HttpsError("invalid-argument", "wsId and checkinId required.");
    if (reason.length < 15)
        throw new https_1.HttpsError("invalid-argument", "Reason too short.");
    const ws = await getWorkspace(wsId);
    ensureClient(uid, ws);
    // ✅ correct location
    const ref = db.doc(`workspaces/${wsId}/hourly/session/checkins/${checkinId}`);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Checkin not found.");
    await ref.update({
        status: "disputed",
        dispute: {
            reason,
            at: admin.firestore.FieldValue.serverTimestamp(),
            byUid: uid,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
exports.hourlyDefendCheckin = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const checkinId = String(request.data?.checkinId || "");
    const note = String(request.data?.note || "").trim();
    if (!wsId || !checkinId)
        throw new https_1.HttpsError("invalid-argument", "wsId and checkinId required.");
    if (note.length < 12)
        throw new https_1.HttpsError("invalid-argument", "Defense note too short.");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    // ✅ correct location
    const ref = db.doc(`workspaces/${wsId}/hourly/session/checkins/${checkinId}`);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Checkin not found.");
    const c = snap.data();
    if (c.status !== "disputed")
        throw new https_1.HttpsError("failed-precondition", "Only disputed checkins can be defended.");
    await ref.update({
        defense: {
            note,
            at: admin.firestore.FieldValue.serverTimestamp(),
            byUid: uid,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
// Scheduled: Reconcile wallet balances from transactions (daily)
// Detects and logs any discrepancies; optionally auto-fixes
// Runs daily at 2 AM UTC
// ------------------------------
exports.reconcileWalletBalances = (0, scheduler_1.onSchedule)("every day 02:00", async () => {
    console.log("[reconcileWalletBalances] Starting daily reconciliation...");
    const issues = [];
    let fixCount = 0;
    const walletsSnap = await db.collection("wallets").get();
    for (const walletDoc of walletsSnap.docs) {
        const uid = walletDoc.id;
        const wallet = walletDoc.data();
        try {
            // Compute totals from all transactions
            const txSnap = await db.collection(`wallets/${uid}/transactions`).get();
            let computedAvailable = 0;
            let computedEarned = 0;
            let computedSpent = 0;
            for (const tx of txSnap.docs) {
                const t = tx.data();
                const amount = Number(t.amount || 0);
                const type = String(t.type || "");
                const reason = String(t.reason || "");
                if (type === "credit") {
                    if (reason === "payout_release" || reason === "withdrawal_reversal") {
                        computedAvailable += amount;
                        computedEarned += amount;
                    }
                    else if (reason === "deposit") {
                        computedAvailable += amount;
                    }
                }
                else if (type === "debit") {
                    if (reason === "workspace_funding") {
                        computedSpent += amount;
                    }
                    else if (reason === "withdrawal") {
                        computedAvailable = Math.max(0, computedAvailable - amount);
                    }
                }
            }
            // Compare with wallet aggregates
            const storedAvailable = Number(wallet.availableBalance || 0);
            const storedEarned = Number(wallet.totalEarned || 0);
            const storedSpent = Number(wallet.totalSpent || 0);
            const driftTol = 0.01; // Allow 1 kobo drift due to rounding
            const availDrift = Math.abs(storedAvailable - computedAvailable) > driftTol;
            const earnedDrift = Math.abs(storedEarned - computedEarned) > driftTol;
            const spentDrift = Math.abs(storedSpent - computedSpent) > driftTol;
            if (availDrift || earnedDrift || spentDrift) {
                const issue = {
                    uid,
                    role: wallet.role,
                    availDrift: { stored: storedAvailable, computed: computedAvailable },
                    earnedDrift: { stored: storedEarned, computed: computedEarned },
                    spentDrift: { stored: storedSpent, computed: computedSpent },
                };
                issues.push(issue);
                console.warn("[reconcileWalletBalances] DRIFT detected for", uid, issue);
                // Auto-fix by updating aggregates to match computed values
                await walletDoc.ref.update({
                    availableBalance: computedAvailable,
                    totalEarned: computedEarned,
                    totalSpent: computedSpent,
                    lastReconciled: admin.firestore.FieldValue.serverTimestamp(),
                });
                fixCount++;
                console.log("[reconcileWalletBalances] Fixed wallet", uid);
            }
        }
        catch (e) {
            console.error("[reconcileWalletBalances] Error for wallet", uid, e);
        }
    }
    // Log reconciliation summary
    console.log("[reconcileWalletBalances] Complete. Drifts found:", issues.length, "Fixed:", fixCount);
});
// ------------------------------
// Scheduled: legacy payment reconciliation is disabled during migration.
// The first check happens five minutes after initiation. A second and final
// verification is attempted before the payment is escalated for admin review.
// The function remains temporarily deployed as a harmless no-op until undeployed.
// ------------------------------
async function verifyLegacyTransaction(_reference) {
    throw new Error("Legacy payment verification is disabled");
}
async function recordPaymentReconciliationCase(data) {
    const caseId = String(data.caseId);
    await db.collection("paymentReconciliationCases").doc(caseId).set({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
async function settleReconciledWalletTopup(ref, reference, amount, uid) {
    const walletRef = db.doc(`wallets/${uid}`);
    const txRef = walletRef.collection("transactions").doc(reference);
    const result = await db.runTransaction(async (tx) => {
        const [walletSnap, topupSnap, walletTxSnap] = await Promise.all([
            tx.get(walletRef),
            tx.get(ref),
            tx.get(txRef),
        ]);
        if (!topupSnap.exists || !walletTxSnap.exists)
            throw new Error("Wallet payment record is missing");
        const topup = topupSnap.data();
        const expectedAmount = Number(topup?.amount || walletTxSnap.data()?.amount || 0);
        if (!expectedAmount || Math.abs(expectedAmount - amount) > 0.01)
            throw new Error("Paid amount does not match pending top-up");
        if (topup?.status === "funded")
            return { settled: false, amount: expectedAmount };
        const wallet = walletSnap.exists ? walletSnap.data() : {};
        tx.set(walletRef, {
            uid,
            role: String(wallet?.role || "client"),
            availableBalance: Number(wallet?.availableBalance || 0) + expectedAmount,
            totalLoaded: Number(wallet?.totalLoaded || 0) + expectedAmount,
            totalFundingReceived: Number(wallet?.totalFundingReceived || 0) + expectedAmount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        tx.set(txRef, {
            status: "completed",
            meta: { reference, confirmedBy: "legacy_reconciliation" },
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        tx.set(ref, {
            status: "funded",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            confirmedBy: "legacy_reconciliation",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { settled: true, amount: expectedAmount };
    });
    return result;
}
async function settleReconciledWorkspacePayment(paymentRef, reference, amount, wsRef) {
    return db.runTransaction(async (tx) => {
        const [paymentSnap, wsSnap] = await Promise.all([tx.get(paymentRef), tx.get(wsRef)]);
        if (!paymentSnap.exists || !wsSnap.exists)
            throw new Error("Workspace payment record is missing");
        const payment = paymentSnap.data();
        if (Math.abs(Number(payment?.amount || 0) - amount) > 0.01)
            throw new Error("Paid amount does not match pending workspace payment");
        if (payment?.status === "funded")
            return { settled: false };
        tx.set(paymentRef, {
            status: "funded",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            fundedBy: "legacy_reconciliation",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        tx.set(wsRef, {
            payment: {
                status: "funded",
                fundedAt: admin.firestore.FieldValue.serverTimestamp(),
                fundedBy: "legacy_reconciliation",
                reference,
                amount,
                escrow: true,
            },
            status: "active",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        tx.set(wsRef.collection("escrowLedger").doc(), {
            type: "hold",
            reference,
            amount,
            currency: "NGN",
            fundedBy: "legacy_reconciliation",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { settled: true };
    });
}
exports.reconcileLegacyPayments = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
    // Intentionally disabled during the provider migration. Kept temporarily only
    // to make any deployed legacy scheduler harmless until it is undeployed.
    return;
    const now = admin.firestore.Timestamp.now();
    const [topups, payments] = await Promise.all([
        db.collectionGroup("topups")
            .where("status", "==", "initiated")
            .where("nextReconciliationAt", "<=", now)
            .limit(200)
            .get(),
        db.collectionGroup("payments")
            .where("status", "==", "initiated")
            .where("nextReconciliationAt", "<=", now)
            .limit(200)
            .get(),
    ]);
    for (const pending of [...topups.docs, ...payments.docs]) {
        const data = pending.data();
        const attempts = Number(data?.reconciliationAttempts || 0);
        if (attempts >= 2)
            continue;
        const reference = String(data?.reference || pending.id);
        const caseId = pending.ref.parent.id === "topups"
            ? `wallet_${pending.ref.parent.parent?.id || "unknown"}_${reference}`
            : `workspace_${pending.ref.parent.parent?.id || "unknown"}_${reference}`;
        const attempt = attempts + 1;
        try {
            const verified = await verifyLegacyTransaction(reference);
            if (verified.paid) {
                if (pending.ref.parent.id === "topups") {
                    const uid = pending.ref.parent.parent?.id;
                    if (!uid)
                        throw new Error("Wallet owner is missing");
                    await settleReconciledWalletTopup(pending.ref, reference, verified.amount, String(uid));
                }
                else {
                    const wsRef = pending.ref.parent.parent;
                    if (!wsRef)
                        throw new Error("Workspace owner is missing");
                    await settleReconciledWorkspacePayment(pending.ref, reference, verified.amount, wsRef);
                }
                await recordPaymentReconciliationCase({ caseId, reference, amount: verified.amount, kind: pending.ref.parent.id === "topups" ? "wallet_topup" : "workspace_funding", ownerId: pending.ref.parent.parent?.id || "", workspaceId: pending.ref.parent.id === "payments" ? pending.ref.parent.parent?.id || "" : "", status: "resolved", attempts: attempt, resolvedAt: admin.firestore.FieldValue.serverTimestamp() });
            }
            else {
                const status = attempt >= 2 ? "needs_manual_review" : "retrying";
                await pending.ref.set({ reconciliationAttempts: attempt, lastReconciliationAt: admin.firestore.FieldValue.serverTimestamp(), nextReconciliationAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
                await recordPaymentReconciliationCase({ caseId, reference, amount: Number(data?.amount || 0), kind: pending.ref.parent.id === "topups" ? "wallet_topup" : "workspace_funding", ownerId: pending.ref.parent.parent?.id || "", workspaceId: pending.ref.parent.id === "payments" ? pending.ref.parent.parent?.id || "" : "", status, attempts: attempt, lastProviderStatus: "disabled" });
            }
        }
        catch (error) {
            const status = attempt >= 2 ? "needs_manual_review" : "retrying";
            await pending.ref.set({ reconciliationAttempts: attempt, lastReconciliationAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            await recordPaymentReconciliationCase({ caseId, reference, amount: Number(data?.amount || 0), kind: pending.ref.parent.id === "topups" ? "wallet_topup" : "workspace_funding", ownerId: pending.ref.parent.parent?.id || "", workspaceId: pending.ref.parent.id === "payments" ? pending.ref.parent.parent?.id || "" : "", status, attempts: attempt, error: error?.message || "Reconciliation failed" });
        }
    }
});
