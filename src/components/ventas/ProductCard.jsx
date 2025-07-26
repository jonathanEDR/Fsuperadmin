import React, { useState } from 'react';
import { Plus, Minus, Edit3, Trash2, Calculator } from 'lucide-react';
import QuantityModal from './QuantityModal';
import { useCantidadManagement } from '../../hooks/useCantidadManagement';
import { useProductoSafe } from '../../hooks/useProductoSafe';

const ProductCard = ({ 
  producto, 
  ventaId, 
  venta, // 📋 Nueva prop para acceder a toda la venta y sus devoluciones
  onUpdateQuantity, 
  onRemoveProduct, 
  canEdit = false,
  loading = false,
  devoluciones = [] // 📋 Mantener por compatibilidad, pero usar venta.devoluciones como prioridad
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  
  // Hook para manejo seguro del producto
  const productoSafe = useProductoSafe(producto);
  const [newQuantity, setNewQuantity] = useState(productoSafe.cantidad);

  // Hook unificado para gestión de cantidades
  const { 
    actualizarCantidadManual, 
    loading: cantidadLoading, 
    error: cantidadError 
  } = useCantidadManagement();

  // Actualizar newQuantity cuando cambie producto.cantidad
  React.useEffect(() => {
    setNewQuantity(productoSafe.cantidad);
  }, [productoSafe.cantidad]);

  // 🔍 DETECTAR SI EL PRODUCTO TIENE DEVOLUCIONES
  const tieneDevolucion = React.useMemo(() => {
    // Verificar si el producto es válido primero
    if (!productoSafe.isValid || !productoSafe.id) {
      return false;
    }
    
    // PRIORIDAD: Usar devoluciones de la venta si están disponibles
    const devolucionesAUsar = venta?.devoluciones || devoluciones || [];
    
    if (!devolucionesAUsar || devolucionesAUsar.length === 0) {
      return false;
    }
    
    // Buscar coincidencias
    const hayCoincidencia = devolucionesAUsar.some(dev => {
      const devProductoId = dev.productoId?._id || dev.productoId;
      return devProductoId && productoSafe.id && (devProductoId.toString() === productoSafe.id.toString());
    });
    
    return hayCoincidencia;
  }, [venta?.devoluciones, devoluciones, productoSafe.id, productoSafe.isValid]);

  // Función para determinar el color del stock
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

  const handleQuantityChange = async (action) => {
    if (isUpdating || loading || cantidadLoading) return;
    
    // Para operaciones + y -, abrir el modal
    if (action === 'increase' || action === 'decrease') {
      setShowQuantityModal(true);
      return;
    }
    
    // Para cambio directo en el input
    if (action === 'set') {
      const stockActual = producto.productoId?.cantidadRestante || 0;
      const cantidadActual = producto.cantidad;
      const nuevaCantidad = Math.max(1, parseInt(newQuantity) || 1);
      const diferencia = nuevaCantidad - cantidadActual;
      
      // Si se aumenta la cantidad, verificar stock
      if (diferencia > 0 && stockActual < diferencia) {
        alert(`⚠️ Stock insuficiente. Solo hay ${stockActual} unidades adicionales disponibles`);
        return;
      }
      
      setIsUpdating(true);
      try {
        // Usar el servicio unificado
        const resultado = await actualizarCantidadManual(
          ventaId, 
          producto.productoId._id, 
          nuevaCantidad,
          'Cambio manual desde tarjeta de producto'
        );
        
        setNewQuantity(nuevaCantidad);
        
        // Notificar al componente padre
        if (onUpdateQuantity && resultado.venta) {
          onUpdateQuantity(resultado.venta);
        }
      } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        alert('Error al actualizar la cantidad. Por favor, intente nuevamente.');
        // Revertir el valor del input
        setNewQuantity(producto.cantidad);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleQuantityConfirm = async (responseData) => {
    // La venta puede venir directamente o dentro de un objeto con la propiedad 'venta'
    const venta = responseData?.venta || responseData;
    
    if (venta && venta.productos) {
      // Buscar el producto actualizado en la venta
      const productoActualizado = venta.productos.find(
        p => p.productoId._id === producto.productoId._id
      );
      
      if (productoActualizado) {
        // Actualizar el estado local inmediatamente
        setNewQuantity(productoActualizado.cantidad);
      }
      
      // Notificar al componente padre que la venta se actualizó
      if (onUpdateQuantity) {
        onUpdateQuantity(venta);
      }
    }
  };

  const handleRemove = async () => {
    if (!productoSafe.isValid || !productoSafe.id) {
      alert('Error: No se puede eliminar un producto sin ID válido');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto de la venta?')) {
      await onRemoveProduct(ventaId, productoSafe.id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Mostrar error si el producto no es válido */}
      {!productoSafe.isValid && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 text-xs font-medium">
            ⚠️ Error: {productoSafe.error}
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-2">
        {/* Header compacto */}
        <div>
          <h5 className="font-medium text-gray-900 text-sm leading-tight">
            {productoSafe.nombre}
          </h5>
          {/* Categoría más compacta */}
          {productoSafe.categoria && productoSafe.categoria !== 'Sin categoría' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
              📂 {productoSafe.categoria}
            </span>
          )}
        </div>

        {/* Información principal en formato compacto */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Cantidad:</span>
            <span className="font-medium">{productoSafe.cantidad}</span>
          </div>
          <div className="flex justify-between">
            <span>Precio:</span>
            <span className="font-medium">S/ {productoSafe.precio?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">Subtotal:</span>
            <span className="font-medium text-blue-600">S/ {productoSafe.subtotal?.toFixed(2)}</span>
          </div>
        </div>

        {/* Stock compacto */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Stock:</span>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStockColor(producto.productoId?.cantidadRestante || 0)}`}>
            {getStockIcon(producto.productoId?.cantidadRestante || 0)} {producto.productoId?.cantidadRestante || 0}
          </span>
        </div>

        {/* Advertencia de stock bajo */}
        {(producto.productoId?.cantidadRestante || 0) <= 5 && (
          <div className="text-xs text-orange-600">⚠️ Stock bajo</div>
        )}

        {canEdit && (
          <div className="space-y-2">
            {/* ✅ MOSTRAR CONTROLES SOLO SI NO HAY DEVOLUCIONES */}
            {!tieneDevolucion ? (
              <>
                {/* Controles de cantidad más compactos */}
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() => handleQuantityChange('decrease')}
                    disabled={isUpdating || producto.cantidad <= 1}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reducir cantidad"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    onBlur={() => handleQuantityChange('set')}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuantityChange('set')}
                    className="w-8 text-center text-xs border-0 bg-transparent focus:ring-0 focus:outline-none"
                    min="1"
                    max={producto.cantidad + (producto.productoId?.cantidadRestante || 0)}
                  />
                  
                  <button
                    onClick={() => handleQuantityChange('increase')}
                    disabled={isUpdating || (producto.productoId?.cantidadRestante || 0) <= 0}
                    className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                      (producto.productoId?.cantidadRestante || 0) <= 0
                        ? 'text-red-400 bg-red-100'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                    title={
                      (producto.productoId?.cantidadRestante || 0) <= 0
                        ? 'Sin stock disponible'
                        : 'Aumentar cantidad'
                    }
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Botón eliminar compacto */}
                <button
                  onClick={handleRemove}
                  disabled={isUpdating}
                  className="w-full text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Eliminar
                </button>
                
                {/* Advertencia de stock agotado */}
                {(producto.productoId?.cantidadRestante || 0) <= 0 && (
                  <div className="text-xs text-red-600 text-center bg-red-50 py-1 rounded">
                    Sin stock
                  </div>
                )}
              </>
            ) : (
              /* 🔒 MENSAJE CUANDO HAY DEVOLUCIONES - más compacto */
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                <div className="text-orange-700 text-xs">
                  🔒 <span className="font-medium">Cantidad bloqueada</span>
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Producto con devolución
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border mt-1">
                  Cantidad: {producto.cantidad}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isUpdating && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          Actualizando...
        </div>
      )}

      {/* Modal de cantidad */}
      <QuantityModal
        isOpen={showQuantityModal}
        onClose={() => setShowQuantityModal(false)}
        producto={producto}
        onConfirm={handleQuantityConfirm}
        isUpdating={isUpdating}
        ventaId={ventaId}
      />
    </div>
  );
};

export default ProductCard;
