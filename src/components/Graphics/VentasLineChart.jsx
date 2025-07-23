import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';
import { formatearFecha } from '../../utils/fechaHoraUtils';
import { 
  procesarFechaParaGrafico, 
  calcularIndiceParaFecha, 
  fechaEnRango, 
  extraerFechaValida,
  generarEtiquetasGrafico,
  calcularRangoFechas
} from '../../utils/graficosDateUtils';

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

  const processVentasData = (ventas, devoluciones, filter, startDate, endDate) => {
    const labels = generarEtiquetasGrafico(filter, startDate, endDate);
    const dataPoints = labels.map(() => ({ 
      ventasBrutas: 0, 
      devoluciones: 0, 
      ventasNetas: 0,
      cantidadVendida: 0 
    }));

    console.log('🔄 Procesando datos para gráfico:', {
      ventas: ventas.length,
      devoluciones: devoluciones.length,
      filter: filter,
      etiquetas: labels.length
    });

    // Procesar ventas
    ventas.forEach((venta) => {
      const fechaVenta = extraerFechaValida(venta, [
        'fechadeVenta',
        'createdAt', 
        'updatedAt'
      ]) || new Date();
      
      if (fechaEnRango(fechaVenta, startDate, endDate)) {
        const indexPos = calcularIndiceParaFecha(fechaVenta, filter, startDate);
        if (indexPos >= 0 && indexPos < dataPoints.length) {
          dataPoints[indexPos].ventasBrutas += Number(venta.montoTotal || 0);
          dataPoints[indexPos].cantidadVendida += Number(venta.cantidadVendida || 0);
          
          console.log('✅ Venta agregada:', {
            fecha: fechaVenta.toISOString(),
            dia: indexPos + 1,
            monto: Number(venta.montoTotal || 0)
          });
        }
      }
    });

    // Procesar devoluciones
    console.log('📋 Devoluciones recibidas:', devoluciones.map(d => ({
      id: d._id,
      fecha: d.fechaDevolucion,
      monto: d.monto || d.montoDevolucion
    })));

    devoluciones.forEach((devolucion) => {
      const fechaDevolucion = extraerFechaValida(devolucion, [
        'fechaDevolucion',
        'createdAt',
        'updatedAt'
      ]);
      
      if (!fechaDevolucion) {
        console.warn('⚠️ Devolución sin fecha válida:', devolucion._id);
        return;
      }
      
      console.log('📅 Procesando devolución:', {
        id: devolucion._id,
        fechaOriginal: devolucion.fechaDevolucion,
        fechaParsed: fechaDevolucion.toISOString(),
        monto: devolucion.monto || devolucion.montoDevolucion,
        enRango: fechaEnRango(fechaDevolucion, startDate, endDate)
      });
      
      if (fechaEnRango(fechaDevolucion, startDate, endDate)) {
        const indexPos = calcularIndiceParaFecha(fechaDevolucion, filter, startDate);
        
        if (indexPos >= 0 && indexPos < dataPoints.length) {
          const montoDevolucion = Number(devolucion.monto || devolucion.montoDevolucion || 0);
          dataPoints[indexPos].devoluciones += montoDevolucion;
          console.log('✅ Devolución agregada:', {
            indice: indexPos,
            dia: labels[indexPos],
            monto: montoDevolucion
          });
        }
      }
    });

    // Calcular ventas netas
    dataPoints.forEach(point => {
      point.ventasNetas = point.ventasBrutas - point.devoluciones;
    });
    
    // Resumen final con debug
    const totalDevoluciones = dataPoints.reduce((sum, point) => sum + point.devoluciones, 0);
    const totalVentas = dataPoints.reduce((sum, point) => sum + point.ventasBrutas, 0);
    const totalVentasNetas = totalVentas - totalDevoluciones;
    
    console.log('💰 TOTALES FINALES:', {
      ventas: totalVentas.toFixed(2),
      devoluciones: totalDevoluciones.toFixed(2),
      netas: totalVentasNetas.toFixed(2),
      diasConVentas: dataPoints.filter(p => p.ventasBrutas > 0).length,
      diasConDevoluciones: dataPoints.filter(p => p.devoluciones > 0).length
    });
    
    return { labels, dataPoints };
  };

  const fetchVentasData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Cargando datos para gráfico...');
      
      // Obtener ventas y devoluciones
      const [ventasResponse, devolucionesResponse] = await Promise.all([
        api.get('/api/ventas?limit=1000'),
        api.get('/api/devoluciones?limit=1000').catch(() => ({ data: { devoluciones: [] } }))
      ]);
      
      const ventas = ventasResponse.data.ventas || ventasResponse.data || [];
      const devoluciones = devolucionesResponse.data.devoluciones || devolucionesResponse.data || [];
      
      console.log('📊 Datos obtenidos:', {
        ventas: ventas.length,
        devoluciones: devoluciones.length,
        filtro: timeFilter
      });
      
      // Debug: Mostrar algunos registros de ventas para verificar datos
      console.log('📋 Muestra de ventas:', ventas.slice(0, 3).map(v => ({
        id: v._id,
        fecha: v.fechadeVenta || v.createdAt,
        monto: v.montoTotal
      })));
      
      console.log('📋 Muestra de devoluciones:', devoluciones.slice(0, 3).map(d => ({
        id: d._id,
        fecha: d.fechaDevolucion || d.createdAt,
        monto: d.monto || d.montoDevolucion
      })));
      
      const { startDate, endDate } = calcularRangoFechas(timeFilter);
      const { labels, dataPoints } = processVentasData(ventas, devoluciones, timeFilter, startDate, endDate);
      
      // Calcular totales del período
      const periodTotals = dataPoints.reduce((acc, point) => ({
        ventasBrutas: acc.ventasBrutas + point.ventasBrutas,
        devoluciones: acc.devoluciones + point.devoluciones,
        ventasNetas: acc.ventasNetas + point.ventasNetas,
        cantidadVendida: acc.cantidadVendida + point.cantidadVendida
      }), { ventasBrutas: 0, devoluciones: 0, ventasNetas: 0, cantidadVendida: 0 });
      
      // Asegurar que ventasNetas se calcule correctamente
      periodTotals.ventasNetas = periodTotals.ventasBrutas - periodTotals.devoluciones;
      
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
            data: dataPoints.map(point => point.ventasBrutas - point.devoluciones),
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
          <div className="text-lg sm:text-2xl font-bold text-blue-600">S/ {(totals.ventasBrutas - totals.devoluciones).toFixed(2)}</div>
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
