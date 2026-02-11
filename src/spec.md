# Specification

## Summary
**Goal:** Eliminate “Unauthorized” errors for Froggy Phrase users by authorizing phrase-hash userId calls as full `#user` actions even when the caller principal is anonymous.

**Planned changes:**
- Backend: Update authorization logic so requests with a recognized Froggy Phrase phrase-hash `userId` are treated as `#user` for all actions, regardless of caller principal (including anonymous).
- Backend: Add/extend `*ByPhraseHash(userId, ...)` method variants for all UI-triggered write/mutation actions that currently require principal-based `#user` authorization (e.g., creating ponds, lilies/posts, ribbits/comments, liking/unliking, view-count increments, and username/avatar/profile saves).
- Frontend: Update React Query queries/mutations to consistently call phrase-hash backend endpoints whenever `getPhraseHashUserId()` returns a non-empty userId; otherwise keep existing Internet Identity/principal-based calls.

**User-visible outcome:** Froggy Phrase users can create ponds, create lilies/posts, create ribbits/comments, like/unlike, increment views, and save avatar/profile without “Unauthorized” errors even when not logged in with Internet Identity, while existing Internet Identity behavior remains unchanged.
