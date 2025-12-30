import React from 'react';

export default function CatalogoGastoForm({ item, onChange, onSubmit, onCancel, isSubmitting }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Gasto *</label>
        <input
          type="text"
          value={item.nombre || ''}
          onChange={e => onChange('nombre', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej: Harina, Electricidad, Gasolina..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
        <select
          value={item.categoria || ''}
          onChange={e => onChange('categoria', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Seleccione una categoria</option>
          <option value="Finanzas">Finanzas</option>
          <option value="Producción">Producción</option>
          <option value="Ventas">Ventas</option>
          <option value="Administración">Administración</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto *</label>
        <select
          value={item.tipoDeGasto || ''}
          onChange={e => onChange('tipoDeGasto', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Seleccione un tipo</option>
          <option value="Pago Personal">Pago Personal</option>
          <option value="Materia Prima">Materia Prima</option>
          <option value="Otros">Otros</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
        <input
          type="text"
          value={item.unidadMedida || ''}
          onChange={e => onChange('unidadMedida', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ej: kg, litro, unidad, servicio..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">Ejemplos: kg, litro, unidad, hora, servicio, metro, galon</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Referencia</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.precioReferencia || ''}
          onChange={e => onChange('precioReferencia', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
        />
        <p className="text-xs text-gray-500 mt-1">Precio sugerido por unidad (opcional)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
        <textarea
          value={item.descripcion || ''}
          onChange={e => onChange('descripcion', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Descripcion adicional del gasto (opcional)"
          rows={3}
        />
      </div>

      {item._id && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="activo"
            checked={item.activo !== false}
            onChange={e => onChange('activo', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
            Item activo en el catalogo
          </label>
        </div>
      )}

      <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Procesando...' : (item._id ? 'Actualizar' : 'Agregar al Catalogo')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-6 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
