/**
 * Validates that a tag contains only alphanumeric characters (letters and numbers).
 * No spaces, hyphens, underscores, or punctuation allowed.
 */
export function isTagAlphanumeric(text: string): boolean {
  if (!text || text.length === 0) return false;
  return /^[a-zA-Z0-9]+$/.test(text);
}

/**
 * Normalizes a tag to lowercase alphanumeric format.
 * Returns the lowercased version if valid, or null if invalid.
 */
export function normalizeTag(tag: string): string | null {
  const trimmed = tag.trim();
  if (!isTagAlphanumeric(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

/**
 * Gets a user-friendly error message for invalid tags.
 */
export function getTagValidationError(tag: string): string | null {
  if (!tag || tag.trim().length === 0) {
    return null; // Tags are optional, so empty is valid
  }
  
  if (!isTagAlphanumeric(tag.trim())) {
    return 'Tag can only contain letters and numbers (no spaces, hyphens, or special characters)';
  }
  
  return null;
}
