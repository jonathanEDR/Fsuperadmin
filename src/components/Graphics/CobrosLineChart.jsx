import React, { useEffect, useState, useCallback, memo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getCobrosHistorial } from '../../services/cobroService';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CobrosLineChart = memo(({ userRole }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    total: 0,
    yape: 0,
    efectivo: 0,
    billetes: 0,
    faltantes: 0,
    gastos: 0,
    cobroNeto: 0
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
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
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

  // Función para procesar datos de cobros
  const processCobrosData = useCallback((cobros) => {
    if (!fechaInicio || !fechaFin) return null;

    // Crear un mapa de fechas para agrupar los cobros por día
    const dataByDate = {};
    
    // Inicializar todas las fechas en el rango
    const startDate = new Date(fechaInicio + 'T00:00:00');
    const endDate = new Date(fechaFin + 'T23:59:59');
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dataByDate[dateKey] = {
        yape: 0,
        efectivo: 0,
        billetes: 0,
        faltantes: 0,
        gastos: 0,
        total: 0,
        cobroNeto: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Procesar cada cobro
    cobros.forEach((cobro) => {
      // Usar fechaCobro como principal
      let fechaBase = cobro.fechaCobro || cobro.createdAt || cobro.fecha || cobro.fechaCreacion || cobro.updatedAt || cobro.timestamp;
      if (!fechaBase) return;
      
      const cobroDate = new Date(fechaBase);
      if (isNaN(cobroDate.getTime())) return;
      
      // Obtener la fecha en formato YYYY-MM-DD usando timezone de Perú
      const dateKey = obtenerFechaSoloLocal(cobroDate);
      
      // Solo procesar si está dentro del rango
      if (dataByDate[dateKey]) {
        const yape = Number(cobro.yape || 0);
        const efectivo = Number(cobro.efectivo || 0);
        const billetes = Number(cobro.billetes || 0);
        const faltantes = Number(cobro.faltantes || 0);
        const gastos = Number(cobro.gastosImprevistos || 0);
        
        dataByDate[dateKey].yape += yape;
        dataByDate[dateKey].efectivo += efectivo;
        dataByDate[dateKey].billetes += billetes;
        dataByDate[dateKey].faltantes += faltantes;
        dataByDate[dateKey].gastos += gastos;
        dataByDate[dateKey].total += yape + efectivo + billetes + faltantes + gastos;
        dataByDate[dateKey].cobroNeto += yape + efectivo + billetes + faltantes;
      }
    });

    // Convertir a arrays para el gráfico
    const sortedDates = Object.keys(dataByDate).sort();
    const labels = sortedDates.map(date => {
      const d = new Date(date + 'T12:00:00');
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    });

    // Guardar labels originales para tooltips
    setOriginalLabels(sortedDates.map(date => {
      const d = new Date(date + 'T12:00:00');
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }));

    const dataPoints = sortedDates.map(date => dataByDate[date]);

    // Calcular totales
    const periodTotals = dataPoints.reduce((acc, point) => ({
      total: acc.total + point.total,
      yape: acc.yape + point.yape,
      efectivo: acc.efectivo + point.efectivo,
      billetes: acc.billetes + point.billetes,
      faltantes: acc.faltantes + point.faltantes,
      gastos: acc.gastos + point.gastos,
      cobroNeto: acc.cobroNeto + point.cobroNeto
    }), { total: 0, yape: 0, efectivo: 0, billetes: 0, faltantes: 0, gastos: 0, cobroNeto: 0 });

    setTotals(periodTotals);

    return {
      labels,
      datasets: [
        {
          label: 'Yape (S/)',
          data: dataPoints.map(point => point.yape),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Efectivo (S/)',
          data: dataPoints.map(point => point.efectivo),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Billetes (S/)',
          data: dataPoints.map(point => point.billetes),
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Faltantes (S/)',
          data: dataPoints.map(point => point.faltantes),
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Gastos (S/)',
          data: dataPoints.map(point => point.gastos),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Total (S/)',
          data: dataPoints.map(point => point.total),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: false,
          borderWidth: 3,
        },
        {
          label: 'Cobro Neto (S/)',
          data: dataPoints.map(point => point.cobroNeto),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.3,
          fill: false,
          borderWidth: 3,
          borderDash: [5, 3],
        },
      ],
    };
  }, [fechaInicio, fechaFin, obtenerFechaSoloLocal]);

  // Función para obtener datos
  const fetchData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getCobrosHistorial(1, 1000);
      const cobros = response.cobros || [];
      const processedData = processCobrosData(cobros);
      setChartData(processedData);
    } catch (err) {
      setError('No se pudo cargar el gráfico de cobros: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, processCobrosData]);

  // Función para obtener la etiqueta del filtro
  const getTimeFilterLabel = useCallback(() => {
    if (!fechaInicio || !fechaFin) return 'Sin período';
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return `${inicio.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${fin.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} (${diffDays} días)`;
  }, [fechaInicio, fechaFin]);

  // Efecto para cargar datos cuando cambian las fechas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fechaInicio && fechaFin) {
        fetchData();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchData, fechaInicio, fechaFin]);

  // Efecto inicial
  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <p className="text-red-800 font-medium">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Control de Cobros
          </h3>
        </div>
        
        {/* Indicador del período */}
        <div className="text-center">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            💰 {getTimeFilterLabel()}
          </span>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {/* Fecha de Inicio */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha de Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              max={fechaFin || new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Fecha de Fin */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha de Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              min={fechaInicio}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Botones de acceso rápido */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                const hace7Dias = new Date();
                hace7Dias.setDate(hace7Dias.getDate() - 7);
                setFechaInicio(hace7Dias.toISOString().split('T')[0]);
                setFechaFin(new Date().toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium whitespace-nowrap transition-colors"
            >
              Últimos 7 días
            </button>
            
            <button
              onClick={() => {
                const hace30Dias = new Date();
                hace30Dias.setDate(hace30Dias.getDate() - 30);
                setFechaInicio(hace30Dias.toISOString().split('T')[0]);
                setFechaFin(new Date().toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium whitespace-nowrap transition-colors"
            >
              Últimos 30 días
            </button>
          </div>
        </div>

        {/* Info del análisis */}
        {fechaInicio && fechaFin && (
          <div className="mt-3 pt-3 border-t border-emerald-200">
            <p className="text-sm text-emerald-800">
              💰 Analizando desde {new Date(fechaInicio).toLocaleDateString('es-ES')} hasta {new Date(fechaFin).toLocaleDateString('es-ES')}
              {(() => {
                const inicio = new Date(fechaInicio);
                const fin = new Date(fechaFin);
                const diffDays = Math.ceil(Math.abs(fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
                return ` (${diffDays} días)`;
              })()}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
                      size: isMobile ? 11 : 12
                    },
                    bodyFont: {
                      size: isMobile ? 10 : 11
                    },
                    callbacks: {
                      title: function(context) {
                        const index = context[0]?.dataIndex;
                        if (index !== undefined && originalLabels[index]) {
                          return originalLabels[index];
                        }
                        return context[0]?.label || '';
                      },
                      label: function(context) {
                        return `${context.dataset.label}: S/ ${context.parsed.y.toFixed(2)}`;
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
                    display: true,
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                    },
                    ticks: {
                      font: {
                        size: isMobile ? 9 : 11
                      },
                      callback: function(value) {
                        return 'S/ ' + value;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">💰</div>
                <p className="text-gray-500">No hay datos para mostrar</p>
                <p className="text-gray-400 text-sm">Selecciona un rango de fechas válido</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumen de totales - Tarjetas con gradientes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-800">Total Cobros</p>
              <p className="text-base sm:text-xl font-bold text-blue-900">
                S/ {totals.total.toFixed(2)}
              </p>
            </div>
            <div className="text-blue-600 text-xl sm:text-2xl">💵</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-purple-800">Cobro Neto</p>
              <p className="text-base sm:text-xl font-bold text-purple-900">
                S/ {totals.cobroNeto.toFixed(2)}
              </p>
            </div>
            <div className="text-purple-600 text-xl sm:text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-800">Yape</p>
              <p className="text-base sm:text-xl font-bold text-green-900">
                S/ {totals.yape.toFixed(2)}
              </p>
            </div>
            <div className="text-green-600 text-xl sm:text-2xl">📱</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-800">Efectivo</p>
              <p className="text-base sm:text-xl font-bold text-yellow-900">
                S/ {totals.efectivo.toFixed(2)}
              </p>
            </div>
            <div className="text-yellow-600 text-xl sm:text-2xl">💵</div>
          </div>
        </div>
      </div>

      {/* Segunda fila de tarjetas */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-cyan-800">Billetes</p>
              <p className="text-base sm:text-xl font-bold text-cyan-900">
                S/ {totals.billetes.toFixed(2)}
              </p>
            </div>
            <div className="text-cyan-600 text-xl sm:text-2xl">💳</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-orange-800">Faltantes</p>
              <p className="text-base sm:text-xl font-bold text-orange-900">
                S/ {totals.faltantes.toFixed(2)}
              </p>
            </div>
            <div className="text-orange-600 text-xl sm:text-2xl">⚠️</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-red-800">Gastos</p>
              <p className="text-base sm:text-xl font-bold text-red-900">
                S/ {totals.gastos.toFixed(2)}
              </p>
            </div>
            <div className="text-red-600 text-xl sm:text-2xl">📉</div>
          </div>
        </div>
      </div>
    </div>
  );
});

CobrosLineChart.displayName = 'CobrosLineChart';

export default CobrosLineChart;
