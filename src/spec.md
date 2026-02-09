# Specification

## Summary
**Goal:** Fix the Frog Profile page Back button so it appears in the header row to the left of the avatar without overlapping, and navigates back reliably.

**Planned changes:**
- Add/restore a Reddit-style Back button on `frontend/src/pages/FrogProfilePage.tsx` and lay it out in the profile header row to the left of the pond avatar with consistent spacing across mobile and desktop viewports.
- Implement Back button behavior to navigate to the previous page when `window.history.length > 1`, otherwise fall back to `/`.
- Match the Back button’s look and feel to the existing Lily page Back button (arrow-left icon + “Back” label, muted styling, hover state, rounded hit area) and ensure it is keyboard accessible with an accessible label.

**User-visible outcome:** On the Frog Profile page, users see a properly placed “Back” button left of the avatar that doesn’t overlap other header elements and takes them to the previous page (or home when no history is available).
