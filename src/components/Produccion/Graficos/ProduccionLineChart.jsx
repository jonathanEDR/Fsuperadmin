import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../../services/api';
import { formatearFecha } from '../../../utils/fechaHoraUtils';
import { procesarFechaParaGrafico } from '../../../utils/graficosDateUtils';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ProduccionLineChart = React.memo(({ userRole }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    totalProducciones: 0,
    totalUnidadesProducidas: 0,
    costoTotalProduccion: 0,
    produccionesCompletadas: 0
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
  
  // 📊 State para almacenar detalles de productos por día (para tooltip enriquecido)
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

  // Función auxiliar para obtener fecha solo (YYYY-MM-DD) considerando zona horaria de Perú
  const obtenerFechaSoloLocal = useCallback((fecha) => {
    if (!fecha) return null;
    // Usar toLocaleDateString para obtener la fecha en zona horaria de Perú
    const fechaLocal = fecha.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // Formato YYYY-MM-DD
    return fechaLocal;
  }, []);

  // Función para obtener datos de producción
  const fetchProduccionData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) {
      return;
    }

    setLoading(true);
    setError(null);

    const urlEndpoint = `/api/produccion/estadisticas/graficos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    
    // Log estratégico: URL y rango de fechas
    console.log('📊 ProduccionLineChart - Petición:', { url: urlEndpoint, fechaInicio, fechaFin });

    try {
      const response = await api.get(urlEndpoint);
      
      // Validar estructura de respuesta
      if (!response.data || !response.data.data) {
        console.error('❌ ProduccionLineChart - Estructura de respuesta inválida:', response.data);
        setError('Estructura de datos incorrecta');
        return;
      }
      
      const { producciones, produccionesPorDia, totales } = response.data.data;
      
      // Log estratégico: Resumen de datos recibidos
      console.log('📊 ProduccionLineChart - Datos:', {
        producciones: producciones?.length || 0,
        dias: Object.keys(produccionesPorDia || {}).length,
        totales: totales
      });
      
      // Guardar detalles por día para el tooltip
      setDetallesPorDia(produccionesPorDia || {});
      
      await processProduccionData(producciones, totales);
    } catch (err) {
      console.error('❌ ProduccionLineChart - Error:', err.message, err.response?.status);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  // Función para procesar datos de producción
  const processProduccionData = useCallback(async (producciones, totalesBackend) => {
    try {
      if (!fechaInicio || !fechaFin) {
        return;
      }

      // Validar que el array sea válido
      const produccionesValidas = Array.isArray(producciones) ? producciones : [];

      // Configurar fechas en zona horaria local de Perú
      const startDate = new Date(fechaInicio + 'T00:00:00');
      const endDate = new Date(fechaFin + 'T23:59:59.999');

      // Generar etiquetas para el rango de fechas (usando hora local)
      const labels = [];
      const fechaActual = new Date(startDate);
      
      while (fechaActual <= endDate) {
        const año = fechaActual.getFullYear();
        const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaActual.getDate()).padStart(2, '0');
        labels.push(`${año}-${mes}-${dia}`);
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
      
      // Guardar las etiquetas originales para el tooltip
      setOriginalLabels(labels);
      
      if (labels.length === 0) {
        console.error('❌ ProduccionLineChart - No se pudieron generar etiquetas');
        setError('Error al generar las etiquetas del gráfico');
        return;
      }

      // Inicializar estructura de datos
      const dataPoints = labels.map(() => ({ 
        unidadesProducidas: 0, 
        costoProduccion: 0, 
        cantidadProducciones: 0,
        produccionesCompletadas: 0
      }));

      // Procesar producciones - filtrar por rango de fechas
      produccionesValidas.forEach(produccion => {
        if (!produccion || !produccion.fechaProduccion) {
          return;
        }
        
        // Usar procesarFechaParaGrafico para manejar zona horaria correctamente
        const fechaProduccion = procesarFechaParaGrafico(produccion.fechaProduccion);
        if (!fechaProduccion) {
          return;
        }
        
        // Obtener fecha solo (YYYY-MM-DD) en zona horaria de Perú
        const fechaSoloProduccion = obtenerFechaSoloLocal(fechaProduccion);
        
        // Encontrar el índice correcto basado en la fecha local
        const index = labels.indexOf(fechaSoloProduccion);
        
        if (index >= 0 && index < dataPoints.length) {
          const cantidadProducida = parseFloat(produccion.cantidadProducida) || 0;
          const costoTotal = parseFloat(produccion.costoTotal) || 0;
          
          dataPoints[index].unidadesProducidas += cantidadProducida;
          dataPoints[index].costoProduccion += costoTotal;
          dataPoints[index].cantidadProducciones += 1;
          
          if (produccion.estado === 'completada') {
            dataPoints[index].produccionesCompletadas += 1;
          }
        }
      });

      // Calcular totales del período
      let totalUnidades = 0;
      let totalCosto = 0;
      let totalProducciones = 0;
      let totalCompletadas = 0;

      dataPoints.forEach(point => {
        totalUnidades += point.unidadesProducidas;
        totalCosto += point.costoProduccion;
        totalProducciones += point.cantidadProducciones;
        totalCompletadas += point.produccionesCompletadas;
      });

      const periodTotals = {
        totalProducciones: totalesBackend?.totalProducciones || totalProducciones,
        totalUnidadesProducidas: totalesBackend?.totalUnidadesProducidas || totalUnidades,
        costoTotalProduccion: totalesBackend?.costoTotalProduccion || totalCosto,
        produccionesCompletadas: totalesBackend?.produccionesCompletadas || totalCompletadas
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
            label: 'Unidades Producidas',
            data: dataPoints.map(point => point.unidadesProducidas),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y',
          },
          {
            label: 'Costo Producción (S/)',
            data: dataPoints.map(point => point.costoProduccion),
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y1',
          },
          {
            label: 'N° Producciones',
            data: dataPoints.map(point => point.cantidadProducciones),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y',
            borderWidth: 2,
            borderDash: [5, 5],
          },
        ],
      };
      
      if (!newChartData.labels || newChartData.labels.length === 0) {
        console.error('❌ ProduccionLineChart - Sin datos válidos para mostrar');
        setError('No hay datos para mostrar en el período seleccionado');
        return;
      }
      
      setChartData(newChartData);
    } catch (err) {
      console.error('❌ ProduccionLineChart - Error:', err.message);
      setError('No se pudo cargar el gráfico de producción: ' + err.message);
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
        fetchProduccionData();
      }, 300); // Debounce de 300ms para evitar múltiples llamadas

      return () => clearTimeout(timer);
    }
  }, [fetchProduccionData, fechaInicio, fechaFin]);

  // Efecto inicial para cargar datos por defecto
  useEffect(() => {
    fetchProduccionData();
  }, []); // Solo se ejecuta una vez al montar el componente

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchProduccionData}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 14.229l-4.419 2.585A1 1 0 014 16V4zm2 0v10.586l3.419-2a1 1 0 011.162 0L14 14.586V4H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-800 to-indigo-600 bg-clip-text text-transparent">
            Producción Diaria
          </h3>
        </div>
        
        {/* Información del período actual */}
        <div className="text-center">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            🏭 {getTimeFilterLabel()}
          </span>
        </div>
      </div>

      {/* Panel de selección de fechas siempre visible */}
      <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-sm text-purple-800">
              🏭 Analizando desde {new Date(fechaInicio).toLocaleDateString('es-ES')} hasta {new Date(fechaFin).toLocaleDateString('es-ES')}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
                      size: window.innerWidth < 640 ? 11 : 13,
                      weight: 'bold'
                    },
                    bodyFont: {
                      size: window.innerWidth < 640 ? 10 : 11
                    },
                    footerFont: {
                      size: window.innerWidth < 640 ? 9 : 10,
                      style: 'italic'
                    },
                    padding: 12,
                    boxPadding: 6,
                    callbacks: {
                      title: function(context) {
                        const index = context[0].dataIndex;
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
                        if (label.includes('Costo')) {
                          return `${label}: S/ ${value.toFixed(2)}`;
                        }
                        return `${label}: ${value.toFixed(0)}`;
                      },
                      afterBody: function(context) {
                        const index = context[0].dataIndex;
                        if (originalLabels && originalLabels[index]) {
                          const fechaClave = originalLabels[index];
                          const detalle = detallesPorDia[fechaClave];
                          
                          if (detalle && detalle.productos && detalle.productos.length > 0) {
                            const lines = ['', '📦 Productos producidos:'];
                            
                            // Agrupar productos por nombre para evitar duplicados
                            const productosAgrupados = {};
                            detalle.productos.forEach(p => {
                              const key = p.nombre;
                              if (!productosAgrupados[key]) {
                                productosAgrupados[key] = {
                                  nombre: p.nombre,
                                  cantidad: 0,
                                  unidad: p.unidad,
                                  costo: 0
                                };
                              }
                              productosAgrupados[key].cantidad += p.cantidad;
                              productosAgrupados[key].costo += p.costo;
                            });
                            
                            // Mostrar hasta 5 productos más destacados
                            const productosOrdenados = Object.values(productosAgrupados)
                              .sort((a, b) => b.cantidad - a.cantidad)
                              .slice(0, 5);
                            
                            productosOrdenados.forEach(p => {
                              const unidad = p.unidad || 'unid.';
                              lines.push(`  • ${p.nombre}: ${p.cantidad} ${unidad}`);
                            });
                            
                            if (Object.keys(productosAgrupados).length > 5) {
                              lines.push(`  ... y ${Object.keys(productosAgrupados).length - 5} más`);
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
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: !isMobile,
                      text: 'Unidades / Producciones',
                      font: {
                        size: 11
                      }
                    },
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 9 : 11
                      }
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: !isMobile,
                      text: 'Costo (S/)',
                      font: {
                        size: 11
                      }
                    },
                    grid: {
                      drawOnChartArea: false,
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
                <div className="text-gray-400 text-6xl mb-4">🏭</div>
                <p className="text-gray-500">No hay datos de producción</p>
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
              <p className="text-xs sm:text-sm font-medium text-green-800">Unidades Producidas</p>
              <p className="text-base sm:text-xl font-bold text-green-900">
                {totals.totalUnidadesProducidas.toLocaleString()}
              </p>
            </div>
            <div className="text-green-600 text-xl sm:text-2xl">📦</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-amber-800">Costo Total</p>
              <p className="text-base sm:text-xl font-bold text-amber-900">
                S/ {totals.costoTotalProduccion.toFixed(2)}
              </p>
            </div>
            <div className="text-amber-600 text-xl sm:text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-800">Total Producciones</p>
              <p className="text-base sm:text-xl font-bold text-blue-900">
                {totals.totalProducciones}
              </p>
            </div>
            <div className="text-blue-600 text-xl sm:text-2xl">🏭</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-purple-800">Completadas</p>
              <p className="text-base sm:text-xl font-bold text-purple-900">
                {totals.produccionesCompletadas}
              </p>
            </div>
            <div className="text-purple-600 text-xl sm:text-2xl">✅</div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProduccionLineChart.displayName = 'ProduccionLineChart';

export default ProduccionLineChart;
