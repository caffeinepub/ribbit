# Specification

## Summary
**Goal:** Remove the horizontal inset on the LilyCard hover background layer on desktop only, without changing any other spacing or layout.

**Planned changes:**
- Update the LilyCard hover background layer styles so that at the Tailwind `lg` breakpoint and up, the hover background spans flush to the left/right edges of the card while keeping the existing vertical inset.
- Preserve the current rounded corners, opacity transition, and non-interactive behavior of the hover background layer.
- Keep the hover background unchanged on viewports below `lg` (still inset on all sides).

**User-visible outcome:** On desktop, hovering a lily card shows a hover background that reaches the card’s left and right edges (no horizontal inset), while the mobile/tablet hover appearance remains the same.
