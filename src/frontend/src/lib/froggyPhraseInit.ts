import { getPhraseHashUserId } from './user';
import type { backendInterface } from '@/backend';

const INIT_CACHE_KEY = 'ribbit_froggy_phrase_initialized';

/**
 * Check if the current Froggy Phrase userId has already been initialized
 * for the given principal.
 */
function isAlreadyInitialized(principalId: string, userId: string): boolean {
  try {
    const cached = localStorage.getItem(INIT_CACHE_KEY);
    if (!cached) return false;
    
    const cacheData = JSON.parse(cached);
    return cacheData.principalId === principalId && cacheData.userId === userId;
  } catch {
    return false;
  }
}

/**
 * Mark the current Froggy Phrase userId as initialized for the given principal.
 */
function markAsInitialized(principalId: string, userId: string): void {
  try {
    const cacheData = { principalId, userId, timestamp: Date.now() };
    localStorage.setItem(INIT_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache Froggy Phrase initialization:', error);
  }
}

/**
 * Clear the initialization cache (e.g., on logout).
 */
export function clearFroggyPhraseInitCache(): void {
  try {
    localStorage.removeItem(INIT_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear Froggy Phrase init cache:', error);
  }
}

/**
 * Initialize Froggy Phrase linkage with the authenticated actor.
 * This links the phrase-hash userId to the authenticated principal and assigns #user role.
 * 
 * @param actor - The authenticated backend actor
 * @param principalId - The authenticated principal ID as string
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeFroggyPhraseIfNeeded(
  actor: backendInterface,
  principalId: string
): Promise<void> {
  try {
    // Get the current phrase-hash userId
    const userId = await getPhraseHashUserId();
    
    // Skip if no userId (shouldn't happen, but defensive)
    if (!userId || userId === '') {
      console.warn('No Froggy Phrase userId available for initialization');
      return;
    }
    
    // Skip if already initialized for this principal + userId combo
    if (isAlreadyInitialized(principalId, userId)) {
      return;
    }
    
    // Call backend to link userId with principal and assign #user role
    await actor.initializeFroggyPhrase(userId);
    
    // Cache the initialization to avoid repeated calls
    markAsInitialized(principalId, userId);
    
    console.log('Froggy Phrase initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Froggy Phrase:', error);
    // Don't throw - allow the app to continue even if initialization fails
  }
}
