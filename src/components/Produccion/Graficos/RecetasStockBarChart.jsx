import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../../services/api';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * RecetasStockBarChart
 * 
 * Gráfico de barras para visualizar el stock disponible de recetas.
 * Muestra stock por fase (preparado, intermedio, terminado) y costo del inventario.
 */
const RecetasStockBarChart = React.memo(() => {
  const { canViewPrices } = useQuickPermissions();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recetasData, setRecetasData] = useState([]);
  const [totales, setTotales] = useState({
    totalRecetas: 0,
    totalStockDisponible: 0,
    costoTotalInventario: 0,
    recetasSinStock: 0,
    recetasConStock: 0
  });
  
  // Estado para mostrar detalles por fase
  const [mostrarPorFase, setMostrarPorFase] = useState(false);
  
  // Estado para limitar cantidad de recetas mostradas
  const [limite, setLimite] = useState(15);

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

  // Función para obtener datos de stock de recetas
  const fetchRecetasData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/recetas/estadisticas/stock');
      
      const { recetas, totales: totalesBackend } = response.data.data;
      
      setRecetasData(recetas);
      setTotales(totalesBackend);
      
      processChartData(recetas);
    } catch (err) {
      console.error('❌ RecetasStockChart - Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Procesar datos para el gráfico
  const processChartData = useCallback((recetas) => {
    if (!recetas || recetas.length === 0) {
      setChartData(null);
      return;
    }

    // Filtrar recetas con stock > 0 y limitar cantidad
    const recetasFiltradas = recetas
      .filter(r => r.stockDisponible > 0 || r.cantidadProducida > 0)
      .slice(0, limite);

    if (recetasFiltradas.length === 0) {
      setChartData(null);
      return;
    }

    const labels = recetasFiltradas.map(r => {
      // Truncar nombres largos
      const nombre = r.nombre;
      return nombre.length > 20 ? nombre.substring(0, 18) + '...' : nombre;
    });

    let datasets;

    if (mostrarPorFase) {
      // Mostrar stock por fase
      datasets = [
        {
          label: 'Preparado',
          data: recetasFiltradas.map(r => r.stockPorFase?.preparado || 0),
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Intermedio',
          data: recetasFiltradas.map(r => r.stockPorFase?.intermedio || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Terminado',
          data: recetasFiltradas.map(r => r.stockPorFase?.terminado || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ];
    } else {
      // Mostrar stock total
      datasets = [
        {
          label: 'Stock Disponible',
          data: recetasFiltradas.map(r => r.stockDisponible),
          backgroundColor: recetasFiltradas.map(r => {
            // Color según nivel de stock
            if (r.stockDisponible === 0) return 'rgba(239, 68, 68, 0.8)';
            if (r.stockDisponible < 5) return 'rgba(251, 191, 36, 0.8)';
            return 'rgba(16, 185, 129, 0.8)';
          }),
          borderColor: recetasFiltradas.map(r => {
            if (r.stockDisponible === 0) return 'rgb(239, 68, 68)';
            if (r.stockDisponible < 5) return 'rgb(251, 191, 36)';
            return 'rgb(16, 185, 129)';
          }),
          borderWidth: 1,
          borderRadius: 4,
        }
      ];
    }

    setChartData({
      labels,
      datasets,
      // Guardar datos completos para el tooltip
      _recetasCompletas: recetasFiltradas
    });
  }, [limite, mostrarPorFase]);

  // Actualizar gráfico cuando cambian las opciones
  useEffect(() => {
    if (recetasData.length > 0) {
      processChartData(recetasData);
    }
  }, [recetasData, limite, mostrarPorFase, processChartData]);

  // Efecto inicial para cargar datos
  useEffect(() => {
    fetchRecetasData();
  }, [fetchRecetasData]);

  // Opciones del gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: isMobile ? 'y' : 'x', // Barras horizontales en móvil
    plugins: {
      legend: {
        display: mostrarPorFase,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: isMobile ? 10 : 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: function(context) {
            const index = context[0].dataIndex;
            const receta = chartData?._recetasCompletas?.[index];
            return receta?.nombre || context[0].label;
          },
          label: function(context) {
            const index = context.dataIndex;
            const receta = chartData?._recetasCompletas?.[index];
            const value = context.parsed.y ?? context.parsed.x;
            
            if (mostrarPorFase) {
              return `${context.dataset.label}: ${value} ${receta?.unidadMedida || 'unid.'}`;
            }
            return `Stock: ${value} ${receta?.unidadMedida || 'unid.'}`;
          },
          afterBody: function(context) {
            const index = context[0].dataIndex;
            const receta = chartData?._recetasCompletas?.[index];
            
            if (!receta) return [];
            
            const lines = [];
            lines.push('');
            lines.push(`📦 Producido: ${receta.cantidadProducida} ${receta.unidadMedida}`);
            lines.push(`📤 Utilizado: ${receta.cantidadUtilizada} ${receta.unidadMedida}`);
            
            if (receta.costoTotal > 0 && canViewPrices) {
              lines.push(`💰 Costo/unidad: S/ ${receta.costoTotal.toFixed(2)}`);
              const valorInventario = receta.stockDisponible * receta.costoTotal;
              lines.push(`💵 Valor inventario: S/ ${valorInventario.toFixed(2)}`);
            }
            
            if (!mostrarPorFase && (receta.stockPorFase?.preparado > 0 || 
                receta.stockPorFase?.intermedio > 0 || 
                receta.stockPorFase?.terminado > 0)) {
              lines.push('');
              lines.push('📊 Stock por fase:');
              if (receta.stockPorFase.preparado > 0) {
                lines.push(`  • Preparado: ${receta.stockPorFase.preparado}`);
              }
              if (receta.stockPorFase.intermedio > 0) {
                lines.push(`  • Intermedio: ${receta.stockPorFase.intermedio}`);
              }
              if (receta.stockPorFase.terminado > 0) {
                lines.push(`  • Terminado: ${receta.stockPorFase.terminado}`);
              }
            }
            
            return lines;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: !isMobile,
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            size: isMobile ? 9 : 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            size: isMobile ? 9 : 11
          },
          stepSize: 1
        },
        title: {
          display: !isMobile,
          text: 'Cantidad en Stock',
          font: {
            size: 12
          }
        }
      }
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchRecetasData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <span className="text-xl">📝</span>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-600 bg-clip-text text-transparent">
              Stock de Recetas
            </h3>
            <p className="text-xs text-gray-500">Inventario disponible por receta</p>
          </div>
        </div>
        
        {/* Botón refrescar */}
        <button
          onClick={fetchRecetasData}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? '⏳' : '🔄'} Actualizar
        </button>
      </div>

      {/* Controles */}
      <div className="mb-4 flex flex-wrap gap-3">
        {/* Toggle vista por fase */}
        <button
          onClick={() => setMostrarPorFase(!mostrarPorFase)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mostrarPorFase 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {mostrarPorFase ? '📊 Por Fase' : '📦 Stock Total'}
        </button>
        
        {/* Selector de límite */}
        <select
          value={limite}
          onChange={(e) => setLimite(Number(e.target.value))}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500"
        >
          <option value={10}>Top 10</option>
          <option value={15}>Top 15</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
          <div className="text-xs text-blue-600 font-medium">Total Recetas</div>
          <div className="text-xl font-bold text-blue-800">{totales.totalRecetas}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
          <div className="text-xs text-green-600 font-medium">Con Stock</div>
          <div className="text-xl font-bold text-green-800">{totales.recetasConStock}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
          <div className="text-xs text-amber-600 font-medium">Sin Stock</div>
          <div className="text-xl font-bold text-amber-800">{totales.recetasSinStock}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-purple-600 font-medium">Stock Total</div>
          <div className="text-xl font-bold text-purple-800">{totales.totalStockDisponible}</div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="w-full" style={{ height: isMobile ? '400px' : '350px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando stock de recetas...</p>
            </div>
          </div>
        ) : chartData ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="text-4xl mb-2 block">📝</span>
              <p className="text-gray-500">No hay recetas con stock registrado</p>
              <p className="text-sm text-gray-400 mt-1">Produce recetas para ver el inventario</p>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda de colores */}
      {!mostrarPorFase && chartData && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-600">Stock normal (≥5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span className="text-gray-600">Stock bajo (&lt;5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-600">Sin stock</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RecetasStockBarChart.displayName = 'RecetasStockBarChart';

export default RecetasStockBarChart;
