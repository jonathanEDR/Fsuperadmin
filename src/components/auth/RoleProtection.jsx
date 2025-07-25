import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { getFullApiUrl, safeFetch } from '../../config/api';

/**
 * Componente de protección de roles que verifica el rol del usuario
 * y redirige según sea necesario
 */
const RoleProtection = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/sin-acceso',
  bypassClerkCheck = false 
}) => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verifyRole = async () => {
      try {
        // Si no hay roles específicos permitidos y no se especifica bypass, permitir acceso
        if (allowedRoles.length === 0 && !bypassClerkCheck) {
          setIsAuthorized(true);
          setIsVerifying(false);
          return;
        }

        const token = await getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        // Obtener perfil del usuario
        const response = await safeFetch(getFullApiUrl('/auth/user-profile'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          navigate('/login');
          return;
        }

        const profileData = await response.json();
        const userRole = profileData.user.role;

        // Si el usuario está dado de baja, redirigir a sin acceso
        if (userRole === 'de_baja') {
          navigate('/sin-acceso', { replace: true });
          return;
        }

        // Si hay roles específicos permitidos, verificar si el usuario tiene uno de ellos
        if (allowedRoles.length > 0) {
          if (allowedRoles.includes(userRole)) {
            setIsAuthorized(true);
          } else {
            navigate(redirectTo, { replace: true });
            return;
          }
        } else {
          // Si no hay roles específicos, permitir acceso (excepto para de_baja que ya se verificó)
          setIsAuthorized(true);
        }

      } catch (error) {
        navigate('/login');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyRole();
  }, [getToken, navigate, allowedRoles, redirectTo, bypassClerkCheck]);

  // Mostrar loading mientras se verifica el rol
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostrar el contenido
  if (isAuthorized) {
    return children;
  }

  // Si no está autorizado, no mostrar nada (ya se redirigió)
  return null;
};

export default RoleProtection;
