import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend
} from 'chart.js';
import api from '../../services/api';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Paleta de colores diferenciados para cada trabajador
const COLORES = [
  { border: '#10B981', bg: 'rgba(16,185,129,0.12)' },   // emerald
  { border: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },   // blue
  { border: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },   // amber
  { border: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },   // violet
  { border: '#EF4444', bg: 'rgba(239,68,68,0.12)' },    // red
  { border: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },    // cyan
  { border: '#EC4899', bg: 'rgba(236,72,153,0.12)' },   // pink
  { border: '#84CC16', bg: 'rgba(132,204,22,0.12)' },   // lime
  { border: '#F97316', bg: 'rgba(249,115,22,0.12)' },   // orange
  { border: '#6366F1', bg: 'rgba(99,102,241,0.12)' },   // indigo
];

const VentasPorTrabajadorChart = React.memo(({ userRole }) => {
  // ── Filtros de fecha: últimos 30 días por defecto ──
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);

  // ── Datos ──
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Génerar lista de fechas del rango ──
  const labels = useMemo(() => {
    if (!fechaInicio || !fechaFin) return [];
    const lista = [];
    const cur = new Date(fechaInicio + 'T00:00:00');
    const end = new Date(fechaFin + 'T00:00:00');
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      lista.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return lista;
  }, [fechaInicio, fechaFin]);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/api/ventas/graficos/por-trabajador?startDate=${fechaInicio}&endDate=${fechaFin}`
      );
      setTrabajadores(res.data.trabajadores || []);
    } catch (err) {
      console.error('Error cargando ventas por trabajador:', err);
      setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const t = setTimeout(fetchData, 300);
      return () => clearTimeout(t);
    }
  }, [fetchData, fechaInicio, fechaFin]);

  // ── Construir chartData ──
  const chartData = useMemo(() => {
    if (!trabajadores.length || !labels.length) return null;

    const datasets = trabajadores.map((t, idx) => {
      const color = COLORES[idx % COLORES.length];
      return {
        label: t.nombre,
        data: labels.map(fecha => parseFloat((t.porFecha[fecha] || 0).toFixed(2))),
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.3,
        fill: false,
        pointRadius: labels.length > 31 ? 2 : 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      };
    });

    return {
      labels: labels.map(d => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      }),
      datasets,
    };
  }, [trabajadores, labels]);

  // ── Label del período ──
  const periodoLabel = useMemo(() => {
    if (!fechaInicio || !fechaFin) return '';
    const dias = labels.length;
    const ini = new Date(fechaInicio).toLocaleDateString('es-ES');
    const fin = new Date(fechaFin).toLocaleDateString('es-ES');
    return `${ini} – ${fin} (${dias} ${dias === 1 ? 'día' : 'días'})`;
  }, [fechaInicio, fechaFin, labels]);

  const irA7Dias = () => {
    const hoy = new Date();
    const ini = new Date(); ini.setDate(hoy.getDate() - 7);
    setFechaInicio(ini.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  };

  const irA30Dias = () => {
    const hoy = new Date();
    const ini = new Date(); ini.setDate(hoy.getDate() - 30);
    setFechaInicio(ini.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  };

  const irAlMesActual = () => {
    const hoy = new Date();
    const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFechaInicio(ini.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">⚠️ Error</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg blur-sm opacity-60" />
            <div className="relative bg-white rounded-lg p-2 border border-gray-200">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Ventas por Trabajador
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Evolución diaria por cada vendedor</p>
          </div>
        </div>
        <span className="text-xs sm:text-sm text-gray-600 font-medium">📊 {periodoLabel}</span>
      </div>

      {/* Filtro de fechas */}
      <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 Fecha de Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              max={fechaFin || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">📅 Fecha de Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              min={fechaInicio}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={irA7Dias} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium whitespace-nowrap">
              Últimos 7 días
            </button>
            <button onClick={irA30Dias} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium whitespace-nowrap">
              Últimos 30 días
            </button>
            <button onClick={irAlMesActual} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 text-xs font-medium whitespace-nowrap">
              Este mes
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full" style={{ height: 'clamp(280px, 50vh, 420px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
                <p className="mt-2 text-gray-600 text-sm">Cargando datos...</p>
              </div>
            </div>
          ) : chartData ? (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: window.innerWidth < 640 ? 8 : 14,
                      boxWidth: window.innerWidth < 640 ? 8 : 12,
                      font: { size: window.innerWidth < 640 ? 9 : 11 },
                    },
                  },
                  title: { display: false },
                  tooltip: {
                    callbacks: {
                      title(context) {
                        const idx = context[0].dataIndex;
                        const d = new Date(labels[idx] + 'T00:00:00');
                        return d.toLocaleDateString('es-ES', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        });
                      },
                      label(context) {
                        const val = context.parsed.y;
                        return `${context.dataset.label}: S/ ${val.toFixed(2)}`;
                      },
                      afterBody(context) {
                        const idx = context[0].dataIndex;
                        const total = context.reduce((s, c) => s + (c.parsed.y || 0), 0);
                        return [``, `Total del día: S/ ${total.toFixed(2)}`];
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: {
                      maxTicksLimit: window.innerWidth < 640 ? 5 : 12,
                      font: { size: window.innerWidth < 640 ? 9 : 11 },
                    },
                  },
                  y: {
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: {
                      font: { size: window.innerWidth < 640 ? 9 : 11 },
                      callback: v => 'S/ ' + v.toFixed(0),
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <p className="text-gray-500 text-sm">No hay ventas en este período</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de totales por trabajador */}
      {!loading && trabajadores.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumen por trabajador</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trabajadores.map((t, idx) => {
              const color = COLORES[idx % COLORES.length];
              const diasConVenta = Object.keys(t.porFecha).length;
              return (
                <div
                  key={t.userId}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: color.border + '60', backgroundColor: color.bg }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color.border }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{t.nombre}</p>
                    <p className="text-xs text-gray-500">{diasConVenta} día{diasConVenta !== 1 ? 's' : ''} con ventas</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">S/ {t.totalMonto.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

VentasPorTrabajadorChart.displayName = 'VentasPorTrabajadorChart';
export default VentasPorTrabajadorChart;
