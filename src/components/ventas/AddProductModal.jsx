import React, { useState, useEffect } from 'react';
import { X, Plus, ShoppingCart } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

const AddProductModal = ({ 
  isOpen, 
  onClose, 
  ventaId, 
  onProductAdded, 
  currentProducts = [] 
}) => {
  const { getToken } = useAuth();
  const [productos, setProductos] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cargar productos disponibles
  useEffect(() => {
    if (isOpen) {
      loadProductos();
    }
  }, [isOpen]);

  const loadProductos = async () => {
    setLoadingProducts(true);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      
      // Filtrar productos que ya están en la venta y que tienen stock
      const productosDisponibles = data.filter(producto => {
        const yaEstaEnVenta = currentProducts.some(p => p.productoId._id === producto._id);
        const tieneStock = producto.cantidadRestante > 0;
        return !yaEstaEnVenta && tieneStock;
      });

      setProductos(productosDisponibles);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar productos disponibles');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProductId || quantity <= 0) {
      setError('Por favor selecciona un producto y especifica una cantidad válida');
      return;
    }

    const selectedProduct = productos.find(p => p._id === selectedProductId);
    if (!selectedProduct) {
      setError('Producto no encontrado');
      return;
    }

    if (quantity > selectedProduct.cantidadRestante) {
      setError(`⚠️ Stock insuficiente: Solo hay ${selectedProduct.cantidadRestante} unidades disponibles de "${selectedProduct.nombre}"`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/productos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productoId: selectedProductId,
          cantidad: quantity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar producto');
      }

      const data = await response.json();
      
      // Notificar al componente padre
      if (onProductAdded) {
        onProductAdded(data.venta);
      }

      // Limpiar formulario y cerrar modal
      setSelectedProductId('');
      setQuantity(1);
      onClose();
    } catch (error) {
      console.error('Error al agregar producto:', error);
      setError(error.message || 'Error al agregar producto');
    } finally {
      setLoading(false);
    }
  };

  // Obtener el producto seleccionado para mostrar información
  const selectedProduct = productos.find(p => p._id === selectedProductId);
  
  // Validar si la cantidad es válida
  const isQuantityValid = selectedProduct && quantity > 0 && quantity <= selectedProduct.cantidadRestante;
  
  // Determinar el color del indicador de stock
  const getStockColor = (cantidadRestante) => {
    if (cantidadRestante === 0) return 'text-red-600 bg-red-100';
    if (cantidadRestante <= 5) return 'text-orange-600 bg-orange-100';
    if (cantidadRestante <= 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockIcon = (cantidadRestante) => {
    if (cantidadRestante === 0) return '🔴';
    if (cantidadRestante <= 5) return '🟠';
    if (cantidadRestante <= 10) return '🟡';
    return '🟢';
  };

  const handleClose = () => {
    setSelectedProductId('');
    setQuantity(1);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Agregar Producto
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body dividido en dos columnas */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:gap-6">
            {/* Columna izquierda: Información del producto, cantidad y botones */}
            <div className="md:w-1/2 mb-6 md:mb-0 flex flex-col gap-4">
              {/* Selector de producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto
                </label>
                {loadingProducts ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Cargando productos...</span>
                  </div>
                ) : (
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {productos.map(producto => (
                      <option key={producto._id} value={producto._id}>
                        {producto.nombre} - {producto.categoryId?.nombre || 'Sin categoría'} - {getStockIcon(producto.cantidadRestante)} Stock: {producto.cantidadRestante} - S/ {producto.precio}
                      </option>
                    ))}
                  </select>
                )}
                {productos.length === 0 && !loadingProducts && (
                  <p className="text-sm text-gray-500 mt-2">
                    No hay productos disponibles para agregar a esta venta
                  </p>
                )}
              </div>
              {/* Información del producto seleccionado */}
              {selectedProduct && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Producto</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nombre:</span>
                      <p className="font-medium">{selectedProduct.nombre}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Precio:</span>
                      <p className="font-medium">S/ {selectedProduct.precio}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Categoría:</span>
                      <p className="font-medium">{selectedProduct.categoryName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Stock disponible:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(selectedProduct.cantidadRestante)}`}>
                          {getStockIcon(selectedProduct.cantidadRestante)} {selectedProduct.cantidadRestante} unidades
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Advertencia de stock bajo */}
                  {selectedProduct.cantidadRestante <= 5 && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        ⚠️ <strong>Stock bajo:</strong> Solo quedan {selectedProduct.cantidadRestante} unidades disponibles
                      </p>
                    </div>
                  )}
                </div>
              )}
              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct ? selectedProduct.cantidadRestante : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    selectedProduct && quantity > selectedProduct.cantidadRestante 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  required
                />
                {selectedProduct && quantity > selectedProduct.cantidadRestante && (
                  <p className="mt-1 text-sm text-red-600">
                    ⚠️ La cantidad no puede ser mayor al stock disponible ({selectedProduct.cantidadRestante})
                  </p>
                )}
                {selectedProduct && (
                  <p className="mt-1 text-sm text-gray-600">
                    Máximo disponible: {selectedProduct.cantidadRestante} unidades
                  </p>
                )}
              </div>
              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedProductId || quantity <= 0 || productos.length === 0 || !isQuantityValid}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    loading || !selectedProductId || quantity <= 0 || productos.length === 0 || !isQuantityValid
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {isQuantityValid ? 'Agregar Producto' : 'Cantidad no válida'}
                    </>
                  )}
                </button>
              </div>
              {/* Ayuda adicional */}
              {!isQuantityValid && selectedProduct && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Tip:</strong> Ajusta la cantidad a un valor entre 1 y {selectedProduct.cantidadRestante}
                  </p>
                </div>
              )}
            </div>
            {/* Columna derecha: Resumen */}
            <div className="md:w-1/2 flex flex-col gap-4">
              {/* Resumen de la operación */}
              {selectedProduct && (
                <div className={`border rounded-lg p-4 ${
                  isQuantityValid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className="font-medium text-gray-900 mb-3">Resumen de la operación</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Producto:</span>
                      <span className="font-medium">{selectedProduct.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categoría:</span>
                      <span className="font-medium">{selectedProduct.categoryId?.nombre || 'Sin categoría'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio unitario:</span>
                      <span className="font-medium">S/ {selectedProduct.precio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cantidad a agregar:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock después de la operación:</span>
                      <span className={`font-medium ${
                        selectedProduct.cantidadRestante - quantity >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {selectedProduct.cantidadRestante - quantity} unidades
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-bold text-blue-600">
                        S/ {(selectedProduct.precio * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Indicador de validación */}
                  {isQuantityValid ? (
                    <div className="mt-3 flex items-center gap-2 text-green-700">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm">Operación válida</span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-red-700">
                      <span className="text-red-600">✗</span>
                      <span className="text-sm">Cantidad no válida</span>
                    </div>
                  )}
                </div>
              )}
              {/* Información del producto seleccionado (resumen adicional) */}
              {selectedProductId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  {(() => {
                    const producto = productos.find(p => p._id === selectedProductId);
                    if (!producto) return null;
                    const subtotal = producto.precio * quantity;
                    return (
                      <div className="space-y-2 text-sm">
                        <h4 className="font-medium text-blue-800">Resumen:</h4>
                        <div className="flex justify-between">
                          <span>Precio unitario:</span>
                          <span className="font-medium">S/ {producto.precio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cantidad:</span>
                          <span className="font-medium">{quantity}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Subtotal:</span>
                          <span className="font-bold text-blue-600">S/ {subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
