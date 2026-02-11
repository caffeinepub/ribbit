# Specification

## Summary
**Goal:** Fix pond creation so that only the creating user becomes a member (and has their membership state updated), instead of all users being auto-added.

**Planned changes:**
- Update backend `createPond(...)` logic to initialize the new pond’s `members` list with only the `caller` (preserving any existing creator admin/mod assignment behavior).
- Remove/avoid any pond-creation code paths that populate `members` from global user registries (e.g., `initializedUsers` or similar collections).
- Ensure pond creation updates joined-pond membership state only for the creator (e.g., creator’s `joinedPonds`) and does not add the new pond to other users’ profiles.

**User-visible outcome:** After creating a pond, only the creator is a member by default; other users will not see the pond in their joined ponds unless they explicitly join.
