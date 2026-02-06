# Specification

## Summary
**Goal:** Enforce alphanumeric-only validation for new pond names during pond creation.

**Planned changes:**
- Update the Create Pond UI (frontend/src/pages/CreatePondPage.tsx) to validate pond names as strictly letters and/or numbers, block submission on any non-alphanumeric character, and show a clear English validation message.
- Remove any frontend behavior that derives/submits a hyphenated slug or other transformed variant; submit only the validated alphanumeric-only pond name.
- Add backend validation in backend/main.mo so createPond rejects (traps) if the pond name contains any non-alphanumeric character, preventing bypass via direct canister calls.

**User-visible outcome:** When creating a pond, users can only submit names made of letters and numbers; names containing spaces, hyphens, underscores, or punctuation are rejected with a clear validation message.
