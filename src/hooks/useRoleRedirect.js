// useRoleRedirect.js - Hook personalizado para manejar redirecciones basadas en roles
import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export const useRoleRedirect = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    // Verificar si ya se redirigió en esta sesión
    const sessionRedirectKey = 'roleRedirectCompleted';
    if (sessionStorage.getItem(sessionRedirectKey)) {
      console.log('🔄 Redirect already completed in this session');
      return;
    }

    // Evitar múltiples ejecuciones
    if (hasRedirected.current || isProcessing.current) {
      return;
    }

    const performRedirect = async () => {
      try {
        // Marcar como en proceso
        isProcessing.current = true;
        
        console.log('🔄 Starting role-based redirect...');
        
        const token = await getToken();
        if (!token) {
          console.log('❌ No token found, redirecting to login');
          hasRedirected.current = true;
          navigate('/login', { replace: true });
          return;
        }

        console.log('🔑 Token obtained successfully');

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        
        const response = await fetch(`${backendUrl}/api/auth/user-role-check`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 API Response status:', response.status);

        if (!response.ok) {
          console.log('❌ Error fetching profile');
          hasRedirected.current = true;
          
          if (response.status === 403) {
            console.log('🚫 Access forbidden, redirecting to sin-acceso');
            navigate('/sin-acceso', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
          return;
        }

        const profileData = await response.json();
        const userRole = profileData.user.role;
        
        console.log('✅ User role detected:', userRole);

        // Marcar como redirigido antes de navegar
        hasRedirected.current = true;
        sessionStorage.setItem('roleRedirectCompleted', 'true');

        // Redirigir según el rol
        switch (userRole) {
          case 'super_admin':
            console.log('🔴 Redirecting to Super Admin dashboard');
            navigate('/super-admin/dashboard', { replace: true });
            break;
          case 'admin':
            console.log('🟡 Redirecting to Admin dashboard');
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'de_baja':
            console.log('❌ User is "de_baja", redirecting to no access page');
            navigate('/sin-acceso', { replace: true });
            break;
          case 'user':
          default:
            console.log('🔵 Redirecting to User dashboard');
            navigate('/user/dashboard', { replace: true });
            break;
        }
      } catch (error) {
        console.error('❌ Error during role-based redirect:', error);
        hasRedirected.current = true;
        sessionStorage.setItem('roleRedirectCompleted', 'true');
        navigate('/login', { replace: true });
      } finally {
        isProcessing.current = false;
      }
    };

    // Usar setTimeout para evitar ejecución inmediata y dar tiempo a React
    const timeoutId = setTimeout(performRedirect, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // Solo ejecutar una vez

  return { hasRedirected: hasRedirected.current };
};
