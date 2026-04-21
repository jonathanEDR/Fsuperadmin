import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  extraerFechaValida,
  calcularIndiceParaFecha,
  fechaEnRango,
  generarEtiquetasGrafico,
  calcularRangoFechas
} from '../utils/graficosDateUtils';

export const useProductosPorPeriodo = (timeFilter = 'mes') => {
  const [data, setData] = useState({
    chartData: null,
    totals: {
      totalUnidades: 0,
      productosUnicos: 0,
      productoMasVendido: null
    },
    loading: true,
    error: null
  });

  const { getToken } = useAuth();

  const processVentasData = (ventas, filter, startDate, endDate) => {
    const labels = generarEtiquetasGrafico(filter, startDate, endDate);
    
    const productosPorIntervalo = new Array(labels.length).fill(0);
    // Desglose por intervalo: array de objetos {nombreProducto: cantidad}
    const productosPorDia = new Array(labels.length).fill(null).map(() => ({}));
    const resumenProductos = {};
    let totalUnidades = 0;

    ventas.forEach((venta) => {
      const fechaVenta = extraerFechaValida(venta, [
        'fechadeVenta',
        'createdAt', 
        'updatedAt'
      ]) || new Date();
      
      if (fechaEnRango(fechaVenta, startDate, endDate)) {
        const intervalIndex = calcularIndiceParaFecha(fechaVenta, filter, startDate);

        if (intervalIndex !== -1 && intervalIndex >= 0 && intervalIndex < productosPorIntervalo.length) {
          if (venta.productos && Array.isArray(venta.productos)) {
            venta.productos.forEach((producto) => {
              if (producto && producto.cantidad) {
                const cantidad = parseInt(producto.cantidad) || 0;
                const nombreProducto = producto.productoId?.nombre || 
                                     producto.nombre || 
                                     producto.title || 
                                     'Producto sin nombre';

                productosPorIntervalo[intervalIndex] += cantidad;
                totalUnidades += cantidad;

                // Acumular por día
                productosPorDia[intervalIndex][nombreProducto] = 
                  (productosPorDia[intervalIndex][nombreProducto] || 0) + cantidad;

                if (!resumenProductos[nombreProducto]) {
                  resumenProductos[nombreProducto] = 0;
                }
                resumenProductos[nombreProducto] += cantidad;
              }
            });
          }
        }
      }
    });

    // Convertir desglose por día a array ordenado por cantidad desc
    const detallesPorIntervalo = productosPorDia.map(dia =>
      Object.entries(dia)
        .sort(([, a], [, b]) => b - a)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    );

    // Calcular producto más vendido
    const productoMasVendido = Object.entries(resumenProductos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 1)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))[0] || null;

    // Obtener top 5 productos
    const topProductos = Object.entries(resumenProductos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    return {
      labels,
      datasets: [
        {
          label: 'Productos Vendidos',
          data: productosPorIntervalo,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'rgba(34, 197, 94, 0.8)',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
        {
          label: 'Meta Diaria (180 unidades)',
          data: new Array(labels.length).fill(180),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5], // Línea punteada
          fill: false,
          tension: 0,
          pointRadius: 0, // Sin puntos en la línea de meta
          pointHoverRadius: 4,
          pointBackgroundColor: 'rgb(239, 68, 68)',
        }
      ],
      totals: {
        totalUnidades,
        productosUnicos: Object.keys(resumenProductos).length,
        productoMasVendido,
        topProductos,
        detallesPorIntervalo
      }
    };
  };

  const fetchData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const { startDate, endDate } = calcularRangoFechas(timeFilter);

      // ✅ Endpoint específico para productos vendidos
      const ventasResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ventas/productos-vendidos?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&timeFilter=${timeFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!ventasResponse.ok) {
        throw new Error(`Error al obtener las ventas: ${ventasResponse.status}`);
      }

      const ventasResult = await ventasResponse.json();
      const ventasData = ventasResult.ventas || ventasResult || [];

      // Procesar datos
      const processedData = processVentasData(ventasData, timeFilter, startDate, endDate);
      
      setData({
        chartData: processedData,
        totals: processedData.totals,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error fetching productos por período:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  return {
    ...data,
    refetch: fetchData
  };
};