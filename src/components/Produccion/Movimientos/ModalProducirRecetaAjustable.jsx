/**
 * Modal de Producción Ajustable de Recetas
 * 
 * Características:
 * - ✅ Cálculo automático de escala (25%, 50%, 75%, 100%, 150%, 200%)
 * - ✅ Ajuste manual de ingredientes individuales
 * - ✅ Registro de rendimiento real vs planeado
 * - ✅ Registro de mermas, desperdicios, bonificaciones
 * - ✅ Historial de producciones
 * - ✅ Validación de stock en tiempo real
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { getFullApiUrl, safeFetch } from '../../../config/api';
import { recetaService } from '../../../services/recetaService';
import { ingredienteService } from '../../../services/ingredienteService';
import '../../../styles/modal-protection.css';

const ModalProducirRecetaAjustable = ({ isOpen, onClose, receta, onSuccess }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isSuperAdmin, canViewPrices } = useQuickPermissions();
  
  // ============= ESTADOS PRINCIPALES =============
  const [vistaActual, setVistaActual] = useState('calcular'); // 'calcular', 'ajustar', 'historial'
  const [escalaSeleccionada, setEscalaSeleccionada] = useState(1);
  const [calculoSugerido, setCalculoSugerido] = useState(null);
  const [loadingCalculo, setLoadingCalculo] = useState(false);
  
  // Estados para producción ajustable
  const [ingredientesAjustados, setIngredientesAjustados] = useState([]);
  const [rendimiento, setRendimiento] = useState({
    planeado: 0,
    real: 0,
    motivo: ''
  });
  
  const [formData, setFormData] = useState({
    motivo: 'Producción de receta',
    observaciones: '',
    operador: ''
  });
  
  // Estados de control
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [historialProducciones, setHistorialProducciones] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // ============= ESCALAS PREDEFINIDAS =============
  const escalasPreset = [
    { valor: 0.25, label: '25%', emoji: '🔻' },
    { valor: 0.5, label: '50%', emoji: '⬇️' },
    { valor: 0.75, label: '75%', emoji: '📉' },
    { valor: 1, label: '100%', emoji: '✅' },
    { valor: 1.5, label: '150%', emoji: '📈' },
    { valor: 2, label: '200%', emoji: '⬆️' },
  ];

  // ============= EFECTOS =============
  useEffect(() => {
    if (isOpen && receta) {
      // Solo resetear cuando se abre por primera vez, no en cada cambio de vista
      if (!ingredientesDisponibles.length) {
        cargarUsuarios();
        resetearFormulario();
      }
      cargarIngredientes();
      if (vistaActual === 'historial') {
        cargarHistorial();
      }
    }
  }, [isOpen, receta]);

  useEffect(() => {
    if (escalaSeleccionada && receta?._id && ingredientesDisponibles.length > 0) {
      calcularProduccionEscalada();
    }
  }, [escalaSeleccionada, receta?._id, ingredientesDisponibles]);

  // ============= FUNCIONES DE CARGA =============
  const cargarUsuarios = async () => {
    if (!isSuperAdmin) {
      // Admin/User: autocompletar con nombre del usuario actual
      setFormData(prev => ({
        ...prev,
        operador: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || ''
      }));
      return;
    }

    try {
      setLoadingUsuarios(true);
      const token = await getToken();
      const url = `${getFullApiUrl('/admin/users')}`;
      
      const response = await safeFetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.users || []);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const resetearFormulario = () => {
    setVistaActual('calcular');
    setEscalaSeleccionada(1);
    setCalculoSugerido(null);
    setIngredientesAjustados([]);
    setRendimiento({
      planeado: receta?.rendimiento?.cantidad || 0,
      real: receta?.rendimiento?.cantidad || 0,
      motivo: ''
    });
    setFormData({
      motivo: 'Producción de receta',
      observaciones: '',
      operador: ''
    });
    setError('');
  };

  const cargarIngredientes = async () => {
    try {
      const response = await ingredienteService.obtenerIngredientes({ activo: true });
      setIngredientesDisponibles(response.data || []);
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
      setError('Error al cargar ingredientes disponibles');
    }
  };

  const cargarHistorial = async () => {
    if (!receta || !receta._id) return;
    
    try {
      setLoadingHistorial(true);
      const response = await recetaService.obtenerHistorialProduccion(receta._id);
      setHistorialProducciones(response.data?.historial || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setError('Error al cargar historial de producciones');
    } finally {
      setLoadingHistorial(false);
    }
  };

  // ============= CÁLCULO DE ESCALA =============
  const calcularProduccionEscalada = async () => {
    if (!receta || !receta._id) {
      console.warn('No hay receta para calcular');
      return;
    }
    
    try {
      setLoadingCalculo(true);
      setError('');
      
      const response = await recetaService.calcularEscala(receta._id, escalaSeleccionada);
      
      if (!response.data) {
        throw new Error('No se recibieron datos del cálculo');
      }
      
      setCalculoSugerido(response.data);
      
      // 🎯 MEJORADO: Inicializar recursos ajustados (ingredientes Y recetas)
      const ingredientesSugeridos = response.data.ingredientesSugeridos || [];
      const ingredientesIniciales = ingredientesSugeridos.map(ing => {
        // 🎯 NUEVO: Detectar si es ingrediente o receta
        const tipoRecurso = ing.tipo || 'ingrediente';
        const recursoInfo = tipoRecurso === 'receta' ? ing.receta : ing.ingrediente;
        
        return {
          tipo: tipoRecurso, // 🎯 NUEVO: Guardar tipo
          ingredienteId: recursoInfo?._id || recursoInfo?.id,
          nombre: `${tipoRecurso === 'receta' ? '📋' : '🥬'} ${recursoInfo?.nombre || 'Sin nombre'}`,
          cantidadOriginal: ing.cantidadOriginal || 0,
          cantidadPlaneada: ing.cantidadSugerida || 0,
          cantidadReal: ing.cantidadSugerida || 0,
          unidadMedida: recursoInfo?.unidadMedida || 'unidad',
          disponible: ing.stockDisponible || 0,
          suficiente: ing.suficiente !== undefined ? ing.suficiente : false,
          motivo: '',
          esReceta: tipoRecurso === 'receta'
        };
      });
      
      setIngredientesAjustados(ingredientesIniciales);
      
      // Calcular rendimiento planeado
      const rendimientoCantidad = receta.rendimiento?.cantidad || 1;
      const rendimientoPlaneado = Math.floor(rendimientoCantidad * escalaSeleccionada);
      setRendimiento(prev => ({
        ...prev,
        planeado: rendimientoPlaneado,
        real: rendimientoPlaneado
      }));
      
    } catch (error) {
      console.error('Error al calcular escala:', error);
      setError(error.response?.data?.message || error.message || 'Error al calcular producción escalada');
    } finally {
      setLoadingCalculo(false);
    }
  };

  // ============= MANEJO DE CAMBIOS =============
  const handleCambioIngrediente = (index, campo, valor) => {
    const nuevosIngredientes = [...ingredientesAjustados];
    nuevosIngredientes[index][campo] = valor;
    
    // Recalcular si es suficiente
    if (campo === 'cantidadReal') {
      nuevosIngredientes[index].suficiente = 
        nuevosIngredientes[index].disponible >= parseFloat(valor || 0);
    }
    
    setIngredientesAjustados(nuevosIngredientes);
  };

  const handleCambioRendimiento = (campo, valor) => {
    setRendimiento(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleCambioFormData = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // ============= APLICAR SUGERENCIAS =============
  const aplicarSugerencias = () => {
    if (!calculoSugerido) return;
    
    const ingredientesActualizados = ingredientesAjustados.map(ing => ({
      ...ing,
      cantidadReal: ing.cantidadPlaneada,
      motivo: ''
    }));
    
    setIngredientesAjustados(ingredientesActualizados);
    setRendimiento(prev => ({
      ...prev,
      real: prev.planeado,
      motivo: ''
    }));
  };

  // ============= VALIDACIONES =============
  const validacionesActuales = useMemo(() => {
    const validaciones = {
      todosIngredientesSuficientes: true,
      ingredientesFaltantes: [],
      rendimientoValido: true,
      hayDiferencias: false
    };

    // Validar ingredientes
    ingredientesAjustados.forEach(ing => {
      if (!ing.suficiente) {
        validaciones.todosIngredientesSuficientes = false;
        validaciones.ingredientesFaltantes.push({
          nombre: ing.nombre,
          falta: (ing.cantidadReal - ing.disponible).toFixed(2),
          unidad: ing.unidadMedida
        });
      }
      
      // Detectar diferencias
      if (ing.cantidadReal !== ing.cantidadPlaneada || ing.motivo) {
        validaciones.hayDiferencias = true;
      }
    });

    // Validar rendimiento
    validaciones.rendimientoValido = rendimiento.real > 0;
    
    if (rendimiento.real !== rendimiento.planeado || rendimiento.motivo) {
      validaciones.hayDiferencias = true;
    }

    return validaciones;
  }, [ingredientesAjustados, rendimiento]);

  // ============= SUBMIT =============
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validacionesActuales.todosIngredientesSuficientes) {
      setError('No hay suficiente stock de algunos ingredientes');
      return;
    }

    if (!validacionesActuales.rendimientoValido) {
      setError('El rendimiento real debe ser mayor a 0');
      return;
    }

    try {
      setEnviando(true);
      setError('');

      // Preparar datos para producción ajustable
      const payload = {
        ingredientesAjustados: ingredientesAjustados.map(ing => ({
          ingredienteId: ing.ingredienteId,
          cantidadPlaneada: ing.cantidadPlaneada,
          cantidadReal: ing.cantidadReal,
          motivo: ing.motivo
        })),
        rendimientoReal: {
          planeado: rendimiento.planeado,
          cantidad: rendimiento.real,
          unidadMedida: receta.rendimiento.unidadMedida,
          motivo: rendimiento.motivo
        },
        motivo: formData.motivo,
        observaciones: formData.observaciones,
        operador: formData.operador || 'Usuario'
      };

      await recetaService.producirRecetaAjustable(receta._id, payload);

      // Éxito
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al producir receta:', error);
      setError(error.response?.data?.message || error.message || 'Error al producir la receta');
    } finally {
      setEnviando(false);
    }
  };

  // ============= CAMBIAR VISTA =============
  const cambiarVista = (vista) => {
    setVistaActual(vista);
    if (vista === 'historial' && historialProducciones.length === 0) {
      cargarHistorial();
    }
  };

  if (!isOpen) return null;
  
  if (!receta) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <p className="text-red-600">Error: No se ha seleccionado una receta</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // ============= RENDER =============
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="modal-protection bg-white rounded-lg shadow-xl overflow-hidden"
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          position: 'static',
          transform: 'none',
          maxWidth: '900px',
          width: '100%'
        }}
      >
        <div className="overflow-y-auto" style={{ maxHeight: '95vh' }}>
          {/* ============= HEADER ============= */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold m-0">🎯 Producción Ajustable</h2>
                <p className="text-blue-100 text-sm mt-1 mb-0">{receta.nombre}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded p-2 transition-colors"
                disabled={enviando}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navegación de Pestañas */}
            <div className="flex space-x-2">
              {[
                { id: 'calcular', label: '📊 Calcular', icon: '📊' },
                { id: 'ajustar', label: '🔧 Ajustar', icon: '🔧' },
                { id: 'historial', label: '📜 Historial', icon: '📜' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => cambiarVista(tab.id)}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    vistaActual === tab.id
                      ? 'bg-white text-blue-700'
                      : 'bg-blue-800 bg-opacity-50 text-white hover:bg-opacity-70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ============= CONTENIDO ============= */}
          <div className="p-6">
            {/* Error Global */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex items-start">
                  <span className="text-red-500 text-xl mr-3">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-700 font-medium m-0">Error</p>
                    <p className="text-red-600 text-sm mt-1 mb-0">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ============= VISTA: CALCULAR ============= */}
            {vistaActual === 'calcular' && (
              <div className="space-y-6">
                {/* Información de la Receta */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Stock Actual</p>
                      <p className="text-2xl font-bold text-gray-800 m-0">
                        {receta.inventario?.cantidadProducida || 0}
                      </p>
                      <p className="text-xs text-gray-500 m-0">{receta.rendimiento?.unidadMedida || 'unidad'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Rendimiento Original</p>
                      <p className="text-2xl font-bold text-gray-800 m-0">
                        {receta.rendimiento?.cantidad || 0}
                      </p>
                      <p className="text-xs text-gray-500 m-0">por producción</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ingredientes</p>
                      <p className="text-2xl font-bold text-gray-800 m-0">
                        {receta.ingredientes?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 m-0">componentes</p>
                    </div>
                  </div>
                </div>

                {/* Selector de Escala */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    📏 Selecciona la Escala de Producción
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {escalasPreset.map(escala => (
                      <button
                        key={escala.valor}
                        type="button"
                        onClick={() => setEscalaSeleccionada(escala.valor)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          escalaSeleccionada === escala.valor
                            ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{escala.emoji}</div>
                        <div className="font-bold text-gray-800">{escala.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Escala Personalizada */}
                  <div className="mt-4 flex items-center space-x-2">
                    <label className="text-sm text-gray-600">O ingresa escala personalizada:</label>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={escalaSeleccionada}
                      onChange={(e) => setEscalaSeleccionada(parseFloat(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">× (10% - 1000%)</span>
                  </div>
                </div>

                {/* Resultados del Cálculo */}
                {loadingCalculo ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Calculando producción...</span>
                  </div>
                ) : calculoSugerido && (
                  <div className="space-y-4">
                    {/* Resumen de Producción */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-5 border border-green-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-2">✨</span>
                        Producción Sugerida ({(escalaSeleccionada * 100).toFixed(0)}%)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Rendimiento Esperado</p>
                          <p className="text-3xl font-bold text-green-700 m-0">
                            {calculoSugerido.rendimientoSugerido?.cantidad || 0}
                          </p>
                          <p className="text-sm text-gray-600 m-0">
                            {calculoSugerido.rendimientoSugerido?.unidadMedida || 'unidad'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Estado de Producción</p>
                          <div className="flex items-center space-x-2">
                            {calculoSugerido.produccionPosible !== false ? (
                              <>
                                <span className="text-3xl">✅</span>
                                <span className="text-lg font-medium text-green-700">Posible</span>
                              </>
                            ) : (
                              <>
                                <span className="text-3xl">⚠️</span>
                                <span className="text-lg font-medium text-red-700">Stock Insuficiente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ingredientes Sugeridos */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">📦 Ingredientes Necesarios</h4>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingrediente</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Original</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sugerido</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Disponible</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(calculoSugerido.ingredientesSugeridos || []).map((ing, index) => (
                              <tr key={index} className={!ing.suficiente ? 'bg-red-50' : ''}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {ing.ingrediente?.nombre || 'Sin nombre'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                  {(ing.cantidadOriginal || 0).toFixed(2)} {ing.ingrediente?.unidadMedida || 'u'}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-blue-600 text-right">
                                  {(ing.cantidadSugerida || 0).toFixed(2)} {ing.ingrediente?.unidadMedida || 'u'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                  {(ing.stockDisponible || 0).toFixed(2)} {ing.ingrediente?.unidadMedida || 'u'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ing.suficiente ? (
                                    <span className="text-green-500 text-xl">✓</span>
                                  ) : (
                                    <span className="text-red-500 text-xl">✗</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Alertas */}
                    {calculoSugerido.alertas && calculoSugerido.alertas.length > 0 && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <div className="flex items-start">
                          <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                          <div className="flex-1">
                            <p className="font-medium text-yellow-800 m-0 mb-2">Advertencias:</p>
                            <ul className="list-disc list-inside space-y-1 m-0">
                              {calculoSugerido.alertas.map((alerta, index) => (
                                <li key={index} className="text-sm text-yellow-700">{alerta}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botón para continuar */}
                    {calculoSugerido.produccionPosible && (
                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => cambiarVista('ajustar')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2"
                        >
                          <span>Continuar al Ajuste</span>
                          <span>→</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ============= VISTA: AJUSTAR ============= */}
            {vistaActual === 'ajustar' && (
              <>
                {/* Mensaje si no hay cálculo previo */}
                {ingredientesAjustados.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">📊</span>
                    <p className="text-gray-600 mb-4">
                      Primero debes calcular una producción en la pestaña "Calcular"
                    </p>
                    <button
                      type="button"
                      onClick={() => cambiarVista('calcular')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      ← Ir a Calcular
                    </button>
                  </div>
                ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Resumen del Cálculo */}
                {calculoSugerido && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Escala Seleccionada</p>
                        <p className="text-2xl font-bold text-blue-700 m-0">
                          {(escalaSeleccionada * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Rendimiento Planeado</p>
                        <p className="text-2xl font-bold text-blue-700 m-0">
                          {rendimiento.planeado} {receta.rendimiento?.unidadMedida}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={aplicarSugerencias}
                        className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors"
                      >
                        🔄 Restaurar Sugerencias
                      </button>
                    </div>
                  </div>
                )}

                {/* Ajuste de Ingredientes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">🔧</span>
                    Ajustar Ingredientes
                  </h3>
                  <div className="space-y-3">
                    {ingredientesAjustados.map((ing, index) => (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-4 ${
                          !ing.suficiente ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 m-0">{ing.nombre}</p>
                            <p className="text-xs text-gray-500 m-0 mt-1">
                              Disponible: {ing.disponible.toFixed(2)} {ing.unidadMedida}
                            </p>
                          </div>
                          {!ing.suficiente && (
                            <span className="text-red-600 font-medium text-sm">⚠️ Insuficiente</span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Original</label>
                            <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-700">
                              {ing.cantidadOriginal?.toFixed(2) || '0'} {ing.unidadMedida}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Planeado</label>
                            <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-700">
                              {ing.cantidadPlaneada.toFixed(2)} {ing.unidadMedida}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Real *</label>
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ing.cantidadReal}
                                onChange={(e) => handleCambioIngrediente(index, 'cantidadReal', parseFloat(e.target.value) || 0)}
                                className={`flex-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                                  !ing.suficiente ? 'border-red-300' : 'border-gray-300'
                                }`}
                                disabled={enviando}
                              />
                              <span className="text-xs text-gray-500">{ing.unidadMedida}</span>
                            </div>
                          </div>
                        </div>
                        
                        {ing.cantidadReal !== ing.cantidadPlaneada && (
                          <div className="mt-3">
                            <label className="block text-xs text-gray-600 mb-1">
                              Motivo de la diferencia (opcional)
                            </label>
                            <input
                              type="text"
                              value={ing.motivo}
                              onChange={(e) => handleCambioIngrediente(index, 'motivo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Ej: Desperdicio en pesaje, merma..."
                              disabled={enviando}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ajuste de Rendimiento */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">📊</span>
                    Rendimiento Real
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Rendimiento Planeado</label>
                      <div className="px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-700">
                        {rendimiento.planeado} {receta.rendimiento?.unidadMedida}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Rendimiento Real *</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={rendimiento.real}
                          onChange={(e) => handleCambioRendimiento('real', parseInt(e.target.value) || 0)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          disabled={enviando}
                          required
                        />
                        <span className="text-sm text-gray-600">{receta.rendimiento?.unidadMedida}</span>
                      </div>
                    </div>
                  </div>

                  {rendimiento.real !== rendimiento.planeado && (
                    <div>
                      <div className={`mb-2 p-3 rounded-lg bg-white border-l-4 ${
                        rendimiento.real > rendimiento.planeado 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-yellow-500 bg-yellow-50'
                      }`}>
                        <p className="text-sm font-medium m-0">
                          {rendimiento.real > rendimiento.planeado ? '✨ Bonificación: ' : '⚠️ Merma: '}
                          {Math.abs(rendimiento.real - rendimiento.planeado)} unidades
                          ({((Math.abs(rendimiento.real - rendimiento.planeado) / rendimiento.planeado) * 100).toFixed(1)}%)
                        </p>
                      </div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Motivo de la diferencia (opcional)
                      </label>
                      <textarea
                        value={rendimiento.motivo}
                        onChange={(e) => handleCambioRendimiento('motivo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Ej: Merma en horneado, piezas quemadas, mejor aprovechamiento..."
                        disabled={enviando}
                      />
                    </div>
                  )}
                </div>

                {/* Información Adicional */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo de Producción *
                    </label>
                    <textarea
                      value={formData.motivo}
                      onChange={(e) => handleCambioFormData('motivo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Describe el motivo de esta producción..."
                      disabled={enviando}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones (opcional)
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => handleCambioFormData('observaciones', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Cualquier información adicional..."
                      disabled={enviando}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operador Responsable * {isSuperAdmin && <span className="text-gray-500 text-xs">(Selecciona quién realizó la producción)</span>}
                    </label>
                    {isSuperAdmin ? (
                      <select
                        value={formData.operador}
                        onChange={(e) => handleCambioFormData('operador', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled={enviando || loadingUsuarios}
                        required
                      >
                        <option value="">
                          {loadingUsuarios ? 'Cargando usuarios...' : 'Seleccionar operador...'}
                        </option>
                        {usuarios.map(u => (
                          <option key={u._id} value={u.nombre_negocio || u.email}>
                            {u.nombre_negocio || u.email} ({u.role})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.operador}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        readOnly
                      />
                    )}
                  </div>
                </div>

                {/* Resumen de Validación */}
                {!validacionesActuales.todosIngredientesSuficientes && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-start">
                      <span className="text-red-500 text-xl mr-3">⚠️</span>
                      <div className="flex-1">
                        <p className="font-medium text-red-800 m-0 mb-2">Stock Insuficiente:</p>
                        <ul className="list-disc list-inside space-y-1 m-0">
                          {validacionesActuales.ingredientesFaltantes.map((ing, index) => (
                            <li key={index} className="text-sm text-red-700">
                              {ing.nombre}: Faltan {ing.falta} {ing.unidad}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {validacionesActuales.hayDiferencias && validacionesActuales.todosIngredientesSuficientes && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-start">
                      <span className="text-blue-500 text-xl mr-3">ℹ️</span>
                      <div className="flex-1">
                        <p className="font-medium text-blue-800 m-0">
                          Se registrarán diferencias entre lo planeado y lo real
                        </p>
                        <p className="text-sm text-blue-700 mt-1 mb-0">
                          Esto ayuda a mantener un historial preciso y detectar patrones.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => cambiarVista('calcular')}
                    className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    disabled={enviando}
                  >
                    ← Volver al Cálculo
                  </button>
                  <button
                    type="submit"
                    disabled={enviando || !validacionesActuales.todosIngredientesSuficientes || !validacionesActuales.rendimientoValido}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      enviando || !validacionesActuales.todosIngredientesSuficientes || !validacionesActuales.rendimientoValido
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {enviando ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Produciendo...
                      </span>
                    ) : (
                      '✅ Producir Receta'
                    )}
                  </button>
                </div>
              </form>
                )}
              </>
            )}

            {/* ============= VISTA: HISTORIAL ============= */}
            {vistaActual === 'historial' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 m-0">
                    📜 Historial de Producciones
                  </h3>
                  <button
                    type="button"
                    onClick={cargarHistorial}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    disabled={loadingHistorial}
                  >
                    <span>🔄</span>
                    <span>Actualizar</span>
                  </button>
                </div>

                {loadingHistorial ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando historial...</span>
                  </div>
                ) : historialProducciones.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl">📋</span>
                    <p className="text-gray-600 mt-4 mb-0">No hay producciones registradas aún</p>
                    <p className="text-sm text-gray-500 mt-2 mb-0">
                      Las producciones ajustables aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historialProducciones
                      .filter(prod => prod.tipo === 'produccion_ajustable')
                      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                      .map((produccion, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                {new Date(produccion.fecha).toLocaleString('es-ES', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </p>
                              <p className="font-medium text-gray-800 m-0">{produccion.motivo}</p>
                              {produccion.operador && (
                                <p className="text-xs text-gray-500 mt-1 mb-0">
                                  👤 {produccion.operador}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600 mb-1">Rendimiento</p>
                              <p className="text-2xl font-bold text-green-700 m-0">
                                {produccion.rendimientoReal.cantidad}
                              </p>
                              <p className="text-xs text-gray-500 m-0">
                                {produccion.rendimientoReal.unidadMedida}
                              </p>
                            </div>
                          </div>

                          {/* Diferencia de Rendimiento */}
                          {produccion.diferenciaRendimiento.cantidad !== 0 && (
                            <div className={`mb-3 p-3 rounded-lg ${
                              produccion.diferenciaRendimiento.cantidad > 0
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                              <p className="text-sm font-medium m-0">
                                {produccion.diferenciaRendimiento.cantidad > 0 ? '✨ Bonificación: ' : '⚠️ Merma: '}
                                {Math.abs(produccion.diferenciaRendimiento.cantidad)} unidades
                                ({Math.abs(produccion.diferenciaRendimiento.porcentaje).toFixed(1)}%)
                              </p>
                            </div>
                          )}

                          {/* Ingredientes Consumidos */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-600 mb-2">INGREDIENTES CONSUMIDOS</p>
                            <div className="space-y-1">
                              {produccion.ingredientesConsumidos.map((ing, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{ing.nombre}</span>
                                  <span className="text-gray-600">
                                    {ing.cantidad.toFixed(2)} {ing.unidadMedida}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Costos - Solo para super_admin */}
                          {canViewPrices && (
                            <div className="border-t pt-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Costo Total:</span>
                                <span className="font-medium text-gray-800">
                                  ${produccion.costoTotal.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600">Costo Unitario:</span>
                                <span className="font-medium text-gray-800">
                                  ${produccion.costoUnitario.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Observaciones */}
                          {produccion.observaciones && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              <span className="font-medium">Observaciones:</span> {produccion.observaciones}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalProducirRecetaAjustable;
