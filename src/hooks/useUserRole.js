import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getFullApiUrl, safeFetch } from '../config/api';

/**
 * Hook personalizado para obtener el rol del usuario desde el backend
 * de manera consistente en toda la aplicación
 */
export const useUserRole = () => {
  const { getToken } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          setUserRole('user'); // Rol por defecto
          return;
        }

        const response = await safeFetch(getFullApiUrl('/auth/user-profile'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.warn('Error fetching user profile, using default role');
          setUserRole('user');
          return;
        }

        const profileData = await response.json();
        const role = profileData.user?.role || 'user';
        
        console.log('🔍 useUserRole - Role fetched from backend:', role);
        setUserRole(role);

      } catch (error) {
        console.error('Error fetching user role:', error);
        setError(error.message);
        setUserRole('user'); // Rol por defecto en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [getToken]);

  return { userRole, isLoading, error };
};
