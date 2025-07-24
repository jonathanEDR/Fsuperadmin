import { useMemo } from 'react';

/**
 * Hook personalizado para manejar productos de forma segura
 * Previene errores de lectura de propiedades null/undefined
 */
export const useProductoSafe = (producto) => {
  return useMemo(() => {
    if (!producto) {
      return {
        id: null,
        nombre: 'Producto no disponible',
        categoria: 'Sin categoría',
        precio: 0,
        cantidad: 0,
        subtotal: 0,
        isValid: false,
        error: 'Producto no encontrado'
      };
    }

    // Manejar estructura de productos en ventas (con productoId)
    const productoData = producto.productoId || producto;
    
    if (!productoData) {
      return {
        id: null,
        nombre: 'Producto no disponible',
        categoria: 'Sin categoría',
        precio: producto.precioUnitario || 0,
        cantidad: producto.cantidad || 0,
        subtotal: producto.subtotal || 0,
        isValid: false,
        error: 'Datos de producto incompletos'
      };
    }

    return {
      id: productoData._id || productoData.id,
      nombre: productoData.nombre || 'Producto sin nombre',
      categoria: productoData.categoryId?.nombre || productoData.categoryName || 'Sin categoría',
      precio: producto.precioUnitario || productoData.precio || 0,
      cantidad: producto.cantidad || 0,
      subtotal: producto.subtotal || 0,
      stock: productoData.cantidadRestante || 0,
      codigo: productoData.codigoProducto || 'Sin código',
      isValid: true,
      error: null,
      // Datos originales para casos especiales
      original: producto,
      productoData: productoData
    };
  }, [producto]);
};

/**
 * Hook para validar lista de productos
 */
export const useProductosListSafe = (productos) => {
  return useMemo(() => {
    if (!Array.isArray(productos)) {
      return {
        productos: [],
        validCount: 0,
        invalidCount: 0,
        errors: ['La lista de productos no es válida']
      };
    }

    const errors = [];
    let validCount = 0;
    let invalidCount = 0;

    const productosSeguros = productos.map((producto, index) => {
      if (!producto) {
        errors.push(`Producto en posición ${index + 1} es null o undefined`);
        invalidCount++;
        return null;
      }

      const productoData = producto.productoId || producto;
      
      if (!productoData) {
        errors.push(`Producto en posición ${index + 1} no tiene datos válidos`);
        invalidCount++;
        return null;
      }

      if (!productoData.nombre) {
        errors.push(`Producto en posición ${index + 1} no tiene nombre`);
        invalidCount++;
      }

      validCount++;
      return producto;
    }).filter(Boolean); // Eliminar elementos null

    return {
      productos: productosSeguros,
      validCount,
      invalidCount,
      errors,
      hasErrors: errors.length > 0
    };
  }, [productos]);
};

export default useProductoSafe;
