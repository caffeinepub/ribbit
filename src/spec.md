# Specification

## Summary
**Goal:** Fix the placement of the existing Back button on the Lily detail page header.

**Planned changes:**
- Update `frontend/src/pages/LilyPage.tsx` to render the existing Reddit-style Back control (ArrowLeft + “Back”) inline within the lily header row, positioned immediately to the left of the pond avatar and metadata.
- Remove the current separate/above-content Back button rendering on the Lily page so only the inline header Back control remains.
- Ensure the change is limited to the Lily detail page and does not introduce any Back button UI on `frontend/src/pages/FrogProfilePage.tsx`.

**User-visible outcome:** On `/lily/:id`, the Back control appears directly to the left of the pond avatar in the header area, remains clickable and keyboard-accessible with the same behavior, and no duplicate Back button appears above the content.
