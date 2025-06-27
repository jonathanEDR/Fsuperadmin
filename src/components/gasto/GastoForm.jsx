import React from 'react';

export default function GastoForm({ gasto, onChange, onSubmit, onCancel, isSubmitting }) {
  // Formulario controlado para agregar/editar gasto
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría de Gasto *</label>
        <select
          value={gasto.gasto}
          onChange={e => onChange('gasto', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">Seleccione una categoría</option>
          <option value="Finanzas">Finanzas</option>
          <option value="Producción">Producción</option>
          <option value="Ventas">Ventas</option>
          <option value="Administración">Administración</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto *</label>
        <select
          value={gasto.tipoDeGasto}
          onChange={e => onChange('tipoDeGasto', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">Seleccione un tipo</option>
          <option value="Pago Personal">Pago Personal</option>
          <option value="Materia Prima">Materia Prima</option>
          <option value="Otros">Otros</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora *</label>
        <input
          type="datetime-local"
          value={gasto.fechaGasto}
          onChange={e => onChange('fechaGasto', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
        <input
          type="text"
          value={gasto.descripcion}
          onChange={e => onChange('descripcion', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Unidad *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={gasto.costoUnidad}
          onChange={e => onChange('costoUnidad', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
        <input
          type="number"
          min="1"
          step="1"
          value={gasto.cantidad}
          onChange={e => onChange('cantidad', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      {gasto.costoUnidad && gasto.cantidad && (
        <div className="bg-gray-50 p-3 rounded-md">
          <span className="text-sm font-medium text-gray-700">
            Total: S/. {(parseFloat(gasto.costoUnidad) * parseFloat(gasto.cantidad)).toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex space-x-3 mt-6">
        <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors">
          {isSubmitting ? 'Procesando...' : (gasto._id ? 'Actualizar' : 'Agregar')}
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 px-6 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
}
