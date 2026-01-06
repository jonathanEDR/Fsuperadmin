import React, { useState, useEffect } from 'react';
import { useMovimiento } from '../../hooks/useMovimiento';
import useCatalogoGastosModal from './hooks/useCatalogoGastosModal';
import CatalogoGastoSelector from './components/CatalogoGastoSelector';
import { getLocalDateString } from '../../utils/dateUtils';
import styles from './Modal.module.css';

/**
 * Modal de Egreso - ACTUALIZADO CON CATÁLOGO DE GASTOS
 *
 * Integra el catálogo de gastos para permitir seleccionar items predefinidos
 * o ingresar manualmente si se prefiere.
 */
const ModalEgreso = ({ isOpen, onClose, onSuccess }) => {
  const { registrarMovimiento, loading, error, setError } = useMovimiento();
  const {
    loading: loadingCatalogo,
    getCatalogoPorCategoria
  } = useCatalogoGastosModal();

  const [selectedSection, setSelectedSection] = useState('');
  const [catalogoItemSeleccionado, setCatalogoItemSeleccionado] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'egreso',
    categoria: '',
    descripcion: '',
    monto: '',
    cantidad: '1',
    unidadMedida: 'unidad',
    fecha: getLocalDateString(),
    metodoPago: 'efectivo',
    proveedor: '',
    numeroComprobante: '',
    observaciones: '',
    catalogoGastoId: null
  });

  // Items del catálogo filtrados por sección
  const itemsCatalogo = getCatalogoPorCategoria(selectedSection);

  // Secciones disponibles
  const secciones = [
    { value: 'finanzas', label: 'Finanzas', icon: '💰', color: 'blue' },
    { value: 'produccion', label: 'Producción', icon: '⚙️', color: 'green' },
    { value: 'ventas', label: 'Ventas', icon: '📈', color: 'yellow' },
    { value: 'admin', label: 'Administración', icon: '🏢', color: 'purple' }
  ];

  // Métodos de pago
  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'deposito', label: 'Depósito' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'tarjeta', label: 'Tarjeta' }
  ];

  // Mapeo de secciones a categorías para el backend
  const mapeoSeccionCategoria = {
    'finanzas': 'Finanzas',
    'produccion': 'Producción',
    'ventas': 'Ventas',
    'admin': 'Administración'
  };

  // Resetear cuando cambia la sección
  useEffect(() => {
    if (selectedSection) {
      setCatalogoItemSeleccionado(null);
      setFormData(prev => ({
        ...prev,
        descripcion: '',
        monto: '',
        cantidad: '1',
        unidadMedida: 'unidad',
        catalogoGastoId: null,
        categoria: ''
      }));
    }
  }, [selectedSection]);

  // Manejar selección de item del catálogo
  const handleSelectCatalogoItem = (item) => {
    if (!item) {
      setCatalogoItemSeleccionado(null);
      setFormData(prev => ({
        ...prev,
        descripcion: '',
        monto: '',
        cantidad: '1',
        unidadMedida: 'unidad',
        catalogoGastoId: null,
        categoria: ''
      }));
      return;
    }

    setCatalogoItemSeleccionado(item);
    setFormData(prev => ({
      ...prev,
      descripcion: item.nombre,
      monto: item.precioReferencia ? item.precioReferencia.toString() : '',
      unidadMedida: item.unidadMedida || 'unidad',
      catalogoGastoId: item._id,
      categoria: `${item.tipoDeGasto.toLowerCase().replace(' ', '_')}_${selectedSection}`
    }));
    setShowRightPanel(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validaciones
      if (!selectedSection) {
        setError('Debe seleccionar una sección');
        return;
      }

      if (!formData.descripcion || formData.descripcion.trim().length < 3) {
        setError('La descripción debe tener al menos 3 caracteres');
        return;
      }

      if (!formData.monto || parseFloat(formData.monto) <= 0) {
        setError('El monto debe ser mayor a 0');
        return;
      }

      // Calcular monto total
      const cantidad = parseFloat(formData.cantidad) || 1;
      const costoUnidad = parseFloat(formData.monto) || 0;
      const montoTotal = costoUnidad * cantidad;

      // Preparar datos para envío
      const dataToSend = {
        ...formData,
        monto: montoTotal,
        costoUnidad: costoUnidad,
        cantidad: cantidad,
        // Categoría para el módulo de caja
        categoria: formData.categoria || `otros_${selectedSection}`,
        // Datos adicionales para integración con gastos
        seccion: mapeoSeccionCategoria[selectedSection],
        catalogoGastoId: formData.catalogoGastoId
      };

      await registrarMovimiento(dataToSend, () => {
        onSuccess();
        resetForm();
        onClose();
      });
    } catch (err) {
      console.error('Error en handleSubmit:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'egreso',
      categoria: '',
      descripcion: '',
      monto: '',
      cantidad: '1',
      unidadMedida: 'unidad',
      fecha: getLocalDateString(),
      metodoPago: 'efectivo',
      proveedor: '',
      numeroComprobante: '',
      observaciones: '',
      catalogoGastoId: null
    });
    setSelectedSection('');
    setCatalogoItemSeleccionado(null);
    setShowRightPanel(false);
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Calcular monto total
  const montoTotal = (parseFloat(formData.monto) || 0) * (parseFloat(formData.cantidad) || 1);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2 z-50 animate-fadeIn">
      <div className="bg-white rounded-lg sm:rounded-xl w-full h-full sm:h-auto sm:max-w-4xl lg:max-w-6xl mx-0 sm:mx-2 lg:mx-4 relative sm:max-h-[98vh] overflow-hidden shadow-2xl border border-gray-100 animate-slideUp">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <button
            onClick={handleClose}
            className="absolute right-2 sm:right-3 lg:right-4 top-2 sm:top-3 lg:top-4 text-white/80 hover:text-white transition-all duration-200 hover:rotate-90 hover:scale-110"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="pr-6 sm:pr-8">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  Registrar Egreso
                </h2>
                <p className="text-red-100 text-xs sm:text-sm lg:text-base font-medium">
                  Gestión de egresos de caja
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-2 sm:px-3 lg:px-4 py-3 sm:py-4 overflow-y-auto max-h-[calc(100vh-120px)] sm:max-h-[calc(98vh-100px)]">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-3 sm:mb-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de Secciones */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Sección *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {secciones.map(seccion => (
                  <button
                    key={seccion.value}
                    type="button"
                    onClick={() => setSelectedSection(seccion.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                      selectedSection === seccion.value
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{seccion.icon}</span>
                    <span className={`text-sm font-medium ${
                      selectedSection === seccion.value ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {seccion.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid principal */}
            <div className={`grid transition-all duration-500 ease-in-out gap-4 ${
              showRightPanel ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
            }`}>

              {/* Columna Principal */}
              <div className="space-y-4">
                {/* Catálogo de Gastos */}
                {selectedSection && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <CatalogoGastoSelector
                      items={itemsCatalogo}
                      selectedId={catalogoItemSeleccionado?._id}
                      onSelect={handleSelectCatalogoItem}
                      loading={loadingCatalogo}
                      seccionSeleccionada={selectedSection}
                    />
                  </div>
                )}

                {/* Formulario de Monto y Detalles */}
                {(selectedSection && catalogoItemSeleccionado) && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="bg-red-100 p-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">
                        Detalles del Egreso
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Descripción (si viene del catálogo, mostrar como readonly) */}
                      {catalogoItemSeleccionado && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Descripción
                          </label>
                          <div className="w-full rounded-lg border-2 border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700">
                            {formData.descripcion}
                            <span className="ml-2 text-xs text-gray-500">(del catálogo)</span>
                          </div>
                        </div>
                      )}

                      {/* Precio Unitario */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Precio Unitario (S/.) *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-medium text-sm">S/</span>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.monto}
                            onChange={(e) => handleInputChange('monto', e.target.value)}
                            className="w-full rounded-lg border-2 border-gray-200 bg-white pl-10 pr-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      {/* Cantidad */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Cantidad ({formData.unidadMedida})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formData.cantidad}
                          onChange={(e) => handleInputChange('cantidad', e.target.value)}
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          placeholder="1"
                        />
                      </div>

                      {/* Total calculado */}
                      <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-700">Monto Total:</span>
                          <span className="text-xl font-bold text-red-700">
                            S/. {montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Fecha */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Fecha *
                        </label>
                        <input
                          type="date"
                          value={formData.fecha}
                          onChange={(e) => handleInputChange('fecha', e.target.value)}
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          required
                        />
                      </div>

                      {/* Método de Pago */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Método de Pago
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {metodosPago.map(metodo => (
                            <button
                              key={metodo.value}
                              type="button"
                              onClick={() => handleInputChange('metodoPago', metodo.value)}
                              className={`relative p-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 ${
                                formData.metodoPago === metodo.value
                                  ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500/20'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {formData.metodoPago === metodo.value && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
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
                )}

                {/* Botones de acción */}
                {selectedSection && catalogoItemSeleccionado && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-4 py-3 rounded-xl">
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancelar</span>
                        </div>
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full sm:w-auto px-6 py-2 text-xs font-bold text-white rounded-lg transition-all duration-200 shadow-lg transform hover:scale-105 ${
                          loading
                            ? 'bg-red-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-1">
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Procesando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <span>💸 Registrar Egreso</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Panel Derecho - Detalles Adicionales */}
              {showRightPanel && (
                <div className={`space-y-4 ${styles.slideInLeft}`}>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">
                          Detalles Adicionales
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRightPanel(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Proveedor
                          </label>
                          <input
                            type="text"
                            value={formData.proveedor}
                            onChange={(e) => handleInputChange('proveedor', e.target.value)}
                            className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Nombre del proveedor"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            N° Comprobante
                          </label>
                          <input
                            type="text"
                            value={formData.numeroComprobante}
                            onChange={(e) => handleInputChange('numeroComprobante', e.target.value)}
                            className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Factura, recibo, etc."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Observaciones
                        </label>
                        <textarea
                          value={formData.observaciones}
                          onChange={(e) => handleInputChange('observaciones', e.target.value)}
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-20 resize-none"
                          placeholder="Notas adicionales..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info del item seleccionado del catálogo */}
                  {catalogoItemSeleccionado && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
                      <h4 className="text-sm font-bold text-green-700 mb-3 flex items-center">
                        <span className="mr-2">📋</span>
                        Item del Catálogo
                      </h4>
                      <div className="bg-white/60 p-3 rounded-lg border border-green-200 space-y-2">
                        <p className="text-sm text-green-800">
                          <strong>Nombre:</strong> {catalogoItemSeleccionado.nombre}
                        </p>
                        <p className="text-sm text-green-800">
                          <strong>Tipo:</strong> {catalogoItemSeleccionado.tipoDeGasto}
                        </p>
                        <p className="text-sm text-green-800">
                          <strong>Unidad:</strong> {catalogoItemSeleccionado.unidadMedida}
                        </p>
                        {catalogoItemSeleccionado.descripcion && (
                          <p className="text-xs text-green-600 mt-2">
                            {catalogoItemSeleccionado.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Nota informativa */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                    <div className="flex items-start space-x-2">
                      <div className="bg-amber-100 p-1.5 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-800 mb-1">
                          💡 Tip
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Los gastos registrados desde caja se integran automáticamente con el módulo de gastos para un mejor control financiero.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalEgreso;
