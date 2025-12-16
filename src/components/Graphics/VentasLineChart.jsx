import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';
import { formatearFecha } from '../../utils/fechaHoraUtils';
import { 
  procesarFechaParaGrafico, 
  calcularIndiceParaFecha, 
  fechaEnRango, 
  extraerFechaValida,
  generarEtiquetasGrafico,
  calcularRangoFechas
} from '../../utils/graficosDateUtils';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VentasLineChart = React.memo(({ userRole }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    ventasBrutas: 0,
    devoluciones: 0,
    ventasNetas: 0,
    cantidadVendida: 0
  });
  
  // Estados para filtro de fechas - valores por defecto: últimos 30 días
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    return hace30Dias.toISOString().split('T')[0];
  });
  
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // State para almacenar las etiquetas originales para el tooltip
  const [originalLabels, setOriginalLabels] = useState([]);

  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función para obtener datos de ventas
  const fetchVentasData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar el endpoint específico para gráficos que incluye fechadeVenta
      const [ventasRes, devolucionesRes] = await Promise.all([
        api.get(`/api/ventas/graficos?startDate=${fechaInicio}&endDate=${fechaFin}`),
        api.get('/api/devoluciones?limit=1000').catch(() => ({ data: { devoluciones: [] } }))
      ]);

      const ventas = ventasRes.data.ventas || ventasRes.data || [];
      const devoluciones = devolucionesRes.data.devoluciones || devolucionesRes.data || [];

      await processVentasData(ventas, devoluciones);
    } catch (err) {
      console.error('❌ VentasChart - Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  // Función auxiliar para obtener fecha solo (YYYY-MM-DD) considerando zona horaria de Perú
  const obtenerFechaSoloLocal = useCallback((fecha) => {
    if (!fecha) return null;
    // Usar toLocaleDateString para obtener la fecha en zona horaria de Perú
    const fechaLocal = fecha.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // Formato YYYY-MM-DD
    return fechaLocal;
  }, []);

  // Función para procesar datos de ventas
  const processVentasData = useCallback(async (ventas, devoluciones) => {
    try {
      if (!fechaInicio || !fechaFin) {
        return;
      }

      // Validar que los arrays sean válidos
      const ventasValidas = Array.isArray(ventas) ? ventas : [];
      const devolucionesValidas = Array.isArray(devoluciones) ? devoluciones : [];

      // Configurar fechas en zona horaria local de Perú
      // Crear fechas a medianoche en hora local para evitar problemas de zona horaria
      const startDate = new Date(fechaInicio + 'T00:00:00');
      const endDate = new Date(fechaFin + 'T23:59:59.999');

      // Generar etiquetas para el rango de fechas (usando hora local)
      const labels = [];
      const fechaActual = new Date(startDate);
      
      while (fechaActual <= endDate) {
        // Usar formato local en lugar de ISO para evitar desfase de zona horaria
        const año = fechaActual.getFullYear();
        const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaActual.getDate()).padStart(2, '0');
        labels.push(`${año}-${mes}-${dia}`);
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
      
      // Guardar las etiquetas originales para el tooltip
      setOriginalLabels(labels);
      
      if (labels.length === 0) {
        console.error('❌ VentasChart - No se pudieron generar etiquetas');
        setError('Error al generar las etiquetas del gráfico');
        return;
      }

      // Inicializar estructura de datos
      const dataPoints = labels.map(() => ({ 
        ventasBrutas: 0, 
        devoluciones: 0, 
        ventasNetas: 0,
        cantidadVendida: 0 
      }));

      // Procesar ventas - filtrar por rango de fechas
      let ventasProcesadas = 0;
      let ventasEnRango = 0;
      
      ventasValidas.forEach(venta => {
        ventasProcesadas++;
        if (!venta || !venta.fechadeVenta) {
          return;
        }
        
        // ✅ CORRECCIÓN: Usar procesarFechaParaGrafico para manejar zona horaria correctamente
        const fechaVenta = procesarFechaParaGrafico(venta.fechadeVenta);
        if (!fechaVenta) {
          return;
        }
        
        // Obtener fecha solo (YYYY-MM-DD) en zona horaria de Perú
        const fechaSoloVenta = obtenerFechaSoloLocal(fechaVenta);
        
        // Encontrar el índice correcto basado en la fecha local
        const index = labels.indexOf(fechaSoloVenta);
        
        if (index >= 0 && index < dataPoints.length) {
            ventasEnRango++;
            const montoVenta = parseFloat(venta?.montoTotal) || 0;
            // ✅ CORRECCIÓN: El montoTotal del backend ya es NETO (después de devoluciones)
            // Por eso lo guardamos en ventasNetas primero, luego calcularemos ventasBrutas
            dataPoints[index].ventasNetas += montoVenta;
            
            // Calcular cantidad vendida
            if (Array.isArray(venta.productos)) {
              const cantidad = venta.productos.reduce((sum, prod) => {
                return sum + (parseInt(prod?.cantidad) || 0);
              }, 0);
              dataPoints[index].cantidadVendida += cantidad;
            }
        }
      });
      
      // Procesar devoluciones - filtrar por rango de fechas
      devolucionesValidas.forEach(devolucion => {
        if (!devolucion || !devolucion.fechaDevolucion) return;
        
        // ✅ CORRECCIÓN: Usar procesarFechaParaGrafico para manejar zona horaria correctamente
        const fechaDevolucion = procesarFechaParaGrafico(devolucion.fechaDevolucion);
        if (!fechaDevolucion) return;
        
        // Obtener fecha solo (YYYY-MM-DD) en zona horaria de Perú
        const fechaSoloDevolucion = obtenerFechaSoloLocal(fechaDevolucion);
        
        // Encontrar el índice correcto basado en la fecha local
        const index = labels.indexOf(fechaSoloDevolucion);
        
        if (index >= 0 && index < dataPoints.length) {
          const montoDevolucion = parseFloat(devolucion?.monto) || 0;
          dataPoints[index].devoluciones += montoDevolucion;
        }
      });

      // ✅ CORRECCIÓN: Calcular ventas BRUTAS a partir de las netas
      // Fórmula correcta: Ventas Brutas = Ventas Netas + Devoluciones
      dataPoints.forEach(point => {
        point.ventasBrutas = point.ventasNetas + point.devoluciones;
      });

      // Calcular totales del período
      let totalVentasBrutas = 0;
      let totalDevoluciones = 0;
      let totalVentasNetas = 0;
      let totalCantidadVendida = 0;

      dataPoints.forEach(point => {
        totalVentasBrutas += point.ventasBrutas;
        totalDevoluciones += point.devoluciones;
        totalVentasNetas += point.ventasNetas;
        totalCantidadVendida += point.cantidadVendida;
      });

      const periodTotals = {
        ventasBrutas: totalVentasBrutas,
        devoluciones: totalDevoluciones,
        ventasNetas: totalVentasNetas,
        cantidadVendida: totalCantidadVendida
      };
      
      setTotals(periodTotals);
      
      const newChartData = {
        labels: labels.map(dateStr => {
          const date = new Date(dateStr + 'T00:00:00');
          return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit' 
          });
        }),
        datasets: [
          {
            label: 'Ventas Brutas (S/)',
            data: dataPoints.map(point => point.ventasBrutas),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Devoluciones (S/)',
            data: dataPoints.map(point => point.devoluciones),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Ventas Netas (S/)',
            data: dataPoints.map(point => point.ventasNetas),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: false,
            borderWidth: 3,
          },
        ],
      };
      
      if (!newChartData.labels || newChartData.labels.length === 0) {
        console.error('❌ VentasChart - Sin datos válidos para mostrar');
        setError('No hay datos para mostrar en el período seleccionado');
        return;
      }
      
      setChartData(newChartData);
    } catch (err) {
      setError('No se pudo cargar el gráfico de ventas: ' + err.message);
    }
  }, [fechaInicio, fechaFin, obtenerFechaSoloLocal]);

  // Función para obtener la etiqueta del filtro
  const getTimeFilterLabel = useCallback(() => {
    if (!fechaInicio || !fechaFin) return 'Selecciona un rango de fechas';
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferenciaDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
    
    return `${inicio.toLocaleDateString('es-ES')} - ${fin.toLocaleDateString('es-ES')} (${diferenciaDias} ${diferenciaDias === 1 ? 'día' : 'días'})`;
  }, [fechaInicio, fechaFin]);

  // Efecto para cargar datos cuando cambian las fechas
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const timer = setTimeout(() => {
        fetchVentasData();
      }, 300); // Debounce de 300ms para evitar múltiples llamadas

      return () => clearTimeout(timer);
    }
  }, [fetchVentasData, fechaInicio, fechaFin]);

  // Efecto inicial para cargar datos por defecto
  useEffect(() => {
    fetchVentasData();
  }, []); // Solo se ejecuta una vez al montar el componente

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchVentasData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8 overflow-hidden">
      {/* Header simplificado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Evolución de Ventas
          </h3>
        </div>
        
        {/* Información del período actual */}
        <div className="text-center">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            📊 {getTimeFilterLabel()}
          </span>
        </div>
      </div>

      {/* Panel de selección de fechas siempre visible */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {/* Fecha de inicio */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha de Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              max={fechaFin || new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Fecha de fin */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha de Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={fechaInicio}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Botones de accesos rápidos */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                const hoy = new Date();
                const hace7Dias = new Date();
                hace7Dias.setDate(hoy.getDate() - 7);
                setFechaInicio(hace7Dias.toISOString().split('T')[0]);
                setFechaFin(hoy.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium whitespace-nowrap transition-colors"
            >
              Últimos 7 días
            </button>
            
            <button
              onClick={() => {
                const hoy = new Date();
                const hace30Dias = new Date();
                hace30Dias.setDate(hoy.getDate() - 30);
                setFechaInicio(hace30Dias.toISOString().split('T')[0]);
                setFechaFin(hoy.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium whitespace-nowrap transition-colors"
            >
              Últimos 30 días
            </button>
          </div>
        </div>

        {/* Información del rango */}
        {fechaInicio && fechaFin && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-blue-800">
              📊 Analizando desde {new Date(fechaInicio).toLocaleDateString('es-ES')} hasta {new Date(fechaFin).toLocaleDateString('es-ES')}
              {(() => {
                const inicio = new Date(fechaInicio);
                const fin = new Date(fechaFin);
                const diferencia = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
                return ` (${diferencia} ${diferencia === 1 ? 'día' : 'días'})`;
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Gráfico con altura responsiva mejorada */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full" style={{height: 'clamp(280px, 50vh, 400px)'}}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : chartData ? (
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    display: true, 
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: window.innerWidth < 640 ? 8 : 15,
                      boxWidth: window.innerWidth < 640 ? 8 : 12,
                      boxHeight: window.innerWidth < 640 ? 8 : 12,
                      font: {
                        size: window.innerWidth < 640 ? 9 : 12
                      }
                    }
                  },
                  title: { display: false },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    titleFont: {
                      size: window.innerWidth < 640 ? 11 : 12
                    },
                    bodyFont: {
                      size: window.innerWidth < 640 ? 10 : 11
                    },
                    callbacks: {
                      title: function(context) {
                        const index = context[0].dataIndex;
                        // Usar las etiquetas originales guardadas en el state
                        if (originalLabels && originalLabels[index]) {
                          const originalDate = originalLabels[index];
                          const date = new Date(originalDate + 'T00:00:00');
                          return date.toLocaleDateString('es-ES', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        }
                        return '';
                      },
                      label: function(context) {
                        const value = context.parsed.y;
                        const label = context.dataset.label || '';
                        return `${label}: S/ ${value.toFixed(2)}`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      maxTicksLimit: window.innerWidth < 640 ? 5 : 10,
                      font: {
                        size: window.innerWidth < 640 ? 9 : 11
                      }
                    }
                  },
                  y: {
                    display: true,
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 9 : 11
                      },
                      callback: function(value) {
                        return 'S/ ' + value.toFixed(0);
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <p className="text-gray-500">No hay datos para mostrar</p>
                <p className="text-gray-400 text-sm">Selecciona un rango de fechas válido</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel de totales mejorado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-800">Ventas Brutas</p>
              <p className="text-base sm:text-xl font-bold text-green-900">
                S/ {totals.ventasBrutas.toFixed(2)}
              </p>
            </div>
            <div className="text-green-600 text-xl sm:text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-red-800">Devoluciones</p>
              <p className="text-base sm:text-xl font-bold text-red-900">
                S/ {totals.devoluciones.toFixed(2)}
              </p>
            </div>
            <div className="text-red-600 text-xl sm:text-2xl">↩️</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-800">Ventas Netas</p>
              <p className="text-base sm:text-xl font-bold text-blue-900">
                S/ {totals.ventasNetas.toFixed(2)}
              </p>
            </div>
            <div className="text-blue-600 text-xl sm:text-2xl">📈</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-purple-800">Cantidad</p>
              <p className="text-base sm:text-xl font-bold text-purple-900">
                {totals.cantidadVendida} unid.
              </p>
            </div>
            <div className="text-purple-600 text-xl sm:text-2xl">📦</div>
          </div>
        </div>
      </div>
    </div>
  );
});

VentasLineChart.displayName = 'VentasLineChart';

export default VentasLineChart;