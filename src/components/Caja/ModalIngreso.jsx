import React, { useState } from 'react';
import { useMovimiento } from '../../hooks/useMovimiento';
import styles from './Modal.module.css';

const ModalIngreso = ({ isOpen, onClose, onSuccess }) => {
  const { registrarMovimiento, loading, error, setError } = useMovimiento();
  
  const [formData, setFormData] = useState({
    tipo: 'ingreso',
    categoria: '',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodoPago: 'efectivo',
    numeroComprobante: '',
    observaciones: ''
  });

  // Estado para controlar la visibilidad del panel derecho
  const [showRightPanel, setShowRightPanel] = useState(false);

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
    
    // Mostrar panel derecho automáticamente al seleccionar categoría
    if (field === 'categoria' && value) {
      setShowRightPanel(true);
    }
    
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
      fecha: new Date().toISOString().split('T')[0],
      metodoPago: 'efectivo',
      numeroComprobante: '',
      observaciones: ''
    });
    setShowRightPanel(false); // Ocultar panel derecho al resetear
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-5xl lg:max-w-7xl mx-0 sm:mx-2 lg:mx-4 relative sm:max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100 animate-slideUp">
        
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={handleClose}
            className="absolute right-3 sm:right-4 lg:right-6 top-3 sm:top-4 lg:top-6 text-white/80 hover:text-white transition-all duration-200 hover:rotate-90 hover:scale-110"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="pr-8 sm:pr-12">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  Registrar Ingreso
                </h2>
                <p className="text-green-100 text-sm sm:text-base lg:text-lg font-medium">
                  Gestión de ingresos de caja
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 sm:py-4 rounded-md mb-4 sm:mb-6">
              <div className="flex items-center">
                <div className="ml-2">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            
            {/* Grid principal mejorado - Layout dinámico */}
            <div className={`grid transition-all duration-500 ease-in-out gap-6 sm:gap-8 ${
              showRightPanel ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
            }`}>
              
              {/* Columna Principal: Información básica + Botones */}
              <div className="space-y-6">
                {/* Información del Ingreso */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-xl">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        Información del Ingreso
                      </h3>
                    </div>
                    
                    {/* Botón para mostrar/ocultar panel derecho */}
                    <button
                      type="button"
                      onClick={() => setShowRightPanel(!showRightPanel)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    >
                      <span className="hidden sm:inline">
                        {showRightPanel ? 'Ocultar detalles' : 'Mostrar detalles'}
                      </span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${showRightPanel ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Categoría de Ingreso *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.categoria}
                          onChange={(e) => handleInputChange('categoria', e.target.value)}
                          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 hover:border-gray-300"
                          required
                        >
                          <option value="">🏷️ Seleccionar categoría de ingreso</option>
                          {categoriasIngreso.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Monto (S/.) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500 font-medium">S/</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formData.monto}
                          onChange={(e) => handleInputChange('monto', e.target.value)}
                          className="w-full rounded-xl border-2 border-gray-200 bg-white pl-12 pr-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 hover:border-gray-300"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Fecha del Ingreso *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => handleInputChange('fecha', e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 hover:border-gray-300"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Método de Pago
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {metodosPago.map(metodo => (
                          <button
                            key={metodo.value}
                            type="button"
                            onClick={() => handleInputChange('metodoPago', metodo.value)}
                            className={`relative p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                              formData.metodoPago === metodo.value
                                ? 'border-green-500 bg-green-50 text-green-700 ring-4 ring-green-500/20'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {formData.metodoPago === metodo.value && (
                              <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            {metodo.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones movidos aquí - lado izquierdo */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-6 py-4 rounded-2xl">
                  <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 shadow-sm"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancelar</span>
                      </div>
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={loading}
                      className={`w-full sm:w-auto px-8 py-3 text-sm font-bold text-white rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-lg transform hover:scale-105 ${
                        loading 
                          ? 'bg-green-400 cursor-not-allowed ring-green-200' 
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 ring-green-500/50'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Procesando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span>Registrar Ingreso</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              
              {/* Panel Derecho - Descripción y campos adicionales (condicional) */}
              {showRightPanel && (
                <div className={`space-y-6 ${styles.slideInLeft}`}>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-blue-100 p-2 rounded-xl">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        Descripción y Detalles
                      </h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Descripción *
                        </label>
                        <textarea
                          value={formData.descripcion}
                          onChange={(e) => handleInputChange('descripcion', e.target.value)}
                          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-gray-300 h-32 resize-y"
                          placeholder="Describe detalladamente el ingreso..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            N° Comprobante
                          </label>
                          <input
                            type="text"
                            value={formData.numeroComprobante}
                            onChange={(e) => handleInputChange('numeroComprobante', e.target.value)}
                            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-gray-300"
                            placeholder="Factura, recibo, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Observaciones
                          </label>
                          <input
                            type="text"
                            value={formData.observaciones}
                            onChange={(e) => handleInputChange('observaciones', e.target.value)}
                            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-gray-300"
                            placeholder="Notas adicionales..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mostrar información de la categoría seleccionada */}
                  {formData.categoria && (
                    <div className={`bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 shadow-sm ${styles.slideInUp}`}>
                      <h4 className="text-lg font-bold text-green-700 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {categoriasIngreso.find(cat => cat.value === formData.categoria)?.label}
                      </h4>
                      
                      {/* Información adicional por tipo de categoría */}
                      <div className="bg-white/60 p-4 rounded-xl border border-green-200">
                        {formData.categoria === 'venta_directa' && (
                          <p className="text-sm text-green-600 leading-relaxed">
                            💡 <strong>Ventas Directas:</strong> Registra aquí los ingresos por ventas realizadas directamente en el local o punto de venta. Incluye efectivo y pagos con tarjeta.
                          </p>
                        )}
                        {formData.categoria === 'cobro' && (
                          <p className="text-sm text-green-600 leading-relaxed">
                            💰 <strong>Cobros Pendientes:</strong> Para registrar cobros de facturas pendientes de clientes. Especifica el número de factura en el comprobante.
                          </p>
                        )}
                        {formData.categoria === 'devolucion_proveedor' && (
                          <p className="text-sm text-green-600 leading-relaxed">
                            📦 <strong>Devoluciones:</strong> Reembolsos por devoluciones de productos a proveedores. Incluye número de nota de crédito o documento de devolución.
                          </p>
                        )}
                        {formData.categoria === 'prestamo_recibido' && (
                          <p className="text-sm text-green-600 leading-relaxed">
                            🏦 <strong>Préstamos:</strong> Préstamos o financiamiento recibido. Especifica la entidad financiera y términos en las observaciones.
                          </p>
                        )}
                        {formData.categoria === 'ingreso_extra' && (
                          <p className="text-sm text-green-600 leading-relaxed">
                            ✨ <strong>Ingresos Extra:</strong> Otros ingresos no categorizados. Describe detalladamente la fuente del ingreso en la descripción.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalIngreso;
