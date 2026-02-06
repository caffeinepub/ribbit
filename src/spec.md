# Specification

## Summary
**Goal:** Fix mobile search modal alignment and remove unintended padding/margins that add extra vertical spacing across Home, Tags, Tag, and Pond pages.

**Planned changes:**
- Apply `margin-block-end: auto` to the search form in the mobile search modal to ensure correct mobile alignment.
- Home: remove padding from the wrapper div currently using `py-4 px-4 lg:px-0 lg:py-0` around the tabs header area.
- Tags (Tag Hub): remove `mb-4` from the header divider container (`border-b border-border bg-background mb-4`).
- Tag page: remove the `mb-4` bottom margin effect from the Tabs root container (`flex flex-col gap-2 mb-4`) via page-level override (without editing `frontend/src/components/ui/*`).
- Pond page: remove/refactor the mobile-only padding wrapper (`py-4 px-4 lg:hidden`) so it does not render as an empty spacer for members; only render spacing when the Join CTA is shown for non-members.

**User-visible outcome:** Mobile search modal layout aligns correctly, and Home/Tags/Tag/Pond pages no longer show unwanted extra gaps or padding—especially on mobile—while preserving existing layouts and the Join Pond CTA behavior.
