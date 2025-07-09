import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VentasLineChart = ({ userRole }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('mes'); // hoy, semana, mes, anual
  const [totals, setTotals] = useState({
    ventasBrutas: 0,
    devoluciones: 0,
    ventasNetas: 0,
    cantidadVendida: 0
  });

  const getDateRange = (filter) => {
    const now = new Date();
    let startDate, endDate;

    switch (filter) {
      case 'hoy':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'semana':
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'anual':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    return { startDate, endDate };
  };

  const generateLabels = (filter, startDate, endDate) => {
    const labels = [];
    const current = new Date(startDate);

    while (current < endDate) {
      switch (filter) {
        case 'hoy':
          labels.push(current.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
          current.setHours(current.getHours() + 1);
          break;
        case 'semana':
          labels.push(current.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));
          current.setDate(current.getDate() + 1);
          break;
        case 'mes':
          labels.push(current.getDate().toString());
          current.setDate(current.getDate() + 1);
          break;
        case 'anual':
          labels.push(current.toLocaleDateString('es-ES', { month: 'short' }));
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          labels.push(current.toLocaleDateString('es-ES'));
          current.setDate(current.getDate() + 1);
      }
    }

    return labels;
  };

  const processVentasData = (ventas, devoluciones, filter, startDate, endDate) => {
    const labels = generateLabels(filter, startDate, endDate);
    const dataPoints = labels.map(() => ({ 
      ventasBrutas: 0, 
      devoluciones: 0, 
      ventasNetas: 0,
      cantidadVendida: 0 
    }));

    // Procesar ventas
    ventas.forEach((venta) => {
      const fechaCampos = [
        venta.createdAt,
        venta.fecha,
        venta.fechaCreacion,
        venta.fechaVenta,
        venta.updatedAt,
        venta.timestamp
      ];
      let fechaValida = null;
      for (let fecha of fechaCampos) {
        if (fecha) {
          const testDate = new Date(fecha);
          if (!isNaN(testDate.getTime())) {
            fechaValida = testDate;
            break;
          }
        }
      }
      const ventaDate = fechaValida || new Date();
      if (ventaDate >= startDate && ventaDate < endDate) {
        let indexPos = 0;
        switch (filter) {
          case 'hoy':
            indexPos = Math.floor((ventaDate - startDate) / (60 * 60 * 1000));
            break;
          case 'semana':
            indexPos = Math.floor((ventaDate - startDate) / (24 * 60 * 60 * 1000));
            break;
          case 'mes':
            indexPos = ventaDate.getDate() - 1;
            break;
          case 'anual':
            indexPos = ventaDate.getMonth();
            break;
        }
        if (indexPos >= 0 && indexPos < dataPoints.length) {
          dataPoints[indexPos].ventasBrutas += Number(venta.montoTotal || 0);
          dataPoints[indexPos].cantidadVendida += Number(venta.cantidadVendida || 0);
        }
      }
    });

    // Procesar devoluciones
    devoluciones.forEach((devolucion) => {
      const fechaCampos = [
        devolucion.createdAt,
        devolucion.fecha,
        devolucion.fechaCreacion,
        devolucion.fechaDevolucion,
        devolucion.updatedAt
      ];
      let fechaValida = null;
      for (let fecha of fechaCampos) {
        if (fecha) {
          const testDate = new Date(fecha);
          if (!isNaN(testDate.getTime())) {
            fechaValida = testDate;
            break;
          }
        }
      }
      const devolucionDate = fechaValida || new Date();
      if (devolucionDate >= startDate && devolucionDate < endDate) {
        let indexPos = 0;
        switch (filter) {
          case 'hoy':
            indexPos = Math.floor((devolucionDate - startDate) / (60 * 60 * 1000));
            break;
          case 'semana':
            indexPos = Math.floor((devolucionDate - startDate) / (24 * 60 * 60 * 1000));
            break;
          case 'mes':
            indexPos = devolucionDate.getDate() - 1;
            break;
          case 'anual':
            indexPos = devolucionDate.getMonth();
            break;
        }
        if (indexPos >= 0 && indexPos < dataPoints.length) {
          dataPoints[indexPos].devoluciones += Number(devolucion.monto || devolucion.montoDevolucion || 0);
        }
      }
    });

    // Calcular ventas netas
    dataPoints.forEach(point => {
      point.ventasNetas = point.ventasBrutas - point.devoluciones;
    });
    return { labels, dataPoints };
  };

  const fetchVentasData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener ventas y devoluciones
      const [ventasResponse, devolucionesResponse] = await Promise.all([
        api.get('/api/ventas?limit=1000'),
        api.get('/api/devoluciones?limit=1000').catch(() => ({ data: { devoluciones: [] } })) // Fallback si no hay devoluciones
      ]);
      const ventas = ventasResponse.data.ventas || ventasResponse.data || [];
      const devoluciones = devolucionesResponse.data.devoluciones || devolucionesResponse.data || [];
      const { startDate, endDate } = getDateRange(timeFilter);
      const { labels, dataPoints } = processVentasData(ventas, devoluciones, timeFilter, startDate, endDate);
      // Calcular totales del período
      const periodTotals = dataPoints.reduce((acc, point) => ({
        ventasBrutas: acc.ventasBrutas + point.ventasBrutas,
        devoluciones: acc.devoluciones + point.devoluciones,
        ventasNetas: acc.ventasNetas + point.ventasNetas,
        cantidadVendida: acc.cantidadVendida + point.cantidadVendida
      }), { ventasBrutas: 0, devoluciones: 0, ventasNetas: 0, cantidadVendida: 0 });
      setTotals(periodTotals);
      setChartData({
        labels,
        datasets: [
          {
            label: 'Ventas Brutas (S/)',
            data: dataPoints.map(point => point.ventasBrutas),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Devoluciones (S/)',
            data: dataPoints.map(point => point.devoluciones),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Ventas Netas (S/)',
            data: dataPoints.map(point => point.ventasNetas),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: false,
            borderWidth: 3,
          },
        ],
      });
    } catch (err) {
      setError('No se pudo cargar el gráfico de ventas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentasData();
  }, [timeFilter]);

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'hoy': return 'Hoy';
      case 'semana': return 'Esta Semana';
      case 'mes': return 'Este Mes';
      case 'anual': return 'Este Año';
      default: return 'Período';
    }
  };

  if (loading) return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8">
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm">Cargando gráfico de ventas...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8">
      <div className="py-8 text-center text-red-600">
        <p className="font-semibold">Error al cargar el gráfico</p>
        <p className="text-xs sm:text-sm mt-2">{error}</p>
        <button 
          onClick={fetchVentasData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  if (!chartData) return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8">
      <div className="py-8 text-center text-gray-600">
        <p>No hay datos disponibles para mostrar</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-6 mb-4 sm:mb-8 overflow-x-auto">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-2 sm:mb-0">
          Evolución de Ventas - {getTimeFilterLabel()}
        </h3>
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          {['hoy', 'semana', 'mes', 'anual'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`w-full sm:w-auto px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <div className="mb-4 sm:mb-6 min-w-[350px] sm:min-w-0" style={{height: '18rem', minHeight: '16rem'}}>
        {chartData ? (
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
                    padding: 20
                  }
                },
                title: { display: false },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    label: function(context) {
                      return `${context.dataset.label}: S/ ${context.parsed.y.toFixed(2)}`;
                    }
                  }
                }
              },
              scales: {
                y: { 
                  beginAtZero: true, 
                  title: { display: true, text: 'Monto (S/)' },
                  ticks: {
                    callback: function(value) {
                      return 'S/ ' + value;
                    }
                  }
                },
                x: { 
                  title: { display: true, text: 'Día del Mes' }
                },
              },
              interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
              }
            }} 
            height={window.innerWidth < 640 ? 250 : 400}
          />
        ) : (
          <div className="h-64 sm:h-96 flex items-center justify-center text-gray-500">
            <p>No se pudo renderizar el gráfico</p>
          </div>
        )}
      </div>

      {/* Resumen de totales */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-green-600">S/ {totals.ventasBrutas.toFixed(2)}</div>
          <div className="text-xs sm:text-sm text-gray-600">Ventas Brutas - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-blue-600">S/ {totals.ventasNetas.toFixed(2)}</div>
          <div className="text-xs sm:text-sm text-gray-600">Ventas Netas - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-red-600">S/ {totals.devoluciones.toFixed(2)}</div>
          <div className="text-xs sm:text-sm text-gray-600">Devoluciones - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-purple-600">{totals.cantidadVendida} unidades</div>
          <div className="text-xs sm:text-sm text-gray-600">Cantidad Vendida - {getTimeFilterLabel()}</div>
        </div>
      </div>
    </div>
  );
};

export default VentasLineChart;
