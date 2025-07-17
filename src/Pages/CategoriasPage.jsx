import React, { useEffect } from 'react';
import CategoryList from '../components/productos/CategoryList';

const CategoriasPage = () => {
  useEffect(() => {
    document.title = 'Gestión de Categorías | Panel de Control';
  }, []);

  return (
    <div className="flex-1 p-4 min-h-0 overflow-auto">
      <CategoryList />
    </div>
  );
};

export default CategoriasPage;
