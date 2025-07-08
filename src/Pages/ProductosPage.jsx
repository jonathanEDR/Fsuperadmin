import React from 'react';
import ProductoList from '../components/productos/ProductoList';
import { useUserRole } from '../hooks/useUserRole';

function ProductosPage() {
  const { userRole, isLoading, error } = useUserRole();
  
  // ...existing code...

  // Mostrar loading mientras se obtiene el rol
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
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
    <div className="space-y-6">
      <ProductoList userRole={userRole} />
    </div>
  );
}

export default ProductosPage;
