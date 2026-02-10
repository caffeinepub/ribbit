# Specification

## Summary
**Goal:** Let users join a pond directly from the All Ponds page pond cards without opening the pond page.

**Planned changes:**
- Add a compact Join control to each pond card in `frontend/src/pages/AllPondsPage.tsx` that appears only when the user is not already a member.
- Wire the Join control to the existing join mutation (`useJoinPond`), ensuring the click does not trigger the card’s Link navigation.
- Show loading/disabled state while joining, and switch to a non-interactive (or disabled) “Joined” state on success.
- Show an error toast (sonner) on join failure and keep the card in the not-joined state.
- Refresh/invalidate the joined-ponds query (`useGetJoinedPonds`) after a successful join so membership indicators update immediately without a full page refresh.

**User-visible outcome:** On the All Ponds page, users can click “Join” on a pond card to join instantly, see immediate “Joined” feedback, and get a toast error if the join fails.
