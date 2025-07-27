
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-1 sm:p-4 z-50">
      <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-4xl lg:max-w-5xl mx-0 sm:mx-2 lg:mx-4 relative sm:max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-t-none sm:rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute right-2 sm:right-3 lg:right-4 top-2 sm:top-3 lg:top-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} className="sm:hidden" />
            <X size={24} className="hidden sm:block" />
          </button>

          <div className="pr-6 sm:pr-8">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Registrar Nueva Entrada de Inventario</h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">Cada entrada se registra individualmente para mejor trazabilidad</p>
          </div>
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {inventarioError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 sm:py-4 rounded-md mb-4 sm:mb-6">
              <div className="flex items-center">
                <div className="ml-2">
                  <strong>Error:</strong> {inventarioError}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleInventarioSubmit} className="space-y-4 sm:space-y-6">
            {/* Información del Producto */}
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Package className="mr-2 sm:mr-3" size={20} />
                <span className="hidden sm:inline">Información del Producto</span>
                <span className="sm:hidden">Producto</span>
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Producto Registrado * 
                    <span className="text-xs sm:text-sm text-gray-500 ml-1">(Organizados por categoría)</span>
                  </label>
                  <select
                    name="productoId"
                    value={inventarioForm.productoId || ''}
                    onChange={e => setInventarioForm(f => ({ ...f, productoId: e.target.value }))}
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
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
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <FileText className="mr-2 sm:mr-3" size={20} />
                <span className="hidden sm:inline">Detalles de la Entrada</span>
                <span className="sm:hidden">Detalles</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
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
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Ej: 100"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
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
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Ej: 15.50"
                  />
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <User className="mr-2 sm:mr-3" size={20} />
                <span className="hidden sm:inline">Información Adicional</span>
                <span className="sm:hidden">Adicional</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    name="lote"
                    value={inventarioForm.lote || ''}
                    onChange={e => setInventarioForm(f => ({ ...f, lote: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Ej: LOTE-001"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    name="proveedor"
                    value={inventarioForm.proveedor || ''}
                    onChange={e => setInventarioForm(f => ({ ...f, proveedor: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Ej: Proveedor ABC"
                  />
                </div>
              </div>
              <div className="mt-4 sm:mt-6">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  name="fechaVencimiento"
                  value={inventarioForm.fechaVencimiento || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, fechaVencimiento: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 sm:py-3"
                />
              </div>
              <div className="mt-4 sm:mt-6">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={inventarioForm.observaciones || ''}
                  onChange={e => setInventarioForm(f => ({ ...f, observaciones: e.target.value }))}
                  rows="3"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Observaciones adicionales sobre esta entrada..."
                />
              </div>
            </div>

            {/* Resumen */}
            {inventarioForm.cantidad && inventarioForm.precio && (
              <div className="bg-blue-50 p-3 sm:p-4 lg:p-6 rounded-lg">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-blue-900 mb-2 sm:mb-3">Resumen</h3>
                <div className="text-sm sm:text-base text-blue-800 space-y-1 sm:space-y-2">
                  <p>Cantidad: <span className="font-semibold">{inventarioForm.cantidad} unidades</span></p>
                  <p>Precio unitario: <span className="font-semibold">S/ {parseFloat(inventarioForm.precio || 0).toFixed(2)}</span></p>
                  <p className="text-base sm:text-lg font-bold">
                    Costo total: S/ {(parseFloat(inventarioForm.cantidad || 0) * parseFloat(inventarioForm.precio || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Botones fijos en la parte inferior */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-b-none sm:rounded-b-lg">
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="inventario-form"
              onClick={handleInventarioSubmit}
              disabled={inventarioLoading}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                inventarioLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {inventarioLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Registrando...</span>
                  <span className="sm:hidden">...</span>
                </div>
              ) : (
                <>
                  <span className="hidden sm:inline">Registrar Entrada</span>
                  <span className="sm:hidden">Registrar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventarioModal;
