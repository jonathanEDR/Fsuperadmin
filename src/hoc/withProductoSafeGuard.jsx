import React from 'react';

/**
 * Higher Order Component que protege contra errores de productos nulos
 * Intercepta todos los mapeos de productos y los filtra automáticamente
 */

const withProductoSafeGuard = (WrappedComponent) => {
  return React.forwardRef((props, ref) => {
    // Interceptar y limpiar todas las props que contengan arrays de productos
    const cleanProps = React.useMemo(() => {
      const cleaned = { ...props };
      
      // Lista de props comunes que pueden contener productos
      const productArrayProps = [
        'productos', 
        'ventas', 
        'items', 
        'productList', 
        'data',
        'ventasToRender'
      ];
      
      productArrayProps.forEach(propName => {
        if (cleaned[propName]) {
          if (Array.isArray(cleaned[propName])) {
            // Si es array directo de productos
            cleaned[propName] = cleanProductArray(cleaned[propName]);
          } else if (cleaned[propName].productos) {
            // Si es objeto que contiene productos (como venta)
            cleaned[propName] = {
              ...cleaned[propName],
              productos: cleanProductArray(cleaned[propName].productos)
            };
          } else if (Array.isArray(cleaned[propName]) && cleaned[propName][0]?.productos) {
            // Si es array de objetos que contienen productos (como array de ventas)
            cleaned[propName] = cleaned[propName].map(item => ({
              ...item,
              productos: cleanProductArray(item.productos || [])
            }));
          }
        }
      });
      
      return cleaned;
    }, [props]);

    return <WrappedComponent {...cleanProps} ref={ref} />;
  });
};

/**
 * Función para limpiar arrays de productos
 */
const cleanProductArray = (productos) => {
  if (!Array.isArray(productos)) {
    console.warn('cleanProductArray: Se esperaba un array, recibido:', typeof productos);
    return [];
  }
  
  return productos
    .filter(producto => {
      if (producto == null) {
        console.warn('🔧 ProductoSafeGuard: Producto null/undefined filtrado');
        return false;
      }
      return true;
    })
    .map(producto => {
      // Asegurar que el producto tenga estructura básica
      if (!producto.productoId && !producto.nombre) {
        console.warn('🔧 ProductoSafeGuard: Producto sin nombre normalizado:', producto);
        return {
          ...producto,
          nombre: producto.nombre || 'Producto sin nombre',
          productoId: producto.productoId || {
            nombre: 'Producto sin nombre',
            _id: null
          }
        };
      }
      
      // Si el producto tiene productoId pero es null, normalizarlo
      if (producto.productoId === null) {
        return {
          ...producto,
          productoId: {
            nombre: producto.nombre || 'Producto sin nombre',
            _id: null
          }
        };
      }
      
      return producto;
    });
};

export default withProductoSafeGuard;
