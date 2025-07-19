import { useState, useCallback } from 'react';
import cantidadService from '../services/cantidadService';

/**
 * Hook unificado para gestión de cantidades en ventas
 * Centraliza toda la lógica de actualización de cantidades
 */
export const useCantidadManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Función para actualizar cantidad manualmente (desde ProductCard)
  const actualizarCantidadManual = useCallback(async (ventaId, productoId, nuevaCantidad, motivo = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const resultado = await cantidadService.actualizarCantidadEnVenta(
        ventaId, 
        productoId, 
        nuevaCantidad, 
        'manual', 
        motivo
      );
      
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para procesar devolución
  const procesarDevolucion = useCallback(async (devolucionData) => {
    setLoading(true);
    setError(null);
    
    try {
      const resultado = await cantidadService.procesarDevolucion(devolucionData);
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para validar operaciones antes de ejecutarlas
  const validarOperacion = useCallback(async (ventaId, productoId, cantidadDeseada, tipoOperacion) => {
    try {
      const resultado = await cantidadService.validarOperacionCantidad(
        ventaId, 
        productoId, 
        cantidadDeseada, 
        tipoOperacion
      );
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Función para obtener historial
  const obtenerHistorial = useCallback(async (ventaId, productoId) => {
    try {
      const resultado = await cantidadService.obtenerHistorialCantidad(ventaId, productoId);
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    // Estados
    loading,
    error,
    
    // Funciones
    actualizarCantidadManual,
    procesarDevolucion,
    validarOperacion,
    obtenerHistorial,
    clearError
  };
};
