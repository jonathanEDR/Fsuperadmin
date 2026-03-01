import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { getFullApiUrl, safeFetch } from '../../../config/api';
import { useAuth } from '@clerk/clerk-react';
import { X, Factory, Loader2, AlertCircle, BarChart3, Plus, Target, Zap, Pencil, Lightbulb, RefreshCw, Save, Calendar, Carrot, CakeSlice, AlertTriangle, Trash2, Check } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
              <Factory size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
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
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Stock Actual */}
            <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1"><BarChart3 size={13} className="text-gray-500" /> Cantidad Actual</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {producto.stock || 0}
                  </div>
                  <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidad'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1"><Plus size={13} className="text-gray-500" /> A Producir</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{formData.cantidadProducir}
                  </div>
                  <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidad'}</div>
                </div>
              </div>
              
              {/* Stock Final Proyectado */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1"><Target size={13} className="text-gray-500" /> Stock Final</div>
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
                className="w-full p-3 border border-gray-200 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={enviando}
                required
              />
            </div>

            {/* 🎯 Indicador de Fórmula Estándar */}
            {formulaCargada && formulaEstandar?.activa && !modoManual ? (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-emerald-600" />
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
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pencil size={16} className="text-amber-600" />
                    <p className="text-sm font-bold text-amber-800">Modo Manual</p>
                  </div>
                  <button type="button" onClick={() => { setModoManual(false); aplicarFormula(formulaEstandar, formData.cantidadProducir); }} className="text-xs text-amber-600 hover:text-amber-800 underline">
                    Volver a fórmula
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Sin Fórmula Estándar</p>
                    <p className="text-xs text-blue-700">Agrega recetas y marca "Guardar como fórmula" para auto-calcular.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox guardar fórmula */}
            <label className="flex items-center gap-2 p-2 bg-gray-50/60 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={guardarComoFormula}
                onChange={(e) => setGuardarComoFormula(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
                disabled={enviando}
              />
              <span className="text-xs text-gray-700 flex items-center gap-1">
                {formulaCargada && formulaEstandar?.activa
                  ? <><RefreshCw size={12} /> Actualizar fórmula estándar</>
                  : <><Save size={12} /> Guardar como fórmula estándar</>
                }
              </span>
            </label>

            {/* Ingredientes Utilizados */}
            <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Carrot size={14} className="text-green-600" /> Ingredientes (Opcional)
                  {ingredientesDisponibles.length > 0 && (
                    <span className="ml-1 text-xs text-green-600">
                      ({ingredientesDisponibles.length} disponible{ingredientesDisponibles.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={agregarIngrediente}
                  disabled={enviando || loading || ingredientesDisponibles.length === 0}
                  className="text-xs text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-1 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  title={ingredientesDisponibles.length === 0 ? 'No hay ingredientes con stock disponible' : 'Agregar ingrediente'}
                >
                  + Agregar
                </button>
              </div>

              {ingredientesDisponibles.length === 0 && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-amber-700 font-medium flex items-center justify-center gap-1"><AlertTriangle size={14} /> No hay ingredientes con stock disponible</p>
                  <p className="text-xs text-amber-600 mt-1">Agrega entrada de inventario primero</p>
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
                      <div key={index} className="flex gap-2 items-end bg-white p-3 rounded-xl border border-gray-100 relative">
                        <button
                          type="button"
                          onClick={() => eliminarIngrediente(index)}
                          className="absolute -top-2 -right-2 bg-red-50 text-red-500 border border-red-200 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-100"
                          disabled={enviando}
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ingrediente</label>
                          <select
                            value={item.ingrediente}
                            onChange={(e) => actualizarIngrediente(index, 'ingrediente', e.target.value)}
                            className="w-full text-sm p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                            className="w-full text-sm p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
            <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <CakeSlice size={14} className="text-purple-600" /> Recetas (Opcional)
                  {recetasDisponibles.length > 0 && (
                    <span className="ml-1 text-xs text-purple-600">
                      ({recetasDisponibles.length} disponible{recetasDisponibles.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={agregarReceta}
                  disabled={enviando || loading || recetasDisponibles.length === 0}
                  className="text-xs text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 px-3 py-1 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  title={recetasDisponibles.length === 0 ? 'No hay recetas con stock disponible' : 'Agregar receta'}
                >
                  + Agregar
                </button>
              </div>

              {recetasDisponibles.length === 0 && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-amber-700 font-medium flex items-center justify-center gap-1"><AlertTriangle size={14} /> No hay recetas con stock disponible</p>
                  <p className="text-xs text-amber-600 mt-1">Produce recetas primero</p>
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
                      <div key={index} className="flex gap-2 items-end bg-white p-3 rounded-xl border border-gray-100 relative">
                        <button
                          type="button"
                          onClick={() => eliminarReceta(index)}
                          className="absolute -top-2 -right-2 bg-red-50 text-red-500 border border-red-200 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-100"
                          disabled={enviando}
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Receta</label>
                          <select
                            value={item.receta}
                            onChange={(e) => actualizarReceta(index, 'receta', e.target.value)}
                            className="w-full text-sm p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
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
                            className="w-full text-sm p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
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
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                  title="Tu nombre se completa automáticamente"
                />
              )}
              {!isSuperAdmin && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Check size={12} className="text-green-500" /> Tu nombre se completa automáticamente
                </p>
              )}
            </div>

            {/* Fecha y Hora de Producción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-500" /> Fecha y Hora de Producción
              </label>
              <input
                type="datetime-local"
                value={formData.fechaProduccion}
                onChange={(e) => handleInputChange('fechaProduccion', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                disabled={enviando}
              />
            </div>

          </div>

          {/* Footer con botones */}
          <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 rounded-b-2xl flex-shrink-0">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 px-4 py-2.5 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2"
              >
                {enviando ? <><Loader2 size={16} className="animate-spin" /> Produciendo...</> : <><Factory size={16} /> Producir</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalProducirCantidadSimple;
