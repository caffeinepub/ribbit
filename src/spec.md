# Specification

## Summary
**Goal:** Add a local-only bookmarking feature for lilies and a “Saved Lilies” page to revisit bookmarked posts.

**Planned changes:**
- Add a Bookmark toggle to each lily’s action bar and persist bookmarked lily IDs in browser storage (local-only; no backend calls).
- Update the lily action bar order everywhere it appears to: Likes → Replies → Views → Share → Bookmark, with clear English labeling/aria-labels.
- Add a new “Saved Lilies” route/page reachable from existing navigation that lists bookmarked lilies using existing card/list UI patterns and supports navigation to lily detail pages.
- Support removing bookmarks from the Saved Lilies page with immediate list updates, including an English empty state when none are saved.
- Handle missing/unavailable bookmarked lilies gracefully by showing an English placeholder entry and allowing removal of that bookmark without errors.

**User-visible outcome:** Users can bookmark/unbookmark lilies from both the feed and lily detail page, see consistent bookmark state across navigation and refresh, and open a “Saved Lilies” page to view (or remove) their saved posts—even if some saved posts are no longer available.
