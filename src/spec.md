# Specification

## Summary
**Goal:** Left-align all Lily page content into a single column with no extra indentation between sections.

**Planned changes:**
- Update `frontend/src/pages/LilyPage.tsx` layout so the pond avatar, metadata/title/description, image/link block, and engagement/action buttons share the same left edge in a single-column flow (remove side-by-side/avatar-offset alignment).
- Ensure the page stays within the existing max-width container without introducing horizontal scrolling across mobile and desktop.
- Preserve all existing Lily page behavior (view count increment, like/unlike, share, bookmark, ribbit creation, lightbox modal).

**User-visible outcome:** On the Lily page, all content sections align cleanly on the left in one readable column, with no unwanted horizontal offsets, while all current interactions continue working as before.
