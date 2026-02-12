# Specification

## Summary
**Goal:** Fix Settings desktop tab alignment, ensure a visible avatar placeholder in Settings when none is set, and refresh the header avatar immediately after avatar updates.

**Planned changes:**
- Adjust the md+ Settings page layout so the vertical tabs column aligns flush with the left edge of the Settings content block (consistent left alignment between tabs and main content).
- In Settings > Avatar, render a clear placeholder avatar when the user has no saved avatar and no local preview selected.
- After a successful avatar save, update/refresh the relevant React Query cache so the Header avatar re-renders immediately without a page refresh.

**User-visible outcome:** On desktop, Settings tabs line up correctly with the Settings content; the Avatar tab always shows an avatar placeholder when none is selected; and the Header avatar updates right after saving a new avatar.
