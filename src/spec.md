# Specification

## Summary
**Goal:** Begin a parallel, additive migration from Principal-keyed backend storage to phrase-hash `UserId : Text` storage, keeping all existing Principal data intact and maintaining anonymous/legacy behavior.

**Planned changes:**
- Add new UserId-keyed backend maps for identity-linked data (at minimum: user profiles, username ownership/mapping, and like state for posts and ribbits) while leaving existing Principal-keyed storage unchanged.
- Implement a linkage mapping that associates `msg.caller : Principal` with a provided `userId : Text` whenever phrase-hash-enabled methods are called with `userId != ""`.
- Update backend read/write paths for key identity-affecting actions to dual-write (UserId + Principal when `userId != ""`) and to read with safe fallback (prefer UserId when available, otherwise Principal), without adding new authorization gating.
- Expose/extend backend query methods so the frontend can fetch profile and like state by `userId` while preserving existing Principal-based query methods.
- Update existing frontend React Query hooks/mutations (that already compute `getPhraseHashUserId()`) to pass `userId` into backend methods that accept it, and continue working when `userId` is empty.

**User-visible outcome:** Users can continue using the app as before, while accounts/actions can also be stored and retrieved via phrase-hash `userId` when available, enabling a gradual migration without breaking legacy Principal-based users.
