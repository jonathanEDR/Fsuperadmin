import React, { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../../services/api';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * MaterialesBarChart
 * 
 * Gráfico de barras que muestra el stock actual de materiales
 * con información de costos en el tooltip.
 * Zona horaria: America/Lima (UTC-5)
 */
const MaterialesBarChart = React.memo(() => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    totalMateriales: 0,
    stockTotal: 0,
    costoTotalInventario: 0,
    materialesSinStock: 0,
    materialesBajoStock: 0
  });
  
  // Estado para ordenamiento
  const [ordenarPor, setOrdenarPor] = useState('cantidad');
  const [limite, setLimite] = useState(15);
  
  // Estado para almacenar datos completos de materiales (para tooltip)
  const [materialesData, setMaterialesData] = useState([]);

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

  // Función para obtener datos de materiales
  const fetchMaterialesData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/materiales/estadisticas/stock?ordenarPor=${ordenarPor}&limite=${limite}`);
      
      const { materiales, totales } = response.data.data;
      
      // Guardar datos completos para el tooltip
      setMaterialesData(materiales);
      setTotals(totales);
      
      // Procesar datos para el gráfico
      processChartData(materiales);
    } catch (err) {
      console.error('❌ MaterialesBarChart - Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [ordenarPor, limite]);

  // Función para procesar datos del gráfico
  const processChartData = useCallback((materiales) => {
    if (!materiales || materiales.length === 0) {
      setChartData(null);
      return;
    }

    // Crear colores basados en nivel de stock
    const backgroundColors = materiales.map(m => {
      if (m.alertaStock) {
        return 'rgba(239, 68, 68, 0.7)'; // Rojo - bajo stock
      } else if (m.stockDisponible <= m.stockMinimo * 1.5) {
        return 'rgba(245, 158, 11, 0.7)'; // Amarillo - stock medio
      }
      return 'rgba(59, 130, 246, 0.7)'; // Azul - stock bueno
    });

    const borderColors = materiales.map(m => {
      if (m.alertaStock) {
        return 'rgba(239, 68, 68, 1)';
      } else if (m.stockDisponible <= m.stockMinimo * 1.5) {
        return 'rgba(245, 158, 11, 1)';
      }
      return 'rgba(59, 130, 246, 1)';
    });

    const newChartData = {
      labels: materiales.map(m => {
        // Truncar nombre si es muy largo
        const nombre = m.nombre || 'Sin nombre';
        return nombre.length > 20 ? nombre.substring(0, 18) + '...' : nombre;
      }),
      datasets: [
        {
          label: 'Stock Disponible',
          data: materiales.map(m => m.stockDisponible),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };

    setChartData(newChartData);
  }, []);

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    fetchMaterialesData();
  }, [fetchMaterialesData]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchMaterialesData}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
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
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <span className="text-xl">📦</span>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-yellow-700 to-orange-600 bg-clip-text text-transparent">
            Stock de Materiales
          </h3>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {/* Ordenar por */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Ordenar por
            </label>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="cantidad">Mayor Stock</option>
              <option value="costo">Mayor Costo</option>
              <option value="nombre">Nombre (A-Z)</option>
              <option value="alerta">Alertas Primero</option>
            </select>
          </div>

          {/* Cantidad a mostrar */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📋 Mostrar
            </label>
            <select
              value={limite}
              onChange={(e) => setLimite(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
              <option value={30}>Top 30</option>
              <option value={50}>Top 50</option>
            </select>
          </div>

          {/* Botón actualizar */}
          <button
            onClick={fetchMaterialesData}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Leyenda de colores */}
        <div className="mt-4 pt-3 border-t border-yellow-200 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-gray-600">Stock óptimo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-gray-600">Stock medio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-600">Bajo stock / Alerta</span>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full" style={{height: 'clamp(300px, 50vh, 450px)'}}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
                <p className="mt-2 text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : chartData ? (
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: isMobile ? 'y' : 'x', // Barras horizontales en móvil
                plugins: {
                  legend: { 
                    display: false
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
                    callbacks: {
                      title: function(context) {
                        const index = context[0].dataIndex;
                        if (materialesData && materialesData[index]) {
                          return materialesData[index].nombre;
                        }
                        return context[0].label;
                      },
                      label: function(context) {
                        const index = context.dataIndex;
                        if (materialesData && materialesData[index]) {
                          const material = materialesData[index];
                          return `Stock: ${material.stockDisponible} ${material.unidadMedida}`;
                        }
                        return `Stock: ${context.parsed.y || context.parsed.x}`;
                      },
                      afterLabel: function(context) {
                        const index = context.dataIndex;
                        if (materialesData && materialesData[index]) {
                          const material = materialesData[index];
                          const lines = [];
                          
                          lines.push(`💰 Precio unit.: S/ ${material.precioUnitario.toFixed(2)}`);
                          lines.push(`💵 Valor total: S/ ${material.costoTotal.toFixed(2)}`);
                          
                          if (material.stockMinimo > 0) {
                            lines.push(`⚠️ Stock mínimo: ${material.stockMinimo} ${material.unidadMedida}`);
                          }
                          
                          if (material.proveedor && material.proveedor !== 'Sin proveedor') {
                            lines.push(`🏭 Proveedor: ${material.proveedor}`);
                          }
                          
                          if (material.alertaStock) {
                            lines.push('');
                            lines.push('🚨 ¡ALERTA DE STOCK BAJO!');
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
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      maxRotation: isMobile ? 0 : 45,
                      minRotation: isMobile ? 0 : 45,
                      font: {
                        size: isMobile ? 9 : 11
                      }
                    }
                  },
                  y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                      display: !isMobile,
                      text: 'Cantidad en Stock',
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
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <span className="text-4xl mb-2 block">📦</span>
                <p>No hay materiales registrados</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">📦</span>
            <span className="text-xs sm:text-sm text-blue-600 font-medium">Total Materiales</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-blue-800">
            {totals.totalMateriales}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 sm:p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">📊</span>
            <span className="text-xs sm:text-sm text-emerald-600 font-medium">Stock Total</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-800">
            {totals.stockTotal.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 sm:p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">💰</span>
            <span className="text-xs sm:text-sm text-amber-600 font-medium">Valor Inventario</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-amber-800">
            S/ {totals.costoTotalInventario.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">⚠️</span>
            <span className="text-xs sm:text-sm text-orange-600 font-medium">Bajo Stock</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-orange-800">
            {totals.materialesBajoStock}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 sm:p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl">🚫</span>
            <span className="text-xs sm:text-sm text-red-600 font-medium">Sin Stock</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-red-800">
            {totals.materialesSinStock}
          </div>
        </div>
      </div>
    </div>
  );
});

MaterialesBarChart.displayName = 'MaterialesBarChart';

export default MaterialesBarChart;
