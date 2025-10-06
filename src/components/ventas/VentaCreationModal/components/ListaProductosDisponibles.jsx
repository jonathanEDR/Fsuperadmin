import React from 'react';
import { Plus, Package } from 'lucide-react';

/**
 * ListaProductosDisponibles - Muestra la lista de productos filtrados
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.productos - Lista de productos filtrados
 * @param {Function} props.onAgregarProducto - Callback para agregar producto al carrito
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
  error = null
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
      {productos.map((producto) => (
        <div
          key={producto._id}
          className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            {/* Información del producto */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {producto.nombre}
              </h4>
              
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {producto.codigo && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {producto.codigo}
                  </span>
                )}
                
                {producto.categoria && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {producto.categoria}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm font-medium text-green-600">
                  ${producto.precio?.toFixed(2) || '0.00'}
                </span>
                
                <span className={`text-sm ${
                  producto.stock > 10 
                    ? 'text-green-600' 
                    : producto.stock > 0 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  Stock: {producto.stock || 0}
                </span>
              </div>
            </div>

            {/* Botón agregar */}
            <button
              onClick={() => onAgregarProducto(producto)}
              disabled={!producto.stock || producto.stock <= 0}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                producto.stock > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={producto.stock > 0 ? 'Agregar al carrito' : 'Sin stock disponible'}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

ListaProductosDisponibles.displayName = 'ListaProductosDisponibles';

export default ListaProductosDisponibles;
