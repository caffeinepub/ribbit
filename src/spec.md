# Specification

## Summary
**Goal:** Make specified search input and buttons render with a fully-rounded (9999px) pill-shaped border radius across responsive layouts and themes.

**Planned changes:**
- Update the Header search input to use a fully-rounded border radius while preserving hover/focus styling in light and dark themes.
- Update all button-style controls in `frontend/src/components/Header.tsx` to use a fully-rounded border radius without affecting alignment or spacing on mobile/desktop.
- Update the “Start a Pond” button on `frontend/src/pages/AllPondsPage.tsx` to use a fully-rounded border radius while keeping existing padding/typography/interaction styles.
- Update the “Save Changes”, “Save Froggy Phrase”, and “Choose Avatar” buttons on `frontend/src/pages/UserSettingsPage.tsx` to use a fully-rounded border radius while keeping disabled/loading states (if present) intact.

**User-visible outcome:** The Header search input and the specified buttons appear pill-shaped and consistent across pages, themes, and responsive layouts.
