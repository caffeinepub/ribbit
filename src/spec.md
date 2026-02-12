# Specification

## Summary
**Goal:** Ensure pond creators automatically become members of the pond at the moment the pond is created.

**Planned changes:**
- Update the backend `createPond` flow to add the creator to `Pond.members` on successful pond creation.
- Ensure the new pond’s `memberCount` reflects the creator’s membership (at least 1 at creation) without double-counting.
- Update the creator’s profile (`joinedPonds` in phrase-hash based user profile storage) to include the newly created pond name immediately after creation.
- Add idempotency safeguards so the creator is not added twice and `memberCount` is not incremented twice in edge cases.
- Preserve existing `createPond` behavior for pond metadata, images, and admin/moderator assignment.

**User-visible outcome:** After creating a pond, the creator is immediately joined as a member of that pond (and their joined ponds list reflects it) without any extra UI steps.
