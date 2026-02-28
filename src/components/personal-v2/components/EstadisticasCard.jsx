/**
 * Tarjetas de estadisticas/resumen
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Info } from 'lucide-react';

const EstadisticasCard = React.memo(({ totales, formatearMoneda }) => {

  const cards = [
    { title: 'Adelantos', value: totales.adelantos || 0, icon: TrendingDown, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { title: 'Pagos Diarios', value: totales.pagosDiarios || 0, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Bonificaciones', value: totales.bonificaciones || 0, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { title: 'Faltantes', value: totales.faltantes || 0, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { title: 'Gastos', value: totales.gastos || 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', tooltip: true },
    {
      title: 'Total a Pagar',
      value: totales.totalAPagar || 0,
      icon: TrendingUp,
      color: (totales.totalAPagar || 0) >= 0 ? 'text-emerald-600' : 'text-red-500',
      bg: (totales.totalAPagar || 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50',
      border: (totales.totalAPagar || 0) >= 0 ? 'border-emerald-100' : 'border-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className={`${card.bg} border ${card.border} rounded-2xl p-3.5 transition-all hover:shadow-sm`}
            title={card.tooltip ? 'Solo referencia, no se descuenta del pago' : ''}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{card.title}</span>
              <Icon size={15} className={card.color} />
            </div>
            <div className={`text-lg font-bold ${card.color}`}>{formatearMoneda(card.value)}</div>
            {card.tooltip && (
              <p className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                <Info size={10} /> Solo referencia
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