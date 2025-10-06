/**
 * Validaciones para el módulo de creación de ventas
 */

/**
 * Valida un producto antes de agregarlo al carrito
 * @param {Object} producto - Producto a validar
 * @param {number} cantidad - Cantidad solicitada
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validarProducto = (producto, cantidad) => {
  if (!producto) {
    return { valid: false, error: 'Selecciona un producto' };
  }

  if (!producto.nombre || producto.nombre.trim() === '') {
    return { 
      valid: false, 
      error: 'Este producto no tiene nombre válido. Contacta al administrador.' 
    };
  }

  if (!producto.precio || producto.precio <= 0) {
    return { 
      valid: false, 
      error: 'Este producto no tiene precio válido. Contacta al administrador.' 
    };
  }

  if (cantidad <= 0) {
    return { 
      valid: false, 
      error: 'La cantidad debe ser mayor a 0' 
    };
  }

  if (cantidad > producto.cantidadRestante) {
    return { 
      valid: false, 
      error: `Solo hay ${producto.cantidadRestante} unidades disponibles` 
    };
  }

  return { valid: true, error: null };
};

/**
 * Valida el carrito antes de crear la venta
 * @param {Array} carrito - Items del carrito
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validarCarrito = (carrito) => {
  if (!carrito || carrito.length === 0) {
    return { 
      valid: false, 
      error: 'Agrega al menos un producto' 
    };
  }

  // Validar cada item del carrito
  for (const item of carrito) {
    if (!item.nombre || item.nombre.trim() === '') {
      return { 
        valid: false, 
        error: 'Hay productos sin nombre válido en el carrito' 
      };
    }

    if (!item.precioUnitario || item.precioUnitario <= 0) {
      return { 
        valid: false, 
        error: 'Hay productos sin precio válido en el carrito' 
      };
    }

    if (!item.cantidad || item.cantidad <= 0) {
      return { 
        valid: false, 
        error: 'Hay productos con cantidad inválida en el carrito' 
      };
    }

    if (!item.productoId) {
      return { 
        valid: false, 
        error: 'Hay productos sin ID válido en el carrito' 
      };
    }
  }

  return { valid: true, error: null };
};

/**
 * Valida los datos del formulario de venta
 * @param {Object} formData - Datos del formulario
 * @param {number} montoTotal - Monto total de la venta
 * @returns {Object} - { valid: boolean, error: string }
 */
/**
 * Valida los datos del formulario de venta
 * @param {Object} formData - Datos del formulario
 * @param {number} montoTotal - Monto total de la venta
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validarFormularioVenta = (formData, montoTotal) => {
  if (!formData.fechadeVenta) {
    return { 
      valid: false, 
      error: 'La fecha de venta es requerida' 
    };
  }

  if (!formData.targetUserId) {
    return { 
      valid: false, 
      error: 'Debes seleccionar un cliente' 
    };
  }

  if (montoTotal <= 0) {
    return { 
      valid: false, 
      error: 'El monto total debe ser mayor a 0' 
    };
  }

  return { valid: true, error: null };
};

/**
 * Valida que un producto tiene los datos mínimos requeridos
 * @param {Object} producto - Producto a validar
 * @returns {boolean} - true si el producto es válido
 */
export const esProductoValido = (producto) => {
  return (
    producto &&
    producto.nombre &&
    producto.nombre.trim() !== '' &&
    producto.precio &&
    producto.precio > 0 &&
    producto.cantidadRestante > 0
  );
};
