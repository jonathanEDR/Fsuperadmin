import React, { useState } from 'react';
import { Plus, Minus, Edit3, Trash2, Calculator } from 'lucide-react';
import QuantityModal from './QuantityModal';
import { useCantidadManagement } from '../../hooks/useCantidadManagement';

const ProductCard = ({ 
  producto, 
  ventaId, 
  onUpdateQuantity, 
  onRemoveProduct, 
  canEdit = false,
  loading = false,
  devoluciones = [] // 📋 Nueva prop para detectar devoluciones
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [newQuantity, setNewQuantity] = useState(producto.cantidad);

  // Hook unificado para gestión de cantidades
  const { 
    actualizarCantidadManual, 
    loading: cantidadLoading, 
    error: cantidadError 
  } = useCantidadManagement();

  // Actualizar newQuantity cuando cambie producto.cantidad
  React.useEffect(() => {
    setNewQuantity(producto.cantidad);
  }, [producto.cantidad]);

  // 🔍 DETECTAR SI EL PRODUCTO TIENE DEVOLUCIONES (VERSIÓN SIMPLIFICADA PARA DEBUG)
  const tieneDevolucion = React.useMemo(() => {
    console.log('🔍 ===== INICIANDO DETECCIÓN DE DEVOLUCIONES =====');
    
    if (!devoluciones || devoluciones.length === 0) {
      console.log('❌ No hay devoluciones para analizar');
      return false;
    }
    
    const productoIdActual = producto.productoId?._id || producto.productoId;
    console.log('� Producto actual:', {
      id: productoIdActual,
      nombre: producto.productoId?.nombre,
      devolucionesTotales: devoluciones.length
    });
    
    // Mostrar todas las devoluciones para debug
    devoluciones.forEach((dev, index) => {
      const devProductoId = dev.productoId?._id || dev.productoId;
      const sonIguales = devProductoId && productoIdActual && (devProductoId.toString() === productoIdActual.toString());
      
      console.log(`📋 Devolución ${index + 1}:`, {
        devolucionId: dev._id,
        productoIdEnDev: devProductoId,
        productoIdActual: productoIdActual,
        sonIguales: sonIguales,
        nombreProducto: dev.productoId?.nombre,
        cantidadDevuelta: dev.cantidadDevuelta,
        estado: dev.estado
      });
    });
    
    // Buscar coincidencias
    const hayCoincidencia = devoluciones.some(dev => {
      const devProductoId = dev.productoId?._id || dev.productoId;
      return devProductoId && productoIdActual && (devProductoId.toString() === productoIdActual.toString());
    });
    
    console.log('🎯 RESULTADO FINAL:', {
      productoId: productoIdActual,
      hayDevoluciones: hayCoincidencia,
      ocultarBotones: hayCoincidencia
    });
    
    console.log('🔍 ===== FIN DETECCIÓN DE DEVOLUCIONES =====');
    
    return hayCoincidencia;
  }, [devoluciones, producto.productoId]);

  // 📊 LOG FINAL SIMPLIFICADO
  console.log('🎯 DECISIÓN FINAL - MOSTRAR/OCULTAR BOTONES:', {
    producto: producto.productoId?.nombre,
    tieneDevolucion: tieneDevolucion,
    mostrarBotones: !tieneDevolucion,
    accion: tieneDevolucion ? '🔒 OCULTAR BOTONES' : '✅ MOSTRAR BOTONES'
  });

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
    console.log('🔍 ProductCard - handleQuantityConfirm recibió:', responseData);
    
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
        
        console.log('✅ Producto actualizado con historial:', {
          productoId: producto.productoId._id,
          cantidadAnterior: producto.cantidad,
          cantidadNueva: productoActualizado.cantidad,
          historial: productoActualizado.historial
        });
      } else {
        console.warn('⚠️ ProductCard - No se encontró el producto en la venta actualizada');
      }
      
      // Notificar al componente padre que la venta se actualizó
      if (onUpdateQuantity) {
        console.log('🔄 ProductCard - Notificando al padre sobre la actualización');
        onUpdateQuantity(venta);
      }
    } else {
      console.warn('⚠️ ProductCard - No se encontró la estructura de venta esperada:', responseData);
    }
  };

  const handleRemove = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto de la venta?')) {
      await onRemoveProduct(ventaId, producto.productoId._id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900 mb-1">
            {producto.productoId?.nombre}
          </h5>
          {/* Información de la categoría */}
          {producto.productoId?.categoryId && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                📂 {producto.productoId.categoryId.nombre}
              </span>
            </div>
          )}
          <div className="text-sm text-gray-600 space-y-1">
            <p>Cantidad: <span className="font-medium">{producto.cantidad}</span></p>
            <p>Precio unitario: <span className="font-medium">S/ {producto.precioUnitario?.toFixed(2)}</span></p>
            <p>Subtotal: <span className="font-medium text-blue-600">S/ {producto.subtotal?.toFixed(2)}</span></p>
            
            {/* Mostrar historial de operaciones si existe */}
            {producto.historial && producto.historial.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <Calculator className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">Historial de cambios:</span>
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  {(() => {
                    const historialOrdenado = [...producto.historial].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                    
                    if (historialOrdenado.length === 0) {
                      return `${producto.cantidad}`;
                    }
                    
                    // Obtener la cantidad inicial (primera entrada del historial)
                    const cantidadInicial = historialOrdenado[0].cantidadAnterior || producto.cantidad;
                    let formula = cantidadInicial.toString();
                    
                    // Agregar cada operación del historial
                    historialOrdenado.forEach(entry => {
                      const operacion = entry.operacion;
                      if (operacion > 0) {
                        formula += ` +${operacion}`;
                      } else if (operacion < 0) {
                        formula += ` ${operacion}`;
                      }
                    });
                    
                    // Agregar el resultado final
                    formula += ` = ${producto.cantidad}`;
                    
                    return formula;
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {producto.historial.length} cambio{producto.historial.length !== 1 ? 's' : ''} realizado{producto.historial.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
            
            {/* Información de stock */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Stock disponible:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(producto.productoId?.cantidadRestante || 0)}`}>
                {getStockIcon(producto.productoId?.cantidadRestante || 0)} {producto.productoId?.cantidadRestante || 0}
              </span>
            </div>
            
            {/* Advertencia de stock bajo */}
            {(producto.productoId?.cantidadRestante || 0) <= 5 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-orange-600">⚠️</span>
                <span className="text-xs text-orange-600">Stock bajo</span>
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-col items-end gap-2">
            {/* ✅ MOSTRAR CONTROLES SOLO SI NO HAY DEVOLUCIONES */}
            {!tieneDevolucion ? (
              <>
                {/* Controles de cantidad */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() => handleQuantityChange('decrease')}
                    disabled={isUpdating || producto.cantidad <= 1}
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reducir cantidad"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    onBlur={() => handleQuantityChange('set')}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuantityChange('set')}
                    className="w-16 text-center border-0 bg-transparent focus:ring-0 focus:outline-none"
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
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Advertencia de stock agotado */}
                {(producto.productoId?.cantidadRestante || 0) <= 0 && (
                  <div className="text-xs text-red-600 text-center">
                    Sin stock
                  </div>
                )}
              </>
            ) : (
              /* 🔒 MENSAJE CUANDO HAY DEVOLUCIONES */
              <div className="flex flex-col items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-700">
                  <span className="text-lg">🔒</span>
                  <span className="text-sm font-medium">Cantidad bloqueada</span>
                </div>
                <div className="text-xs text-orange-600 text-center">
                  Este producto tiene devoluciones.<br/>
                  No se puede modificar la cantidad.
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                  Cantidad fija: {producto.cantidad}
                </div>
              </div>
            )}

            {/* Botón eliminar */}
            <button
              onClick={handleRemove}
              disabled={isUpdating}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Eliminar producto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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
