# Specification

## Summary
**Goal:** Add a Reddit-style mobile left sidebar drawer and adjust the desktop right sidebar styling to a gray rounded panel.

**Planned changes:**
- Add a mobile-only hamburger button to the left of the Ribbit logo in the header (hidden on `lg` and up).
- Implement the existing `LeftSidebar` as a mobile off-canvas drawer that slides in from the left with a scrim overlay, supports scrolling, closes on scrim tap, and closes on navigation.
- Restyle the desktop `RightSidebar` outer container to render as a single rounded panel with a soft light-gray/tinted background while keeping existing inner sections and mobile behavior unchanged.

**User-visible outcome:** On mobile, users can open and close the left navigation via a hamburger drawer like Reddit; on desktop, the right sidebar appears inside a rounded light-gray panel.
