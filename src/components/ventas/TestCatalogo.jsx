// Test del Catálogo de Ventas
import React from 'react';
import CatalogoVentas from './catalogo/CatalogoVentas';

const TestCatalogo = () => {
  const handleConfirmarVenta = (productos) => {
    console.log('Productos seleccionados:', productos);
    alert(`Se seleccionaron ${productos.length} productos`);
  };

  return (
    <div>
      <h1>Test del Catálogo de Ventas</h1>
      <CatalogoVentas
        isOpen={true}
        onClose={() => console.log('Cerrar catálogo')}
        onConfirmarVenta={handleConfirmarVenta}
        userRole="admin"
      />
    </div>
  );
};

export default TestCatalogo;
