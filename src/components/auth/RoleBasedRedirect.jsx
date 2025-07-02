// RoleBasedRedirect.jsx - Componente para redirigir según el rol
import { memo } from 'react';
import { useRoleRedirect } from '../../hooks/useRoleRedirect';

const RoleBasedRedirect = () => {
  const { hasRedirected } = useRoleRedirect();

  // Mostrar loading mientras se hace la redirección
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {hasRedirected ? 'Redirigiendo...' : 'Verificando autenticación...'}
        </p>
      </div>
    </div>
  );
};

export default memo(RoleBasedRedirect);
