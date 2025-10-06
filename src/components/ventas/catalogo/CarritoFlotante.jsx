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
      <div className="flex items-center justify-between p-4 border-b-2 border-purple-200 bg-gradient-to-r from-purple-50 via-white to-purple-50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-purple-600" size={24} />
          <h3 className="font-bold text-gray-900 text-lg">
            Carrito de Compras
          </h3>
          <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-md">
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
              <div key={item.productoId} className="bg-white rounded-lg p-3 border-2 border-purple-200 hover:border-purple-400 transition-colors shadow-sm">
                {/* Información del producto */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.nombre}
                    </h4>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">
                        Código: {item.codigoProducto}
                      </span>
                      {item.categoryName && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
                          {item.categoryName}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Precio: <strong className="text-purple-600">S/ {item.precioUnitario.toFixed(2)}</strong>
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {item.stockDisponible}
                      </span>
                    </div>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => onEliminarProducto(item.productoId)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-all p-2 rounded-lg"
                    title="Eliminar producto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Controles de cantidad */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-purple-50 rounded-lg border-2 border-purple-300 p-1">
                    <button
                      onClick={() => handleCantidadChange(item.productoId, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                      className="p-1.5 text-purple-600 hover:text-white hover:bg-purple-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                      className="w-12 text-center text-sm font-bold border-0 bg-transparent focus:ring-0 focus:outline-none text-purple-600"
                    />
                    
                    <button
                      onClick={() => handleCantidadChange(item.productoId, item.cantidad + 1)}
                      disabled={item.cantidad >= item.stockDisponible}
                      className="p-1.5 text-purple-600 hover:text-white hover:bg-purple-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                    <div className="text-sm font-bold text-purple-700">
                      S/ {item.subtotal.toFixed(2)}
                    </div>
                    <div className="text-xs text-purple-500">
                      {item.cantidad} × S/ {item.precioUnitario.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Advertencia de stock */}
                {item.cantidad >= item.stockDisponible && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded-lg text-xs text-yellow-800 font-medium">
                    ⚠️ Has agregado todo el stock disponible
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer del carrito */}
          <div className="border-t-2 border-purple-200 p-4 bg-gradient-to-b from-white to-purple-50 space-y-4">
            {/* Resumen del total */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-purple-600 font-medium">
                <span>Productos ({carrito.length})</span>
                <span>S/ {totalCarrito.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-xl font-bold text-purple-700 pt-2 border-t-2 border-purple-200 bg-purple-50 px-3 py-2 rounded-lg">
                <span>Total</span>
                <span>S/ {totalCarrito.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-2">
              <button
                onClick={onConfirmarVenta}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <CheckCircle size={20} />
                Confirmar Venta
              </button>
              
              <button
                onClick={onLimpiarCarrito}
                className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg hover:bg-purple-50 transition-all text-sm font-semibold border-2 border-purple-200 hover:border-purple-400"
              >
                Limpiar carrito
              </button>
            </div>

            {/* Información adicional */}
            <div className="text-xs text-purple-600 text-center space-y-1 font-medium">
              <p>💵 Los precios incluyen todos los impuestos</p>
              <p>📦 Stock actualizado en tiempo real</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoFlotante;
