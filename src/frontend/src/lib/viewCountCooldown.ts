// Per-lily cooldown helper for view counting
// Stores last-increment timestamp per lily ID in localStorage

const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes cooldown
const STORAGE_KEY_PREFIX = 'lily_view_cooldown_';

/**
 * Check if a lily ID is within the cooldown window
 * @param lilyId - The lily (post) ID to check
 * @returns true if within cooldown (should NOT increment), false if cooldown expired (can increment)
 */
export function isWithinCooldown(lilyId: string): boolean {
  try {
    const storageKey = STORAGE_KEY_PREFIX + lilyId;
    const lastIncrementStr = localStorage.getItem(storageKey);
    
    if (!lastIncrementStr) {
      return false; // No previous increment, not in cooldown
    }
    
    const lastIncrementTime = parseInt(lastIncrementStr, 10);
    if (isNaN(lastIncrementTime)) {
      return false; // Invalid timestamp, treat as not in cooldown
    }
    
    const now = Date.now();
    const elapsed = now - lastIncrementTime;
    
    return elapsed < COOLDOWN_DURATION_MS;
  } catch (error) {
    console.error('Error checking view count cooldown:', error);
    return false; // On error, allow increment
  }
}

/**
 * Record a successful view increment timestamp for a lily ID
 * @param lilyId - The lily (post) ID that was incremented
 */
export function recordViewIncrement(lilyId: string): void {
  try {
    const storageKey = STORAGE_KEY_PREFIX + lilyId;
    const now = Date.now();
    localStorage.setItem(storageKey, now.toString());
  } catch (error) {
    console.error('Error recording view count increment:', error);
  }
}

/**
 * Clear cooldown for a lily ID (useful for testing or manual reset)
 * @param lilyId - The lily (post) ID to clear
 */
export function clearCooldown(lilyId: string): void {
  try {
    const storageKey = STORAGE_KEY_PREFIX + lilyId;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error clearing view count cooldown:', error);
  }
}
