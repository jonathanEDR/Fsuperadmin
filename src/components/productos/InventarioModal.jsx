
import React from 'react';
import { X, Calendar, Package, User, FileText } from 'lucide-react';

const InventarioModal = ({
  isOpen,
  onClose,
  inventarioForm,
  setInventarioForm,
  inventarioError,
  inventarioLoading,
  catalogoProductos,
  handleInventarioSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registrar Nueva Entrada de Inventario</h2>
          <p className="text-gray-600">Cada entrada se registra individualmente para mejor trazabilidad</p>
        </div>

        {inventarioError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            <div className="flex items-center">
              <div className="ml-2">
                <strong>Error:</strong> {inventarioError}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleInventarioSubmit} className="space-y-6">
          {/* Información del Producto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="mr-2" size={20} />
              Información del Producto
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto Registrado * 
                  <span className="text-xs text-gray-500 ml-1">(Organizados por categoría)</span>
                </label>
                <select
                  name="productoId"
                  value={inventarioForm.productoId || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, productoId: e.target.value }))}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">-- Selecciona un producto registrado --</option>
                  {(() => {
                    // Agrupar productos por categoría
                    const productosPorCategoria = catalogoProductos.reduce((acc, producto) => {
                      const categoria = producto.categoria || 'Sin categoría';
                      if (!acc[categoria]) {
                        acc[categoria] = [];
                      }
                      acc[categoria].push(producto);
                      return acc;
                    }, {});

                    // Ordenar categorías alfabéticamente
                    const categoriasOrdenadas = Object.keys(productosPorCategoria).sort();

                    return categoriasOrdenadas.map(categoria => (
                      <optgroup key={categoria} label={categoria}>
                        {productosPorCategoria[categoria]
                          .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
                          .map(producto => (
                            <option key={producto._id} value={producto._id}>
                              {producto.codigoProducto} - {producto.nombre} (Stock: {producto.cantidadRestante || 0})
                            </option>
                          ))
                        }
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>
            </div>
          </div>

          {/* Información de la Entrada */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="mr-2" size={20} />
              Detalles de la Entrada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={inventarioForm.cantidad || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, cantidad: e.target.value }))}
                  required
                  min="1"
                  step="1"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Unitario *
                </label>
                <input
                  type="number"
                  name="precio"
                  value={inventarioForm.precio || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, precio: e.target.value }))}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: 15.50"
                />
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2" size={20} />
              Información Adicional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lote
                </label>
                <input
                  type="text"
                  name="lote"
                  value={inventarioForm.lote || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, lote: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: LOTE-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  name="proveedor"
                  value={inventarioForm.proveedor || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, proveedor: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: Proveedor ABC"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                name="fechaVencimiento"
                value={inventarioForm.fechaVencimiento || ''}
                onChange={e => setInventarioForm(f => ({ ...f, fechaVencimiento: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={inventarioForm.observaciones || ''}
                onChange={e => setInventarioForm(f => ({ ...f, observaciones: e.target.value }))}
                rows="3"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Observaciones adicionales sobre esta entrada..."
              />
            </div>
          </div>

          {/* Resumen */}
          {inventarioForm.cantidad && inventarioForm.precio && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Resumen</h3>
              <div className="text-sm text-blue-800">
                <p>Cantidad: {inventarioForm.cantidad} unidades</p>
                <p>Precio unitario: S/ {parseFloat(inventarioForm.precio || 0).toFixed(2)}</p>
                <p className="font-semibold">
                  Costo total: S/ {(parseFloat(inventarioForm.cantidad || 0) * parseFloat(inventarioForm.precio || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={inventarioLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                inventarioLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {inventarioLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </div>
              ) : (
                'Registrar Entrada'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventarioModal;
