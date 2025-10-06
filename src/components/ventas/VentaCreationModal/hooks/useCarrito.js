import { useState, useCallback, useMemo } from 'react';
import { validarProducto } from '../utils/ventaValidators';
import { calcularSubtotal } from '../utils/ventaHelpers';

/**
 * Hook personalizado para gestionar el carrito de ventas
 * @returns {Object} Estado y funciones del carrito
 */
export const useCarrito = () => {
  const [carrito, setCarrito] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Calcula el monto total del carrito
   */
  const montoTotal = useMemo(() => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  }, [carrito]);

  /**
   * Agrega un producto al carrito
   */
  const agregarProducto = useCallback((producto, cantidad) => {
    // Validar producto
    const validacion = validarProducto(producto, cantidad);
    if (!validacion.valid) {
      setError(validacion.error);
      return false;
    }

    // Obtener precio (puede ser precio o precioVenta)
    const precio = producto.precio || producto.precioVenta || 0;

    // Calcular subtotal
    const subtotal = calcularSubtotal(precio, cantidad);
    
    // Agregar al carrito
    setCarrito(prevCarrito => [...prevCarrito, {
      productoId: producto._id,
      nombre: producto.nombre,
      cantidad: cantidad,
      precioUnitario: precio,
      subtotal
    }]);

    // Limpiar error y mostrar mensaje de éxito
    setError('');
    const mensaje = `✓ ${producto.nombre} (${cantidad}) agregado al carrito`;
    setSuccessMessage(mensaje);
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);

    return true;
  }, []);

  /**
   * Elimina un producto del carrito por índice
   */
  const eliminarProducto = useCallback((index) => {
    setCarrito(prevCarrito => prevCarrito.filter((_, i) => i !== index));
    setError('');
    setSuccessMessage('');
  }, []);

  /**
   * Limpia completamente el carrito
   */
  const limpiarCarrito = useCallback(() => {
    setCarrito([]);
    setError('');
    setSuccessMessage('');
  }, []);

  /**
   * Obtiene la cantidad total de items en el carrito
   */
  const cantidadItems = useMemo(() => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  }, [carrito]);

  return {
    carrito,
    montoTotal,
    cantidadItems,
    error,
    successMessage,
    agregarProducto,
    eliminarProducto,
    limpiarCarrito,
    setError,
    setSuccessMessage
  };
};
