/**
 * Componente de filtros por fecha
 * Permite filtrar registros por: hoy, semana, mes, histórico o rango personalizado
 */

import React from 'react';
import { Calendar } from 'lucide-react';

const FiltrosFecha = React.memo(({ 
  filtroActual, 
  onFiltroChange, 
  customRange, 
  onCustomRangeChange 
}) => {
  
  const opcionesFiltro = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Esta Semana' },
    { value: 'mes', label: 'Este Mes' },
    { value: 'historico', label: 'Histórico' },
    { value: 'custom', label: 'Personalizado' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={20} className="text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">Filtrar por Fecha</h3>
      </div>
      
      {/* Botones de filtro rápido */}
      <div className="flex flex-wrap gap-2 mb-4">
        {opcionesFiltro.map((opcion) => (
          <button
            key={opcion.value}
            onClick={() => onFiltroChange(opcion.value)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filtroActual === opcion.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {opcion.label}
          </button>
        ))}
      </div>
      
      {/* Rango personalizado */}
      {filtroActual === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={customRange.start}
              onChange={(e) => onCustomRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={customRange.end}
              onChange={(e) => onCustomRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
});

FiltrosFecha.displayName = 'FiltrosFecha';

export default FiltrosFecha;
