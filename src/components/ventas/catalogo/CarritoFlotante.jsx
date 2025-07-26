import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';

const CarritoFlotante = ({
  carrito = [],
  totalCarrito = 0,
  onActualizarCantidad,
  onEliminarProducto,
  onLimpiarCarrito,
  onConfirmarVenta,
  onCerrar
}) => {

  const handleCantidadChange = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      onEliminarProducto(productoId);
    } else {
      onActualizarCantidad(productoId, nuevaCantidad);
    }
  };

  return (
    <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header del carrito */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-purple-600" size={20} />
          <h3 className="font-semibold text-gray-900">
            Carrito de Compras
          </h3>
          <span className="bg-purple-100 text-purple-800 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {carrito.length}
          </span>
        </div>
        
        <button
          onClick={onCerrar}
          className="text-gray-400 hover:text-gray-600 transition-colors lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Contenido del carrito */}
      {carrito.length === 0 ? (
        /* Carrito vacío */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Carrito vacío</p>
            <p className="text-gray-400 text-sm">
              Agrega productos del catálogo para comenzar
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {carrito.map(item => (
              <div key={item.productoId} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                {/* Información del producto */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.nombre}
                    </h4>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">
                        Código: {item.codigoProducto}
                      </span>
                      {item.categoryName && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {item.categoryName}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Precio: <strong>S/ {item.precioUnitario.toFixed(2)}</strong>
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {item.stockDisponible}
                      </span>
                    </div>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => onEliminarProducto(item.productoId)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Eliminar producto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Controles de cantidad */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
                    <button
                      onClick={() => handleCantidadChange(item.productoId, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={14} />
                    </button>
                    
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => {
                        const nuevaCantidad = Math.max(1, Math.min(parseInt(e.target.value) || 1, item.stockDisponible));
                        handleCantidadChange(item.productoId, nuevaCantidad);
                      }}
                      min="1"
                      max={item.stockDisponible}
                      className="w-12 text-center text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                    />
                    
                    <button
                      onClick={() => handleCantidadChange(item.productoId, item.cantidad + 1)}
                      disabled={item.cantidad >= item.stockDisponible}
                      className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      S/ {item.subtotal.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.cantidad} × S/ {item.precioUnitario.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Advertencia de stock */}
                {item.cantidad >= item.stockDisponible && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                    ⚠️ Has agregado todo el stock disponible
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer del carrito */}
          <div className="border-t border-gray-200 p-4 bg-white space-y-4">
            {/* Resumen del total */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Productos ({carrito.length})</span>
                <span>S/ {totalCarrito.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>S/ {totalCarrito.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-2">
              <button
                onClick={onConfirmarVenta}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Confirmar Venta
              </button>
              
              <button
                onClick={onLimpiarCarrito}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Limpiar carrito
              </button>
            </div>

            {/* Información adicional */}
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Los precios incluyen todos los impuestos</p>
              <p>Stock actualizado en tiempo real</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoFlotante;
