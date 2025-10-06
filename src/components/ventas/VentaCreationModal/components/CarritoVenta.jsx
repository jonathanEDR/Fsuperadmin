import React from 'react';
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react';

/**
 * CarritoVenta - Componente del carrito de compras
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.carrito - Items en el carrito
 * @param {Function} props.onRemoverProducto - Callback para remover producto
 * @param {Function} props.onActualizarCantidad - Callback para actualizar cantidad
 * @param {Function} props.onLimpiarCarrito - Callback para limpiar todo el carrito
 * @param {number} props.subtotal - Subtotal calculado
 * 
 * @example
 * <CarritoVenta
 *   carrito={items}
 *   onRemoverProducto={handleRemover}
 *   onActualizarCantidad={handleActualizar}
 *   onLimpiarCarrito={handleLimpiar}
 *   subtotal={150.50}
 * />
 */
const CarritoVenta = React.memo(({
  carrito = [],
  onRemoverProducto,
  onActualizarCantidad,
  onLimpiarCarrito,
  subtotal = 0
}) => {
  // Empty cart state
  if (carrito.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <ShoppingCart size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">El carrito está vacío</p>
        <p className="text-gray-500 text-sm mt-1">
          Agrega productos desde la lista disponible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con botón limpiar */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})
        </h3>
        <button
          onClick={onLimpiarCarrito}
          className="text-sm text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
        >
          <Trash2 size={14} />
          Limpiar todo
        </button>
      </div>

      {/* Lista de productos en carrito */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {carrito.map((item) => (
          <div
            key={item.productoId}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Info del producto */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {item.nombre}
                </h4>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">
                    ${item.precio?.toFixed(2) || '0.00'} c/u
                  </span>
                  {item.codigo && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {item.codigo}
                    </span>
                  )}
                </div>

                {/* Controles de cantidad */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => onActualizarCantidad(item.productoId, item.cantidad - 1)}
                    disabled={item.cantidad <= 1}
                    className={`p-1 rounded ${
                      item.cantidad <= 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title="Disminuir cantidad"
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={item.stockDisponible || 999}
                    value={item.cantidad}
                    onChange={(e) => {
                      const valor = parseInt(e.target.value) || 1;
                      onActualizarCantidad(item.productoId, valor);
                    }}
                    className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                  />

                  <button
                    onClick={() => onActualizarCantidad(item.productoId, item.cantidad + 1)}
                    disabled={item.cantidad >= (item.stockDisponible || 999)}
                    className={`p-1 rounded ${
                      item.cantidad >= (item.stockDisponible || 999)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title="Aumentar cantidad"
                  >
                    <Plus size={14} />
                  </button>

                  {item.stockDisponible && (
                    <span className="text-xs text-gray-500 ml-2">
                      (máx: {item.stockDisponible})
                    </span>
                  )}
                </div>
              </div>

              {/* Subtotal y botón eliminar */}
              <div className="flex flex-col items-end gap-2">
                <span className="font-semibold text-green-600">
                  ${((item.precio || 0) * item.cantidad).toFixed(2)}
                </span>
                
                <button
                  onClick={() => onRemoverProducto(item.productoId)}
                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                  title="Eliminar del carrito"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="border-t border-gray-200 pt-3 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
          <span className="text-2xl font-bold text-green-600">
            ${subtotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
});

CarritoVenta.displayName = 'CarritoVenta';

export default CarritoVenta;
