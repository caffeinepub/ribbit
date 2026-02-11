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

export function setFroggyPhrase(phrase: string): void {
  const trimmedPhrase = phrase.trim();
  const words = trimmedPhrase.split(/\s+/);
  
  if (words.length < 5) {
    throw new Error('Froggy Phrase must contain at least 5 words');
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

export function getFroggyPhrase(): string | null {
  const obfuscated = localStorage.getItem(`${FROGGY_PHRASE_KEY}_original`);
  if (!obfuscated) return null;
  
  try {
    return atob(obfuscated);
  } catch {
    return null;
  }
}

export function restoreFromFroggyPhrase(phrase: string): boolean {
  const trimmedPhrase = phrase.trim();
  const words = trimmedPhrase.split(/\s+/);
  
  if (words.length < 5) {
    return false;
  }
  
  const hashedPhrase = hashPhrase(trimmedPhrase);
  const storedHash = localStorage.getItem(FROGGY_PHRASE_KEY);
  
  if (hashedPhrase !== storedHash) {
    return false;
  }
  
  // Restore settings from backup
  const backupData = localStorage.getItem(SETTINGS_BACKUP_KEY);
  if (!backupData) {
    return false;
  }
  
  try {
    const settings = JSON.parse(backupData);
    localStorage.setItem(USERNAME_KEY, settings.username);
    localStorage.setItem(USER_ID_KEY, settings.userId.toString());
    localStorage.setItem(USERNAME_CHANGED_KEY, settings.usernameChanged ? 'true' : 'false');
    if (settings.previousUsername) {
      localStorage.setItem(PREVIOUS_USERNAME_KEY, settings.previousUsername);
    }
    return true;
  } catch {
    return false;
  }
}

export function clearFroggyPhrase(): void {
  localStorage.removeItem(FROGGY_PHRASE_KEY);
  localStorage.removeItem(`${FROGGY_PHRASE_KEY}_original`);
  localStorage.removeItem(SETTINGS_BACKUP_KEY);
}

/**
 * Compute SHA-256 hash of the Froggy Phrase as lowercase hex string.
 * Returns empty string if no phrase is set (anonymous mode).
 */
export async function getPhraseHashUserId(): Promise<string> {
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
