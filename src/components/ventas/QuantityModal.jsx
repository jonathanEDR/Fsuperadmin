import React, { useState } from 'react';
import { Plus, Minus, X, History, Loader2 } from 'lucide-react';
import { useCantidadManagement } from '../../hooks/useCantidadManagement';

const QuantityModal = ({ 
  isOpen, 
  onClose, 
  producto, 
  onConfirm,
  isUpdating = false,
  ventaId 
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState('');

  // Hook unificado para gestión de cantidades
  const { 
    actualizarCantidadManual, 
    loading,
    error: cantidadError,
    clearError 
  } = useCantidadManagement();

  const stockDisponible = producto?.productoId?.cantidadRestante || 0;

  const handleOperation = async (operation) => {
    if (cantidad <= 0) return;
    
    setError('');
    clearError();
    
    try {
      // ✅ VALIDACIÓN MEJORADA DE CANTIDAD
      const cantidadNum = Number(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        throw new Error('La cantidad debe ser un número válido mayor que 0');
      }
      
      // Calcular la nueva cantidad final
      let nuevaCantidad;
      let motivoOperacion;
      
      if (operation === 'add') {
        // ✅ VALIDAR STOCK DISPONIBLE ANTES DE AGREGAR
        if (cantidadNum > stockDisponible) {
          throw new Error(`Stock insuficiente. Disponible: ${stockDisponible}, solicitado: ${cantidadNum}`);
        }
        
        if (stockDisponible <= 0) {
          throw new Error('No hay stock disponible para este producto');
        }
        
        nuevaCantidad = producto.cantidad + cantidadNum;
        motivoOperacion = `Agregar ${cantidadNum} unidades desde modal`;
      } else {
        // ✅ VALIDAR QUE NO SE REDUZCA MÁS DE LO DISPONIBLE
        if (cantidadNum > producto.cantidad) {
          throw new Error(`No se puede reducir más de la cantidad actual (${producto.cantidad})`);
        }
        
        nuevaCantidad = producto.cantidad - cantidadNum;
        motivoOperacion = `Quitar ${cantidadNum} unidades desde modal`;
      }
      
      // Verificar que la nueva cantidad no sea negativa
      if (nuevaCantidad < 0) {
        throw new Error('La cantidad no puede ser negativa');
      }
      
      console.log('🔍 QuantityModal - Parámetros enviados:', {
        ventaId,
        productoId: producto.productoId._id,
        nuevaCantidad,
        operation,
        cantidad: cantidadNum,
        producto_cantidad: producto.cantidad
      });
      
      // Usar el servicio unificado
      const resultado = await actualizarCantidadManual(
        ventaId,
        producto.productoId._id,
        nuevaCantidad,
        motivoOperacion
      );
      
      console.log('✅ QuantityModal - Respuesta del servidor:', resultado);
      
      if (onConfirm) {
        // Pasar la estructura completa de la respuesta
        onConfirm(resultado);
      }
      
      handleClose();
    } catch (err) {
      console.error('❌ QuantityModal - Error al actualizar cantidad:', err);
      setError(err.message);
    }
  };

  const renderHistorialFormula = () => {
    if (!producto.historial || producto.historial.length === 0) {
      return producto.cantidad.toString();
    }

    const historialOrdenado = [...producto.historial].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    if (historialOrdenado.length === 0) {
      return producto.cantidad.toString();
    }

    let formula = historialOrdenado[0].cantidadAnterior.toString();
    
    historialOrdenado.forEach(entry => {
      const operacion = entry.operacion > 0 ? `+${entry.operacion}` : entry.operacion.toString();
      formula += ` ${operacion}`;
    });
    
    formula += ` = ${producto.cantidad}`;
    return formula;
  };

  const handleClose = () => {
    setCantidad(1);
    setError('');
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Modificar Cantidad
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información del producto */}
        <div className="mb-4 bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            {producto.productoId?.nombre}
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Cantidad actual: <span className="font-medium">{producto.cantidad}</span></p>
            <p>Stock disponible: <span className="font-medium">{stockDisponible}</span></p>
            <p>Precio unitario: <span className="font-medium">S/ {producto.precioUnitario?.toFixed(2)}</span></p>
          </div>
        </div>

        {/* Historial actual */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Historial de Cambios
          </label>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-sm text-blue-800 font-mono">
              {renderHistorialFormula()}
            </div>
          </div>
        </div>

        {/* Input de cantidad con validación */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad a agregar/quitar
          </label>
          <input
            type="number"
            value={cantidad}
            onChange={(e) => {
              const value = Math.max(1, parseInt(e.target.value) || 1);
              // ✅ LIMITAR LA CANTIDAD AL STOCK DISPONIBLE PARA AGREGAR
              const maxValue = Math.max(stockDisponible, producto.cantidad);
              setCantidad(Math.min(value, maxValue));
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max={Math.max(stockDisponible, producto.cantidad)}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            ✅ Stock disponible: {stockDisponible} | 📦 Cantidad actual: {producto.cantidad}
          </p>
        </div>

        {/* Error */}
        {(error || cantidadError) && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">{error || cantidadError}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleOperation('subtract')}
            disabled={loading || cantidad >= producto.cantidad || producto.cantidad <= 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl disabled:opacity-50"
            title={producto.cantidad <= 0 ? "No se puede reducir más" : `Quitar ${cantidad} unidades`}
          >
            <Minus className="w-4 h-4" />
            Quitar {cantidad}
          </button>
          <button
            onClick={() => handleOperation('add')}
            disabled={loading || cantidad > stockDisponible || stockDisponible <= 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl disabled:opacity-50"
            title={stockDisponible <= 0 ? "Sin stock disponible" : `Agregar ${cantidad} unidades`}
          >
            <Plus className="w-4 h-4" />
            Agregar {cantidad}
          </button>
        </div>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            Actualizando...
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantityModal;
