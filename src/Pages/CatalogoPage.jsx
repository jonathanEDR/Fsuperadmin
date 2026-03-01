import React from 'react';
import { Loader2 } from 'lucide-react';
import CatalogoVentasPageView from '../components/ventas/catalogo/CatalogoVentasPageView';
import { useUserRole } from '../hooks/useUserRole';
import ProductoErrorBoundary from '../components/common/ProductoErrorBoundary';

function CatalogoPage() {
  const { userRole, isLoading, error } = useUserRole();

  // Mostrar loading mientras se obtiene el rol
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error al cargar el perfil del usuario</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ProductoErrorBoundary>
      <CatalogoVentasPageView userRole={userRole} />
    </ProductoErrorBoundary>
  );
}

export default CatalogoPage;
