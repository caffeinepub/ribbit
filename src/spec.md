# Specification

## Summary
**Goal:** Restore/ensure the frontend React app builds and runs, and implement a working avatar upload flow on the Settings page.

**Planned changes:**
- Ensure the existing frontend entry points and routing compile and render by fixing missing imports, broken routes, and placeholder/empty components that prevent the app from building.
- Implement avatar upload in `/settings`: image file selection, pre-upload preview, client-side compression for non-animated images (skip recompression for animated GIFs), upload via the existing `useSaveCallerUserProfile` / `saveCallerUserProfile` mutation with `UserProfile.avatar` set, and refresh the displayed avatar after successful save.
- Add English user-facing success/error messaging and show upload progress when available.

**User-visible outcome:** The app loads and navigates without crashes, and users can select, preview, and save an avatar on the Settings page (including animated GIFs remaining animated), with clear success/error feedback.
