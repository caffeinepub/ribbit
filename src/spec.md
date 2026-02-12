# Specification

## Summary
**Goal:** Fix pond join/leave failures by making pond membership and related profile updates use Froggy Phrase hash identity (userId: Text) end-to-end.

**Planned changes:**
- Update backend pond membership storage and join/leave logic to be userId-based (phrase-hash), removing reliance on userId→Principal linkage and caller Principal for membership.
- Ensure backend join/leave updates the phrase-hash user profile’s joinedPonds list via getUserProfileByPhraseHash behavior, creating a default profile when missing.
- Add a conditional backend state migration (migration.mo) only if required to safely upgrade existing deployed membership state and keep existing ponds readable.
- Update frontend join/leave pond flows to work with the backend changes and refresh membership-dependent queries so UI state updates after join/leave without showing the prior error.

**User-visible outcome:** Users can join and leave ponds without seeing “user id not found”, membership is tracked per userId (not shared anonymous principal), and pond member counts/button state update correctly after join/leave.
