import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getCobrosHistorial } from '../../services/cobroService';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CobrosLineChart = ({ userRole }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('semana'); // hoy, semana, mes, anual
  const [totals, setTotals] = useState({
    total: 0,
    yape: 0,
    efectivo: 0,
    billetes: 0,
    faltantes: 0,
    gastos: 0
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

  // Agrupa los cobros usando el campo 'fechaCobro' (consistente con la tabla)
  const processData = (cobros, filter, startDate, endDate) => {
    const labels = generateLabels(filter, startDate, endDate);
    const dataPoints = labels.map(() => ({ yape: 0, efectivo: 0, billetes: 0, faltantes: 0, gastos: 0, total: 0, cobroNeto: 0 }));

    cobros.forEach((cobro) => {
      // Usar fechaCobro como principal, igual que en la tabla
      let fechaBase = cobro.fechaCobro || cobro.createdAt || cobro.fecha || cobro.fechaCreacion || cobro.updatedAt || cobro.timestamp;
      if (!fechaBase) return; // Si no hay fecha, ignorar
      
      // CORREGIDO: Usar directamente new Date() sin compensación de zona horaria
      // para mantener consistencia con la tabla CobrosHistorial
      const cobroDate = new Date(fechaBase);
      if (isNaN(cobroDate.getTime())) return; // Validar fecha
      
      // Debug temporal: Comparar fechas
      console.log('🔍 Debug fechas:', {
        fechaOriginal: fechaBase,
        fechaParseada: cobroDate.toLocaleString('es-ES'),
        dia: cobroDate.getDate(),
        mes: cobroDate.getMonth() + 1,
        año: cobroDate.getFullYear()
      });
      
      if (cobroDate < startDate || cobroDate >= endDate) return;

      let indexPos = 0;
      switch (filter) {
        case 'hoy':
          indexPos = Math.floor((cobroDate - startDate) / (60 * 60 * 1000));
          break;
        case 'semana':
          indexPos = Math.floor((cobroDate - startDate) / (24 * 60 * 60 * 1000));
          break;
        case 'mes':
          indexPos = cobroDate.getDate() - 1;
          break;
        case 'anual':
          indexPos = cobroDate.getMonth();
          break;
        default:
          indexPos = 0;
      }
      if (indexPos >= 0 && indexPos < dataPoints.length) {
        dataPoints[indexPos].yape += Number(cobro.yape || 0);
        dataPoints[indexPos].efectivo += Number(cobro.efectivo || 0);
        dataPoints[indexPos].billetes += Number(cobro.billetes || 0);
        dataPoints[indexPos].faltantes += Number(cobro.faltantes || 0);
        dataPoints[indexPos].gastos += Number(cobro.gastosImprevistos || 0);
        // Corregido: Total ventas = yape + efectivo + billetes + faltantes + gastos imprevistos
        dataPoints[indexPos].total += Number(cobro.yape || 0) + Number(cobro.efectivo || 0) + Number(cobro.billetes || 0) + Number(cobro.faltantes || 0) + Number(cobro.gastosImprevistos || 0);
        // Cobro neto = yape + efectivo + billetes + faltantes (lo que realmente se cobra, excluyendo gastos)
        dataPoints[indexPos].cobroNeto += Number(cobro.yape || 0) + Number(cobro.efectivo || 0) + Number(cobro.billetes || 0) + Number(cobro.faltantes || 0);
      }
    });
    return { labels, dataPoints };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener muchos más datos para asegurar que tengamos registros
      const response = await getCobrosHistorial(1, 1000);
      const cobros = response.cobros || [];
      const { startDate, endDate } = getDateRange(timeFilter);
      const { labels, dataPoints } = processData(cobros, timeFilter, startDate, endDate);
      // Calcular totales incluyendo billetes y faltantes
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
      setChartData({
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
            label: 'Gastos Imprevistos (S/)',
            data: dataPoints.map(point => point.gastos),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Total Ventas (S/)',
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
            borderDash: [5, 3], // Línea punteada para diferenciarlo
          },
        ],
      });
    } catch (err) {
      setError('No se pudo cargar el gráfico de cobros: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  if (loading) return <div className="py-8 text-center">Cargando gráfico...</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;
  if (!chartData) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">
          Control de Cobros - {getTimeFilterLabel()}
        </h3>
        <div className="flex gap-2">
          {['hoy', 'semana', 'mes', 'anual'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
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
      <div className="mb-6">
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
                title: { display: true, text: 'Fecha' }
              },
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            }
          }} 
          height={400}
        />
      </div>

      {/* Resumen de totales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">S/ {totals.total.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Ventas - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">S/ {totals.cobroNeto.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Cobro Neto - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">S/ {totals.yape.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Yape - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">S/ {totals.efectivo.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Efectivo - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-600">S/ {totals.billetes.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Billetes - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">S/ {totals.faltantes.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Faltantes - {getTimeFilterLabel()}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">S/ {totals.gastos.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Gastos - {getTimeFilterLabel()}</div>
        </div>
      </div>
    </div>
  );
};

export default CobrosLineChart;
