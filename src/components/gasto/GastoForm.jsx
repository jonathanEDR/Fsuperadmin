import React, { useState, useEffect } from 'react';
import useCatalogoGastos from './useCatalogoGastos';

export default function GastoForm({ gasto, onChange, onSubmit, onCancel, isSubmitting }) {
  const { catalogo, loading: loadingCatalogo } = useCatalogoGastos();
  const [catalogoFiltrado, setCatalogoFiltrado] = useState([]);

  // Filtrar catalogo cuando cambia la categoria
  useEffect(() => {
    if (gasto.gasto && catalogo.length > 0) {
      const filtrado = catalogo.filter(
        item => item.categoria === gasto.gasto && item.activo
      );
      setCatalogoFiltrado(filtrado);
    } else {
      setCatalogoFiltrado([]);
    }
  }, [gasto.gasto, catalogo]);

  // Manejar seleccion del catalogo
  const handleCatalogoSelect = (e) => {
    const itemId = e.target.value;

    if (itemId === '') {
      onChange('catalogoGastoId', null);
      onChange('descripcion', '');
      onChange('unidadMedida', 'unidad');
      onChange('costoUnidad', '');
      onChange('tipoDeGasto', '');
      return;
    }

    const itemSeleccionado = catalogo.find(item => item._id === itemId);
    if (itemSeleccionado) {
      onChange('catalogoGastoId', itemSeleccionado._id);
      onChange('descripcion', itemSeleccionado.nombre);
      onChange('tipoDeGasto', itemSeleccionado.tipoDeGasto);
      onChange('unidadMedida', itemSeleccionado.unidadMedida);
      if (itemSeleccionado.precioReferencia > 0) {
        onChange('costoUnidad', itemSeleccionado.precioReferencia.toString());
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Categoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria de Gasto *</label>
        <select
          value={gasto.gasto}
          onChange={e => {
            onChange('gasto', e.target.value);
            onChange('catalogoGastoId', null);
            onChange('descripcion', '');
            onChange('tipoDeGasto', '');
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Seleccione una categoria</option>
          <option value="Finanzas">Finanzas</option>
          <option value="Producción">Produccion</option>
          <option value="Ventas">Ventas</option>
          <option value="Administración">Administracion</option>
        </select>
      </div>

      {/* Selector de Catalogo */}
      {gasto.gasto && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar del Catalogo *
          </label>
          {loadingCatalogo ? (
            <div className="flex items-center gap-2 text-gray-500 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Cargando catalogo...
            </div>
          ) : catalogoFiltrado.length > 0 ? (
            <select
              value={gasto.catalogoGastoId || ''}
              onChange={handleCatalogoSelect}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccione un gasto del catalogo</option>
              {catalogoFiltrado.map(item => (
                <option key={item._id} value={item._id}>
                  {item.nombre} - {item.tipoDeGasto} ({item.unidadMedida})
                  {item.precioReferencia > 0 && ` - S/.${item.precioReferencia.toFixed(2)}`}
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-center">
              <div className="text-amber-400 text-3xl mb-2">📭</div>
              <p className="text-sm text-amber-700 font-medium">
                No hay items en el catalogo para esta categoria
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Primero agrega items al catalogo desde la seccion "Catalogo de Gastos"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info del gasto seleccionado del catalogo */}
      {gasto.catalogoGastoId && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-blue-800">{gasto.descripcion}</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
              {gasto.tipoDeGasto}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {gasto.unidadMedida || 'unidad'}
            </span>
          </div>
        </div>
      )}

      {/* Fecha y hora */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora *</label>
        <input
          type="datetime-local"
          value={gasto.fechaGasto}
          onChange={e => onChange('fechaGasto', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Costo por unidad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Costo por {gasto.unidadMedida || 'Unidad'} (S/.) *
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={gasto.costoUnidad}
          onChange={e => onChange('costoUnidad', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
          required
        />
      </div>

      {/* Cantidad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantidad ({gasto.unidadMedida || 'unidades'}) *
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={gasto.cantidad}
          onChange={e => onChange('cantidad', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="1"
          required
        />
      </div>

      {/* Total calculado */}
      {gasto.costoUnidad && gasto.cantidad && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total a registrar:</span>
            <span className="text-2xl font-bold text-green-600">
              S/. {(parseFloat(gasto.costoUnidad) * parseFloat(gasto.cantidad)).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {gasto.cantidad} {gasto.unidadMedida || 'unidad'}(es) x S/. {parseFloat(gasto.costoUnidad).toFixed(2)}
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex space-x-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting || !gasto.catalogoGastoId}
          className="flex-1 px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Procesando...' : (gasto._id ? 'Actualizar' : 'Agregar')}
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
