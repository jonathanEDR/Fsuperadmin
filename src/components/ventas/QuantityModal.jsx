import React, { useState } from 'react';
import { Plus, Minus, X, History } from 'lucide-react';
import { updateProductQuantityInVenta } from '../../services/ventas';

const QuantityModal = ({ 
  isOpen, 
  onClose, 
  producto, 
  onConfirm,
  isUpdating = false,
  ventaId 
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stockDisponible = producto?.productoId?.cantidadRestante || 0;

  const handleOperation = async (operation) => {
    if (cantidad <= 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Validar que cantidad sea un número válido
      const cantidadNum = Number(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        throw new Error('La cantidad debe ser un número válido mayor que 0');
      }
      
      // Calcular la nueva cantidad final
      let nuevaCantidad;
      if (operation === 'add') {
        nuevaCantidad = producto.cantidad + cantidadNum;
      } else {
        nuevaCantidad = producto.cantidad - cantidadNum;
      }
      
      // Verificar que la nueva cantidad no sea negativa
      if (nuevaCantidad < 0) {
        throw new Error('La cantidad no puede ser negativa');
      }
      
      console.log('🔍 Debug - Parámetros enviados:', {
        ventaId,
        productoId: producto.productoId._id,
        nuevaCantidad,
        operation,
        cantidad: cantidadNum,
        producto_cantidad: producto.cantidad
      });
      
      const response = await updateProductQuantityInVenta(
        ventaId,
        producto.productoId._id,
        nuevaCantidad
      );
      
      console.log('✅ Respuesta del servidor:', response);
      
      if (onConfirm) {
        onConfirm(response.venta);
      }
      
      handleClose();
    } catch (err) {
      console.error('❌ Error al actualizar cantidad:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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
        <div className="mb-4 bg-gray-50 rounded-lg p-4">
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800 font-mono">
              {renderHistorialFormula()}
            </div>
          </div>
        </div>

        {/* Input de cantidad */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad a agregar/quitar
          </label>
          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleOperation('subtract')}
            disabled={loading || cantidad >= producto.cantidad}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Minus className="w-4 h-4" />
            Quitar {cantidad}
          </button>
          <button
            onClick={() => handleOperation('add')}
            disabled={loading || cantidad > stockDisponible}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Agregar {cantidad}
          </button>
        </div>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            Actualizando...
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantityModal;
