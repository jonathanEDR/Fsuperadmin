import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useVentaModification = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Agregar producto a una venta existente
  const addProductToVenta = useCallback(async (ventaId, productoId, cantidad) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/productos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productoId,
          cantidad
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar producto');
      }

      const data = await response.json();
      return data.venta;
    } catch (error) {
      console.error('Error al agregar producto:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Actualizar cantidad de un producto en una venta
  const updateProductQuantity = useCallback(async (ventaId, productoId, cantidad) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 useVentaModification - updateProductQuantity llamado:', {
        ventaId,
        productoId,
        cantidad
      });
      
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/productos/${productoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cantidad
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar cantidad');
      }

      const data = await response.json();
      console.log('✅ useVentaModification - Respuesta exitosa:', data);
      return data.venta;
    } catch (error) {
      console.error('❌ Error en updateProductQuantity:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Eliminar producto de una venta
  const removeProductFromVenta = useCallback(async (ventaId, productoId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/productos/${productoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar producto');
      }

      const data = await response.json();
      return data.venta;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return {
    loading,
    error,
    clearError,
    addProductToVenta,
    updateProductQuantity,
    removeProductFromVenta
  };
};
