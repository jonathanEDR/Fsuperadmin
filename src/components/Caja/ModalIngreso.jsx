import React, { useState } from 'react';
import { useMovimiento } from '../../hooks/useMovimiento';
import { getLocalDateTimeString } from '../../utils/fechaHoraUtils';

const ModalIngreso = ({ isOpen, onClose, onSuccess }) => {
  const { registrarMovimiento, loading, error, setError } = useMovimiento();
  
  const [formData, setFormData] = useState({
    tipo: 'ingreso',
    categoria: '',
    descripcion: '',
    monto: '',
    fecha: getLocalDateTimeString(false), // Incluye hora actual
    metodoPago: 'efectivo',
    numeroComprobante: '',
    observaciones: ''
  });

  const categoriasIngreso = [
    { value: 'venta_directa', label: 'Venta Directa' },
    { value: 'cobro', label: 'Cobro de Cliente' },
    { value: 'devolucion_proveedor', label: 'Devolución de Proveedor' },
    { value: 'prestamo_recibido', label: 'Préstamo Recibido' },
    { value: 'ingreso_extra', label: 'Ingreso Extra' }
  ];

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'deposito', label: 'Depósito' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'tarjeta', label: 'Tarjeta' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await registrarMovimiento(formData, () => {
        onSuccess();
        resetForm();
        onClose();
      });
    } catch (err) {
      // El error ya se maneja en el hook
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'ingreso',
      categoria: '',
      descripcion: '',
      monto: '',
      fecha: getLocalDateTimeString(false), // Incluye hora actual
      metodoPago: 'efectivo',
      numeroComprobante: '',
      observaciones: ''
    });
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-h-[95vh] sm:max-w-2xl lg:max-w-4xl relative overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <button
            onClick={handleClose}
            className="absolute right-2 sm:right-4 top-2 sm:top-4 text-white/80 hover:text-white transition-all duration-200 hover:rotate-90 p-1"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 pr-8">
            <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                Registrar Ingreso
              </h2>
              <p className="text-green-100 text-xs sm:text-sm hidden xs:block">
                Gestión de ingresos de caja
              </p>
            </div>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            {/* Sección: Información Principal */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="bg-green-100 p-1 rounded">📋</span>
                Información del Ingreso
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Categoría */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => handleInputChange('categoria', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categoriasIngreso.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Monto (S/.) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.monto}
                      onChange={(e) => handleInputChange('monto', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Fecha y Hora */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Fecha y Hora *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    required
                  />
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
                    placeholder="Describe el ingreso..."
                    rows={2}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Método de Pago */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 p-1 rounded">💳</span>
                Método de Pago
              </h3>
              
              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-7 gap-2">
                {metodosPago.map(metodo => (
                  <button
                    key={metodo.value}
                    type="button"
                    onClick={() => handleInputChange('metodoPago', metodo.value)}
                    className={`relative p-2 sm:p-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                      formData.metodoPago === metodo.value
                        ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/30'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {formData.metodoPago === metodo.value && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">✓</span>
                    )}
                    {metodo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sección: Detalles Adicionales */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="bg-purple-100 p-1 rounded">📝</span>
                Detalles Adicionales
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    N° Comprobante
                  </label>
                  <input
                    type="text"
                    value={formData.numeroComprobante}
                    onChange={(e) => handleInputChange('numeroComprobante', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    placeholder="Factura, recibo..."
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            </div>

            {/* Info de categoría seleccionada */}
            {formData.categoria && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-lg">💡</span>
                  <div className="text-xs sm:text-sm text-green-700">
                    <strong>{categoriasIngreso.find(cat => cat.value === formData.categoria)?.label}:</strong>
                    {formData.categoria === 'venta_directa' && ' Ingresos por ventas realizadas en el local.'}
                    {formData.categoria === 'cobro' && ' Cobros de facturas pendientes de clientes.'}
                    {formData.categoria === 'devolucion_proveedor' && ' Reembolsos por devoluciones a proveedores.'}
                    {formData.categoria === 'prestamo_recibido' && ' Préstamos o financiamiento recibido.'}
                    {formData.categoria === 'ingreso_extra' && ' Otros ingresos no categorizados.'}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer con botones - Fijo */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex flex-col xs:flex-row gap-2 xs:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="w-full xs:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 xs:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full xs:w-auto px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all order-1 xs:order-2 ${
                loading 
                  ? 'bg-green-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>💰</span>
                  Registrar Ingreso
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalIngreso;
