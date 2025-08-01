import React, { useEffect, useState } from 'react';
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

const VentasLineChart = ({ userRole }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('mes'); // hoy, semana, mes, anual
  const [totals, setTotals] = useState({
    ventasBrutas: 0,
    devoluciones: 0,
    ventasNetas: 0,
    cantidadVendida: 0
  });

  const processVentasData = (ventas, devoluciones, filter, startDate, endDate) => {
    const labels = generarEtiquetasGrafico(filter, startDate, endDate);
    const dataPoints = labels.map(() => ({ 
      ventasBrutas: 0, 
      devoluciones: 0, 
      ventasNetas: 0,
      cantidadVendida: 0 
    }));

    // Procesar ventas - SOLO ventas reales, no montos ajustados por devoluciones
    ventas.forEach((venta) => {
      const fechaVenta = extraerFechaValida(venta, [
        'fechadeVenta',
        'createdAt', 
        'updatedAt'
      ]) || new Date();
      
      if (fechaEnRango(fechaVenta, startDate, endDate)) {
        const indexPos = calcularIndiceParaFecha(fechaVenta, filter, startDate);
        if (indexPos >= 0 && indexPos < dataPoints.length) {
          // Usar montoOriginal si existe (monto antes de devoluciones), sino montoTotal
          const montoVentaBruta = Number(venta.montoOriginal || venta.montoTotal || 0);
          dataPoints[indexPos].ventasBrutas += montoVentaBruta;
          dataPoints[indexPos].cantidadVendida += Number(venta.cantidadVendida || 0);
        }
      }
    });

    // Procesar devoluciones - Solo restar del total, no afectar ventas brutas
    // Crear un mapa de devoluciones por venta para ajustar las ventas brutas
    const devolucionesPorVenta = {};
    devoluciones.forEach((devolucion) => {
      const ventaId = devolucion.ventaId || devolucion.venta;
      if (ventaId) {
        if (!devolucionesPorVenta[ventaId]) {
          devolucionesPorVenta[ventaId] = 0;
        }
        devolucionesPorVenta[ventaId] += Number(devolucion.monto || devolucion.montoDevolucion || 0);
      }
    });

    // Si no hay campo montoOriginal, intentar recalcular las ventas brutas
    if (Object.keys(devolucionesPorVenta).length > 0) {
      // Recalcular ventas brutas sumando las devoluciones al montoTotal actual
      ventas.forEach((venta) => {
        const devolucionTotal = devolucionesPorVenta[venta._id] || 0;
        if (devolucionTotal > 0) {
          const fechaVenta = extraerFechaValida(venta, ['fechadeVenta', 'createdAt', 'updatedAt']);
          if (fechaVenta && fechaEnRango(fechaVenta, startDate, endDate)) {
            const indexPos = calcularIndiceParaFecha(fechaVenta, filter, startDate);
            if (indexPos >= 0 && indexPos < dataPoints.length) {
              // Ajustar: ventas brutas = monto actual + devoluciones
              const montoOriginalCalculado = Number(venta.montoTotal || 0) + devolucionTotal;
              const diferencia = montoOriginalCalculado - Number(venta.montoTotal || 0);
              
              dataPoints[indexPos].ventasBrutas += diferencia;
            }
          }
        }
      });
    }

    // Procesar devoluciones como eventos separados
    devoluciones.forEach((devolucion) => {
      const fechaDevolucion = extraerFechaValida(devolucion, [
        'fechaDevolucion',
        'createdAt',
        'updatedAt'
      ]);
      
      if (!fechaDevolucion) {
        return;
      }
      
      if (fechaEnRango(fechaDevolucion, startDate, endDate)) {
        const indexPos = calcularIndiceParaFecha(fechaDevolucion, filter, startDate);
        
        if (indexPos >= 0 && indexPos < dataPoints.length) {
          const montoDevolucion = Number(devolucion.monto || devolucion.montoDevolucion || 0);
          dataPoints[indexPos].devoluciones += montoDevolucion;
        }
      }
    });

    // Calcular ventas netas
    dataPoints.forEach(point => {
      point.ventasNetas = point.ventasBrutas - point.devoluciones;
    });
    
    return { labels, dataPoints };
  };

  const fetchVentasData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener ventas y devoluciones
      const [ventasResponse, devolucionesResponse] = await Promise.all([
        api.get('/api/ventas?limit=1000'),
        api.get('/api/devoluciones?limit=1000').catch(() => ({ data: { devoluciones: [] } }))
      ]);
      
      const ventas = ventasResponse.data.ventas || ventasResponse.data || [];
      const devoluciones = devolucionesResponse.data.devoluciones || devolucionesResponse.data || [];
      
      const { startDate, endDate } = calcularRangoFechas(timeFilter);
      const { labels, dataPoints } = processVentasData(ventas, devoluciones, timeFilter, startDate, endDate);
      
      // Calcular totales del período
      let totalVentasBrutas = 0;
      let totalDevoluciones = 0; 
      let totalVentasNetas = 0;
      let totalCantidadVendida = 0;

      // Calcular totales punto por punto para asegurar consistencia
      dataPoints.forEach(point => {
        totalVentasBrutas += point.ventasBrutas;
        totalDevoluciones += point.devoluciones;
        totalVentasNetas += point.ventasNetas;
        totalCantidadVendida += point.cantidadVendida;
      });

      // Verificación cruzada: las ventas netas también pueden calcularse como diferencia total
      const ventasNetasCalculadas = totalVentasBrutas - totalDevoluciones;
      
      const periodTotals = {
        ventasBrutas: totalVentasBrutas,
        devoluciones: totalDevoluciones,
        ventasNetas: ventasNetasCalculadas, // Usar el cálculo directo para mayor precisión
        cantidadVendida: totalCantidadVendida
      };
      
      setTotals(periodTotals);
      setChartData({
        labels,
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
      });
    } catch (err) {
      setError('No se pudo cargar el gráfico de ventas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentasData();
  }, [timeFilter]);

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'hoy': return 'Hoy';
      case 'semana': return 'Esta Semana';
      case 'mes': return 'Este Mes';
      case 'anual': return 'Este Año';
      default: return 'Período';
    }
  };

  if (loading) return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8">
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm">Cargando gráfico de ventas...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8">
      <div className="py-8 text-center text-red-600">
        <p className="font-semibold">Error al cargar el gráfico</p>
        <p className="text-xs sm:text-sm mt-2">{error}</p>
        <button 
          onClick={fetchVentasData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  if (!chartData) return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8">
      <div className="py-8 text-center text-gray-600">
        <p>No hay datos disponibles para mostrar</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8 overflow-hidden">
      {/* Header con filtros tecnológicos modernos */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
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
        
        {/* Selector futurista para móvil y desktop */}
        <div className="w-full sm:w-auto">
          {/* Vista única: Botones tecnológicos modernos */}
          <div className="relative bg-gradient-to-r from-slate-50 to-gray-100 p-1 rounded-2xl border border-gray-200 shadow-lg backdrop-blur-sm">
            {/* Indicador deslizante de fondo */}
            <div 
              className="absolute top-1 bottom-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-xl transition-all duration-300 ease-out shadow-lg"
              style={{
                width: `${100/4}%`,
                left: `${(['hoy', 'semana', 'mes', 'anual'].indexOf(timeFilter)) * 25}%`,
              }}
            ></div>
            
            <div className="relative grid grid-cols-4 gap-0">
              {[
                { key: 'hoy', label: 'Hoy', icon: '⚡', desc: '24h' },
                { key: 'semana', label: 'Semana', icon: '📊', desc: '7d' },
                { key: 'mes', label: 'Mes', icon: '📈', desc: '30d' },
                { key: 'anual', label: 'Año', icon: '🎯', desc: '365d' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTimeFilter(filter.key)}
                  className={`relative px-3 sm:px-4 py-3 sm:py-3 rounded-xl font-medium transition-all duration-300 ease-out group hover:scale-105 ${
                    timeFilter === filter.key
                      ? 'text-white shadow-lg z-10'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-base">{filter.icon}</span>
                    <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1">
                      <span className="text-xs sm:text-sm font-bold leading-none">{filter.label}</span>
                      <span className={`text-xs leading-none ${
                        timeFilter === filter.key ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {filter.desc}
                      </span>
                    </div>
                  </div>
                  
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Indicador activo adicional */}
                  {timeFilter === filter.key && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Efectos de borde tecnológicos */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-2xl opacity-20 blur-sm -z-10"></div>
          </div>
          
          {/* Información del período actual con diseño tech */}
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full">
              <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Analizando: {getTimeFilterLabel()}
              </span>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico con altura responsiva mejorada */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full" style={{height: 'clamp(280px, 50vh, 400px)'}}>
          {chartData ? (
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
                      label: function(context) {
                        return `${context.dataset.label}: S/ ${context.parsed.y.toFixed(2)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    title: { 
                      display: window.innerWidth >= 640, 
                      text: 'Monto (S/)',
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    },
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 8 : 11
                      },
                      callback: function(value) {
                        return window.innerWidth < 640 ? `S/${value}` : `S/ ${value}`;
                      },
                      maxTicksLimit: window.innerWidth < 640 ? 5 : 8
                    }
                  },
                  x: { 
                    title: { 
                      display: window.innerWidth >= 640, 
                      text: 'Día del Mes',
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    },
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 8 : 11
                      },
                      maxTicksLimit: window.innerWidth < 640 ? 6 : 12
                    }
                  },
                },
                interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false
                }
              }} 
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p className="text-sm">No se pudo renderizar el gráfico</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de totales mejorado para móvil - Una sola fila */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {/* Fila única en móvil con todas las métricas */}
        <div className="grid grid-cols-4 gap-2 sm:hidden">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg border border-green-200">
            <div className="text-center">
              <div className="text-sm font-bold text-green-600 truncate">
                S/ {totals.ventasBrutas.toFixed(0)}
              </div>
              <div className="text-xs text-green-700 font-medium">Brutas</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600 truncate">
                S/ {totals.ventasNetas.toFixed(0)}
              </div>
              <div className="text-xs text-blue-700 font-medium">Netas</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-2 rounded-lg border border-red-200">
            <div className="text-center">
              <div className="text-sm font-bold text-red-600 truncate">
                S/ {totals.devoluciones.toFixed(0)}
              </div>
              <div className="text-xs text-red-700 font-medium">Devol.</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2 rounded-lg border border-purple-200">
            <div className="text-center">
              <div className="text-sm font-bold text-purple-600">
                {totals.cantidadVendida}
              </div>
              <div className="text-xs text-purple-700 font-medium">Units</div>
            </div>
          </div>
        </div>

        {/* Grid tradicional para desktop */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg border border-green-200">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                S/ {totals.ventasBrutas.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-green-700 font-medium">Ventas Brutas</div>
              <div className="text-xs text-green-600 mt-1">{getTimeFilterLabel()}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600 truncate">
                S/ {totals.ventasNetas.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-blue-700 font-medium">Ventas Netas</div>
              <div className="text-xs text-blue-600 mt-1">{getTimeFilterLabel()}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-lg border border-red-200">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                S/ {totals.devoluciones.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-red-700 font-medium">Devoluciones</div>
              <div className="text-xs text-red-600 mt-1">{getTimeFilterLabel()}</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-lg border border-purple-200">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">
                {totals.cantidadVendida}
              </div>
              <div className="text-xs sm:text-sm text-purple-700 font-medium">Unidades</div>
              <div className="text-xs text-purple-600 mt-1">{getTimeFilterLabel()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentasLineChart;
