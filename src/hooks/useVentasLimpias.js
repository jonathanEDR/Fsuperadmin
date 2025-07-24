import { useMemo } from 'react';

/**
 * Hook para limpiar y normalizar datos de ventas
 * Asegura que no haya productos null que causen errores
 */
export const useVentasLimpias = (ventas) => {
  return useMemo(() => {
    if (!Array.isArray(ventas)) {
      console.warn('useVentasLimpias: ventas no es un array:', typeof ventas);
      return [];
    }

    return ventas.map(venta => {
      if (!venta) {
        console.warn('useVentasLimpias: venta null encontrada');
        return null;
      }

      // Limpiar productos de la venta
      const productosLimpios = limpiarProductos(venta.productos || []);

      return {
        ...venta,
        productos: productosLimpios
      };
    }).filter(Boolean); // Eliminar ventas null
  }, [ventas]);
};

/**
 * Hook para limpiar array de productos directo
 */
export const useProductosLimpios = (productos) => {
  return useMemo(() => {
    return limpiarProductos(productos || []);
  }, [productos]);
};

/**
 * Función para limpiar array de productos
 */
const limpiarProductos = (productos) => {
  if (!Array.isArray(productos)) {
    console.warn('limpiarProductos: productos no es un array:', typeof productos);
    return [];
  }

  return productos
    .filter(producto => {
      if (producto == null) {
        console.warn('🧹 useVentasLimpias: Producto null eliminado');
        return false;
      }
      return true;
    })
    .map(producto => {
      // Normalizar estructura del producto
      const normalizado = { ...producto };

      // Si productoId es null, crear estructura mínima
      if (normalizado.productoId === null || normalizado.productoId === undefined) {
        normalizado.productoId = {
          _id: null,
          nombre: normalizado.nombre || 'Producto sin nombre',
          categoryId: null
        };
      }

      // Si productoId existe pero no tiene nombre, asignarlo
      if (normalizado.productoId && !normalizado.productoId.nombre) {
        normalizado.productoId.nombre = normalizado.nombre || 'Producto sin nombre';
      }

      // Asegurar propiedades mínimas
      if (!normalizado.nombre && !normalizado.productoId?.nombre) {
        normalizado.nombre = 'Producto sin nombre';
        if (normalizado.productoId) {
          normalizado.productoId.nombre = 'Producto sin nombre';
        }
      }

      // Asegurar cantidades numéricas
      normalizado.cantidad = Number(normalizado.cantidad) || 0;
      normalizado.precioUnitario = Number(normalizado.precioUnitario) || 0;
      normalizado.subtotal = Number(normalizado.subtotal) || 0;

      return normalizado;
    });
};

/**
 * Hook para datos de ventas con validación completa
 */
export const useVentasSafe = (ventas) => {
  const ventasLimpias = useVentasLimpias(ventas);
  
  return useMemo(() => {
    return {
      ventas: ventasLimpias,
      stats: {
        total: ventasLimpias.length,
        conProductos: ventasLimpias.filter(v => v.productos && v.productos.length > 0).length,
        sinProductos: ventasLimpias.filter(v => !v.productos || v.productos.length === 0).length
      }
    };
  }, [ventasLimpias]);
};

export default useVentasLimpias;
