import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Componente para renderizar información de productos de forma segura
 * Maneja casos donde el producto puede ser null o tener datos incompletos
 */
const ProductoSafeDisplay = ({ 
  producto, 
  children, 
  fallbackComponent = null,
  showError = true 
}) => {
  // Verificar si el producto existe
  if (!producto) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    
    if (showError) {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Producto no encontrado</span>
        </div>
      );
    }
    
    return null;
  }

  // Verificar si tiene datos mínimos necesarios
  const productoData = producto.productoId || producto;
  
  if (!productoData) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    
    if (showError) {
      return (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Datos de producto incompletos</span>
        </div>
      );
    }
    
    return null;
  }

  // Si todo está bien, renderizar el contenido
  return children;
};

/**
 * Hook para crear props seguras para productos
 */
export const useProductoProps = (producto) => {
  if (!producto) {
    return {
      nombre: 'Producto no disponible',
      categoria: 'Sin categoría',
      precio: 0,
      isValid: false
    };
  }

  const productoData = producto.productoId || producto;
  
  return {
    nombre: productoData?.nombre || 'Producto sin nombre',
    categoria: productoData?.categoryId?.nombre || productoData?.categoryName || 'Sin categoría',
    precio: producto.precioUnitario || productoData?.precio || 0,
    stock: productoData?.cantidadRestante || 0,
    codigo: productoData?.codigoProducto || 'Sin código',
    isValid: !!productoData?.nombre
  };
};

export default ProductoSafeDisplay;
