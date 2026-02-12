# Specification

## Summary
**Goal:** Ensure pond creators are automatically joined to newly created ponds and fix `memberCount` so it matches actual membership.

**Planned changes:**
- Update backend pond creation to add the creator’s phrase-hash userId to the new pond’s `members : [Text]` at creation time.
- Set/derive `memberCount` to accurately reflect `members.length` immediately after creation (no mismatched preset/increment).
- Update (or create if missing) the creator’s phrase-hash `UserProfile` during pond creation so `joinedPonds` includes the new pond name exactly once.

**User-visible outcome:** After creating a pond, the creator immediately appears as a member (with a correct member count) and their joined ponds list updates without needing a separate join action or manual refresh.
