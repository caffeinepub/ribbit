# Specification

## Summary
**Goal:** Fix the LilyCard hover inset highlight so it consistently appears (in light/dark themes) without breaking interactions, and make right sidebar hover highlights rounded.

**Planned changes:**
- Update LilyCard hover styling so the inset background highlight reliably renders behind content (not lost due to stacking context/background painting), remains inset, and respects rounded corners in both light and dark mode.
- Ensure the LilyCard hover background layer never intercepts pointer events so all interactive elements (links, like/share/bookmark) remain fully clickable while hovered.
- Adjust RightSidebar and TagHubRightSidebar list item hover backgrounds to use rounded corners consistent with item shapes, including cases with negative horizontal margins and sidebar overflow clipping.

**User-visible outcome:** Hovering any LilyCard shows a clear inset highlight without blocking clicks, and hovering items in the right column shows a rounded (not square) hover background.
