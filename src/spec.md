# Specification

## Summary
**Goal:** Refine the Lily page header metadata layout, show the pond avatar, and visually separate the lily content from the ribbits section.

**Planned changes:**
- Update the Lily page header metadata layout so the avatar is on the left and the text to the right renders as two lines: (1) pond name in bold, followed by a “•” separator and the relative timestamp; (2) username in regular (non-bold) text, while preserving the pond name link to `/pond/$name`.
- Change the Lily page header avatar to use the pond’s profile image (pond avatar) instead of the user avatar, with an existing-style fallback (e.g., 🐸) when no pond image is available.
- Add a horizontal border divider between the lily content/engagement block and the Ribbits section using existing Tailwind theme border classes so it looks consistent in light/dark mode.

**User-visible outcome:** On the Lily page, users see the pond avatar with cleaner two-line metadata (pond name + timestamp on the first line, username on the second), and a clear border separating the lily content from the ribbits section.
