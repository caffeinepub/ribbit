# Specification

## Summary
**Goal:** Show each pond’s rank on the All Ponds (/ponds) pond cards.

**Planned changes:**
- Compute pond ranks client-side from the rendered ponds list by sorting deterministically (lilyCount desc, then memberCount desc, then name asc) and assigning ranks starting at 1.
- Update the All Ponds pond card UI to display a visible rank indicator (e.g., “#1”, “#2”, …) without overlapping the existing Join/Joined control in the top-right.

**User-visible outcome:** On the All Ponds page, each pond card clearly displays its rank (e.g., “#1”) while keeping the Join/Joined control unobstructed.
