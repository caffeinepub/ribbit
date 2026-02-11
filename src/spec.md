# Specification

## Summary
**Goal:** For mobile layouts only, move the “Join Pond” action from the Pond Feed page to the Pond About page, aligning it with the existing membership controls placement.

**Planned changes:**
- Remove the mobile-only (lg:hidden) “Join Pond” button from `frontend/src/pages/PondPage.tsx`.
- Add a mobile-only (lg:hidden) “Join Pond” button to `frontend/src/pages/PondAboutPage.tsx` in the membership controls section where “Leave Pond” appears for members.
- Wire the new About-page Join button to the existing join mutation and existing success/error toast messaging; keep the member “Leave Pond” behavior unchanged.
- Leave desktop behavior unchanged, including the existing desktop sidebar join/leave control in `frontend/src/components/PondAboutSidebar.tsx`.

**User-visible outcome:** On mobile, users join a pond from the Pond About page (in the same area as the Leave control), and the Pond Feed page no longer shows a Join button; desktop behavior remains the same.
