# Specification

## Summary
**Goal:** Add shared client-side image compression and apply it across all existing image upload flows so uploads are smaller while previews match what will be uploaded.

**Planned changes:**
- Create a reusable frontend image-compression utility that validates image types, resizes to a reasonable max dimension, and applies lossy compression (JPEG/WebP), returning compressed bytes suitable for `ExternalBlob` uploads.
- Ensure animated GIFs are detected and bypass recompression (uploaded as-is).
- Add robust error handling: reject non-image files with a clear English error, and on compression failure show an English toast and fall back to uploading the original file bytes.
- Update `CreateLilyPage` image Lily flow to compress before `ExternalBlob.fromBytes(...)` and use the compressed image for the on-screen preview.
- Update `CreatePondPage` banner/profile image uploads to compress before building `ExternalBlob`s and ensure both previews display the compressed versions; preserve per-image fallback on failure.
- Update `UserSettingsPage` avatar upload to compress before `ExternalBlob.fromBytes(...).withUploadProgress(...)`, keeping existing upload progress behavior while previewing the compressed image.

**User-visible outcome:** When users upload images (image Lilies, pond banner/profile images, avatars), the app uploads compressed images by default and the preview matches the uploaded result; invalid files or compression issues show an English error and still allow upload via the original image when compression fails.
