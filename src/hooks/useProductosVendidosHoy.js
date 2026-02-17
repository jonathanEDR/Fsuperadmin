import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useProductosVendidosHoy = (periodo = 'hoy') => {
  const [data, setData] = useState({
    totalProductosHoy: 0,
    productoMasVendido: null,
    loading: true,
    error: null
  });

  const { getToken } = useAuth();

  // Función para obtener el rango de fechas según el período
  const obtenerRangoFechas = useCallback(() => {
    const ahora = new Date();
    const fechaHoy = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    
    if (periodo === 'mes') {
      // Obtener primer día del mes actual
      const [year, month] = fechaHoy.split('-');
      const fechaInicio = `${year}-${month}-01`;
      return { fechaInicio, fechaFin: fechaHoy };
    }
    
    // Por defecto: solo hoy
    return { fechaInicio: fechaHoy, fechaFin: fechaHoy };
  }, [periodo]);

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

      // Rango de fechas según el período
      const { fechaInicio, fechaFin } = obtenerRangoFechas();

      // Fetch ventas del período con filtro de fecha y límite alto
      const ventasResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&limit=10000`,
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
  }, [periodo]); // Re-ejecutar cuando cambie el período

  return {
    ...data,
    refetch: fetchProductosHoy
  };
};
