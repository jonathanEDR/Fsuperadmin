import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useProductosPorPeriodo } from '../../hooks/useProductosPorPeriodo';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ProductosVendidosDashboard = ({ userRole }) => {
  const [timeFilter, setTimeFilter] = useState('mes');
  const [selectedDay, setSelectedDay] = useState(null); // { label, index, productos, total }

  const { 
    chartData, 
    totals, 
    loading, 
    error 
  } = useProductosPorPeriodo(timeFilter);

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'hoy': return 'Hoy';
      case 'semana': return 'Esta Semana';
      case 'mes': return 'Este Mes';
      case 'anual': return 'Este Año';
      default: return 'Este Mes';
    }
  };

  const getXAxisLabel = () => {
    switch (timeFilter) {
      case 'hoy': return 'Hora del Día';
      case 'semana': return 'Días de la Semana';
      case 'mes': return 'Día del Mes';
      case 'anual': return 'Mes del Año';
      default: return 'Período';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando análisis de productos vendidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-500 mr-3 text-2xl">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Error al cargar datos</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const label = chartData.labels[idx];
      const productos = totals.detallesPorIntervalo?.[idx] || [];
      const total = productos.reduce((sum, p) => sum + p.cantidad, 0);
      setSelectedDay({ label, index: idx, productos, total });
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: 'bold' }
        }
      },
      title: {
        display: true,
        text: `Análisis de Productos Vendidos - ${getTimeFilterLabel()}`,
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 30 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(34, 197, 94, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(tooltipItems) {
            return `${getXAxisLabel()}: ${tooltipItems[0].label}`;
          },
          label: function(context) {
            const value = context.parsed.y || 0;
            if (context.datasetIndex === 1) return `Meta diaria: ${value} unidades`;
            return `Total vendido: ${value} unidades`;
          },
          afterBody: function(tooltipItems) {
            const dataIndex = tooltipItems[0]?.dataIndex;
            const productosDelDia = totals.detallesPorIntervalo?.[dataIndex] || [];
            if (productosDelDia.length === 0) return ['', 'Sin productos registrados'];
            const lines = ['', '📦 Productos este día:'];
            productosDelDia.slice(0, 5).forEach((p, i) => {
              lines.push(`  ${i + 1}. ${p.nombre}: ${p.cantidad} und`);
            });
            if (productosDelDia.length > 5) {
              lines.push(`  ... y ${productosDelDia.length - 5} más`);
            }
            lines.push('', '👆 Click en el punto para ver todos');
            return lines;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: getXAxisLabel(),
          font: { size: 12, weight: 'bold' }
        },
        grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad de Productos',
          font: { size: 12, weight: 'bold' }
        },
        grid: { display: true, color: 'rgba(0, 0, 0, 0.1)' },
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? `${value} und` : '';
          }
        }
      }
    },
    interaction: { mode: 'nearest', intersect: false }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Filtros de período */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['hoy', 'semana', 'mes', 'anual'].map((filter) => (
            <button
              key={filter}
              onClick={() => { setTimeFilter(filter); setSelectedDay(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'hoy' && 'Hoy'}
              {filter === 'semana' && 'Esta Semana'}
              {filter === 'mes' && 'Este Mes'}
              {filter === 'anual' && 'Este Año'}
            </button>
          ))}
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Productos Vendidos</p>
                <p className="text-green-800 text-2xl font-bold">{totals.totalUnidades || 0}</p>
                <p className="text-green-600 text-xs">unidades - {getTimeFilterLabel()}</p>
              </div>
              <div className="text-green-500 text-3xl">📦</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Productos Únicos</p>
                <p className="text-blue-800 text-2xl font-bold">{totals.productosUnicos || 0}</p>
                <p className="text-blue-600 text-xs">diferentes - {getTimeFilterLabel()}</p>
              </div>
              <div className="text-blue-500 text-3xl">🏷️</div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Top Producto</p>
                <p className="text-purple-800 text-sm font-bold truncate" title={totals.productoMasVendido?.nombre}>
                  {totals.productoMasVendido?.nombre || 'N/A'}
                </p>
                <p className="text-purple-600 text-xs">
                  {totals.productoMasVendido?.cantidad || 0} unidades
                </p>
              </div>
              <div className="text-purple-500 text-3xl">🏆</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-96 mb-2" style={{ cursor: 'pointer' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
      <p className="text-center text-xs text-gray-400 mb-6">
        👆 Haz click en un punto del gráfico para ver el detalle de ese día
      </p>

      {/* Panel de detalle del día seleccionado */}
      {selectedDay && (
        <div className="border border-green-200 rounded-xl bg-green-50 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-green-800">
                📋 Detalle: {getXAxisLabel()} {selectedDay.label}
              </h4>
              <p className="text-green-600 text-sm">
                {selectedDay.productos.length} producto{selectedDay.productos.length !== 1 ? 's' : ''} diferentes —{' '}
                <span className="font-semibold">{selectedDay.total} unidades en total</span>
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none p-1"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          {selectedDay.productos.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Sin ventas registradas en este período</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {selectedDay.productos.map((producto, index) => {
                const pct = selectedDay.total > 0 ? Math.round((producto.cantidad / selectedDay.total) * 100) : 0;
                return (
                  <div key={index} className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm border border-green-100">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' : 'bg-green-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate" title={producto.nombre}>
                        {producto.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-gray-600 text-xs whitespace-nowrap">{producto.cantidad} und ({pct}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Top global del período */}
      {totals.topProductos && totals.topProductos.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Top Productos Más Vendidos — {getTimeFilterLabel()}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {totals.topProductos.map((producto, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white mr-3 ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm" title={producto.nombre}>
                      {producto.nombre.length > 20 ? `${producto.nombre.substring(0, 20)}…` : producto.nombre}
                    </p>
                    <p className="text-gray-600 text-xs">{producto.cantidad} unidades</p>
                  </div>
                </div>
                <div className="text-lg">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && '🏅'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosVendidosDashboard;
