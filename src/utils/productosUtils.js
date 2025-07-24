/**
 * Utilidades para manejo seguro de productos
 * Previene errores de null/undefined en arrays y objetos de productos
 */

/**
 * Filtra productos válidos de un array, eliminando elementos null/undefined
 * @param {Array} productos - Array de productos que puede contener elementos null
 * @returns {Array} Array filtrado con solo productos válidos
 */
export const filtrarProductosValidos = (productos) => {
  if (!Array.isArray(productos)) {
    console.warn('filtrarProductosValidos: Se esperaba un array, recibido:', typeof productos);
    return [];
  }
  
  return productos.filter(producto => {
    if (producto == null) {
      console.warn('filtrarProductosValidos: Producto null/undefined encontrado y eliminado');
      return false;
    }
    
    // Verificar que tenga al menos datos básicos
    if (!producto.productoId && !producto.nombre) {
      console.warn('filtrarProductosValidos: Producto sin ID ni nombre encontrado:', producto);
      return false;
    }
    
    return true;
  });
};

/**
 * Normaliza un producto para asegurar que tenga la estructura esperada
 * @param {Object} producto - Producto a normalizar
 * @returns {Object} Producto normalizado
 */
export const normalizarProducto = (producto) => {
  if (!producto) {
    return {
      _id: null,
      nombre: 'Producto no disponible',
      cantidad: 0,
      precioUnitario: 0,
      subtotal: 0,
      productoId: null,
      isValid: false
    };
  }

  const productoData = producto.productoId || producto;
  
  return {
    _id: producto._id || null,
    nombre: productoData?.nombre || producto.nombre || 'Producto sin nombre',
    cantidad: producto.cantidad || 0,
    precioUnitario: producto.precioUnitario || producto.precio || 0,
    subtotal: producto.subtotal || 0,
    productoId: producto.productoId || null,
    categoryId: productoData?.categoryId || null,
    categoria: productoData?.categoryId?.nombre || productoData?.categoryName || 'Sin categoría',
    codigoProducto: productoData?.codigoProducto || 'Sin código',
    isValid: !!(productoData?.nombre || producto.nombre)
  };
};

/**
 * Normaliza un array de productos
 * @param {Array} productos - Array de productos a normalizar
 * @returns {Array} Array de productos normalizados
 */
export const normalizarProductos = (productos) => {
  const productosValidos = filtrarProductosValidos(productos);
  return productosValidos.map(normalizarProducto);
};

/**
 * Valida que una venta tenga productos válidos
 * @param {Object} venta - Objeto venta a validar
 * @returns {Object} Resultado de la validación
 */
export const validarProductosVenta = (venta) => {
  if (!venta) {
    return {
      esValida: false,
      errores: ['Venta no proporcionada'],
      productosValidos: 0,
      productosInvalidos: 0
    };
  }

  if (!venta.productos || !Array.isArray(venta.productos)) {
    return {
      esValida: false,
      errores: ['Venta no tiene productos o no es un array'],
      productosValidos: 0,
      productosInvalidos: 0
    };
  }

  const errores = [];
  let productosValidos = 0;
  let productosInvalidos = 0;

  venta.productos.forEach((producto, index) => {
    if (producto == null) {
      errores.push(`Producto en posición ${index + 1} es null/undefined`);
      productosInvalidos++;
      return;
    }

    const productoData = producto.productoId || producto;
    
    if (!productoData) {
      errores.push(`Producto en posición ${index + 1} no tiene datos válidos`);
      productosInvalidos++;
      return;
    }

    if (!productoData.nombre && !producto.nombre) {
      errores.push(`Producto en posición ${index + 1} no tiene nombre`);
      productosInvalidos++;
      return;
    }

    productosValidos++;
  });

  return {
    esValida: errores.length === 0,
    errores,
    productosValidos,
    productosInvalidos
  };
};

/**
 * Limpia y normaliza una venta completa
 * @param {Object} venta - Venta a limpiar
 * @returns {Object} Venta limpia y normalizada
 */
export const limpiarVenta = (venta) => {
  if (!venta) {
    return null;
  }

  return {
    ...venta,
    productos: normalizarProductos(venta.productos || [])
  };
};

export default {
  filtrarProductosValidos,
  normalizarProducto,
  normalizarProductos,
  validarProductosVenta,
  limpiarVenta
};
