import React, { useState } from 'react';
import { Plus, Package, Zap } from 'lucide-react';
import MiniModalStock from './MiniModalStock';

/**
 * ListaProductosDisponibles - Muestra la lista de productos filtrados
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.productos - Lista de productos filtrados
 * @param {Function} props.onAgregarProducto - Callback para agregar producto al carrito (recibe producto y cantidad)
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.error - Mensaje de error si existe
 * 
 * @example
 * <ListaProductosDisponibles
 *   productos={productosData}
 *   onAgregarProducto={handleAgregar}
 *   loading={false}
 *   error={null}
 * />
 */
const ListaProductosDisponibles = React.memo(({
  productos = [],
  onAgregarProducto,
  loading = false,
  error = null,
  onStockUpdated, // Nuevo prop para notificar cuando se actualiza stock
  userRole = 'user' // Rol del usuario para control de permisos
}) => {
  // Estado para manejar las cantidades de cada producto
  const [cantidades, setCantidades] = useState({});
  
  // Estado para el mini modal de stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);

  /**
   * Obtener la cantidad actual de un producto
   */
  const getCantidad = (productoId) => {
    return cantidades[productoId] || 1;
  };

  /**
   * Actualizar la cantidad de un producto
   */
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    const cantidad = Math.max(1, Math.min(nuevaCantidad, 999));
    setCantidades(prev => ({
      ...prev,
      [productoId]: cantidad
    }));
  };

  /**
   * Manejar agregar producto con cantidad
   */
  const handleAgregar = (producto) => {
    const cantidad = getCantidad(producto._id);
    onAgregarProducto(producto, cantidad);
    // Resetear la cantidad después de agregar
    setCantidades(prev => {
      const newState = { ...prev };
      delete newState[producto._id];
      return newState;
    });
  };

  /**
   * Abrir modal para agregar stock
   */
  const handleAgregarStock = (producto) => {
    setSelectedProducto(producto);
    setShowStockModal(true);
  };

  /**
   * Manejar cuando se agrega stock exitosamente
   */
  const handleStockAdded = (response, cantidadAgregada) => {
    console.log('Stock agregado exitosamente:', response);
    
    // Notificar al componente padre para refrescar productos
    if (onStockUpdated) {
      onStockUpdated(selectedProducto._id, cantidadAgregada);
    }
    
    // Cerrar modal
    setShowStockModal(false);
    setSelectedProducto(null);
  };

  /**
   * Cerrar modal de stock
   */
  const handleCloseStockModal = () => {
    setShowStockModal(false);
    setSelectedProducto(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Cargando productos...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 font-medium">⚠️ Error al cargar productos</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Empty state
  if (productos.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Package size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No se encontraron productos</p>
        <p className="text-gray-500 text-sm mt-1">
          Intenta ajustar los filtros de búsqueda
        </p>
      </div>
    );
  }

  // Products list
  return (
    <>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {productos.map((producto) => (
          <div
            key={producto._id}
            className="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-3 hover:border-purple-400 hover:shadow-md transition-all duration-200"
          >
            {/* Fila 1: Nombre del producto */}
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 line-clamp-2">
              {producto.nombre}
            </h4>
            
            {/* Fila 2: Info + Controles */}
            <div className="flex items-center justify-between gap-2">
              {/* Información del producto */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                {/* Código y categoría */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(producto.codigoProducto || producto.codigo) && (
                    <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded">
                      {producto.codigoProducto || producto.codigo}
                    </span>
                  )}
                  
                  {(producto.categoryName || producto.categoria) && (
                    <span className="text-[10px] sm:text-xs text-purple-600 bg-purple-50 px-1.5 sm:px-2 py-0.5 rounded">
                      {producto.categoryName || producto.categoria}
                    </span>
                  )}
                </div>

                {/* Precio y Stock */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm font-bold text-green-600">
                    S/ {(producto.precio || producto.precioVenta)?.toFixed(2) || '0.00'}
                  </span>
                  
                  <span className={`text-xs sm:text-sm ${
                    (producto.cantidadRestante || producto.stock) > 10 
                      ? 'text-green-600' 
                      : (producto.cantidadRestante || producto.stock) > 0 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    Stock: {producto.cantidadRestante || producto.stock || 0}
                  </span>
                </div>
              </div>

              {/* Controles de cantidad y agregar */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Input de cantidad */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => actualizarCantidad(producto._id, getCantidad(producto._id) - 1)}
                  disabled={getCantidad(producto._id) <= 1}
                  className="px-1.5 sm:px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                  type="button"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={producto.cantidadRestante || producto.stock || 999}
                  value={getCantidad(producto._id)}
                  onChange={(e) => actualizarCantidad(producto._id, parseInt(e.target.value) || 1)}
                  className="w-10 sm:w-14 text-center border-0 focus:outline-none focus:ring-0 py-1 text-sm sm:text-base"
                />
                <button
                  onClick={() => actualizarCantidad(producto._id, getCantidad(producto._id) + 1)}
                  disabled={getCantidad(producto._id) >= (producto.cantidadRestante || producto.stock)}
                  className="px-1.5 sm:px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                  type="button"
                >
                  +
                </button>
              </div>

              {/* Botón +Stock (solo visible para admin y super-admin) */}
              {(userRole === 'admin' || userRole === 'super-admin') && (
                <button
                  onClick={() => handleAgregarStock(producto)}
                  className="flex-shrink-0 px-2 sm:px-2.5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-1 hover:shadow-lg min-w-[36px] sm:min-w-0"
                  title="Agregar stock rápido"
                >
                  <Zap size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline text-xs font-medium">+Stock</span>
                </button>
              )}

              {/* Botón agregar */}
              <button
                onClick={() => handleAgregar(producto)}
                disabled={!(producto.cantidadRestante || producto.stock) || (producto.cantidadRestante || producto.stock) <= 0}
                className={`flex-shrink-0 px-2.5 sm:px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 min-w-[36px] sm:min-w-0 ${
                  (producto.cantidadRestante || producto.stock) > 0
                    ? 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={(producto.cantidadRestante || producto.stock) > 0 ? 'Agregar al carrito' : 'Sin stock disponible'}
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden xs:inline text-sm font-medium">Agregar</span>
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>

      {/* Mini Modal para agregar stock */}
      <MiniModalStock
        isOpen={showStockModal}
        onClose={handleCloseStockModal}
        producto={selectedProducto}
        onStockAdded={handleStockAdded}
      />
    </>
  );
});

ListaProductosDisponibles.displayName = 'ListaProductosDisponibles';

export default ListaProductosDisponibles;
