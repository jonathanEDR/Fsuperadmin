import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { validarCarrito, validarFormularioVenta } from '../utils/ventaValidators';
import { getLocalDateTimeString } from '../utils/ventaHelpers';

/**
 * Hook personalizado para gestionar el formulario de venta
 * @param {Function} onVentaCreated - Callback cuando se crea una venta exitosamente
 * @param {Function} onClose - Callback para cerrar el modal
 * @returns {Object} Estado y funciones del formulario
 */
export const useVentaForm = (onVentaCreated, onClose) => {
  const { getToken } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    fechadeVenta: getLocalDateTimeString(),
    estadoPago: 'Pendiente',
    cantidadPagada: 0,
    targetUserId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Actualiza un campo del formulario
   */
  const actualizarCampo = useCallback((campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  /**
   * Actualiza múltiples campos del formulario
   */
  const actualizarFormulario = useCallback((datos) => {
    setFormData(prev => ({
      ...prev,
      ...datos
    }));
  }, []);

  /**
   * Resetea el formulario a sus valores iniciales
   */
  const resetearFormulario = useCallback(() => {
    setFormData({
      fechadeVenta: getLocalDateTimeString(),
      estadoPago: 'Pendiente',
      cantidadPagada: 0,
      targetUserId: ''
    });
    setError('');
    setSuccessMessage('');
  }, []);

  /**
   * Envía la venta al backend
   */
  const enviarVenta = useCallback(async (carrito, montoTotal, actualizarStock) => {
    if (isSubmitting) {
      return { success: false, error: 'Ya se está procesando una venta' };
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Validar carrito
      const validacionCarrito = validarCarrito(carrito);
      if (!validacionCarrito.valid) {
        throw new Error(validacionCarrito.error);
      }

      // Validar formulario
      const validacionFormulario = validarFormularioVenta(formData, montoTotal);
      if (!validacionFormulario.valid) {
        throw new Error(validacionFormulario.error);
      }

      // Obtener token de autenticación
      const token = await getToken();

      // Preparar datos para enviar
      const ventaData = {
        productos: carrito.map(item => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        })),
        fechadeVenta: formData.fechadeVenta,
        montoTotal,
        estadoPago: formData.estadoPago,
        cantidadPagada: Number(formData.cantidadPagada) || 0,
        targetUserId: formData.targetUserId || undefined
      };

      // Enviar petición al backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ventaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la venta');
      }

      const data = await response.json();

      // Actualizar stock local si se proporciona la función
      if (actualizarStock) {
        actualizarStock(carrito);
      }

      // Mostrar mensaje de éxito
      setSuccessMessage('✓ Venta creada exitosamente');

      // Notificar al componente padre
      if (onVentaCreated) {
        onVentaCreated(data.venta);
      }

      // Resetear formulario
      resetearFormulario();

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 500);

      return { success: true, data: data.venta };

    } catch (error) {
      const errorMessage = error.message || 'Error al crear la venta';
      setError(errorMessage);
      console.error('Error creating venta:', error);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, getToken, onVentaCreated, onClose, resetearFormulario]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = useCallback((e, carrito, montoTotal, actualizarStock) => {
    if (e) {
      e.preventDefault();
    }
    return enviarVenta(carrito, montoTotal, actualizarStock);
  }, [enviarVenta]);

  return {
    formData,
    isSubmitting,
    error,
    successMessage,
    actualizarCampo,
    actualizarFormulario,
    resetearFormulario,
    enviarVenta,
    handleSubmit,
    setError,
    setSuccessMessage
  };
};
