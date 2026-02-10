# Specification

## Summary
**Goal:** Update the desktop header search bar’s internal logo badge to use a new logo image and match the app’s accent-colored styling.

**Planned changes:**
- In `frontend/src/components/Header.tsx`, replace the desktop (md+) search input’s decorative badge logo image source with `https://res.cloudinary.com/dbnj80s9g/image/upload/v1770762364/newribbitlogo_hcnzwy.png`.
- Update the desktop search bar logo badge container background to use the app’s theme accent token/class (not a hard-coded color), keeping it circular and non-interactive.

**User-visible outcome:** On desktop (md+), the logo badge inside the search bar shows the new logo and sits on an accent-colored circular background, while the mobile centered logo remains unchanged.
