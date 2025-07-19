// Servicio unificado para gestión de cantidades en ventas y devoluciones
import api from './api';

/**
 * Servicio centralizado para manejar todas las operaciones de cantidad
 * que pueden afectar tanto ventas como devoluciones
 */
class CantidadService {
  
  /**
   * Actualizar cantidad de producto en venta
   * @param {string} ventaId - ID de la venta
   * @param {string} productoId - ID del producto
   * @param {number} nuevaCantidad - Nueva cantidad
   * @param {string} tipoOperacion - 'manual' | 'devolucion' | 'ajuste'
   * @param {string} motivo - Motivo del cambio (opcional)
   */
  async actualizarCantidadEnVenta(ventaId, productoId, nuevaCantidad, tipoOperacion = 'manual', motivo = '') {
    try {
      console.log('🔍 CantidadService - Actualizando cantidad:', {
        ventaId,
        productoId,
        nuevaCantidad,
        tipoOperacion,
        motivo
      });

      const response = await api.put(`/api/ventas/${ventaId}/productos/${productoId}/cantidad`, {
        nuevaCantidad,
        tipoOperacion,
        motivo
      });

      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }

      console.log('✅ CantidadService - Cantidad actualizada:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ CantidadService - Error al actualizar cantidad:', error);
      
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar cantidad');
      } else if (error.request) {
        throw new Error('No se pudo conectar con el servidor');
      } else {
        throw new Error(error.message || 'Error al actualizar cantidad');
      }
    }
  }

  /**
   * Procesar devolución (que internamente actualiza cantidades)
   * @param {Object} devolucionData - Datos de la devolución
   */
  async procesarDevolucion(devolucionData) {
    try {
      console.log('🔍 CantidadService - Procesando devolución:', devolucionData);

      const response = await api.post('/api/devoluciones', devolucionData);

      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }

      console.log('✅ CantidadService - Devolución procesada:', response.data);
      
      // ✅ RETORNAR LA VENTA ACTUALIZADA si está disponible
      if (response.data.venta) {
        return {
          devoluciones: response.data.devoluciones,
          venta: response.data.venta,
          message: response.data.message
        };
      }
      
      return response.data;

    } catch (error) {
      console.error('❌ CantidadService - Error al procesar devolución:', error);
      
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al procesar devolución');
      } else if (error.request) {
        throw new Error('No se pudo conectar con el servidor');
      } else {
        throw new Error(error.message || 'Error al procesar devolución');
      }
    }
  }

  /**
   * Obtener historial de cambios de cantidad para un producto en una venta
   * @param {string} ventaId - ID de la venta
   * @param {string} productoId - ID del producto
   */
  async obtenerHistorialCantidad(ventaId, productoId) {
    try {
      const response = await api.get(`/api/ventas/${ventaId}/productos/${productoId}/historial`);
      return response.data;
    } catch (error) {
      console.error('❌ CantidadService - Error al obtener historial:', error);
      throw error;
    }
  }

  /**
   * Validar si una operación de cantidad es permitida
   * @param {string} ventaId - ID de la venta
   * @param {string} productoId - ID del producto
   * @param {number} cantidadDeseada - Cantidad que se desea establecer
   * @param {string} tipoOperacion - Tipo de operación
   */
  async validarOperacionCantidad(ventaId, productoId, cantidadDeseada, tipoOperacion) {
    try {
      const response = await api.post(`/api/ventas/${ventaId}/productos/${productoId}/validar`, {
        cantidadDeseada,
        tipoOperacion
      });
      return response.data;
    } catch (error) {
      console.error('❌ CantidadService - Error en validación:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const cantidadService = new CantidadService();
export default cantidadService;

// Exportar también las funciones individuales para compatibilidad
export const actualizarCantidadEnVenta = cantidadService.actualizarCantidadEnVenta.bind(cantidadService);
export const procesarDevolucion = cantidadService.procesarDevolucion.bind(cantidadService);
export const obtenerHistorialCantidad = cantidadService.obtenerHistorialCantidad.bind(cantidadService);
export const validarOperacionCantidad = cantidadService.validarOperacionCantidad.bind(cantidadService);
