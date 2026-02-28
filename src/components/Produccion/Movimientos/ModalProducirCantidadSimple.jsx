import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { getFullApiUrl, safeFetch } from '../../../config/api';
import { useAuth } from '@clerk/clerk-react';

/**
 * Modal simplificado para admin/user
 * Permite agregar cantidad producida y consumir ingredientes/recetas
 * Muestra cantidades/stock en lugar de costos
 * El backend calculará los costos automáticamente
 */
const ModalProducirCantidadSimple = ({ producto, isOpen, onClose, onSuccess }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isSuperAdmin } = useQuickPermissions();
  
  const [formData, setFormData] = useState({
    cantidadProducir: 1,
    operador: '',
    fechaProduccion: getLocalDateTimeString(),
    observaciones: '',
    ingredientesUtilizados: [],
    recetasUtilizadas: []
    // consumirRecursos eliminado - SIEMPRE se consume automáticamente
  });

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🎯 Estados para fórmula estándar
  const [formulaEstandar, setFormulaEstandar] = useState(null);
  const [formulaCargada, setFormulaCargada] = useState(false);
  const [guardarComoFormula, setGuardarComoFormula] = useState(false);
  const [modoManual, setModoManual] = useState(false);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen && producto) {
      const nombreUsuario = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || '';
      
      setFormData({
        cantidadProducir: 1,
        operador: isSuperAdmin ? '' : nombreUsuario,
        fechaProduccion: getLocalDateTimeString(),
        observaciones: '',
        ingredientesUtilizados: [],
        recetasUtilizadas: []
        // consumirRecursos eliminado - SIEMPRE se consume automáticamente
      });
      setError('');
      
      // Cargar recursos disponibles
      cargarRecursos();
      
      // 🎯 Cargar fórmula estándar
      cargarFormulaEstandar();
      
      // Si es super_admin, cargar lista de usuarios
      if (isSuperAdmin) {
        cargarUsuarios();
      }
    }
  }, [isOpen, producto, user, isSuperAdmin]);

  // Cargar recursos disponibles (ingredientes y recetas)
  const cargarRecursos = async () => {
    try {
      setLoading(true);
      const [ingredientesResponse, recetasResponse] = await Promise.all([
        movimientoUnificadoService.obtenerProductosPorTipo('ingredientes'),
        movimientoUnificadoService.obtenerProductosPorTipo('recetas')
      ]);
      
      // Filtrar solo ingredientes con stock disponible
      const ingredientesConStock = (ingredientesResponse.data || []).filter(
        ing => (ing.cantidad - (ing.procesado || 0)) > 0
      );
      
      // Filtrar solo recetas con stock disponible (producida - utilizada > 0)
      const recetasConStock = (recetasResponse.data || []).filter(
        rec => ((rec.inventario?.cantidadProducida || 0) - (rec.inventario?.cantidadUtilizada || 0)) > 0
      );
      
      setIngredientesDisponibles(ingredientesConStock);
      setRecetasDisponibles(recetasConStock);
    } catch (error) {
      console.error('Error al cargar recursos:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Cargar fórmula estándar del producto
  const cargarFormulaEstandar = async () => {
    try {
      const response = await movimientoUnificadoService.obtenerFormulaEstandar(producto._id);
      const formula = response.data;
      setFormulaEstandar(formula);
      
      if (formula && formula.activa && formula.recetas.length > 0) {
        setFormulaCargada(true);
        aplicarFormula(formula, 1);
      } else {
        setGuardarComoFormula(true);
      }
    } catch (error) {
      console.error('Error al cargar fórmula:', error);
      setGuardarComoFormula(true);
    }
  };

  // 🎯 Aplicar fórmula: auto-calcular cantidades
  const aplicarFormula = (formula, cantidadProducir) => {
    if (!formula || !formula.recetas) return;
    
    const recetasAuto = formula.recetas.map(item => ({
      receta: item.receta?._id || item.receta,
      cantidadUtilizada: Math.round((item.cantidadPorUnidad * cantidadProducir) * 100) / 100
    }));
    
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: recetasAuto
    }));
  };

  // 🎯 Cuando cambia cantidad, auto-calcular si hay fórmula
  const handleCantidadProducirChange = (valor) => {
    setFormData(prev => ({ ...prev, cantidadProducir: valor }));
    if (formulaCargada && formulaEstandar?.activa && !modoManual) {
      aplicarFormula(formulaEstandar, valor);
    }
  };

  // 🎯 Guardar fórmula estándar
  const guardarFormulaDespuesDeProducir = async () => {
    try {
      if (!formData.recetasUtilizadas.length || formData.cantidadProducir <= 0) return;
      const recetasParaFormula = formData.recetasUtilizadas
        .filter(r => r.receta && r.cantidadUtilizada > 0)
        .map(r => ({
          receta: r.receta,
          cantidadPorUnidad: Math.round((r.cantidadUtilizada / formData.cantidadProducir) * 10000) / 10000
        }));
      if (recetasParaFormula.length > 0) {
        await movimientoUnificadoService.guardarFormulaEstandar(producto._id, recetasParaFormula);
      }
    } catch (error) {
      console.error('Error al guardar fórmula:', error);
    }
  };

  // Cargar lista de usuarios (solo para super_admin)
  const cargarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const token = await getToken();
      const url = getFullApiUrl('/admin/users?limit=100&excludeInactive=true');
      
      const response = await safeFetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
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

  const handleInputChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Funciones para ingredientes
  const agregarIngrediente = () => {
    setFormData(prev => ({
      ...prev,
      ingredientesUtilizados: [
        ...prev.ingredientesUtilizados,
        { ingrediente: '', cantidadUtilizada: 0 }
      ]
    }));
  };

  const actualizarIngrediente = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      ingredientesUtilizados: prev.ingredientesUtilizados.map((item, i) => 
        i === index ? { ...item, [campo]: valor } : item
      )
    }));
  };

  const eliminarIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredientesUtilizados: prev.ingredientesUtilizados.filter((_, i) => i !== index)
    }));
  };

  // Funciones para recetas
  const agregarReceta = () => {
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: [
        ...prev.recetasUtilizadas,
        { receta: '', cantidadUtilizada: 0 }
      ]
    }));
  };

  const actualizarReceta = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: prev.recetasUtilizadas.map((item, i) => 
        i === index ? { ...item, [campo]: valor } : item
      )
    }));
  };

  const eliminarReceta = (index) => {
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: prev.recetasUtilizadas.filter((_, i) => i !== index)
    }));
  };

  // Obtener info de ingrediente/receta
  const obtenerIngredienteInfo = (ingredienteId) => {
    return ingredientesDisponibles.find(ing => ing._id === ingredienteId);
  };

  const obtenerRecetaInfo = (recetaId) => {
    return recetasDisponibles.find(rec => rec._id === recetaId);
  };

  const validarFormulario = () => {
    if (!formData.cantidadProducir || formData.cantidadProducir <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return false;
    }

    if (!formData.operador?.trim()) {
      setError('El operador responsable es obligatorio');
      return false;
    }

    // Validar ingredientes
    for (let i = 0; i < formData.ingredientesUtilizados.length; i++) {
      const item = formData.ingredientesUtilizados[i];
      if (!item.ingrediente) {
        setError(`Seleccione un ingrediente en la posición ${i + 1}`);
        return false;
      }
      if (item.cantidadUtilizada <= 0) {
        setError(`La cantidad del ingrediente ${i + 1} debe ser mayor a 0`);
        return false;
      }
      
      // Validar stock disponible (siempre se consume automáticamente)
      const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
      const disponible = (ingredienteInfo?.cantidad || 0) - (ingredienteInfo?.procesado || 0);
      if (item.cantidadUtilizada > disponible) {
        setError(`Stock insuficiente de ${ingredienteInfo?.nombre}. Disponible: ${disponible}`);
        return false;
      }
    }

    // Validar recetas
    for (let i = 0; i < formData.recetasUtilizadas.length; i++) {
      const item = formData.recetasUtilizadas[i];
      if (!item.receta) {
        setError(`Seleccione una receta en la posición ${i + 1}`);
        return false;
      }
      if (item.cantidadUtilizada <= 0) {
        setError(`La cantidad de la receta ${i + 1} debe ser mayor a 0`);
        return false;
      }
      
      // Validar stock disponible (siempre se consume automáticamente)
      const recetaInfo = obtenerRecetaInfo(item.receta);
      const disponible = (recetaInfo?.inventario?.cantidadProducida || 0) - (recetaInfo?.inventario?.cantidadUtilizada || 0);
      if (item.cantidadUtilizada > disponible) {
        setError(`Stock insuficiente de receta ${recetaInfo?.nombre}. Disponible: ${disponible}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setEnviando(true);
      setError('');

      const datosProduccion = {
        tipoProducto: 'produccion',
        productoId: producto._id,
        cantidad: formData.cantidadProducir,
        motivo: `Producción: ${formData.observaciones?.trim() || 'Producción registrada'}`,
        operador: formData.operador?.trim(),
        observaciones: formData.observaciones?.trim() || '',
        fechaProduccion: formData.fechaProduccion,
        consumirRecursos: true, // SIEMPRE consumir automáticamente
        costoTotal: 0, // Backend lo calculará
        ingredientesUtilizados: formData.ingredientesUtilizados.map(ing => ({
          ingrediente: ing.ingrediente,
          cantidadUtilizada: ing.cantidadUtilizada,
          costoUnitario: 0 // Backend lo calculará
        })),
        recetasUtilizadas: formData.recetasUtilizadas.map(rec => ({
          receta: rec.receta,
          cantidadUtilizada: rec.cantidadUtilizada,
          costoUnitario: 0 // Backend lo calculará
        }))
      };

      await movimientoUnificadoService.agregarCantidad(datosProduccion);

      // 🎯 Guardar fórmula estándar si corresponde
      if (guardarComoFormula && formData.recetasUtilizadas.length > 0) {
        await guardarFormulaDespuesDeProducir();
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al producir:', error);
      setError(error.message || 'Error al crear producción');
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏭</span>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Producir Stock
              </h3>
              <p className="text-sm text-gray-500">
                {producto.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Stock Actual */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">📊 Cantidad Actual</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {producto.stock || 0}
                  </div>
                  <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidad'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">➕ A Producir</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{formData.cantidadProducir}
                  </div>
                  <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidad'}</div>
                </div>
              </div>
              
              {/* Stock Final Proyectado */}
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">🎯 Stock Final</div>
                  <div className="text-xl font-bold text-indigo-600">
                    {(producto.stock || 0) + formData.cantidadProducir}
                  </div>
                  <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidad'}</div>
                </div>
              </div>
            </div>

            {/* Cantidad a Producir */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad a Producir *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.cantidadProducir}
                onChange={(e) => handleCantidadProducirChange(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-blue-500 focus:border-blue-500"
                disabled={enviando}
                required
              />
            </div>

            {/* 🎯 Indicador de Fórmula Estándar */}
            {formulaCargada && formulaEstandar?.activa && !modoManual ? (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Fórmula Estándar Activa</p>
                      <p className="text-xs text-emerald-700">Recetas auto-calculadas al cambiar cantidad</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setModoManual(true)} className="text-xs text-emerald-600 hover:text-emerald-800 underline">
                    Editar manual
                  </button>
                </div>
              </div>
            ) : modoManual && formulaCargada ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✏️</span>
                    <p className="text-sm font-bold text-amber-800">Modo Manual</p>
                  </div>
                  <button type="button" onClick={() => { setModoManual(false); aplicarFormula(formulaEstandar, formData.cantidadProducir); }} className="text-xs text-amber-600 hover:text-amber-800 underline">
                    Volver a fórmula
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Sin Fórmula Estándar</p>
                    <p className="text-xs text-blue-700">Agrega recetas y marca "Guardar como fórmula" para auto-calcular.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox guardar fórmula */}
            <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={guardarComoFormula}
                onChange={(e) => setGuardarComoFormula(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
                disabled={enviando}
              />
              <span className="text-xs text-gray-700">
                {formulaCargada && formulaEstandar?.activa
                  ? '🔄 Actualizar fórmula estándar'
                  : '💾 Guardar como fórmula estándar'
                }
              </span>
            </label>

            {/* Ingredientes Utilizados */}
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  🥕 Ingredientes (Opcional)
                  {ingredientesDisponibles.length > 0 && (
                    <span className="ml-2 text-xs text-green-600">
                      ({ingredientesDisponibles.length} disponible{ingredientesDisponibles.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={agregarIngrediente}
                  disabled={enviando || loading || ingredientesDisponibles.length === 0}
                  className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={ingredientesDisponibles.length === 0 ? 'No hay ingredientes con stock disponible' : 'Agregar ingrediente'}
                >
                  + Agregar
                </button>
              </div>

              {ingredientesDisponibles.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-700 font-medium">⚠️ No hay ingredientes con stock disponible</p>
                  <p className="text-xs text-yellow-600 mt-1">Agrega entrada de inventario primero</p>
                </div>
              )}

              {ingredientesDisponibles.length > 0 && formData.ingredientesUtilizados.length === 0 && (
                <p className="text-xs text-gray-500 italic text-center py-2">
                  No se están utilizando ingredientes
                </p>
              )}

              {formData.ingredientesUtilizados.length > 0 && (
                <div className="space-y-3">
                  {formData.ingredientesUtilizados.map((item, index) => {
                    const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
                    const disponible = (ingredienteInfo?.cantidad || 0) - (ingredienteInfo?.procesado || 0);
                    
                    return (
                      <div key={index} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg relative">
                        <button
                          type="button"
                          onClick={() => eliminarIngrediente(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          disabled={enviando}
                        >
                          ×
                        </button>

                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ingrediente</label>
                          <select
                            value={item.ingrediente}
                            onChange={(e) => actualizarIngrediente(index, 'ingrediente', e.target.value)}
                            className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            disabled={enviando || loading}
                            required
                          >
                            <option value="">Seleccionar...</option>
                            {ingredientesDisponibles.map(ing => {
                              const disponibleIng = (ing.cantidad || 0) - (ing.procesado || 0);
                              return (
                                <option key={ing._id} value={ing._id}>
                                  {ing.nombre} - Disp: {disponibleIng.toFixed(2)} {ing.unidadMedida} (Total: {ing.cantidad}, Usado: {ing.procesado || 0})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.cantidadUtilizada}
                            onChange={(e) => actualizarIngrediente(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            disabled={enviando}
                            required
                          />
                          {ingredienteInfo && (
                            <p className="text-xs text-gray-500 mt-1">
                              Disponible: {disponible.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recetas Utilizadas */}
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  🍰 Recetas (Opcional)
                  {recetasDisponibles.length > 0 && (
                    <span className="ml-2 text-xs text-purple-600">
                      ({recetasDisponibles.length} disponible{recetasDisponibles.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={agregarReceta}
                  disabled={enviando || loading || recetasDisponibles.length === 0}
                  className="text-xs bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={recetasDisponibles.length === 0 ? 'No hay recetas con stock disponible' : 'Agregar receta'}
                >
                  + Agregar
                </button>
              </div>

              {recetasDisponibles.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-700 font-medium">⚠️ No hay recetas con stock disponible</p>
                  <p className="text-xs text-yellow-600 mt-1">Produce recetas primero</p>
                </div>
              )}

              {recetasDisponibles.length > 0 && formData.recetasUtilizadas.length === 0 && (
                <p className="text-xs text-gray-500 italic text-center py-2">
                  No se están utilizando recetas
                </p>
              )}

              {formData.recetasUtilizadas.length > 0 && (
                <div className="space-y-3">
                  {formData.recetasUtilizadas.map((item, index) => {
                    const recetaInfo = obtenerRecetaInfo(item.receta);
                    const disponible = (recetaInfo?.inventario?.cantidadProducida || 0) - (recetaInfo?.inventario?.cantidadUtilizada || 0);
                    
                    return (
                      <div key={index} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg relative">
                        <button
                          type="button"
                          onClick={() => eliminarReceta(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          disabled={enviando}
                        >
                          ×
                        </button>

                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Receta</label>
                          <select
                            value={item.receta}
                            onChange={(e) => actualizarReceta(index, 'receta', e.target.value)}
                            className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                            disabled={enviando || loading}
                            required
                          >
                            <option value="">Seleccionar...</option>
                            {recetasDisponibles.map(rec => {
                              const producida = rec.inventario?.cantidadProducida || 0;
                              const utilizada = rec.inventario?.cantidadUtilizada || 0;
                              const disponibleRec = producida - utilizada;
                              return (
                                <option key={rec._id} value={rec._id}>
                                  {rec.nombre} - Disp: {disponibleRec.toFixed(2)} {rec.rendimiento?.unidadMedida} (Prod: {producida}, Usado: {utilizada})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.cantidadUtilizada}
                            onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                            disabled={enviando}
                            required
                          />
                          {recetaInfo && (
                            <p className="text-xs text-gray-500 mt-1">
                              Disponible: {(disponible - (recetaInfo.inventario?.cantidadUtilizada || 0)).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Operador Responsable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operador Responsable *
              </label>
              {isSuperAdmin ? (
                // Super Admin: Selector de usuarios
                <select
                  value={formData.operador}
                  onChange={(e) => handleInputChange('operador', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  disabled={enviando || loadingUsuarios}
                  required
                >
                  <option value="">Seleccionar operador...</option>
                  {usuarios
                    .filter(u => u.role !== 'de_baja' && u.is_active !== false)
                    .map((usuario) => (
                      <option key={usuario._id} value={usuario.nombre_negocio || usuario.email}>
                        {usuario.nombre_negocio || usuario.email} ({usuario.role})
                      </option>
                    ))}
                </select>
              ) : (
                // Admin/User: Campo readonly con su nombre autocompletado
                <input
                  type="text"
                  value={formData.operador}
                  readOnly
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  title="Tu nombre se completa automáticamente"
                />
              )}
              {!isSuperAdmin && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Tu nombre se completa automáticamente
                </p>
              )}
            </div>

            {/* Fecha y Hora de Producción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Fecha y Hora de Producción
              </label>
              <input
                type="datetime-local"
                value={formData.fechaProduccion}
                onChange={(e) => handleInputChange('fechaProduccion', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={enviando}
              />
              <p className="text-xs text-gray-500 mt-1">
                Selecciona cuándo se realizó la producción
              </p>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (Opcional)
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={enviando}
              />
            </div>

          </div>

          {/* Footer con botones */}
          <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-white">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {enviando ? 'Produciendo...' : '🏭 Producir'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalProducirCantidadSimple;
