import React from 'react';

/**
 * Componente para seleccionar un gasto del catálogo
 * Muestra un grid de items disponibles por categoría
 * Solo permite selección del catálogo (sin ingreso manual)
 */

// Configuración de colores por tipo de gasto
const TIPO_GASTO_COLORS = {
  'Pago Personal': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: '👤' },
  'Materia Prima': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '📦' },
  'Otros': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: '📋' }
};

// Formatear moneda
const formatCurrency = (amount) => {
  if (!amount || amount === 0) return null;
  return `S/. ${Number(amount).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export default function CatalogoGastoSelector({
  items = [],
  selectedId = null,
  onSelect,
  loading = false,
  seccionSeleccionada = ''
}) {
  // Agrupar items por tipo de gasto
  const itemsPorTipo = items.reduce((acc, item) => {
    const tipo = item.tipoDeGasto || 'Otros';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(item);
    return acc;
  }, {});

  // Orden de tipos
  const tiposOrdenados = ['Pago Personal', 'Materia Prima', 'Otros'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-3 text-gray-500 text-sm">Cargando catálogo...</span>
      </div>
    );
  }

  if (!seccionSeleccionada) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
        <div className="text-gray-400 text-4xl mb-3">🏢</div>
        <p className="text-gray-500 text-sm">Selecciona una sección para ver el catálogo de gastos</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-amber-50 rounded-lg p-6 text-center border border-amber-200">
        <div className="text-amber-400 text-4xl mb-3">📭</div>
        <p className="text-amber-700 text-sm font-medium mb-2">No hay items en el catálogo para esta sección</p>
        <p className="text-amber-600 text-xs">Primero agrega items al catálogo desde el módulo de Gastos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="bg-red-100 p-1 rounded">📋</span>
          Selecciona del Catálogo
        </h4>
        <span className="text-xs text-gray-500">
          {items.length} item(s) disponibles
        </span>
      </div>

      {/* Grid de items agrupados por tipo */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {tiposOrdenados.map(tipo => {
          const itemsTipo = itemsPorTipo[tipo];
          if (!itemsTipo || itemsTipo.length === 0) return null;

          const config = TIPO_GASTO_COLORS[tipo] || TIPO_GASTO_COLORS['Otros'];

          return (
            <div key={tipo} className="space-y-2">
              {/* Título del tipo */}
              <div className={`flex items-center gap-2 px-2 py-1 ${config.bg} rounded-lg`}>
                <span>{config.icon}</span>
                <span className={`text-xs font-semibold ${config.text}`}>{tipo}</span>
                <span className={`text-xs ${config.text} opacity-70`}>({itemsTipo.length})</span>
              </div>

              {/* Grid de items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {itemsTipo.map(item => {
                  const isSelected = selectedId === item._id;
                  const precioRef = formatCurrency(item.precioReferencia);

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => onSelect(item)}
                      className={`relative p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                          : `${config.border} bg-white hover:border-red-300 hover:shadow-sm`
                      }`}
                    >
                      {/* Check de selección */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}

                      {/* Nombre del item */}
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-red-700' : 'text-gray-800'}`}>
                        {item.nombre}
                      </p>

                      {/* Unidad de medida */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        por {item.unidadMedida || 'unidad'}
                      </p>

                      {/* Precio referencia si existe */}
                      {precioRef && (
                        <p className={`text-xs font-semibold mt-1 ${isSelected ? 'text-red-600' : 'text-green-600'}`}>
                          {precioRef}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contador de selección */}
      {selectedId && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-red-700">
            ✓ Item seleccionado del catálogo
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
}
