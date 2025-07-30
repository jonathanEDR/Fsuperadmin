import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useMovimiento } from '../../hooks/useMovimiento';
import { usePersonalPayment } from '../../hooks/usePersonalPayment';
import api from '../../services/api';
import useGestionPersonalData from '../personal/useGestionPersonalData';

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
  const { colaboradores, registros, pagos, datosCobros } = useGestionPersonalData();
  const [montoPendiente, setMontoPendiente] = useState(0);
  const [selectedSection, setSelectedSection] = useState('');
  
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
  });

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Modal abierto - datos disponibles para cálculos
    }
  }, [isOpen, colaboradores, registros, pagos, datosCobros]);

  // Calcular monto pendiente por colaborador usando EXACTAMENTE la misma lógica que PagosRealizados
  const calcularMontoPendienteColaborador = (colaboradorId) => {
    if (!colaboradorId) return 0;
    
    // Obtener registros de gestión del colaborador
    const registrosColaborador = (registros || []).filter(r => r.colaboradorUserId === colaboradorId);
    const pagosColaborador = (pagos || []).filter(p => p.colaboradorUserId === colaboradorId);
    
    // Calcular totales de gestión básica (pagosDiarios y adelantos)
    const totalesGestion = registrosColaborador.reduce((totales, registro) => ({
      pagosDiarios: totales.pagosDiarios + (registro.pagodiario || 0),
      adelantos: totales.adelantos + (registro.adelanto || 0)
    }), { pagosDiarios: 0, adelantos: 0 });
    
    // Calcular faltantes de cobros del colaborador (exactamente como en PagosRealizados)
    let faltantesCobros = 0;
    if (datosCobros && datosCobros.resumen && datosCobros.resumen.cobrosDetalle) {
      // Filtrar cobros que pertenecen a este colaborador
      const cobrosColaborador = datosCobros.resumen.cobrosDetalle.filter(cobro => 
        cobro.colaboradorUserId === colaboradorId || cobro.vendedorUserId === colaboradorId
      );
      
      faltantesCobros = cobrosColaborador.reduce((total, cobro) => total + (cobro.faltantes || 0), 0);
    }
    
    // FÓRMULA EXACTA: totalAPagar = pagosDiarios - faltantesCobros - adelantos
    const totalAPagar = totalesGestion.pagosDiarios - faltantesCobros - totalesGestion.adelantos;
    
    // El saldo pendiente es lo que debe cobrar menos lo que ya se le pagó
    const totalPagado = pagosColaborador.reduce((total, pago) => total + pago.montoTotal, 0);
    
    return totalAPagar - totalPagado;
  };

  const categoriasEgreso = [
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
      setFormData(prev => ({
        ...prev,
        categoria: '', // Limpiar categoría cuando cambia la sección
        colaboradorUserId: '', // Limpiar colaborador cuando cambia la sección
        colaboradorNombre: '',
        descripcion: '',
        monto: ''
      }));
      setMontoPendiente(0);
      return;
    }

    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Si se selecciona un colaborador, actualizar el nombre
      if (field === 'colaboradorUserId' && value) {
        const colaborador = colaboradores.find(col => col.colaboradorUserId === value);
        if (colaborador) {
          newData.colaboradorNombre = colaborador.nombre;
        }
      }
      return newData;
    });
    // Verificar si es pago personal (cualquier variante) - Usar la categoría actual, no el valor nuevo
    const esPagoPersonal = formData.categoria && formData.categoria.includes('pago_personal');
    const esOtrosGasto = value && value.includes('otros');
    
    // Si se selecciona un colaborador y YA la categoría es pago personal, calcular monto automáticamente
    if (field === 'colaboradorUserId' && value && esPagoPersonal) {
      try {
        // Usar lógica local
        const monto = calcularMontoPendienteColaborador(value);
        const colaborador = colaboradores.find(col => col.colaboradorUserId === value);
        setFormData(prev => ({
          ...prev,
          monto: prev.monto ? prev.monto : (monto > 0 ? monto.toFixed(2) : '0'),
          descripcion: colaborador ? `Pago de personal - ${colaborador.nombre}` : prev.descripcion
        }));
        setMontoPendiente(monto);
        
        if (monto <= 0) {
          setError(`Este colaborador no tiene monto pendiente para pagar. Saldo actual: S/. ${monto.toFixed(2)}`);
        } else {
          // Limpiar error si hay monto válido
          if (error && error.includes('monto pendiente')) {
            setError(null);
          }
        }
      } catch (err) {
        setError('Error al calcular el monto pendiente');
      }
    }
    // Si se cambia la categoría a pago_personal y ya hay colaborador seleccionado
    if (field === 'categoria' && value && value.includes('pago_personal') && formData.colaboradorUserId) {
      try {
        const monto = calcularMontoPendienteColaborador(formData.colaboradorUserId);
        const colaborador = colaboradores.find(col => col.colaboradorUserId === formData.colaboradorUserId);
        setFormData(prev => ({
          ...prev,
          monto: monto > 0 ? monto.toFixed(2) : '0',
          descripcion: colaborador ? `Pago de personal - ${colaborador.nombre}` : prev.descripcion
        }));
        setMontoPendiente(monto);
        
        if (monto <= 0) {
          setError(`Este colaborador no tiene monto pendiente para pagar. Saldo actual: S/. ${monto.toFixed(2)}`);
        } else {
          // Limpiar error si hay monto válido
          if (error && error.includes('monto pendiente')) {
            setError(null);
          }
        }
      } catch (err) {
        setError('Error al calcular el monto pendiente');
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
        monto: '',
        descripcion: '',
        colaboradorUserId: '',
        colaboradorNombre: ''
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
      } else {
        // Limpiar error si el monto es válido
        if (error && error.includes('monto no puede ser mayor')) {
          setError(null);
        }
      }
    }
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (error && !error.includes('monto no puede ser mayor')) setError(null);
    if (personalError) setPersonalError(null);
  };  const isPagoPersonal = formData.categoria && formData.categoria.includes('pago_personal');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-screen overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-red-700 flex items-center">
            💸 Registrar Egreso
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>        {currentError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {currentError}
          </div>
        )}        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Sección */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sección *
              </label>
              <select
                value={selectedSection}
                onChange={(e) => handleInputChange('seccion', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="">Seleccionar sección</option>
                {getSecciones().map(seccion => (
                  <option key={seccion.value} value={seccion.value}>
                    {seccion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Categoría */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría de Egreso *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
                disabled={!selectedSection}
              >
                <option value="">
                  {selectedSection ? 'Seleccionar categoría' : 'Primero selecciona una sección'}
                </option>
                {selectedSection && getCategoriasPorSeccion(selectedSection).map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>          {/* Mostrar información de la categoría seleccionada */}
          {formData.categoria && (
            <div className={`p-3 rounded-lg border-2 ${getColorClass(categoriasEgreso.find(cat => cat.value === formData.categoria)?.color)}`}>
              <p className="text-sm font-medium">
                {categoriasEgreso.find(cat => cat.value === formData.categoria)?.icon} {' '}
                {categoriasEgreso.find(cat => cat.value === formData.categoria)?.label}
              </p>
              {/* Información adicional por tipo de categoría */}
              {isPagoPersonal && (
                <p className="text-xs mt-1 opacity-75">
                  💡 Pago a colaboradores por servicios prestados
                </p>
              )}
              {formData.categoria.includes('materia_prima') && (
                <p className="text-xs mt-1 opacity-75">
                  📦 Materiales, suministros e insumos para la operación
                </p>
              )}
              {isOtrosGasto && (
                <p className="text-xs mt-1 opacity-75">
                  📋 Otros gastos operativos (especificar en descripción)
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isPagoPersonal && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto (S/.) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.monto}
                  onChange={(e) => handleInputChange('monto', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0.00"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                value={formData.metodoPago}
                onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {metodosPago.map(metodo => (
                  <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                ))}
              </select>
            </div>
          </div>          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción * {isOtrosGasto && <span className="text-orange-600">(Especifica el tipo de gasto)</span>}
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                isPagoPersonal ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder={
                isPagoPersonal 
                  ? "Describe el egreso..." 
                  : isOtrosGasto 
                    ? "Ej: Pago de servicios públicos, mantenimiento de equipos, gastos legales..." 
                    : "Describe el egreso..."
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
          </div>{/* Campos específicos para Pago Personal */}
          {isPagoPersonal && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                👥 Datos del Pago Personal
              </h4>
              
              <div className="space-y-4">                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Colaborador *
                  </label>
                  <select
                    value={formData.colaboradorUserId}
                    onChange={(e) => handleInputChange('colaboradorUserId', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={isPagoPersonal}
                  >
                    <option value="">Seleccionar colaborador</option>
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
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Monto Total Pendiente:</span>
                        <span className="font-bold text-gray-900">S/. {montoPendiente.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Campo de monto a pagar (editable) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Monto a Pagar *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={montoPendiente}
                        value={formData.monto}
                        onChange={(e) => handleInputChange('monto', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        required={isPagoPersonal}
                      />
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
          )}{/* Campos específicos para otros tipos de egreso */}
          {!isPagoPersonal && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Personal/Colaborador
                </label>
                <input
                  type="text"
                  value={formData.colaboradorNombre}
                  onChange={(e) => handleInputChange('colaboradorNombre', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Nombre del colaborador"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => handleInputChange('proveedor', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Nombre del proveedor"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                N° Comprobante
              </label>
              <input
                type="text"
                value={formData.numeroComprobante}
                onChange={(e) => handleInputChange('numeroComprobante', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Factura, recibo, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observaciones
              </label>
              <input
                type="text"
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Notas adicionales"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>            <button
              type="submit"
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
              disabled={currentLoading}
            >
              {currentLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isPagoPersonal ? 'Registrando pago...' : 'Guardando...'}
                </div>
              ) : (
                isPagoPersonal ? '👥 Registrar Pago Personal' : '💸 Registrar Egreso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEgreso;
