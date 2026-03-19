import { useEffect } from 'react';
import { useAuthStore } from './authStore';

/**
 * Subscribes to auth store changes for side effects (e.g. sync logout across tabs).
 * Demonstrates the subscribeWithSelector pattern enabled on authStore.
 */
export function useAuthEffects(): void {
  useEffect(() => {
    const unsub = useAuthStore.subscribe(
      (state) => ({ user: state.user, token: state.token }),
      (curr, prev) => {
        if (import.meta.env.DEV) {
          const loggedOut = prev.token && !curr.token;
          const loggedIn = !prev.token && curr.token;
          if (loggedOut) console.warn('[AuthStore] User logged out');
          if (loggedIn) console.warn('[AuthStore] User logged in');
        }
      },
    );
    return unsub;
  }, []);
}
