import type { Pond } from '@/backend';

/**
 * Deterministically sort ponds and assign ranks.
 * Sort order: lilyCount (desc), then memberCount (desc), then name (asc).
 * Returns a Map of pond name -> rank (starting at 1).
 */
export function computePondRanks(ponds: Pond[]): Map<string, number> {
  const sorted = [...ponds].sort((a, b) => {
    // First: lilyCount descending
    const lilyA = Number(a.lilyCount);
    const lilyB = Number(b.lilyCount);
    if (lilyA !== lilyB) {
      return lilyB - lilyA;
    }

    // Second: memberCount descending
    const memberA = Number(a.memberCount);
    const memberB = Number(b.memberCount);
    if (memberA !== memberB) {
      return memberB - memberA;
    }

    // Third: name ascending
    return a.name.localeCompare(b.name);
  });

  const rankMap = new Map<string, number>();
  sorted.forEach((pond, index) => {
    rankMap.set(pond.name, index + 1);
  });

  return rankMap;
}
