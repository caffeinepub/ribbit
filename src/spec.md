# Specification

## Summary
**Goal:** Make the app fully usable in an anonymous-first mode by removing backend and frontend “#user role” gating so anonymous visitors can create and interact with content and save avatars.

**Planned changes:**
- Update backend authorization to allow anonymous callers to perform core actions: create ponds, create lilies/posts, join/leave ponds, like/unlike lilies and ribbits, and create ribbits/replies without “Only users can …” traps.
- Adjust backend profile/avatar endpoints so `getCallerUserProfile` and `saveCallerUserProfile` work safely for anonymous callers (or return safe values) to support loading and saving avatars in User Settings.
- Remove/relax any frontend UI checks that block anonymous visitors from starting pond creation, lily creation, or avatar saving based on user role assumptions, and ensure error messages reflect real validation issues rather than permission gating.

**User-visible outcome:** Visitors who are not logged in can create ponds and lilies, join/leave ponds, like/unlike, post ribbits/replies, and save an avatar in User Settings without authorization errors.
