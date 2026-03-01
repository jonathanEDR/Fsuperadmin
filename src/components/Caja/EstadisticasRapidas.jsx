import React from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

const EstadisticasRapidas = ({ resumen, fechaInicio, fechaFin, formatearMonto }) => {
  if (!resumen) return null;

  // Formatear el rango de fechas para mostrar
  const formatearRangoFechas = () => {
    if (!fechaInicio || !fechaFin) return '';
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    const formatearFecha = (fecha) => {
      return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };
    
    return `${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
  };

  const estadisticas = [
    {
      label: `Ingresos`,
      labelCompleto: `Ingresos (${formatearRangoFechas()})`,
      valor: resumen.totalIngresos,
      color: 'green',
      icono: TrendingUp,
      tipo: 'ingreso'
    },
    {
      label: `Egresos`,
      labelCompleto: `Egresos (${formatearRangoFechas()})`,
      valor: resumen.totalEgresos,
      color: 'red',
      icono: TrendingDown,
      tipo: 'egreso'
    },
    {
      label: 'Flujo Neto',
      labelCompleto: 'Flujo Neto',
      valor: resumen.flujoNeto,
      color: resumen.flujoNeto >= 0 ? 'green' : 'red',
      icono: Scale,
      tipo: 'flujo'
    }
  ];

  const getColorClass = (color, tipo = 'bg') => {
    const colors = {
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-500'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        border: 'border-red-500'
      },
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-500'
      }
    };
    return colors[color]?.[tipo] || '';
  };

  // Formatear monto de forma compacta para móvil
  const formatearMontoCompacto = (valor) => {
    const absValor = Math.abs(valor);
    if (absValor >= 1000) {
      return `S/ ${(absValor / 1000).toFixed(1)}k`;
    }
    return formatearMonto(absValor);
  };

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2 lg:gap-4">
      {estadisticas.map((stat, index) => (
        <div key={index} className={`bg-white p-1.5 sm:p-2 lg:p-4 rounded-xl shadow-sm border-l-2 sm:border-l-4 ${getColorClass(stat.color, 'border')}`}>
          {/* Layout móvil: vertical compacto */}
          <div className="flex flex-col lg:hidden">
            <div className="text-center">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 ${getColorClass(stat.color, 'bg')} rounded-full flex items-center justify-center mx-auto mb-1`}>
                <stat.icono size={14} className={getColorClass(stat.color, 'text')} />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-600 mb-0.5 truncate" title={stat.labelCompleto}>
                {stat.label}
              </p>
              {/* Monto compacto en móvil pequeño, normal en sm+ */}
              <p className={`text-xs sm:hidden font-bold ${getColorClass(stat.color, 'text')}`}>
                {stat.tipo === 'flujo' && stat.valor > 0 ? '+' : ''}
                {formatearMontoCompacto(stat.valor)}
              </p>
              <p className={`hidden sm:block text-sm font-bold ${getColorClass(stat.color, 'text')}`}>
                {stat.tipo === 'flujo' && stat.valor > 0 ? '+' : ''}
                {formatearMonto(Math.abs(stat.valor))}
              </p>
            </div>
          </div>

          {/* Layout web: horizontal compacto */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1" title={stat.labelCompleto}>
                {stat.label}
              </p>
              <p className={`text-xl font-bold ${getColorClass(stat.color, 'text')}`}>
                {stat.tipo === 'flujo' && stat.valor > 0 ? '+' : ''}
                {formatearMonto(Math.abs(stat.valor))}
              </p>
            </div>
            <div className={`w-10 h-10 ${getColorClass(stat.color, 'bg')} rounded-full flex items-center justify-center ml-3`}>
              <stat.icono size={18} className={getColorClass(stat.color, 'text')} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EstadisticasRapidas;
