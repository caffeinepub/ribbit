# Specification

## Summary
**Goal:** Remove recurring authorization failures for normal (non-admin) phrase-hash/anonymous user flows and ensure pond creators are automatically joined as members at creation time.

**Planned changes:**
- Neutralize/remove AccessControl role/permission checks for standard non-admin backend actions (profiles, usernames, pond membership, posting, liking) so phrase-hash/anonymous callers do not hit “Unauthorized” traps during typical usage.
- Keep explicit admin-only backend operations protected so non-admin callers still trap/reject when attempting admin-guarded actions.
- Adjust phrase-hash identity linkage logic so first-time phrase-hash users can establish linkage and use phrase-hash endpoints without relying on AccessControl.initialize or any #user permission state, enforcing ownership via userIdLinkage where needed.
- Update pond creation flow so the creator is automatically added to the pond’s membership (and memberCount reflects it) without requiring AccessControl #user permission.

**User-visible outcome:** Normal users (including first-time phrase-hash/anonymous callers) can use the app’s core features without unexpected “Unauthorized” errors, and creating a pond immediately makes the creator a member without manual joining.
