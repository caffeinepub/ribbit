# Specification

## Summary
**Goal:** Adjust the desktop header “ribbit” logo typography to match the requested letter-spacing and font size.

**Planned changes:**
- Update the desktop logo text span in `frontend/src/components/Header.tsx` to set `letterSpacing: '-0.035rem'`.
- Update the desktop logo text span in `frontend/src/components/Header.tsx` to set `fontSize: '1.7rem'` while keeping the existing Tilt Warp font-family and font-weight (400) unchanged.

**User-visible outcome:** On desktop, the header “ribbit” logo text appears slightly tighter and larger according to the specified typography values, with no other header changes.
