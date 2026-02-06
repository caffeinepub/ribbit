/**
 * Validates that a pond name contains only alphanumeric characters (letters and numbers).
 * No spaces, hyphens, underscores, or punctuation allowed.
 */
export function isAlphanumeric(text: string): boolean {
  if (!text || text.length === 0) return false;
  return /^[a-zA-Z0-9]+$/.test(text);
}

/**
 * Normalizes a pond name to lowercase alphanumeric format.
 * Returns the lowercased version if valid, or null if invalid.
 */
export function normalizePondName(name: string): string | null {
  const trimmed = name.trim();
  if (!isAlphanumeric(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

/**
 * Gets a user-friendly error message for invalid pond names.
 */
export function getPondNameValidationError(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Pond name is required';
  }
  
  if (!isAlphanumeric(name.trim())) {
    return 'Pond name can only contain letters and numbers (no spaces, hyphens, or special characters)';
  }
  
  return null;
}
