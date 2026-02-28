/**
 * Componente de filtros por fecha
 */

import React from 'react';
import { Calendar } from 'lucide-react';

const FiltrosFecha = React.memo(({ filtroActual, onFiltroChange, customRange, onCustomRangeChange }) => {

  const opciones = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Este Mes' },
    { value: 'historico', label: 'Historico' },
    { value: 'custom', label: 'Personalizado' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={15} className="text-gray-400" />
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar por Fecha</h3>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {opciones.map((op) => (
          <button key={op.value} onClick={() => onFiltroChange(op.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filtroActual === op.value
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'
            }`}>
            {op.label}
          </button>
        ))}
      </div>

      {filtroActual === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Fecha Inicio</label>
            <input type="date" value={customRange.start} onChange={(e) => onCustomRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Fecha Fin</label>
            <input type="date" value={customRange.end} onChange={(e) => onCustomRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
          </div>
        </div>
      )}
    </div>
  );
});

FiltrosFecha.displayName = 'FiltrosFecha';
export default FiltrosFecha;