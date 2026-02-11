# Specification

## Summary
**Goal:** Prevent anonymous users from appearing as the same pond member by switching pond membership to use Froggy Phrase hash identity (userId) instead of the anonymous caller Principal.

**Planned changes:**
- Update the backend pond storage model to store membership by userId (phrase hash) rather than by Principal, and adjust all membership-related methods (join/leave/check/get joined ponds) to read/write using userId.
- Add/adjust backend membership endpoints that accept phrase hash (userId) and update frontend React Query hooks to use these phrase-hash endpoints for join/leave and joined-ponds queries (no principal-based fallback for pond membership).
- If the pond storage schema changes, implement a conditional Motoko state migration so upgrades succeed and existing ponds remain readable, while ensuring legacy principal-based membership does not cause anonymous users to appear as members after upgrade.
- Keep admin-only authorization enforcement intact and return clear English error messages for unauthorized operations.

**User-visible outcome:** Joining or leaving a pond is scoped to the current Froggy Phrase identity; different browsers/devices with different phrase hashes no longer share pond membership, and the UI reflects membership changes immediately after join/leave.
