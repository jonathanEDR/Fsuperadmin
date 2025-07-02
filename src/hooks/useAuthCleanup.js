// useAuthCleanup.js - Hook para limpiar el estado cuando el usuario se desloguea
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useAuthCleanup = () => {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    // Si el usuario no está logueado, limpiar el sessionStorage
    if (!isSignedIn) {
      sessionStorage.removeItem('roleRedirectCompleted');
      console.log('🧹 Auth cleanup: Cleared session storage');
    }
  }, [isSignedIn]);
};
