import { useEffect, useRef } from 'react';
import { useActor } from './useActor';
import { getPhraseHashUserId } from '@/lib/user';

const SESSION_INIT_KEY = 'ribbit_froggy_phrase_initialized';

/**
 * Hook that automatically initializes Froggy Phrase access control on app startup.
 * Runs once per session after an actor is available.
 * Ensures Froggy Phrase users receive the #user role automatically.
 */
export function useInitializeFroggyPhraseAccessControl() {
  const { actor, isFetching } = useActor();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip if already initialized in this component instance
    if (hasInitialized.current) {
      return;
    }

    // Skip if actor is not ready
    if (!actor || isFetching) {
      return;
    }

    // Check if already initialized in this session
    const sessionInitialized = sessionStorage.getItem(SESSION_INIT_KEY);
    if (sessionInitialized === 'true') {
      hasInitialized.current = true;
      return;
    }

    // Initialize Froggy Phrase access control
    const initialize = async () => {
      try {
        const userId = await getPhraseHashUserId();
        
        // Only initialize if we have a valid userId (phrase exists)
        if (userId && userId !== '') {
          await actor.initializeFroggyPhrase(userId);
          
          // Mark as initialized for this session
          sessionStorage.setItem(SESSION_INIT_KEY, 'true');
          hasInitialized.current = true;
          
          console.log('Froggy Phrase access control initialized successfully');
        }
      } catch (error) {
        // Log error but don't crash the app
        console.error('Failed to initialize Froggy Phrase access control:', error);
        // Don't set hasInitialized so it can retry on next actor change
      }
    };

    initialize();
  }, [actor, isFetching]);
}
