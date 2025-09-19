import React from 'react';

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
      icono: '📈',
      tipo: 'ingreso'
    },
    {
      label: `Egresos`,
      labelCompleto: `Egresos (${formatearRangoFechas()})`,
      valor: resumen.totalEgresos,
      color: 'red',
      icono: '📉',
      tipo: 'egreso'
    },
    {
      label: 'Flujo Neto',
      labelCompleto: 'Flujo Neto',
      valor: resumen.flujoNeto,
      color: resumen.flujoNeto >= 0 ? 'green' : 'red',
      icono: '⚖️',
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

  return (
    <div className="grid grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-2 sm:gap-4">
      {estadisticas.map((stat, index) => (
        <div key={index} className={`bg-white p-2 sm:p-3 lg:p-4 rounded-xl shadow-lg border-l-4 ${getColorClass(stat.color, 'border')}`}>
          {/* Layout móvil: vertical con icono centrado */}
          <div className="flex flex-col lg:hidden">
            <div className="text-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${getColorClass(stat.color, 'bg')} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className={`${getColorClass(stat.color, 'text')} text-sm sm:text-lg`}>
                  {stat.icono}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1" title={stat.labelCompleto}>
                {stat.label}
              </p>
              <p className={`text-sm sm:text-lg font-bold ${getColorClass(stat.color, 'text')}`}>
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
              <span className={`${getColorClass(stat.color, 'text')} text-lg`}>
                {stat.icono}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EstadisticasRapidas;
