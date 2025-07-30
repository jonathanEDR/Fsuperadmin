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
    console.log('🔄 Procesando ventas para gráfico:', {
      filter,
      totalVentas: ventas.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // 🔍 DEBUG: Verificar estructura de fechas
    if (ventas.length > 0) {
      const primeraVenta = ventas[0];
      console.log('🗓️ DEBUG - Campos de fecha disponibles:', {
        fechadeVenta: primeraVenta.fechadeVenta,
        fechaVenta: primeraVenta.fechaVenta,
        createdAt: primeraVenta.createdAt,
        updatedAt: primeraVenta.updatedAt
      });
    }

    // ✅ Usar la misma función que funciona en VentasLineChart
    const labels = generarEtiquetasGrafico(filter, startDate, endDate);
    
    // Inicializar contadores para cada etiqueta
    const productosPorIntervalo = new Array(labels.length).fill(0);
    const resumenProductos = {};
    let totalUnidades = 0;

    // Procesar cada venta
    ventas.forEach((venta, ventaIndex) => {
      // ✅ Usar la misma función de extracción de fecha que funciona en VentasLineChart
      const fechaVenta = extraerFechaValida(venta, [
        'fechadeVenta',
        'createdAt', 
        'updatedAt'
      ]) || new Date();
      
      // 🔍 DEBUG ESPECIAL: Verificar fechas extraídas
      if (ventaIndex < 5) { // Solo mostrar las primeras 5 para no spam
        console.log(`🗓️ DEBUG Venta ${ventaIndex + 1}:`, {
          id: venta._id,
          fechadeVenta: venta.fechadeVenta,
          createdAt: venta.createdAt,
          updatedAt: venta.updatedAt,
          fechaExtraida: fechaVenta.toISOString(),
          diaDelMes: fechaVenta.getDate(),
          estadoPago: venta.estadoPago,
          completionStatus: venta.completionStatus
        });
      }
      
      // ✅ CHANGED: Procesar ventas que estén en el rango (igual que VentasLineChart)
      // Los filtros de estado se aplican aquí, no en el backend
      if (fechaEnRango(fechaVenta, startDate, endDate)) {
        // ✅ Usar la misma función de cálculo de índice que funciona en VentasLineChart
        const intervalIndex = calcularIndiceParaFecha(fechaVenta, filter, startDate);

        console.log(`📊 Venta ${ventaIndex + 1} → Día ${fechaVenta.getDate()}/${fechaVenta.getMonth() + 1} → índice ${intervalIndex} (${venta.estadoPago}/${venta.completionStatus})`);

        if (intervalIndex !== -1 && intervalIndex >= 0 && intervalIndex < productosPorIntervalo.length) {
          // ✅ CHANGED: NO aplicar filtros de estado aquí (igual que VentasLineChart)
          // VentasLineChart procesa TODAS las ventas sin filtrar por estado
          // Procesar productos de esta venta
          if (venta.productos && Array.isArray(venta.productos)) {
            venta.productos.forEach((producto, prodIndex) => {
              if (producto && producto.cantidad) {
                const cantidad = parseInt(producto.cantidad) || 0;
                
                // ✅ CORRECCIÓN: Acceder correctamente al nombre del producto
                const nombreProducto = producto.productoId?.nombre || 
                                     producto.nombre || 
                                     producto.title || 
                                     'Producto sin nombre';
                
                console.log(`  📦 ${nombreProducto} x${cantidad} → índice ${intervalIndex} ✅ (${venta.estadoPago}/${venta.completionStatus})`);
                
                // Agregar al intervalo correspondiente
                productosPorIntervalo[intervalIndex] += cantidad;
                totalUnidades += cantidad;
                
                // Agregar al resumen global
                if (!resumenProductos[nombreProducto]) {
                  resumenProductos[nombreProducto] = 0;
                }
                resumenProductos[nombreProducto] += cantidad;
              }
            });
          }
        } else {
          console.log('⚠️ Intervalo fuera de rango:', {
            fecha: fechaVenta.toISOString(),
            día: fechaVenta.getDate(),
            intervalIndex,
            maxIndex: productosPorIntervalo.length - 1
          });
        }
      }
    });

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

    console.log('📈 Resultados del procesamiento:', {
      totalUnidades,
      productosUnicos: Object.keys(resumenProductos).length,
      productoMasVendido,
      datosGrafico: productosPorIntervalo,
      labels: labels
    });

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
        topProductos
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

      // ✅ Usar la misma función de cálculo de fechas que funciona en VentasLineChart
      const { startDate, endDate } = calcularRangoFechas(timeFilter);

      console.log(`🗓️ Obteniendo datos para ${timeFilter}:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // ✅ Usar el nuevo endpoint específico para productos vendidos
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