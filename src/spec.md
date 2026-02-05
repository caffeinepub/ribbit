# Specification

## Summary
**Goal:** Extend the backend tag system to persist per-tag usage stats and bounded time-window activity tracking as groundwork for future Tag Hub ranking features.

**Planned changes:**
- Extend the backend tag data model to store per-canonical-tag stats: postsTotal, repliesTotal, firstUsedAt, and lastActivityAt (respecting existing tag merge/canonicalization behavior).
- Update backend write paths so createPost (when tag is non-null) increments the canonical tag’s postsTotal and updates firstUsedAt/lastActivityAt, and createRibbit (when parent post has a non-null tag) increments repliesTotal and updates lastActivityAt.
- Add bounded per-tag time-window/bucketed activity tracking updated on createPost/createRibbit for tagged content, suitable for later Trending/Newest computations without scanning all posts/ribbits.

**User-visible outcome:** No frontend/UI changes; backend now automatically tracks canonical tag usage totals and recent activity history for use in later Tag Hub features.
