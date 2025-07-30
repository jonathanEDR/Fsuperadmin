import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useMovimiento } from '../../hooks/useMovimiento';
import { usePersonalPayment } from '../../hooks/usePersonalPayment';
import api from '../../services/api';
import useGestionPersonalData from '../personal/useGestionPersonalData';
import styles from './Modal.module.css';

const ModalEgreso = ({ isOpen, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const { registrarMovimiento, loading, error, setError } = useMovimiento();
  const {
    registrarPagoPersonal,
    loading: personalLoading,
    error: personalError,
    setError: setPersonalError
  } = usePersonalPayment();
  // Usar el hook de gestión personal para obtener colaboradores, registros y pagos
  const { colaboradores, registros, pagos } = useGestionPersonalData();
  const [montoPendiente, setMontoPendiente] = useState(0);
  const [selectedSection, setSelectedSection] = useState('');
  // Estado para controlar la visibilidad del panel derecho
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo: 'egreso',
    categoria: '',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodoPago: 'efectivo',
    colaboradorUserId: '',
    colaboradorNombre: '',
    proveedor: '',
    numeroComprobante: '',
    observaciones: ''
  });// Cargar datos cuando se abre el modal
  useEffect(() => {
    // Ya no es necesario cargar colaboradores aquí
  }, [isOpen]);

  // Calcular monto pendiente por colaborador usando lógica local (igual que PagosRealizados)
  const calcularMontoPendienteColaborador = (colaboradorId) => {
    if (!colaboradorId) return 0;
    const registrosColaborador = (registros || []).filter(r => r.colaboradorUserId === colaboradorId);
    const pagosColaborador = (pagos || []).filter(p => p.colaboradorUserId === colaboradorId);
    const totalGenerado = registrosColaborador.reduce((total, registro) => {
      const pagodiario = registro.pagodiario || 0;
      const faltante = registro.faltante || 0;
      const adelanto = registro.adelanto || 0;
      return total + (pagodiario - faltante - adelanto);
    }, 0);
    const totalPagado = pagosColaborador.reduce((total, pago) => total + pago.montoTotal, 0);
    return totalGenerado - totalPagado;
  };  const categoriasEgreso = [
    // Finanzas
    { value: 'pago_personal_finanzas', label: 'Pago Personal', section: 'finanzas', icon: '👥', color: 'blue' },
    { value: 'materia_prima_finanzas', label: 'Materia Prima', section: 'finanzas', icon: '📦', color: 'blue' },
    { value: 'otros_finanzas', label: 'Otros', section: 'finanzas', icon: '📄', color: 'blue' },
    
    // Producción
    { value: 'pago_personal_produccion', label: 'Pago Personal', section: 'produccion', icon: '👥', color: 'green' },
    { value: 'materia_prima_produccion', label: 'Materia Prima', section: 'produccion', icon: '📦', color: 'green' },
    { value: 'otros_produccion', label: 'Otros', section: 'produccion', icon: '🔧', color: 'green' },
    
    // Ventas
    { value: 'pago_personal_ventas', label: 'Pago Personal', section: 'ventas', icon: '👥', color: 'yellow' },
    { value: 'materia_prima_ventas', label: 'Materia Prima', section: 'ventas', icon: '📦', color: 'yellow' },
    { value: 'otros_ventas', label: 'Otros', section: 'ventas', icon: '📊', color: 'yellow' },
    
    // Administración
    { value: 'pago_personal_admin', label: 'Pago Personal', section: 'administrativo', icon: '👥', color: 'purple' },
    { value: 'materia_prima_admin', label: 'Materia Prima', section: 'administrativo', icon: '📦', color: 'purple' },
    { value: 'otros_admin', label: 'Otros', section: 'administrativo', icon: '📋', color: 'purple' }
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

  // Funciones para agrupar categorías
  const getSecciones = () => {
    const secciones = [
      { value: 'finanzas', label: '💰 Finanzas', color: 'blue' },
      { value: 'produccion', label: '⚙️ Producción', color: 'green' },
      { value: 'ventas', label: '📈 Ventas', color: 'yellow' },
      { value: 'administrativo', label: '🏢 Administración', color: 'purple' }
    ];
    return secciones;
  };

  const getCategoriasPorSeccion = (seccion) => {
    return categoriasEgreso.filter(cat => cat.section === seccion);
  };

  const getColorClass = (color) => {
    const colorClasses = {
      blue: 'border-blue-200 bg-blue-50 text-blue-700',
      green: 'border-green-200 bg-green-50 text-green-700',
      yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
      purple: 'border-purple-200 bg-purple-50 text-purple-700'
    };
    return colorClasses[color] || colorClasses.blue;  };
  const handleInputChange = async (field, value) => {
    // Manejar cambio de sección
    if (field === 'seccion') {
      setSelectedSection(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mostrar panel derecho automáticamente al seleccionar categoría
    if (field === 'categoria' && value) {
      setShowRightPanel(true);
    }
    
    // Verificar si es pago personal (cualquier variante) - Usar la categoría actual, no el valor nuevo
    const esPagoPersonal = formData.categoria && formData.categoria.includes('pago_personal');
    const esOtrosGasto = value && value.includes('otros');
    
    // Si se selecciona un colaborador y YA la categoría es pago personal, calcular monto automáticamente
    if (field === 'colaboradorUserId' && value && esPagoPersonal) {
      const colaboradorSeleccionado = colaboradores.find(c => c.colaboradorUserId === value);
      if (colaboradorSeleccionado) {
        const montoPendienteCalculado = calcularMontoPendienteColaborador(value);
        setMontoPendiente(montoPendienteCalculado);
        
        // Auto-completar descripción para pago personal
        const descripcionAuto = `Pago a colaborador ${colaboradorSeleccionado.nombre} - ${colaboradorSeleccionado.departamento}`;
        setFormData(prev => ({
          ...prev,
          colaboradorNombre: colaboradorSeleccionado.nombre,
          descripcion: descripcionAuto,
          monto: montoPendienteCalculado > 0 ? montoPendienteCalculado.toFixed(2) : '0'
        }));
      }
    }
    
    // Si se cambia la categoría a pago_personal y ya hay colaborador seleccionado
    if (field === 'categoria' && value && value.includes('pago_personal') && formData.colaboradorUserId) {
      const colaboradorSeleccionado = colaboradores.find(c => c.colaboradorUserId === formData.colaboradorUserId);
      if (colaboradorSeleccionado) {
        const montoPendienteCalculado = calcularMontoPendienteColaborador(formData.colaboradorUserId);
        setMontoPendiente(montoPendienteCalculado);
        
        const descripcionAuto = `Pago a colaborador ${colaboradorSeleccionado.nombre} - ${colaboradorSeleccionado.departamento}`;
        setFormData(prev => ({
          ...prev,
          descripcion: descripcionAuto,
          monto: montoPendienteCalculado > 0 ? montoPendienteCalculado.toFixed(2) : '0'
        }));
      }
    }
    
    // Si se cambia de pago_personal a otra categoría, limpiar monto y descripción
    const esPagoPersonalActual = formData.categoria && formData.categoria.includes('pago_personal');
    const esPagoPersonalNuevo = value && value.includes('pago_personal');
    const esOtrosActual = formData.categoria && formData.categoria.includes('otros');
    const esOtrosNuevo = value && value.includes('otros');
    
    if (field === 'categoria' && esPagoPersonalActual && !esPagoPersonalNuevo) {
      setFormData(prev => ({
        ...prev,
        colaboradorUserId: '',
        colaboradorNombre: '',
        descripcion: '',
        monto: ''
      }));
      setMontoPendiente(0);
    }
    
    // Si se cambia de "otros" a otra categoría, limpiar descripción
    if (field === 'categoria' && esOtrosActual && !esOtrosNuevo && !esPagoPersonalNuevo) {
      setFormData(prev => ({
        ...prev,
        descripcion: ''
      }));
    }
    
    // Validar monto para pago personal - usar categoría actual
    if (field === 'monto' && formData.categoria && formData.categoria.includes('pago_personal')) {
      const montoNumerico = parseFloat(value);
      if (montoNumerico > montoPendiente) {
        setError(`El monto no puede ser mayor al pendiente (S/. ${montoPendiente.toFixed(2)})`);
        return;
      }
    }
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (error && !error.includes('monto no puede ser mayor')) {
      setError(null);
    }
    if (personalError) {
      setPersonalError(null);
    }
  };

  const isPagoPersonal = formData.categoria && formData.categoria.includes('pago_personal');
  const isOtrosGasto = formData.categoria && formData.categoria.includes('otros');

  // Mapear secciones del modal con departamentos del backend
  const mapSeccionToDepartamento = (seccion) => {
    const mapeo = {
      'finanzas': 'Financiero',
      'produccion': 'Producción',
      'ventas': 'Ventas',
      'administrativo': 'Administración'
    };
    return mapeo[seccion] || null;
  };

  // Filtrar colaboradores por departamento según la sección seleccionada
  const getColaboradoresFiltrados = () => {
    if (!isPagoPersonal || !selectedSection) {
      return [];
    }
    const departamentoRequerido = mapSeccionToDepartamento(selectedSection);
    if (!departamentoRequerido) {
      return [];
    }
    // Normalizar para comparar sin tildes y sin importar mayúsculas
    const normalize = str => (str || '').toLowerCase().normalize('NFD').replace(/[^a-z\s]/g, '');
    // Filtrar SOLO por departamento (sin fallback)
    return colaboradores.filter(colaborador => 
      normalize(colaborador.departamento) === normalize(departamentoRequerido)
    );
  };
    const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validación específica para "Otros" - requiere descripción detallada
      if (isOtrosGasto && (!formData.descripcion || formData.descripcion.trim().length < 10)) {
        setError('Para "Otros gastos" debe especificar una descripción detallada (mínimo 10 caracteres)');
        return;
      }
      
      // Validaciones adicionales para pago personal
      if (isPagoPersonal) {
        const montoNumerico = parseFloat(formData.monto);
        
        if (montoNumerico <= 0) {
          setError('El monto debe ser mayor a 0');
          return;
        }
        
        if (montoNumerico > montoPendiente) {
          setError(`El monto no puede ser mayor al pendiente (S/. ${montoPendiente.toFixed(2)})`);
          return;
        }
        
        if (!formData.colaboradorUserId) {
          setError('Debe seleccionar un colaborador');
          return;
        }
          // Usar el hook específico para pagos de personal
        const pagoDataConSeccion = {
          ...formData,
          seccion: selectedSection
        };
        await registrarPagoPersonal(pagoDataConSeccion, () => {
          onSuccess();
          resetForm();
          onClose();
        });
      } else {
        // Validaciones para otros tipos de egreso
        if (!formData.descripcion || formData.descripcion.trim().length < 3) {
          setError('La descripción debe tener al menos 3 caracteres');
          return;
        }
        
        if (!formData.monto || parseFloat(formData.monto) <= 0) {
          setError('El monto debe ser mayor a 0');
          return;
        }
        
        // Usar el hook general para otros tipos de egreso
        await registrarMovimiento(formData, () => {
          onSuccess();
          resetForm();
          onClose();
        });
      }
    } catch (err) {
      // Los errores ya se manejan en los hooks
      console.error('Error en handleSubmit:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'egreso',
      categoria: '',
      descripcion: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      metodoPago: 'efectivo',
      colaboradorUserId: '',
      colaboradorNombre: '',
      proveedor: '',
      numeroComprobante: '',
      observaciones: ''
    });
    setMontoPendiente(0);
    setSelectedSection('');
    setShowRightPanel(false); // Ocultar panel derecho al resetear
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    setPersonalError(null);
    onClose();
  };

  // Mostrar error general o error de pago personal
  const currentError = error || personalError;
  const currentLoading = loading || personalLoading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-5xl lg:max-w-7xl mx-0 sm:mx-2 lg:mx-4 relative sm:max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100 animate-slideUp">
        
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
                  Registrar Egreso
                </h2>
                <p className="text-red-100 text-sm sm:text-base lg:text-lg font-medium">
                  Gestión de egresos de caja
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {currentError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 sm:py-4 rounded-md mb-4 sm:mb-6">
              <div className="flex items-center">
                <div className="ml-2">
                  <strong>Error:</strong> {currentError}
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
                {/* Información del Egreso */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-xl">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        Información del Egreso
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
                    {/* Selector de Sección */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Sección *
                      </label>
                      <div className="relative">
                        <select
                          value={selectedSection}
                          onChange={(e) => handleInputChange('seccion', e.target.value)}
                          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 hover:border-gray-300"
                          required
                        >
                          <option value="">🏢 Seleccionar sección</option>
                          {getSecciones().map(seccion => (
                            <option key={seccion.value} value={seccion.value}>
                              {seccion.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Selector de Categoría */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Categoría de Egreso *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.categoria}
                          onChange={(e) => handleInputChange('categoria', e.target.value)}
                          className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 hover:border-gray-300"
                          required
                          disabled={!selectedSection}
                        >
                          <option value="">
                            {selectedSection ? '🏷️ Seleccionar categoría' : 'Primero selecciona una sección'}
                          </option>
                          {selectedSection && getCategoriasPorSeccion(selectedSection).map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {!isPagoPersonal && (
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
                            className="w-full rounded-xl border-2 border-gray-200 bg-white pl-12 pr-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 hover:border-gray-300"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Fecha del Egreso *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => handleInputChange('fecha', e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 hover:border-gray-300"
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
                                ? 'border-red-500 bg-red-50 text-red-700 ring-4 ring-red-500/20'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {formData.metodoPago === metodo.value && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1">
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
                      disabled={currentLoading}
                      className={`w-full sm:w-auto px-8 py-3 text-sm font-bold text-white rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-lg transform hover:scale-105 ${
                        currentLoading 
                          ? 'bg-red-400 cursor-not-allowed ring-red-200' 
                          : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 ring-red-500/50'
                      }`}
                    >
                      {currentLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{isPagoPersonal ? 'Registrando pago...' : 'Procesando...'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span>{isPagoPersonal ? '👥 Registrar Pago Personal' : '💸 Registrar Egreso'}</span>
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
                          Descripción * {isOtrosGasto && <span className="text-orange-600">(Especifica el tipo de gasto)</span>}
                        </label>
                        <textarea
                          value={formData.descripcion}
                          onChange={(e) => handleInputChange('descripcion', e.target.value)}
                          className={`w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-gray-300 h-32 resize-y ${
                            isPagoPersonal ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder={
                            isPagoPersonal 
                              ? "Se genera automáticamente..." 
                              : isOtrosGasto 
                                ? "Ej: Pago de servicios públicos, mantenimiento de equipos, gastos legales..." 
                                : "Describe detalladamente el egreso..."
                          }
                          required
                          readOnly={isPagoPersonal}
                          title={isPagoPersonal ? 'La descripción se genera automáticamente para pagos de personal' : ''}
                          minLength={isOtrosGasto ? 10 : 1}
                        />
                        {isPagoPersonal && (
                          <p className="text-xs text-gray-500 mt-1">
                            💡 La descripción se genera automáticamente al seleccionar el colaborador
                          </p>
                        )}
                        {isOtrosGasto && (
                          <p className="text-xs text-orange-600 mt-1">
                            💡 Para "Otros gastos" es importante especificar claramente qué tipo de gasto es (mínimo 10 caracteres)
                          </p>
                        )}
                      </div>

                      {/* Campos específicos para Pago Personal */}
                      {isPagoPersonal && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                          <h4 className="text-lg font-bold text-blue-700 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            Datos del Pago Personal
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Colaborador *
                              </label>
                              <select
                                value={formData.colaboradorUserId}
                                onChange={(e) => handleInputChange('colaboradorUserId', e.target.value)}
                                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-gray-300"
                                required={isPagoPersonal}
                              >
                                <option value="">👥 Seleccionar colaborador</option>
                                {getColaboradoresFiltrados().map(colaborador => (
                                  <option key={colaborador._id} value={colaborador.colaboradorUserId}>
                                    {colaborador.nombre} - {colaborador.departamento}
                                  </option>
                                ))}
                              </select>
                              {/* Mostrar información del filtro aplicado */}
                              {isPagoPersonal && selectedSection && (
                                <p className="text-xs text-blue-600 mt-1">
                                  💡 Mostrando solo colaboradores del departamento: {mapSeccionToDepartamento(selectedSection)}
                                </p>
                              )}
                              {isPagoPersonal && selectedSection && getColaboradoresFiltrados().length === 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                  ⚠️ No hay colaboradores registrados en el departamento: {mapSeccionToDepartamento(selectedSection)}
                                </p>
                              )}
                            </div>

                            {/* Mostrar información del monto pendiente */}
                            {formData.colaboradorUserId && (
                              <div className="space-y-3">
                                {/* Resumen del colaborador */}
                                <div className="p-4 bg-white/60 rounded-xl border border-blue-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Monto Total Pendiente:</span>
                                    <span className="font-bold text-gray-900">S/. {montoPendiente.toFixed(2)}</span>
                                  </div>
                                </div>

                                {/* Campo de monto a pagar (editable) */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Monto a Pagar *
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                      <span className="text-gray-500 font-medium">S/</span>
                                    </div>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={montoPendiente}
                                      value={formData.monto}
                                      onChange={(e) => handleInputChange('monto', e.target.value)}
                                      className="w-full rounded-xl border-2 border-gray-200 bg-white pl-12 pr-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-gray-300"
                                      placeholder="0.00"
                                      required={isPagoPersonal}
                                    />
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs text-gray-600">
                                      Máximo: S/. {montoPendiente.toFixed(2)}
                                    </p>
                                    {formData.monto && parseFloat(formData.monto) < montoPendiente && (
                                      <p className="text-xs text-blue-600">
                                        💡 Quedará pendiente: S/. {(montoPendiente - parseFloat(formData.monto || 0)).toFixed(2)}
                                      </p>
                                    )}
                                    {formData.monto && parseFloat(formData.monto) > montoPendiente && (
                                      <p className="text-xs text-red-600">
                                        ⚠️ El monto no puede ser mayor al pendiente
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Botones de acción rápida */}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleInputChange('monto', (montoPendiente / 2).toFixed(2))}
                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    disabled={montoPendiente <= 0}
                                  >
                                    50%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInputChange('monto', (montoPendiente * 0.75).toFixed(2))}
                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                    disabled={montoPendiente <= 0}
                                  >
                                    75%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInputChange('monto', montoPendiente.toFixed(2))}
                                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                    disabled={montoPendiente <= 0}
                                  >
                                    Total
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Mostrar si no hay monto pendiente */}
                            {formData.colaboradorUserId && montoPendiente <= 0 && (
                              <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-700 font-medium">
                                  ⚠️ Este colaborador no tiene montos pendientes por pagar.
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>💡 Nota:</strong> Este pago se registrará automáticamente tanto en la caja como en los pagos realizados del colaborador.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Campos específicos para otros tipos de egreso */}
                      {!isPagoPersonal && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Personal/Colaborador
                            </label>
                            <input
                              type="text"
                              value={formData.colaboradorNombre}
                              onChange={(e) => handleInputChange('colaboradorNombre', e.target.value)}
                              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-gray-300"
                              placeholder="Nombre del colaborador"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Proveedor
                            </label>
                            <input
                              type="text"
                              value={formData.proveedor}
                              onChange={(e) => handleInputChange('proveedor', e.target.value)}
                              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-gray-300"
                              placeholder="Nombre del proveedor"
                            />
                          </div>
                        </div>
                      )}

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
                    <div className={`bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border-2 border-red-200 shadow-sm ${styles.slideInUp}`}>
                      <h4 className="text-lg font-bold text-red-700 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {categoriasEgreso.find(cat => cat.value === formData.categoria)?.icon} {' '}
                        {categoriasEgreso.find(cat => cat.value === formData.categoria)?.label}
                      </h4>
                      
                      {/* Información adicional por tipo de categoría */}
                      <div className="bg-white/60 p-4 rounded-xl border border-red-200">
                        {isPagoPersonal && (
                          <p className="text-sm text-red-600 leading-relaxed">
                            💡 <strong>Pago Personal:</strong> Pago a colaboradores por servicios prestados. El monto se calcula automáticamente según los registros pendientes.
                          </p>
                        )}
                        {formData.categoria.includes('materia_prima') && (
                          <p className="text-sm text-red-600 leading-relaxed">
                            📦 <strong>Materia Prima:</strong> Materiales, suministros e insumos necesarios para la operación del negocio.
                          </p>
                        )}
                        {isOtrosGasto && (
                          <p className="text-sm text-red-600 leading-relaxed">
                            📋 <strong>Otros Gastos:</strong> Gastos operativos diversos. Es importante especificar claramente el tipo de gasto en la descripción.
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

export default ModalEgreso;
