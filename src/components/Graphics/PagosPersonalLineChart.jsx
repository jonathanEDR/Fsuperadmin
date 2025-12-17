import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * PagosPersonalLineChart
 * 
 * Gráfico de línea temporal que muestra los pagos diarios realizados al personal.
 * Zona horaria: America/Lima (UTC-5)
 */
const PagosPersonalLineChart = React.memo(({ userRole }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    totalPagos: 0,
    montoTotalPagado: 0,
    colaboradoresPagados: 0
  });
  
  // Estados para filtro de fechas
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    return hace30Dias.toISOString().split('T')[0];
  });
  
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // State para detalles por día (tooltip enriquecido)
  const [originalLabels, setOriginalLabels] = useState([]);
  const [detallesPorDia, setDetallesPorDia] = useState({});

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

  // Función para obtener datos
  const fetchPagosData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/pagos-realizados/estadisticas/graficos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      
      const { pagos, pagosPorDia, totales } = response.data.data;
      
      setDetallesPorDia(pagosPorDia || {});
      setTotals(totales);
      
      processChartData(pagos, pagosPorDia);
    } catch (err) {
      console.error('❌ PagosPersonalChart - Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  // Procesar datos para el gráfico
  const processChartData = useCallback((pagos, pagosPorDia) => {
    try {
      // Generar etiquetas para el rango de fechas
      const startDate = new Date(fechaInicio + 'T00:00:00');
      const endDate = new Date(fechaFin + 'T23:59:59.999');
      
      const labels = [];
      const fechaActual = new Date(startDate);
      
      while (fechaActual <= endDate) {
        const año = fechaActual.getFullYear();
        const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaActual.getDate()).padStart(2, '0');
        labels.push(`${año}-${mes}-${dia}`);
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
      
      setOriginalLabels(labels);

      // Inicializar datos
      const dataPoints = labels.map(fecha => {
        const detalle = pagosPorDia[fecha];
        return {
          montoPagado: detalle?.totalPagado || 0,
          cantidadPagos: detalle?.cantidadPagos || 0
        };
      });

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
            label: 'Pagos al Personal (S/)',
            data: dataPoints.map(point => point.montoPagado),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'N° de Pagos',
            data: dataPoints.map(point => point.cantidadPagos),
            borderColor: '#EC4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y1',
            borderWidth: 2,
            borderDash: [5, 5],
          }
        ],
      };
      
      setChartData(newChartData);
    } catch (err) {
      setError('No se pudo procesar los datos: ' + err.message);
    }
  }, [fechaInicio, fechaFin]);

  // Función para obtener etiqueta del período
  const getTimeFilterLabel = useCallback(() => {
    if (!fechaInicio || !fechaFin) return 'Selecciona un rango de fechas';
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferenciaDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
    
    return `${inicio.toLocaleDateString('es-ES')} - ${fin.toLocaleDateString('es-ES')} (${diferenciaDias} ${diferenciaDias === 1 ? 'día' : 'días'})`;
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const timer = setTimeout(() => {
        fetchPagosData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fetchPagosData, fechaInicio, fechaFin]);

  useEffect(() => {
    fetchPagosData();
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchPagosData}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-pink-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <span className="text-xl">💰</span>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-violet-800 to-pink-600 bg-clip-text text-transparent">
            Pagos Diarios al Personal
          </h3>
        </div>
        
        <div className="text-center">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            💰 {getTimeFilterLabel()}
          </span>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="mb-6 bg-violet-50 border border-violet-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha de Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              max={fechaFin || new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha de Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              min={fechaInicio}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

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

        {fechaInicio && fechaFin && (
          <div className="mt-3 pt-3 border-t border-violet-200">
            <p className="text-sm text-violet-800">
              💰 Analizando pagos desde {new Date(fechaInicio).toLocaleDateString('es-ES')} hasta {new Date(fechaFin).toLocaleDateString('es-ES')}
            </p>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full" style={{height: 'clamp(280px, 50vh, 400px)'}}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
                <p className="mt-2 text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : chartData ? (
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: { 
                    display: true, 
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: isMobile ? 8 : 15,
                      boxWidth: isMobile ? 8 : 12,
                      font: { size: isMobile ? 9 : 12 }
                    }
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 11 },
                    padding: 12,
                    callbacks: {
                      title: function(context) {
                        const index = context[0].dataIndex;
                        if (originalLabels && originalLabels[index]) {
                          const date = new Date(originalLabels[index] + 'T00:00:00');
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
                        if (label.includes('S/')) {
                          return `${label}: S/ ${value.toFixed(2)}`;
                        }
                        return `${label}: ${value}`;
                      },
                      afterBody: function(context) {
                        const index = context[0].dataIndex;
                        if (originalLabels && originalLabels[index]) {
                          const fechaClave = originalLabels[index];
                          const detalle = detallesPorDia[fechaClave];
                          
                          if (detalle && detalle.pagos && detalle.pagos.length > 0) {
                            const lines = ['', '👥 Pagos realizados:'];
                            
                            detalle.pagos.slice(0, 5).forEach(p => {
                              lines.push(`  • ${p.colaborador}: S/ ${p.monto.toFixed(2)}`);
                            });
                            
                            if (detalle.pagos.length > 5) {
                              lines.push(`  ... y ${detalle.pagos.length - 5} más`);
                            }
                            
                            return lines;
                          }
                        }
                        return [];
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: { color: 'rgba(0,0,0,0.1)' },
                    ticks: {
                      maxTicksLimit: isMobile ? 5 : 10,
                      font: { size: isMobile ? 9 : 11 }
                    }
                  },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: !isMobile,
                      text: 'Monto (S/)',
                      font: { size: 11 }
                    },
                    grid: { color: 'rgba(0,0,0,0.1)' },
                    ticks: {
                      font: { size: isMobile ? 9 : 11 },
                      callback: function(value) {
                        return 'S/ ' + value.toFixed(0);
                      }
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: !isMobile,
                      text: 'N° Pagos',
                      font: { size: 11 }
                    },
                    grid: { drawOnChartArea: false },
                    ticks: { font: { size: isMobile ? 9 : 11 } }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <span className="text-4xl mb-2 block">💰</span>
                <p>No hay pagos registrados en este período</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3 sm:p-4 border border-violet-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">💵</span>
            <span className="text-xs sm:text-sm text-violet-600 font-medium">Total Pagado</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-violet-800">
            S/ {totals.montoTotalPagado?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 sm:p-4 border border-pink-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">📝</span>
            <span className="text-xs sm:text-sm text-pink-600 font-medium">N° de Pagos</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-pink-800">
            {totals.totalPagos || 0}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 sm:p-4 border border-indigo-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">👥</span>
            <span className="text-xs sm:text-sm text-indigo-600 font-medium">Colaboradores</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-indigo-800">
            {totals.colaboradoresPagados || 0}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 sm:p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">💳</span>
            <span className="text-xs sm:text-sm text-emerald-600 font-medium">En Efectivo</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-800">
            S/ {totals.pagosPorMetodo?.efectivo?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
});

PagosPersonalLineChart.displayName = 'PagosPersonalLineChart';

export default PagosPersonalLineChart;
