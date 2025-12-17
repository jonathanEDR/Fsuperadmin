import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../../services/api';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * ResiduosLineChart
 * 
 * Gráfico lineal temporal que muestra la evolución de residuos y malogrados
 * con información detallada por día en el tooltip.
 * Zona horaria: America/Lima (UTC-5)
 */
const ResiduosLineChart = React.memo(() => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    totalResiduos: 0,
    totalCantidadPerdida: 0,
    costoTotalPerdida: 0,
    porMotivo: {},
    porTipo: {}
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

  // Filtros adicionales
  const [tipoProducto, setTipoProducto] = useState('');
  const [motivo, setMotivo] = useState('');

  // State para almacenar las etiquetas originales y detalles por día
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

  // Mapeo de motivos para mostrar
  const motivosLabels = {
    vencido: '📅 Vencido',
    dañado: '💥 Dañado',
    merma: '📉 Merma',
    error_proceso: '⚠️ Error de proceso',
    otros: '❓ Otros'
  };

  // Mapeo de tipos de producto
  const tiposLabels = {
    ingrediente: '🥬 Ingrediente',
    material: '📦 Material',
    receta: '📝 Receta',
    produccion: '🏭 Producción'
  };

  // Función auxiliar para obtener fecha solo (YYYY-MM-DD) en zona horaria de Perú
  const obtenerFechaSoloLocal = useCallback((fecha) => {
    if (!fecha) return null;
    const fechaLocal = fecha.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    return fechaLocal;
  }, []);

  // Función para obtener datos de residuos
  const fetchResiduosData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;

    setLoading(true);
    setError(null);

    try {
      let url = `/api/residuos/estadisticas/graficos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      if (tipoProducto) url += `&tipoProducto=${tipoProducto}`;
      if (motivo) url += `&motivo=${motivo}`;
      
      const response = await api.get(url);
      
      const { residuos, residuosPorDia, totales } = response.data.data;
      
      // Guardar detalles por día para el tooltip
      setDetallesPorDia(residuosPorDia || {});
      setTotals(totales);
      
      await processResiduosData(residuos);
    } catch (err) {
      console.error('❌ ResiduosLineChart - Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, tipoProducto, motivo]);

  // Función para procesar datos de residuos
  const processResiduosData = useCallback(async (residuos) => {
    try {
      if (!fechaInicio || !fechaFin) return;

      const residuosValidos = Array.isArray(residuos) ? residuos : [];

      // Configurar fechas en zona horaria local de Perú
      const startDate = new Date(fechaInicio + 'T00:00:00');
      const endDate = new Date(fechaFin + 'T23:59:59.999');

      // Generar etiquetas para el rango de fechas
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
      
      if (labels.length === 0) {
        setError('Error al generar las etiquetas del gráfico');
        return;
      }

      // Inicializar estructura de datos
      const dataPoints = labels.map(() => ({ 
        cantidadPerdida: 0, 
        costoPerdida: 0, 
        cantidadResiduos: 0
      }));

      // Procesar residuos
      residuosValidos.forEach(residuo => {
        if (!residuo || !residuo.fecha) return;
        
        const fechaResiduo = new Date(residuo.fecha);
        const fechaSolo = obtenerFechaSoloLocal(fechaResiduo);
        const index = labels.indexOf(fechaSolo);
        
        if (index >= 0 && index < dataPoints.length) {
          dataPoints[index].cantidadPerdida += parseFloat(residuo.cantidadPerdida) || 0;
          dataPoints[index].costoPerdida += parseFloat(residuo.costoEstimado) || 0;
          dataPoints[index].cantidadResiduos += 1;
        }
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
            label: 'Cantidad Perdida',
            data: dataPoints.map(point => point.cantidadPerdida),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y',
          },
          {
            label: 'Costo Pérdida (S/)',
            data: dataPoints.map(point => point.costoPerdida),
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y1',
          },
          {
            label: 'N° Registros',
            data: dataPoints.map(point => point.cantidadResiduos),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y',
            borderWidth: 2,
            borderDash: [5, 5],
          },
        ],
      };
      
      setChartData(newChartData);
    } catch (err) {
      setError('No se pudo cargar el gráfico de residuos: ' + err.message);
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

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const timer = setTimeout(() => {
        fetchResiduosData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fetchResiduosData, fechaInicio, fechaFin, tipoProducto, motivo]);

  // Efecto inicial
  useEffect(() => {
    fetchResiduosData();
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchResiduosData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <span className="text-xl">🗑️</span>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-red-700 to-orange-600 bg-clip-text text-transparent">
            Residuos y Malogrados
          </h3>
        </div>
        
        <div className="text-center">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            📊 {getTimeFilterLabel()}
          </span>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fecha de inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              max={fechaFin || new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Fecha de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              min={fechaInicio}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Tipo de producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📦 Tipo de Producto
            </label>
            <select
              value={tipoProducto}
              onChange={(e) => setTipoProducto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Todos los tipos</option>
              <option value="ingrediente">🥬 Ingrediente</option>
              <option value="material">📦 Material</option>
              <option value="receta">📝 Receta</option>
              <option value="produccion">🏭 Producción</option>
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ❓ Motivo
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Todos los motivos</option>
              <option value="vencido">📅 Vencido</option>
              <option value="dañado">💥 Dañado</option>
              <option value="merma">📉 Merma</option>
              <option value="error_proceso">⚠️ Error de proceso</option>
              <option value="otros">❓ Otros</option>
            </select>
          </div>
        </div>

        {/* Botones de accesos rápidos */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-red-200">
          <button
            onClick={() => {
              const hoy = new Date();
              const hace7Dias = new Date();
              hace7Dias.setDate(hoy.getDate() - 7);
              setFechaInicio(hace7Dias.toISOString().split('T')[0]);
              setFechaFin(hoy.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium transition-colors"
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
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium transition-colors"
          >
            Últimos 30 días
          </button>
          
          <button
            onClick={() => {
              const hoy = new Date();
              const hace90Dias = new Date();
              hace90Dias.setDate(hoy.getDate() - 90);
              setFechaInicio(hace90Dias.toISOString().split('T')[0]);
              setFechaFin(hoy.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium transition-colors"
          >
            Últimos 90 días
          </button>

          <button
            onClick={() => {
              setTipoProducto('');
              setMotivo('');
            }}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-xs font-medium transition-colors"
          >
            🔄 Limpiar filtros
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full" style={{height: 'clamp(280px, 50vh, 400px)'}}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
                      boxHeight: isMobile ? 8 : 12,
                      font: {
                        size: isMobile ? 9 : 12
                      }
                    }
                  },
                  title: { display: false },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    titleFont: {
                      size: isMobile ? 11 : 13,
                      weight: 'bold'
                    },
                    bodyFont: {
                      size: isMobile ? 10 : 11
                    },
                    footerFont: {
                      size: isMobile ? 9 : 10,
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
                            const lines = ['', '📦 Productos afectados:'];
                            
                            // Agrupar por nombre
                            const productosAgrupados = {};
                            detalle.productos.forEach(p => {
                              const key = p.nombre;
                              if (!productosAgrupados[key]) {
                                productosAgrupados[key] = {
                                  nombre: p.nombre,
                                  cantidad: 0,
                                  unidad: p.unidad,
                                  costo: 0,
                                  motivos: new Set()
                                };
                              }
                              productosAgrupados[key].cantidad += p.cantidad;
                              productosAgrupados[key].costo += p.costo;
                              productosAgrupados[key].motivos.add(p.motivo);
                            });
                            
                            // Mostrar hasta 5 productos
                            const productosOrdenados = Object.values(productosAgrupados)
                              .sort((a, b) => b.costo - a.costo)
                              .slice(0, 5);
                            
                            productosOrdenados.forEach(p => {
                              const unidad = p.unidad || 'unid.';
                              lines.push(`  • ${p.nombre}: ${p.cantidad} ${unidad}`);
                            });
                            
                            if (Object.keys(productosAgrupados).length > 5) {
                              lines.push(`  ... y ${Object.keys(productosAgrupados).length - 5} más`);
                            }
                            
                            // Mostrar resumen por motivo
                            if (detalle.porMotivo && Object.keys(detalle.porMotivo).length > 0) {
                              lines.push('');
                              lines.push('📋 Por motivo:');
                              Object.entries(detalle.porMotivo).forEach(([mot, cant]) => {
                                const label = motivosLabels[mot] || mot;
                                lines.push(`  ${label}: ${cant}`);
                              });
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
                      maxTicksLimit: isMobile ? 5 : 10,
                      font: {
                        size: isMobile ? 9 : 11
                      }
                    }
                  },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: !isMobile,
                      text: 'Cantidad / Registros',
                      font: {
                        size: 11
                      }
                    },
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      font: {
                        size: isMobile ? 9 : 11
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
                        size: isMobile ? 9 : 11
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
              <div className="text-center text-gray-500">
                <span className="text-4xl mb-2 block">🗑️</span>
                <p>No hay residuos registrados en este período</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 sm:p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">🗑️</span>
            <span className="text-xs sm:text-sm text-red-600 font-medium">Total Registros</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-red-800">
            {totals.totalResiduos}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">📉</span>
            <span className="text-xs sm:text-sm text-orange-600 font-medium">Cantidad Perdida</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-orange-800">
            {totals.totalCantidadPerdida.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 sm:p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">💰</span>
            <span className="text-xs sm:text-sm text-amber-600 font-medium">Costo Pérdida</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-amber-800">
            S/ {totals.costoTotalPerdida.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 sm:p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">📊</span>
            <span className="text-xs sm:text-sm text-purple-600 font-medium">Tipos Afectados</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-purple-800">
            {Object.keys(totals.porTipo || {}).length}
          </div>
        </div>
      </div>

      {/* Resumen por motivo y tipo */}
      {(Object.keys(totals.porMotivo || {}).length > 0 || Object.keys(totals.porTipo || {}).length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Por motivo */}
          {Object.keys(totals.porMotivo || {}).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Distribución por Motivo</h4>
              <div className="space-y-2">
                {Object.entries(totals.porMotivo).map(([mot, cant]) => (
                  <div key={mot} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{motivosLabels[mot] || mot}</span>
                    <span className="text-sm font-semibold text-gray-800">{cant}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Por tipo */}
          {Object.keys(totals.porTipo || {}).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">📦 Distribución por Tipo</h4>
              <div className="space-y-2">
                {Object.entries(totals.porTipo).map(([tipo, cant]) => (
                  <div key={tipo} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{tiposLabels[tipo] || tipo}</span>
                    <span className="text-sm font-semibold text-gray-800">{cant}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ResiduosLineChart.displayName = 'ResiduosLineChart';

export default ResiduosLineChart;
