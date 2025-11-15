/**
 * Tarjetas de estadísticas/resumen
 * Muestra totales y métricas importantes de forma visual
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

const EstadisticasCard = React.memo(({ 
  totales, 
  formatearMoneda 
}) => {
  
  const cards = [
    {
      title: 'Adelantos',
      value: totales.adelantos || 0,
      icon: TrendingDown,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Pagos Diarios',
      value: totales.pagosDiarios || 0,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: 'Bonificaciones',
      value: totales.bonificaciones || 0,
      icon: TrendingUp,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Faltantes',
      value: totales.faltantes || 0,
      icon: AlertCircle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Gastos',
      value: totales.gastos || 0,
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      tooltip: 'Gastos ocasionados por el colaborador (solo referencia, no se descuenta del pago)'
    },
    {
      title: 'Total a Pagar',
      value: totales.totalAPagar || 0,
      icon: TrendingUp,
      color: totales.totalAPagar >= 0 ? 'green' : 'red',
      bgColor: totales.totalAPagar >= 0 ? 'bg-green-50' : 'bg-red-50',
      iconColor: totales.totalAPagar >= 0 ? 'text-green-600' : 'text-red-600',
      borderColor: totales.totalAPagar >= 0 ? 'border-green-200' : 'border-red-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} border ${card.borderColor} rounded-lg p-4 transition-all hover:shadow-md`}
            title={card.tooltip || ''}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {card.title}
              </span>
              <Icon size={20} className={card.iconColor} />
            </div>
            <div className={`text-2xl font-bold ${card.iconColor}`}>
              {formatearMoneda(card.value)}
            </div>
            {card.tooltip && (
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Solo referencia
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
});

EstadisticasCard.displayName = 'EstadisticasCard';

export default EstadisticasCard;
