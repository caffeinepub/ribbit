# Specification

## Summary
**Goal:** Ensure the Lily detail page always shows the engagement row (likes/replies/views) directly below the lily’s main content (title/description, then image/link if present).

**Planned changes:**
- Update `frontend/src/pages/LilyPage.tsx` layout so the engagement row always renders after the title + description block, then after the image (if present) and link (if present).
- Keep engagement row styling and functionality unchanged; adjust placement only on the Lily detail page.

**User-visible outcome:** On the Lily detail page, likes/replies/views always appear below the lily’s description and any image/link, never above the image, while other pages (including feed cards) remain unchanged.
