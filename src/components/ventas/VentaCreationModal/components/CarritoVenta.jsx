import React from 'react';
import { Trash2, ShoppingCart } from 'lucide-react';

/**
 * CarritoVenta - Componente del carrito de compras (Solo resumen, sin controles de cantidad)
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.carrito - Items en el carrito
 * @param {Function} props.onRemoverProducto - Callback para remover producto
 * @param {Function} props.onLimpiarCarrito - Callback para limpiar todo el carrito
 * @param {number} props.subtotal - Subtotal calculado
 * 
 * @example
 * <CarritoVenta
 *   carrito={items}
 *   onRemoverProducto={handleRemover}
 *   onLimpiarCarrito={handleLimpiar}
 *   subtotal={150.50}
 * />
 */
const CarritoVenta = React.memo(({
  carrito = [],
  onRemoverProducto,
  onLimpiarCarrito,
  subtotal = 0
}) => {
  // Empty cart state
  if (carrito.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
        <ShoppingCart size={32} className="sm:w-12 sm:h-12 mx-auto text-gray-400 mb-2 sm:mb-3" />
        <p className="text-gray-600 font-medium text-sm sm:text-base">El carrito está vacío</p>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Agrega productos desde la lista disponible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header con botón limpiar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">
          Carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})
        </h3>
        <button
          onClick={onLimpiarCarrito}
          className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
        >
          <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
          Limpiar todo
        </button>
      </div>

      {/* Lista de productos en carrito */}
      <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2">
        {carrito.map((item, index) => (
          <div
            key={`${item.productoId}-${index}`}
            className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              {/* Info del producto */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                  {item.nombre}
                </h4>
                
                <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 flex-wrap">
                  <span className="text-xs sm:text-sm text-gray-600">
                    S/ {(item.precioUnitario || 0).toFixed(2)} c/u
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-purple-600">
                    × {item.cantidad}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-green-600">
                    = S/ {(item.subtotal || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botón eliminar */}
              <button
                onClick={() => onRemoverProducto(index)}
                className="p-1 sm:p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
                title="Eliminar del carrito"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="border-t border-gray-200 pt-2 sm:pt-3 mt-3 sm:mt-4">
        <div className="flex items-center justify-between">
          <span className="text-base sm:text-lg font-semibold text-gray-900">Subtotal:</span>
          <span className="text-2xl font-bold text-green-600">
            S/ {subtotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
});

CarritoVenta.displayName = 'CarritoVenta';

export default CarritoVenta;
