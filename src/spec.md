# Specification

## Summary
**Goal:** Update the desktop Pond page layout to remove redundant Feed/About tabs and show the pond’s About information in the right sidebar (Reddit-style).

**Planned changes:**
- On `/pond/$name` at desktop breakpoints (`lg` and up), remove the in-page "Feed" and "About" tab buttons while keeping the feed as the center column content.
- On `/pond/$name` at desktop breakpoints (`lg` and up), replace the generic RightSidebar widgets with a pond-specific About sidebar that displays the same information as the current Pond About view (including join/leave actions as applicable).
- On `/pond/$name/about` at desktop breakpoints (`lg` and up), remove the in-page "Feed" and "About" tab buttons and avoid redundant desktop-only navigation; keep the About route usable on mobile.

**User-visible outcome:** On desktop, pond feed pages show posts in the center and pond About details in the right sidebar without Feed/About tabs; on mobile, the existing tab/navigation behavior remains so users can still access About details.
