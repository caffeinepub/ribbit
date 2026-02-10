# Specification

## Summary
**Goal:** Make the LilyCard hover background appear slightly inset so the feed container’s rounded borders remain visible on lily list pages.

**Planned changes:**
- Update LilyCard hover styling so the light gray hover background is inset from the card edges by a small, consistent spacing and uses rounded corners that complement the container.
- Ensure the hover effect does not cause layout shift and remains consistent across pages that render LilyCard lists (e.g., Home and Pond).
- Verify hover styling does not interfere with LilyCard interactions (links and like/share/bookmark buttons), pointer events, focus/keyboard navigation, and maintains a subtle transition; touch-device behavior remains unchanged.

**User-visible outcome:** On Home, Pond, and other lily list pages, hovering a lily shows an inset light-gray highlight that better reveals rounded borders, without breaking any existing click/tap interactions.
