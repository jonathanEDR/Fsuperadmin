import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Mapa de categorías para mostrar nombres legibles
const CATEGORIAS_LABELS = {
  // Ingresos
  venta_directa: 'Venta Directa',
  cobro: 'Cobro de Cliente',
  devolucion_proveedor: 'Dev. Proveedor',
  prestamo_recibido: 'Préstamo Recibido',
  ingreso_extra: 'Ingreso Extra',
  // Egresos
  pago_personal: 'Pago Personal',
  pago_personal_finanzas: 'Pago Personal (Fin.)',
  pago_personal_produccion: 'Pago Personal (Prod.)',
  pago_personal_ventas: 'Pago Personal (Vtas.)',
  pago_personal_admin: 'Pago Personal (Adm.)',
  materia_prima: 'Materia Prima',
  materia_prima_finanzas: 'Materia Prima (Fin.)',
  materia_prima_produccion: 'Materia Prima (Prod.)',
  materia_prima_ventas: 'Materia Prima (Vtas.)',
  materia_prima_admin: 'Materia Prima (Adm.)',
  otros: 'Otros Gastos',
  otros_finanzas: 'Otros (Fin.)',
  otros_produccion: 'Otros (Prod.)',
  otros_ventas: 'Otros (Vtas.)',
  otros_admin: 'Otros (Adm.)',
  pago_proveedor: 'Pago Proveedor',
  gasto_operativo: 'Gasto Operativo',
  servicio_basico: 'Servicio Básico',
  alquiler: 'Alquiler',
  transporte: 'Transporte',
  marketing: 'Marketing',
  impuestos: 'Impuestos',
  egreso_extra: 'Egreso Extra'
};

const CajaLineChart = React.memo(({ userRole }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    flujoNeto: 0,
    saldoFinal: 0
  });

  // Desglose por categorías del período
  const [categoriasResumen, setCategoriasResumen] = useState({
    ingresos: {},
    egresos: {}
  });

  // Desglose por categorías POR DÍA (para tooltips)
  const [categoriasPorDia, setCategoriasPorDia] = useState({});

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

  // Función para obtener movimientos de caja
  const fetchCajaData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/caja/movimientos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&limit=10000`
      );

      const movimientos = response.data.movimientos || [];
      processCajaData(movimientos);
    } catch (err) {
      console.error('❌ CajaChart - Error al cargar datos:', err);
      setError('Error al cargar datos de caja: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  // Función para procesar datos de caja y generar gráfico
  const processCajaData = useCallback((movimientos) => {
    try {
      if (!fechaInicio || !fechaFin) return;

      const movimientosValidos = Array.isArray(movimientos) ? movimientos : [];

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

      if (labels.length === 0) {
        setError('Error al generar las etiquetas del gráfico');
        return;
      }

      // Inicializar estructura de datos por día
      const dataPoints = labels.map(() => ({
        ingresos: 0,
        egresos: 0,
        flujoNeto: 0,
        saldoAcumulado: 0,
        // Desglose por categoría para el tooltip
        categorias: {
          ingresos: {},
          egresos: {}
        }
      }));

      // Acumulador global de categorías
      const categoriasGlobal = { ingresos: {}, egresos: {} };
      // Mapa de categorías por día (key: fecha YYYY-MM-DD)
      const catPorDia = {};

      // Procesar movimientos
      movimientosValidos.forEach(mov => {
        if (!mov || !mov.fecha) return;

        // Obtener fecha en zona horaria de Perú
        const fechaMov = new Date(mov.fecha).toLocaleDateString('en-CA', {
          timeZone: 'America/Lima'
        });

        const index = labels.indexOf(fechaMov);
        if (index < 0 || index >= dataPoints.length) return;

        const monto = parseFloat(mov.monto) || 0;
        const categoria = mov.categoria || 'otros';
        const categoriaLabel = CATEGORIAS_LABELS[categoria] || categoria;

        if (mov.tipo === 'ingreso') {
          dataPoints[index].ingresos += monto;
          // Desglose por categoría del día
          dataPoints[index].categorias.ingresos[categoriaLabel] =
            (dataPoints[index].categorias.ingresos[categoriaLabel] || 0) + monto;
          // Acumulador global
          categoriasGlobal.ingresos[categoriaLabel] =
            (categoriasGlobal.ingresos[categoriaLabel] || 0) + monto;
        } else {
          dataPoints[index].egresos += monto;
          dataPoints[index].categorias.egresos[categoriaLabel] =
            (dataPoints[index].categorias.egresos[categoriaLabel] || 0) + monto;
          categoriasGlobal.egresos[categoriaLabel] =
            (categoriasGlobal.egresos[categoriaLabel] || 0) + monto;
        }
      });

      // Calcular flujo neto y saldo acumulado
      let saldoAcum = 0;
      dataPoints.forEach((point, i) => {
        point.flujoNeto = point.ingresos - point.egresos;
        saldoAcum += point.flujoNeto;
        point.saldoAcumulado = saldoAcum;

        // Guardar categorías por día
        catPorDia[labels[i]] = point.categorias;
      });

      setCategoriasPorDia(catPorDia);
      setCategoriasResumen(categoriasGlobal);

      // Calcular totales del período
      let totalIngresos = 0;
      let totalEgresos = 0;
      dataPoints.forEach(point => {
        totalIngresos += point.ingresos;
        totalEgresos += point.egresos;
      });

      setTotals({
        totalIngresos,
        totalEgresos,
        flujoNeto: totalIngresos - totalEgresos,
        saldoFinal: saldoAcum
      });

      // Generar dataset para Chart.js
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
            label: 'Ingresos (S/)',
            data: dataPoints.map(p => p.ingresos),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: false,
            borderWidth: 2,
            pointRadius: dataPoints.length > 60 ? 0 : 3,
            pointHoverRadius: 5,
          },
          {
            label: 'Egresos (S/)',
            data: dataPoints.map(p => p.egresos),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: false,
            borderWidth: 2,
            pointRadius: dataPoints.length > 60 ? 0 : 3,
            pointHoverRadius: 5,
          },
          {
            label: 'Flujo Neto (S/)',
            data: dataPoints.map(p => p.flujoNeto),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: false,
            borderWidth: 3,
            pointRadius: dataPoints.length > 60 ? 0 : 3,
            pointHoverRadius: 5,
          },
          {
            label: 'Saldo Acumulado (S/)',
            data: dataPoints.map(p => p.saldoAcumulado),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            tension: 0.3,
            fill: true,
            borderWidth: 2,
            borderDash: [5, 3],
            pointRadius: dataPoints.length > 60 ? 0 : 2,
            pointHoverRadius: 4,
          }
        ]
      };

      setChartData(newChartData);
    } catch (err) {
      console.error('❌ Error al procesar datos de caja:', err);
      setError('No se pudo procesar los datos de caja: ' + err.message);
    }
  }, [fechaInicio, fechaFin]);

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
        fetchCajaData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fetchCajaData, fechaInicio, fechaFin]);

  // Efecto inicial
  useEffect(() => {
    fetchCajaData();
  }, []);

  // Formatear monto
  const formatearMonto = (monto) => `S/ ${monto.toFixed(2)}`;

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchCajaData}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg blur-sm opacity-60"></div>
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Evolución de Caja
          </h3>
        </div>
        <div className="text-center">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            💰 {getTimeFilterLabel()}
          </span>
        </div>
      </div>

      {/* Panel de selección de fechas */}
      <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
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
          <div className="mt-3 pt-3 border-t border-emerald-200">
            <p className="text-sm text-emerald-800">
              💰 Analizando desde {new Date(fechaInicio).toLocaleDateString('es-ES')} hasta {new Date(fechaFin).toLocaleDateString('es-ES')}
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

      {/* Gráfico */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full" style={{ height: 'clamp(280px, 50vh, 400px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="mt-2 text-gray-600">Cargando datos de caja...</p>
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
                      size: window.innerWidth < 640 ? 9 : 10
                    },
                    padding: 12,
                    boxPadding: 4,
                    callbacks: {
                      title: function (context) {
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
                      label: function (context) {
                        const value = context.parsed.y;
                        const label = context.dataset.label || '';
                        return `${label}: S/ ${value.toFixed(2)}`;
                      },
                      afterBody: function (context) {
                        const index = context[0].dataIndex;
                        const fecha = originalLabels?.[index];
                        if (!fecha || !categoriasPorDia[fecha]) return [];

                        const catDia = categoriasPorDia[fecha];
                        const lines = [];

                        // Desglose de ingresos por categoría
                        const ingCats = Object.entries(catDia.ingresos || {});
                        if (ingCats.length > 0) {
                          lines.push('');
                          lines.push('── Detalle Ingresos ──');
                          ingCats
                            .sort((a, b) => b[1] - a[1])
                            .forEach(([cat, monto]) => {
                              lines.push(`  📈 ${cat}: S/ ${monto.toFixed(2)}`);
                            });
                        }

                        // Desglose de egresos por categoría
                        const egCats = Object.entries(catDia.egresos || {});
                        if (egCats.length > 0) {
                          lines.push('');
                          lines.push('── Detalle Egresos ──');
                          egCats
                            .sort((a, b) => b[1] - a[1])
                            .forEach(([cat, monto]) => {
                              lines.push(`  📉 ${cat}: S/ ${monto.toFixed(2)}`);
                            });
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
                      color: 'rgba(0,0,0,0.06)',
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
                      color: 'rgba(0,0,0,0.06)',
                    },
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 9 : 11
                      },
                      callback: function (value) {
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
                <div className="text-gray-400 text-6xl mb-4">💰</div>
                <p className="text-gray-500">No hay datos de caja para mostrar</p>
                <p className="text-gray-400 text-sm">Selecciona un rango de fechas válido</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel de totales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-800">Total Ingresos</p>
              <p className="text-base sm:text-xl font-bold text-green-900">
                {formatearMonto(totals.totalIngresos)}
              </p>
            </div>
            <div className="text-green-600 text-xl sm:text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-red-800">Total Egresos</p>
              <p className="text-base sm:text-xl font-bold text-red-900">
                {formatearMonto(totals.totalEgresos)}
              </p>
            </div>
            <div className="text-red-600 text-xl sm:text-2xl">💸</div>
          </div>
        </div>

        <div className={`bg-gradient-to-r ${totals.flujoNeto >= 0 ? 'from-blue-50 to-sky-50 border-blue-200' : 'from-orange-50 to-amber-50 border-orange-200'} border rounded-lg p-3 sm:p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs sm:text-sm font-medium ${totals.flujoNeto >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Flujo Neto</p>
              <p className={`text-base sm:text-xl font-bold ${totals.flujoNeto >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                {totals.flujoNeto >= 0 ? '+' : ''}{formatearMonto(totals.flujoNeto)}
              </p>
            </div>
            <div className={`text-xl sm:text-2xl ${totals.flujoNeto >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>⚖️</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-purple-800">Saldo Final</p>
              <p className={`text-base sm:text-xl font-bold ${totals.saldoFinal >= 0 ? 'text-purple-900' : 'text-red-900'}`}>
                {formatearMonto(totals.saldoFinal)}
              </p>
            </div>
            <div className="text-purple-600 text-xl sm:text-2xl">🏦</div>
          </div>
        </div>
      </div>

      {/* Desglose por categorías del período */}
      {(Object.keys(categoriasResumen.ingresos).length > 0 || Object.keys(categoriasResumen.egresos).length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Desglose Ingresos */}
          {Object.keys(categoriasResumen.ingresos).length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                📈 Ingresos por Categoría
              </h4>
              <div className="space-y-2">
                {Object.entries(categoriasResumen.ingresos)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, monto]) => {
                    const porcentaje = totals.totalIngresos > 0 ? (monto / totals.totalIngresos * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                          <span className="text-green-900 truncate">{cat}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-green-700 font-medium">{formatearMonto(monto)}</span>
                          <span className="text-green-500 text-xs w-12 text-right">({porcentaje.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Desglose Egresos */}
          {Object.keys(categoriasResumen.egresos).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                📉 Egresos por Categoría
              </h4>
              <div className="space-y-2">
                {Object.entries(categoriasResumen.egresos)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, monto]) => {
                    const porcentaje = totals.totalEgresos > 0 ? (monto / totals.totalEgresos * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                          <span className="text-red-900 truncate">{cat}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-red-700 font-medium">{formatearMonto(monto)}</span>
                          <span className="text-red-500 text-xs w-12 text-right">({porcentaje.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CajaLineChart.displayName = 'CajaLineChart';

export default CajaLineChart;
