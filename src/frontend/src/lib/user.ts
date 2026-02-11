import { UNIQUE_WORDS, FROG_TERMS } from './froggyPhraseWordList';

const USERNAME_KEY = 'ribbit_username';
const USER_ID_KEY = 'ribbit_user_id';
const USERNAME_CHANGED_KEY = 'ribbit_username_changed';
const PREVIOUS_USERNAME_KEY = 'ribbit_previous_username';
const FROGGY_PHRASE_KEY = 'ribbit_froggy_phrase';
const SETTINGS_BACKUP_KEY = 'ribbit_settings_backup';

function generateUsername(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `Frog_${randomNum}`;
}

function generateUserId(): number {
  return Math.floor(Math.random() * 1000000);
}

export function getUsername(): string {
  let username = localStorage.getItem(USERNAME_KEY);
  if (!username) {
    username = generateUsername();
    localStorage.setItem(USERNAME_KEY, username);
  }
  return username;
}

export function getUserId(): number {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    const newId = generateUserId();
    localStorage.setItem(USER_ID_KEY, newId.toString());
    return newId;
  }
  return parseInt(userId, 10);
}

export function setUsername(newUsername: string): void {
  const currentUsername = getUsername();
  localStorage.setItem(PREVIOUS_USERNAME_KEY, currentUsername);
  localStorage.setItem(USERNAME_KEY, newUsername);
  localStorage.setItem(USERNAME_CHANGED_KEY, 'true');
  
  // Update settings backup if Froggy Phrase exists
  const phrase = getFroggyPhrase();
  if (phrase) {
    backupSettings();
  }
}

export function hasChangedUsername(): boolean {
  return localStorage.getItem(USERNAME_CHANGED_KEY) === 'true';
}

export function getPreviousUsername(): string | null {
  return localStorage.getItem(PREVIOUS_USERNAME_KEY);
}

// Froggy Phrase functions
function hashPhrase(phrase: string): string {
  // Simple hash function for client-side storage
  let hash = 0;
  for (let i = 0; i < phrase.length; i++) {
    const char = phrase.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function backupSettings(): void {
  const settings = {
    username: getUsername(),
    userId: getUserId(),
    usernameChanged: hasChangedUsername(),
    previousUsername: getPreviousUsername(),
    timestamp: Date.now(),
  };
  localStorage.setItem(SETTINGS_BACKUP_KEY, JSON.stringify(settings));
}

/**
 * Generate a random 12-word Froggy Phrase from the built-in word list.
 * Ensures at least one frog-related term is included.
 */
function generateDefaultFroggyPhrase(): string {
  const words: string[] = [];
  
  // Pick 11 random words from the main list
  for (let i = 0; i < 11; i++) {
    const randomIndex = Math.floor(Math.random() * UNIQUE_WORDS.length);
    words.push(UNIQUE_WORDS[randomIndex]);
  }
  
  // Add one frog-related term at a random position
  const frogTermIndex = Math.floor(Math.random() * FROG_TERMS.length);
  const frogTerm = FROG_TERMS[frogTermIndex];
  const insertPosition = Math.floor(Math.random() * 12);
  words.splice(insertPosition, 0, frogTerm);
  
  return words.join(' ');
}

/**
 * Ensure a default Froggy Phrase exists. If none is stored, generate and persist one.
 * This should be called early in the app lifecycle.
 */
export function ensureDefaultFroggyPhrase(): void {
  const existingPhrase = getFroggyPhrase();
  if (!existingPhrase) {
    const newPhrase = generateDefaultFroggyPhrase();
    // Use internal setter that bypasses immutability check
    setFroggyPhraseInternal(newPhrase);
  }
}

/**
 * Internal setter for Froggy Phrase (used only by ensureDefaultFroggyPhrase).
 * Does not enforce immutability.
 */
function setFroggyPhraseInternal(phrase: string): void {
  const trimmedPhrase = phrase.trim();
  const words = trimmedPhrase.split(/\s+/);
  
  if (words.length !== 12) {
    throw new Error('Froggy Phrase must contain exactly 12 words');
  }
  
  // Hash the phrase for storage
  const hashedPhrase = hashPhrase(trimmedPhrase);
  localStorage.setItem(FROGGY_PHRASE_KEY, hashedPhrase);
  
  // Backup current settings
  backupSettings();
  
  // Store the original phrase (encrypted with simple XOR for obfuscation)
  const obfuscated = btoa(trimmedPhrase);
  localStorage.setItem(`${FROGGY_PHRASE_KEY}_original`, obfuscated);
}

/**
 * Attempt to set a new Froggy Phrase.
 * IMMUTABLE: If a phrase already exists, this will throw an error.
 * @throws Error if a phrase already exists
 */
export function setFroggyPhrase(phrase: string): void {
  const existingPhrase = getFroggyPhrase();
  if (existingPhrase) {
    throw new Error('Froggy Phrase already exists and cannot be changed');
  }
  
  setFroggyPhraseInternal(phrase);
}

export function getFroggyPhrase(): string | null {
  const obfuscated = localStorage.getItem(`${FROGGY_PHRASE_KEY}_original`);
  if (!obfuscated) return null;
  
  try {
    return atob(obfuscated);
  } catch {
    return null;
  }
}

/**
 * Restore from Froggy Phrase is disabled.
 * @deprecated Froggy Phrase is now permanent and cannot be used for restore.
 * @returns false always
 */
export function restoreFromFroggyPhrase(phrase: string): boolean {
  console.warn('Froggy Phrase restore is disabled. The phrase is permanent once created.');
  return false;
}

/**
 * Clear Froggy Phrase is disabled.
 * @deprecated Froggy Phrase is now permanent and cannot be cleared.
 */
export function clearFroggyPhrase(): void {
  console.warn('Froggy Phrase cannot be cleared. It is permanent once created.');
}

/**
 * Compute SHA-256 hash of the Froggy Phrase as lowercase hex string.
 * Returns empty string if no phrase is set (anonymous mode).
 * Ensures a phrase exists before computing the hash.
 */
export async function getPhraseHashUserId(): Promise<string> {
  // Ensure a phrase exists (will generate if missing)
  ensureDefaultFroggyPhrase();
  
  const phrase = getFroggyPhrase();
  if (!phrase) {
    return '';
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(phrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Failed to compute phrase hash:', error);
    return '';
  }
}
