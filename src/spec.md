# Specification

## Summary
**Goal:** Align the pond avatar/metadata header block on the Lily detail page to the same left edge as the main lily content column, while keeping the back button as the only left-offset element (Reddit-style).

**Planned changes:**
- Update `frontend/src/pages/LilyPage.tsx` header layout so the pond avatar + metadata (pond name, timestamp, username, avatar) shares the same left alignment as the lily title, description, media/link block, and action buttons row.
- Keep the back button positioned to the left/in front of the aligned content column, ensuring it remains clickable and does not overlap the header/content on common mobile and desktop widths.
- Scope the change to the Lily page only without altering lily rendering logic or broader site styling beyond what’s needed for alignment.

**User-visible outcome:** On the Lily page, the header metadata block lines up with the rest of the post content in a single consistent column, while the back button remains slightly offset to the left and works without interfering with other elements.
