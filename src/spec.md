# Specification

## Summary
**Goal:** Simplify the Tag detail page stats display and make the global top header fully opaque.

**Planned changes:**
- Update the Tag detail page (/tag/:tag) to remove the “Total Activity” and “Last Activity” fields (including labels, icons, and values) from the stats block, and close up any resulting layout gaps.
- Update the global top header styling to remove transparency effects, ensuring an opaque background and removing any backdrop blur-based translucency while keeping the header sticky and functional across pages.

**User-visible outcome:** On tag pages, users will no longer see “Total Activity” or “Last Activity” in the stats area, and the top header will appear fully opaque (in both light and dark mode) without translucent/blur effects.
