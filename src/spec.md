# Specification

## Summary
**Goal:** Make Ribbit fully anonymous by disabling all backend authorization enforcement so unauthenticated callers have full access to all canister functionality.

**Planned changes:**
- Remove/disable all role/permission checks in backend canister methods so anonymous callers can perform all actions (pond/post/ribbit creation, likes, join/leave ponds, username management, profile read/write, view count increments, and previously admin-only utilities).
- Keep existing access-control-related Candid methods in the backend interface for frontend compatibility, but ensure they do not gate functionality or cause traps in anonymous mode.
- Eliminate “Unauthorized:” traps during normal anonymous site usage by removing or bypassing authorization enforcement paths in `backend/main.mo`.

**User-visible outcome:** Visitors can use the full Ribbit app anonymously (without authenticating) and no features fail due to authorization/role checks.
