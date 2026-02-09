# Specification

## Summary
**Goal:** Re-implement the “mini blurred placeholder” loading for Ribbits avatar images only, while preserving the exact Version 214 UI layout and styling.

**Planned changes:**
- Add mini blurred placeholder loading behavior for Ribbits avatar images in the Lily page ribbits list and in the user profile ribbits/comments list.
- Ensure the avatar transitions from blurred placeholder to final image smoothly (no flicker) and retains existing fallback behavior when an avatar URL is missing/unavailable.
- Keep the Version 214 layout/styles unchanged (no className/spacing/typography/position changes), including leaving the Lily page sorting toggle exactly where it is (directly below the composer textarea).

**User-visible outcome:** Ribbit avatars briefly show a small blurred placeholder while loading, then resolve cleanly to the final avatar without flicker, with no visible UI/layout changes anywhere else.
