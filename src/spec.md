# Specification

## Summary
**Goal:** Allow ponds to be created via phrase-hash `userId` without Principal/caller authorization traps, and ensure the creator is automatically joined and indexed at creation time.

**Planned changes:**
- Update `createPond(...)` in `backend/main.mo` to remove/disable the `userIdLinkage` + `caller != linkedPrincipal` authorization gate and any `AccessControl.hasPermission(...)` checks in the pond-creation path, so creation can succeed based on provided phrase-hash `userId` (including anonymous callers).
- Update `createPond(...)` to auto-join the creator on creation by adding the creator `userId` to `pond.members` (exactly once) and setting `pond.memberCount` to match the unique member total (at least `1`).
- Update phrase-hash user↔pond indexes on creation: add the new pond name to the creator’s `UserProfile.joinedPonds` (via `getUserProfileByPhraseHash(userId)` data model) and to `userPonds[userId]`, avoiding duplicates on retries.

**User-visible outcome:** Users can create a pond using a phrase-hash `userId` even when anonymous, and the creator will immediately appear as a member with their profile and user-pond listings updated to include the new pond.
