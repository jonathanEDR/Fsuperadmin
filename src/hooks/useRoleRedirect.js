// useRoleRedirect.js - Hook personalizado para manejar redirecciones basadas en roles
import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { getFullApiUrl, safeFetch } from '../config/api';

export const useRoleRedirect = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const isProcessing = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3; // Máximo 3 intentos

  useEffect(() => {
    // Verificar si ya se redirigió en esta sesión
    const sessionRedirectKey = 'roleRedirectCompleted';
    if (sessionStorage.getItem(sessionRedirectKey)) {
      console.log('🔄 Redirect already completed in this session');
      return;
    }

    // Evitar múltiples ejecuciones
    if (hasRedirected.current || isProcessing.current) {
      console.log('🔄 Already processing or redirected');
      return;
    }

    // Verificar si hemos excedido el número de reintentos
    if (retryCount.current >= maxRetries) {
      console.error('❌ Max retries exceeded, stopping redirect attempts');
      hasRedirected.current = true;
      sessionStorage.setItem('roleRedirectCompleted', 'true');
      navigate('/network-error', { replace: true });
      return;
    }

    const performRedirect = async () => {
      try {
        // Marcar como en proceso
        isProcessing.current = true;
        retryCount.current += 1;
        
        console.log(`🔄 Starting role-based redirect... (attempt ${retryCount.current}/${maxRetries})`);
        
        const token = await getToken();
        if (!token) {
          console.log('❌ No token found, redirecting to login');
          hasRedirected.current = true;
          sessionStorage.setItem('roleRedirectCompleted', 'true');
          navigate('/login', { replace: true });
          return;
        }

        console.log('🔑 Token obtained successfully');

        let response;
        try {
          const apiUrl = getFullApiUrl('/auth/user-role-check');
          console.log('🌐 Making request to:', apiUrl);
          
          response = await safeFetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (fetchError) {
          console.error('❌ Network error during fetch:', fetchError);
          
          // Si es el último intento, marcar como completado
          if (retryCount.current >= maxRetries) {
            hasRedirected.current = true;
            sessionStorage.setItem('roleRedirectCompleted', 'true');
            navigate('/network-error', { replace: true });
          } else {
            // Intentar de nuevo después de un delay
            setTimeout(() => {
              isProcessing.current = false;
            }, 2000 * retryCount.current); // Delay incremental
          }
          return;
        }

        console.log('📡 API Response status:', response.status);

        // Si es 503 (Service Unavailable), manejar específicamente
        if (response.status === 503) {
          console.error('🚫 Backend service unavailable (503)');
          
          if (retryCount.current >= maxRetries) {
            hasRedirected.current = true;
            sessionStorage.setItem('roleRedirectCompleted', 'true');
            navigate('/service-unavailable', { replace: true });
          } else {
            // Intentar de nuevo después de un delay más largo para 503
            setTimeout(() => {
              isProcessing.current = false;
            }, 5000 * retryCount.current); // 5s, 10s, 15s
          }
          return;
        }

        if (!response.ok) {
          console.log('❌ Error fetching profile');
          hasRedirected.current = true;
          sessionStorage.setItem('roleRedirectCompleted', 'true');
          
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
        
        if (retryCount.current >= maxRetries) {
          hasRedirected.current = true;
          sessionStorage.setItem('roleRedirectCompleted', 'true');
          navigate('/network-error', { replace: true });
        } else {
          // Reintentar después de un delay
          setTimeout(() => {
            isProcessing.current = false;
          }, 3000 * retryCount.current);
        }
      } finally {
        // Solo marcar como no procesando si hemos terminado definitivamente
        if (hasRedirected.current || retryCount.current >= maxRetries) {
          isProcessing.current = false;
        }
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
