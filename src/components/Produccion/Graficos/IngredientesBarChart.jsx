import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../../services/api';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * IngredientesBarChart
 * 
 * Gráfico de barras que muestra el stock actual de ingredientes
 * con información de costos en el tooltip.
 * Zona horaria: America/Lima (UTC-5)
 */
const IngredientesBarChart = React.memo(() => {
  // Hook de permisos para control de visualización de precios
  const { canViewPrices } = useQuickPermissions();
  
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    totalIngredientes: 0,
    stockTotal: 0,
    costoTotalInventario: 0,
    ingredientesSinStock: 0
  });
  
  // Estado para ordenamiento
  const [ordenarPor, setOrdenarPor] = useState('cantidad');
  const [limite, setLimite] = useState(15);
  
  // Estado para almacenar datos completos de ingredientes (para tooltip)
  const [ingredientesData, setIngredientesData] = useState([]);

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

  // Función para obtener datos de ingredientes
  const fetchIngredientesData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/ingredientes/estadisticas/stock?ordenarPor=${ordenarPor}&limite=${limite}`);
      
      const { ingredientes, totales } = response.data.data;
      
      // Guardar datos completos para el tooltip
      setIngredientesData(ingredientes);
      setTotals(totales);
      
      // Procesar datos para el gráfico
      processChartData(ingredientes);
    } catch (err) {
      console.error('❌ IngredientesChart - Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [ordenarPor, limite]);

  // Función para procesar datos del gráfico
  const processChartData = useCallback((ingredientes) => {
    if (!ingredientes || ingredientes.length === 0) {
      setChartData(null);
      return;
    }

    // Generar colores basados en el nivel de inventario DISPONIBLE
    const backgroundColors = ingredientes.map(ing => {
      const disponible = ing.disponible || 0;
      if (disponible === 0) return 'rgba(239, 68, 68, 0.7)'; // Rojo - sin inventario disponible
      if (disponible < 10) return 'rgba(245, 158, 11, 0.7)'; // Amarillo - bajo inventario
      return 'rgba(16, 185, 129, 0.7)'; // Verde - inventario normal
    });

    const borderColors = ingredientes.map(ing => {
      const disponible = ing.disponible || 0;
      if (disponible === 0) return 'rgb(239, 68, 68)';
      if (disponible < 10) return 'rgb(245, 158, 11)';
      return 'rgb(16, 185, 129)';
    });

    const newChartData = {
      labels: ingredientes.map(ing => {
        // Truncar nombres largos en móvil
        const maxLength = isMobile ? 10 : 20;
        return ing.nombre.length > maxLength 
          ? ing.nombre.substring(0, maxLength) + '...' 
          : ing.nombre;
      }),
      datasets: [
        {
          label: 'Inventario Disponible',
          data: ingredientes.map(ing => ing.disponible || 0),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }
      ],
    };
    
    setChartData(newChartData);
  }, [isMobile]);

  // Efecto para cargar datos
  useEffect(() => {
    fetchIngredientesData();
  }, [fetchIngredientesData]);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchIngredientesData}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <span className="text-xl">🥬</span>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-green-800 to-emerald-600 bg-clip-text text-transparent">
            Inventario Disponible de Ingredientes
          </h3>
        </div>
        
        {/* Leyenda de colores */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600">Stock normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-600">Bajo stock (&lt;10)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600">Sin stock</span>
          </div>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {/* Ordenar por */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Ordenar por
            </label>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="cantidad">Mayor stock</option>
              <option value="costo">Mayor costo</option>
              <option value="nombre">Nombre (A-Z)</option>
            </select>
          </div>

          {/* Cantidad a mostrar */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔢 Mostrar
            </label>
            <select
              value={limite}
              onChange={(e) => setLimite(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
              <option value={30}>Top 30</option>
              <option value={50}>Top 50</option>
            </select>
          </div>

          {/* Botón refrescar */}
          <button
            onClick={fetchIngredientesData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full" style={{height: 'clamp(300px, 50vh, 450px)'}}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : chartData ? (
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Barras horizontales para mejor legibilidad de nombres
                plugins: {
                  legend: { 
                    display: false // Ocultamos la leyenda ya que usamos colores informativos
                  },
                  title: { display: false },
                  tooltip: {
                    titleFont: {
                      size: 13,
                      weight: 'bold'
                    },
                    bodyFont: {
                      size: 12
                    },
                    padding: 12,
                    boxPadding: 6,
                    callbacks: {
                      title: function(context) {
                        const index = context[0].dataIndex;
                        if (ingredientesData[index]) {
                          return ingredientesData[index].nombre;
                        }
                        return '';
                      },
                      label: function(context) {
                        const index = context.dataIndex;
                        const ing = ingredientesData[index];
                        if (ing) {
                          return `Disponible: ${ing.disponible || 0} ${ing.unidadMedida}`;
                        }
                        return '';
                      },
                      afterLabel: function(context) {
                        const index = context.dataIndex;
                        const ing = ingredientesData[index];
                        if (ing) {
                          const lines = [];
                          lines.push(`Stock total: ${ing.cantidad} ${ing.unidadMedida}`);
                          // Solo mostrar precios si el usuario tiene permisos y los datos existen
                          if (canViewPrices && ing.precioUnitario !== undefined) {
                            lines.push(`Precio unitario: ${formatCurrency(ing.precioUnitario)}`);
                            lines.push(`Costo total: ${formatCurrency(ing.costoTotal || 0)}`);
                          }
                          return lines;
                        }
                        return [];
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    display: true,
                    title: {
                      display: !isMobile,
                      text: 'Inventario Disponible',
                      font: {
                        size: 12,
                        weight: 'bold'
                      }
                    },
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      font: {
                        size: isMobile ? 10 : 11
                      }
                    }
                  },
                  y: {
                    display: true,
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: isMobile ? 9 : 11
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="text-4xl mb-2 block">📦</span>
                <p className="text-gray-500">No hay ingredientes registrados</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">🥬</span>
            <span className="text-xs sm:text-sm text-green-700 font-medium">Total Ingredientes</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-800">
            {totals.totalIngredientes}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">📦</span>
            <span className="text-xs sm:text-sm text-blue-700 font-medium">Stock Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-800">
            {totals.stockTotal?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 sm:p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">💰</span>
            <span className="text-xs sm:text-sm text-amber-700 font-medium">Costo Inventario</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-amber-800">
            {formatCurrency(totals.costoTotalInventario || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 sm:p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">⚠️</span>
            <span className="text-xs sm:text-sm text-red-700 font-medium">Sin Stock</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-red-800">
            {totals.ingredientesSinStock || 0}
          </p>
        </div>
      </div>
    </div>
  );
});

IngredientesBarChart.displayName = 'IngredientesBarChart';

export default IngredientesBarChart;
