import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';
import { ClipboardList, Wallet } from 'lucide-react';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * RegistrosDiariosLineChart
 * 
 * Componente con tabs que muestra:
 * - Tab 1: Registros diarios de pago (lo devengado, antes de pagar)
 * - Tab 2: Pagos realizados (lo efectivamente pagado)
 * Zona horaria: America/Lima (UTC-5)
 */
const RegistrosDiariosLineChart = React.memo(({ userRole }) => {
  // Tab activo: 'registros' o 'pagos'
  const [activeTab, setActiveTab] = useState('registros');
  
  // Estados para REGISTROS DIARIOS
  const [chartDataRegistros, setChartDataRegistros] = useState(null);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [errorRegistros, setErrorRegistros] = useState(null);
  const [totalsRegistros, setTotalsRegistros] = useState({
    totalRegistros: 0,
    sumaPagosDiarios: 0,
    colaboradoresUnicos: 0,
    registrosPendientes: 0
  });
  const [detallesPorDiaRegistros, setDetallesPorDiaRegistros] = useState({});
  
  // Estados para PAGOS REALIZADOS
  const [chartDataPagos, setChartDataPagos] = useState(null);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [errorPagos, setErrorPagos] = useState(null);
  const [totalsPagos, setTotalsPagos] = useState({
    totalPagos: 0,
    montoTotalPagado: 0,
    colaboradoresPagados: 0
  });
  const [detallesPorDiaPagos, setDetallesPorDiaPagos] = useState({});
  
  // Estados para filtro de fechas (compartidos)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    return hace30Dias.toISOString().split('T')[0];
  });
  
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

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

  // ========== FUNCIONES PARA REGISTROS DIARIOS ==========
  const fetchRegistrosData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;

    setLoadingRegistros(true);
    setErrorRegistros(null);

    try {
      const response = await api.get(`/api/gestion-personal/estadisticas/registros-diarios?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      
      const { registros, registrosPorDia, totales } = response.data.data;
      
      setDetallesPorDiaRegistros(registrosPorDia || {});
      setTotalsRegistros(totales);
      
      processChartDataRegistros(registros, registrosPorDia);
    } catch (err) {
      console.error('❌ RegistrosDiariosChart - Error al cargar datos:', err);
      setErrorRegistros('Error al cargar datos: ' + err.message);
    } finally {
      setLoadingRegistros(false);
    }
  }, [fechaInicio, fechaFin]);

  // ========== FUNCIONES PARA PAGOS REALIZADOS ==========
  const fetchPagosData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;

    setLoadingPagos(true);
    setErrorPagos(null);

    try {
      const response = await api.get(`/api/pagos-realizados/estadisticas/graficos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      
      const { pagos, pagosPorDia, totales } = response.data.data;
      
      setDetallesPorDiaPagos(pagosPorDia || {});
      setTotalsPagos(totales);
      
      processChartDataPagos(pagos, pagosPorDia);
    } catch (err) {
      console.error('❌ PagosRealizadosChart - Error al cargar datos:', err);
      setErrorPagos('Error al cargar datos: ' + err.message);
    } finally {
      setLoadingPagos(false);
    }
  }, [fechaInicio, fechaFin]);

  // Procesar datos para el gráfico de REGISTROS
  const processChartDataRegistros = useCallback((registros, registrosPorDia) => {
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
        const detalle = registrosPorDia[fecha];
        return {
          pagoDiario: detalle?.totalPagoDiario || 0,
          cantidadRegistros: detalle?.cantidadRegistros || 0,
          adelantos: detalle?.totalAdelantos || 0
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
            label: 'Pago Diario Registrado (S/)',
            data: dataPoints.map(point => point.pagoDiario),
            borderColor: '#F97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Adelantos (S/)',
            data: dataPoints.map(point => point.adelantos),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y',
            borderWidth: 2,
            borderDash: [5, 5],
          },
          {
            label: 'N° Registros',
            data: dataPoints.map(point => point.cantidadRegistros),
            borderColor: '#06B6D4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y1',
            borderWidth: 2,
          }
        ],
      };
      
      setChartDataRegistros(newChartData);
    } catch (err) {
      setErrorRegistros('No se pudo procesar los datos: ' + err.message);
    }
  }, [fechaInicio, fechaFin]);

  // Procesar datos para el gráfico de PAGOS REALIZADOS
  const processChartDataPagos = useCallback((pagos, pagosPorDia) => {
    try {
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

      const dataPoints = labels.map(fecha => {
        const detalle = pagosPorDia[fecha];
        return {
          montoPagado: detalle?.totalMontoPagado || 0,
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
            label: 'Monto Pagado (S/)',
            data: dataPoints.map(point => point.montoPagado),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'N° Pagos',
            data: dataPoints.map(point => point.cantidadPagos),
            borderColor: '#EC4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y1',
            borderWidth: 2,
          }
        ],
      };
      
      setChartDataPagos(newChartData);
    } catch (err) {
      setErrorPagos('No se pudo procesar los datos: ' + err.message);
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

  // Cargar ambos datos cuando cambian las fechas
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const timer = setTimeout(() => {
        fetchRegistrosData();
        fetchPagosData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fetchRegistrosData, fetchPagosData, fechaInicio, fechaFin]);

  // Carga inicial
  useEffect(() => {
    fetchRegistrosData();
    fetchPagosData();
  }, []);

  if (errorRegistros && errorPagos) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{errorRegistros || errorPagos}</p>
          <button 
            onClick={() => { fetchRegistrosData(); fetchPagosData(); }}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8 overflow-hidden">
      {/* Header con Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`absolute inset-0 rounded-lg blur-sm opacity-60 ${
              activeTab === 'registros' 
                ? 'bg-gradient-to-r from-orange-400 to-amber-500' 
                : 'bg-gradient-to-r from-violet-400 to-purple-500'
            }`}></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <span className="text-xl">{activeTab === 'registros' ? '📋' : '💳'}</span>
            </div>
          </div>
          <h3 className={`text-base sm:text-xl font-bold bg-clip-text text-transparent ${
            activeTab === 'registros' 
              ? 'bg-gradient-to-r from-orange-700 to-amber-600' 
              : 'bg-gradient-to-r from-violet-700 to-purple-600'
          }`}>
            {activeTab === 'registros' ? 'Registros Diarios de Pago' : 'Pagos Realizados'}
          </h3>
        </div>
        
        <div className="text-center">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            {activeTab === 'registros' ? '📋' : '💳'} {getTimeFilterLabel()}
          </span>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('registros')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm rounded-t-lg transition-all ${
            activeTab === 'registros'
              ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ClipboardList size={18} />
          <span>Registros Diarios</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'registros' ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 text-gray-600'
          }`}>
            {totalsRegistros.totalRegistros || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('pagos')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm rounded-t-lg transition-all ${
            activeTab === 'pagos'
              ? 'bg-violet-100 text-violet-700 border-b-2 border-violet-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Wallet size={18} />
          <span>Pagos Realizados</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'pagos' ? 'bg-violet-200 text-violet-800' : 'bg-gray-200 text-gray-600'
          }`}>
            {totalsPagos.totalPagos || 0}
          </span>
        </button>
      </div>

      {/* Panel de filtros */}
      <div className={`mb-6 border rounded-lg p-4 ${
        activeTab === 'registros' ? 'bg-orange-50 border-orange-200' : 'bg-violet-50 border-violet-200'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha de Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 ${
                activeTab === 'registros' 
                  ? 'focus:ring-orange-500 focus:border-orange-500' 
                  : 'focus:ring-violet-500 focus:border-violet-500'
              }`}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 ${
                activeTab === 'registros' 
                  ? 'focus:ring-orange-500 focus:border-orange-500' 
                  : 'focus:ring-violet-500 focus:border-violet-500'
              }`}
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
          <div className={`mt-3 pt-3 border-t ${activeTab === 'registros' ? 'border-orange-200' : 'border-violet-200'}`}>
            <p className={`text-sm ${activeTab === 'registros' ? 'text-orange-800' : 'text-violet-800'}`}>
              {activeTab === 'registros' ? '📋 Analizando registros' : '💳 Analizando pagos'} desde {new Date(fechaInicio).toLocaleDateString('es-ES')} hasta {new Date(fechaFin).toLocaleDateString('es-ES')}
            </p>
          </div>
        )}
      </div>

      {/* ========== TAB REGISTROS DIARIOS ========== */}
      {activeTab === 'registros' && (
        <>
          {/* Gráfico de Registros */}
          <div className="mb-4 sm:mb-6 w-full overflow-hidden">
            <div className="w-full" style={{height: 'clamp(280px, 50vh, 400px)'}}>
              {loadingRegistros ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="mt-2 text-gray-600">Cargando datos...</p>
              </div>
            </div>
          ) : chartDataRegistros ? (
            <Line 
              data={chartDataRegistros} 
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
                          const detalle = detallesPorDiaRegistros[fechaClave];
                          
                          if (detalle && detalle.registros && detalle.registros.length > 0) {
                            const lines = ['', '👥 Colaboradores registrados:'];
                            
                            detalle.registros.slice(0, 5).forEach(r => {
                              const estadoIcon = r.estadoPago === 'pagado' ? '✅' : '⏳';
                              lines.push(`  ${estadoIcon} ${r.colaborador}: S/ ${r.pagoDiario.toFixed(2)}`);
                            });
                            
                            if (detalle.registros.length > 5) {
                              lines.push(`  ... y ${detalle.registros.length - 5} más`);
                            }
                            
                            if (detalle.totalBonificaciones > 0) {
                              lines.push('');
                              lines.push(`🎁 Bonificaciones: S/ ${detalle.totalBonificaciones.toFixed(2)}`);
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
                      text: 'N° Registros',
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
                <span className="text-4xl mb-2 block">📋</span>
                <p>No hay registros en este período</p>
              </div>
            </div>
          )}
            </div>
          </div>

          {/* Tarjetas de resumen - REGISTROS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl">💵</span>
                <span className="text-xs sm:text-sm text-orange-600 font-medium">Total Devengado</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-orange-800">
                S/ {totalsRegistros.sumaPagosDiarios?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-3 sm:p-4 border border-cyan-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl">📝</span>
                <span className="text-xs sm:text-sm text-cyan-600 font-medium">N° Registros</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-cyan-800">
                {totalsRegistros.totalRegistros || 0}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 sm:p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl">👥</span>
                <span className="text-xs sm:text-sm text-amber-600 font-medium">Colaboradores</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-amber-800">
                {totalsRegistros.colaboradoresUnicos || 0}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 sm:p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl">⏳</span>
                <span className="text-xs sm:text-sm text-yellow-600 font-medium">Pendientes</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-yellow-800">
                {totalsRegistros.registrosPendientes || 0}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== TAB PAGOS REALIZADOS ========== */}
      {activeTab === 'pagos' && (
        <>
          {/* Gráfico de Pagos */}
          <div className="mb-4 sm:mb-6 w-full overflow-hidden">
            <div className="w-full" style={{height: 'clamp(280px, 50vh, 400px)'}}>
              {loadingPagos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
                    <p className="mt-2 text-gray-600">Cargando datos...</p>
                  </div>
                </div>
              ) : chartDataPagos ? (
                <Line 
                  data={chartDataPagos} 
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
                              const detalle = detallesPorDiaPagos[fechaClave];
                              
                              if (detalle && detalle.pagos && detalle.pagos.length > 0) {
                                const lines = ['', '💳 Pagos realizados:'];
                                
                                detalle.pagos.slice(0, 5).forEach(p => {
                                  lines.push(`  ✅ ${p.colaborador}: S/ ${p.montoPagado.toFixed(2)}`);
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
                    <span className="text-4xl mb-2 block">💳</span>
                    <p>No hay pagos en este período</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tarjetas de resumen - PAGOS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-3 sm:p-4 border border-violet-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl">💰</span>
                <span className="text-xs sm:text-sm text-violet-600 font-medium">Total Pagado</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-violet-800">
                S/ {totalsPagos.montoTotalPagado?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 sm:p-4 border border-pink-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl">🧾</span>
                <span className="text-xs sm:text-sm text-pink-600 font-medium">N° Pagos</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-pink-800">
                {totalsPagos.totalPagos || 0}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 sm:p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg sm:text-xl">👥</span>
                <span className="text-xs sm:text-sm text-purple-600 font-medium">Colaboradores Pagados</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-purple-800">
                {totalsPagos.colaboradoresPagados || 0}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

RegistrosDiariosLineChart.displayName = 'RegistrosDiariosLineChart';

export default RegistrosDiariosLineChart;
