# Specification

## Summary
**Goal:** Fix backend pond creation so that only the creating principal is added as an initial member, and only the creator’s profile is updated.

**Planned changes:**
- Update pond-creation logic to initialize `Pond.members` with exactly `[caller]` and set `memberCount` to `1`, without referencing or copying any global user/principal list (e.g., `initializedUsers`).
- Ensure pond creation updates membership-related user state (e.g., `UserProfile.joinedPonds`) only for the creating principal and does not modify any other users’ profiles or any global per-user membership lists.

**User-visible outcome:** When a user creates a new pond, only they are a member by default; other users do not appear as members and are not treated as joined until they explicitly join.
