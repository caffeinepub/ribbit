# Specification

## Summary
**Goal:** Ensure pond creators are automatically added as members of their pond during pond creation, with membership counts and creator profile state updated immediately.

**Planned changes:**
- Update the backend `createPond(...)` flow to include the creator’s phrase-hash userId in `pond.members` at creation time (without duplicates).
- Ensure the new pond’s `memberCount` reflects the creator membership and remains consistent with `pond.members`.
- Update the creator’s `UserProfile` (retrieved by phrase-hash) so `joinedPonds` includes the newly created pond immediately after creation.

**User-visible outcome:** After creating a pond, the creator is already a member of that pond, the pond’s member count reflects this, and the pond appears in the creator’s joined ponds list without requiring a separate join action.
