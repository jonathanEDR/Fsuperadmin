import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useProductosVendidosHoy = () => {
  const [data, setData] = useState({
    totalProductosHoy: 0,
    productoMasVendido: null,
    loading: true,
    error: null
  });

  const { getToken } = useAuth();

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD (zona horaria Perú)
  const obtenerFechaHoy = useCallback(() => {
    const ahora = new Date();
    return ahora.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  }, []);

  const fetchProductosHoy = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const token = await getToken();
      
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fecha de hoy en zona horaria Perú
      const fechaHoy = obtenerFechaHoy();

      // Fetch ventas de hoy con filtro de fecha y límite alto
      const ventasResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ventas?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}&limit=1000`,
        { headers }
      );

      if (!ventasResponse.ok) {
        const errorText = await ventasResponse.text();
        throw new Error(`Error al obtener las ventas: ${ventasResponse.status}`);
      }

      const ventasResult = await ventasResponse.json();

      const ventasData = ventasResult.ventas || ventasResult || [];

      // Procesar datos de ventas del día
      let totalProductosHoy = 0;
      const resumenProductos = {};

      // Procesar cada venta (ya vienen filtradas por el backend)
      ventasData.forEach((venta, index) => {
        // Contar productos de TODAS las ventas del día (no solo las pagadas)
        if (venta.productos && Array.isArray(venta.productos)) {
          venta.productos.forEach((producto) => {
            if (producto && producto.cantidad) {
              const cantidad = parseInt(producto.cantidad) || 0;
              totalProductosHoy += cantidad;
              
              // Acceder correctamente al nombre del producto
              const nombreProducto = producto.productoId?.nombre || 
                                   producto.nombre || 
                                   producto.title || 
                                   'Producto sin nombre';
              
              if (!resumenProductos[nombreProducto]) {
                resumenProductos[nombreProducto] = 0;
              }
              resumenProductos[nombreProducto] += cantidad;
            }
          });
        }
      });

      // Encontrar producto más vendido
      const productoMasVendido = Object.entries(resumenProductos)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 1)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))[0] || null;

      setData({
        totalProductosHoy,
        productoMasVendido,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error fetching productos hoy:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    fetchProductosHoy();
  }, []);

  return {
    ...data,
    refetch: fetchProductosHoy
  };
};
