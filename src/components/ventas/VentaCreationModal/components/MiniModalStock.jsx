import React, { useState } from 'react';
import { X, Plus, Package } from 'lucide-react';
import useInventarioProducto from '../../../../hooks/useInventarioProducto';

/**
 * MiniModalStock - Modal compacto para agregar stock rápido desde ventas
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Estado de apertura del modal
 * @param {Function} props.onClose - Callback para cerrar modal
 * @param {Object} props.producto - Producto seleccionado (pre-llenado)
 * @param {Function} props.onStockAdded - Callback después de agregar stock exitosamente
 */
const MiniModalStock = ({ isOpen, onClose, producto, onStockAdded }) => {
  const inventarioHook = useInventarioProducto();
  
  // Estado del formulario simplificado
  const [formData, setFormData] = useState({
    cantidad: '',
    precio: '',
    lote: ''
  });

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Maneja el cambio de inputs
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      inventarioHook.clearError();

      // Validar campos requeridos
      if (!formData.cantidad || !formData.precio) {
        throw new Error('Cantidad y precio son obligatorios');
      }

      // Validar números positivos
      if (Number(formData.cantidad) <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      if (Number(formData.precio) <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      // Preparar datos para el endpoint
      const entradaData = {
        productoId: producto._id,
        cantidad: Number(formData.cantidad),
        precio: Number(formData.precio),
        lote: formData.lote.trim() || `LOTE-${Date.now()}`, // Auto-generar lote si está vacío
        observaciones: `Entrada rápida desde ventas - ${new Date().toLocaleString()}`,
        proveedor: 'Entrada rápida',
        fechaVencimiento: null
      };

      // Crear entrada usando el hook existente
      const response = await inventarioHook.createEntry(entradaData);
      
      // Notificar éxito
      if (onStockAdded) {
        onStockAdded(response, formData.cantidad);
      }

      // Limpiar formulario y cerrar
      setFormData({ cantidad: '', precio: '', lote: '' });
      onClose();
      
    } catch (err) {
      console.error('Error al agregar stock:', err);
      // El error ya está manejado en el hook
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Cerrar modal y limpiar formulario
   */
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ cantidad: '', precio: '', lote: '' });
      inventarioHook.clearError();
      onClose();
    }
  };

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package size={20} />
              <h3 className="text-lg font-bold">Agregar Stock Rápido</h3>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Información del producto */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-1">{producto.nombre}</h4>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>Stock actual: <span className="font-medium">{producto.cantidadRestante || producto.stock || 0}</span></span>
              <span>•</span>
              <span>Precio: <span className="font-medium">S/ {(producto.precio || 0).toFixed(2)}</span></span>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Cantidad */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cantidad a Agregar *
              </label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => handleInputChange('cantidad', e.target.value)}
                min="1"
                step="1"
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors disabled:bg-gray-100"
                placeholder="Ej: 50"
                autoFocus
              />
            </div>

            {/* Precio Unitario */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio Unitario *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                <input
                  type="number"
                  value={formData.precio}
                  onChange={(e) => handleInputChange('precio', e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors disabled:bg-gray-100"
                  placeholder="15.50"
                />
              </div>
            </div>

            {/* Lote (Opcional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lote (Opcional)
              </label>
              <input
                type="text"
                value={formData.lote}
                onChange={(e) => handleInputChange('lote', e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors disabled:bg-gray-100"
                placeholder="Ej: LOTE-001 (auto si está vacío)"
              />
            </div>

            {/* Resumen */}
            {formData.cantidad && formData.precio && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">Resumen</h5>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Cantidad: <span className="font-medium">{formData.cantidad} unidades</span></p>
                  <p>Precio: <span className="font-medium">S/ {Number(formData.precio).toFixed(2)} c/u</span></p>
                  <p className="font-bold text-base">
                    Costo total: S/ {(Number(formData.cantidad) * Number(formData.precio)).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {inventarioHook.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <strong>Error:</strong> {inventarioHook.error}
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.cantidad || !formData.precio}
                className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Agregando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Agregar Stock
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MiniModalStock;