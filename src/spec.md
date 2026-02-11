# Specification

## Summary
**Goal:** Ensure all Froggy Phrase identities are automatically assigned the `#user` access control role so Froggy Phrase sessions no longer hit unauthorized traps on `#user`-gated backend methods.

**Planned changes:**
- Backend: Update `initializeFroggyPhrase(userId : Text)` to always ensure the caller has AccessControl role `#user` while still recording `userIdLinkage`, and keep the call idempotent without downgrading higher roles.
- Backend: Verify Froggy Phrase callers can pass `AccessControl.hasPermission(..., #user)` after initialization (e.g., for a previously failing method like `incrementLilyViewCount`).
- Frontend: On app startup, compute the Froggy Phrase SHA-256 hash via `getPhraseHashUserId()` and call backend `initializeFroggyPhrase(userId)` once an actor is available, ensuring the call runs at most once per app session (or is otherwise rate-limited/idempotent).

**User-visible outcome:** Froggy Phrase users are automatically initialized as `#user` on startup, and actions that previously failed with “Unauthorized” (e.g., liking/creating content/incrementing views where applicable) no longer show authorization errors.
