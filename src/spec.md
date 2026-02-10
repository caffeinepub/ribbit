# Specification

## Summary
**Goal:** Restore the LilyCard inset hover background so it renders visibly on hover, remains smooth, preserves all interactions, and looks correct in both light and dark themes.

**Planned changes:**
- Adjust LilyCard hover overlay layering so the inset rounded hover background renders above the card base background (not behind it).
- Ensure the hover overlay does not capture pointer events and does not affect click targets for LilyCard interactions (links, like/share/bookmark).
- Update the hover background styling to use theme-compatible colors so it remains subtly visible in both light and dark modes without flicker.

**User-visible outcome:** Hovering a LilyCard shows a clearly visible inset rounded hover tint with a smooth transition, while all card buttons/links remain fully clickable in both light and dark themes.
