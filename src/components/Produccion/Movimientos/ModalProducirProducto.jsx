// Modal Producir Stock - v4.0 Panel Rápido con Fórmula Estándar
import React, { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { getFullApiUrl, safeFetch } from '../../../config/api';
import { X, Factory, Loader2, AlertCircle, Zap, Pencil, ClipboardList, Settings, Trash2, Save, RefreshCw, Calendar, Lightbulb, Check, ChevronDown, ChevronRight, DollarSign } from 'lucide-react';

const ModalProducirProducto = ({ isOpen, onClose, producto, onSuccess }) => {
  const { canViewPrices, isSuperAdmin } = useQuickPermissions();
  const { user } = useUser();
  const { getToken } = useAuth();
  
  // Estados principales
  const [cantidadProducir, setCantidadProducir] = useState(1);
  const [operador, setOperador] = useState('');
  const [fechaProduccion, setFechaProduccion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [recetasUtilizadas, setRecetasUtilizadas] = useState([]);
  
  // Estados de UI
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Fórmula estándar
  const [formulaEstandar, setFormulaEstandar] = useState(null);
  const [formulaCargada, setFormulaCargada] = useState(false);
  const [guardarFormula, setGuardarFormula] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  
  // Recetas disponibles (para modo manual)
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [todasLasRecetas, setTodasLasRecetas] = useState([]);
  
  // Config fórmula mini-modal
  const [configFormulaOpen, setConfigFormulaOpen] = useState(false);
  const [configRecetas, setConfigRecetas] = useState([]);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [eliminandoFormula, setEliminandoFormula] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configExito, setConfigExito] = useState('');
  
  // Operador dropdown (solo super_admin)
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [busquedaOperador, setBusquedaOperador] = useState('');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    };
    if (dropdownAbierto) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownAbierto]);

  // Inicializar al abrir
  useEffect(() => {
    if (isOpen && producto) {
      resetear();
      cargarTodo();
    }
  }, [isOpen, producto]);

  const resetear = () => {
    setCantidadProducir(1);
    setOperador('');
    setObservaciones('');
    setFechaProduccion(getLocalDateTimeString());
    setRecetasUtilizadas([]);
    setError('');
    setFormulaCargada(false);
    setGuardarFormula(false);
    setModoManual(false);
    setBusquedaOperador('');
    setDropdownAbierto(false);
  };

  const cargarTodo = async () => {
    setLoading(true);
    try {
      // Cargar en paralelo
      const promises = [cargarRecetas(), cargarFormula()];
      
      if (isSuperAdmin) {
        promises.push(cargarUsuarios());
      } else {
        // Auto-completar operador para admin/user
        setOperador(user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || '');
      }
      
      await Promise.all(promises);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarRecetas = async () => {
    try {
      const response = await movimientoUnificadoService.obtenerProductosPorTipo('recetas');
      const todas = response.data || [];
      setTodasLasRecetas(todas);
      const conStock = todas.filter(
        rec => ((rec.inventario?.cantidadProducida || 0) - (rec.inventario?.cantidadUtilizada || 0)) > 0
      );
      setRecetasDisponibles(conStock);
    } catch (err) {
      console.error('Error al cargar recetas:', err);
    }
  };

  const cargarFormula = async () => {
    try {
      const response = await movimientoUnificadoService.obtenerFormulaEstandar(producto._id);
      const formula = response.data;
      setFormulaEstandar(formula);
      
      if (formula?.activa && formula.recetas?.length > 0) {
        setFormulaCargada(true);
        aplicarFormula(formula, 1);
      } else {
        setGuardarFormula(true);
      }
    } catch (err) {
      console.error('Error al cargar fórmula:', err);
      setGuardarFormula(true);
    }
  };

  const cargarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const token = await getToken();
      const url = `${getFullApiUrl('/gestion-personal/colaboradores')}`;
      const response = await safeFetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(Array.isArray(data) ? data : data.users || []);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // ========== FÓRMULA ESTÁNDAR ==========

  const aplicarFormula = (formula, cantidad) => {
    if (!formula?.recetas) return;
    const recetasAuto = formula.recetas.map(item => ({
      receta: item.receta?._id || item.receta,
      cantidadUtilizada: Math.round((item.cantidadPorUnidad * cantidad) * 100) / 100,
      costoUnitario: item.costoUnitario || 0,
      nombre: item.nombre || ''
    }));
    setRecetasUtilizadas(recetasAuto);
  };

  const handleCantidadChange = (valor) => {
    const v = Math.max(0.01, Math.round(valor * 100) / 100);
    setCantidadProducir(v);
    if (formulaCargada && formulaEstandar?.activa && !modoManual) {
      aplicarFormula(formulaEstandar, v);
    }
  };

  const guardarFormulaDespuesDeProducir = async () => {
    try {
      if (!recetasUtilizadas.length || cantidadProducir <= 0) return;
      const recetasParaFormula = recetasUtilizadas
        .filter(r => r.receta && r.cantidadUtilizada > 0)
        .map(r => ({
          receta: r.receta,
          cantidadPorUnidad: Math.round((r.cantidadUtilizada / cantidadProducir) * 10000) / 10000
        }));
      if (recetasParaFormula.length > 0) {
        await movimientoUnificadoService.guardarFormulaEstandar(producto._id, recetasParaFormula);
      }
    } catch (err) {
      console.error('Error al guardar fórmula:', err);
    }
  };

  // ========== CONFIG FÓRMULA ESTÁNDAR ==========

  const abrirConfigFormula = () => {
    setConfigError('');
    setConfigExito('');
    if (formulaEstandar?.activa && formulaEstandar.recetas?.length > 0) {
      setConfigRecetas(formulaEstandar.recetas.map(r => ({
        receta: r.receta?._id || r.receta,
        nombre: r.nombre || '',
        cantidadPorUnidad: r.cantidadPorUnidad || 0,
        unidadMedida: r.unidadMedida || 'u'
      })));
    } else {
      setConfigRecetas([{ receta: '', nombre: '', cantidadPorUnidad: 0, unidadMedida: 'u' }]);
    }
    setConfigFormulaOpen(true);
  };

  const agregarRecetaConfig = () => {
    setConfigRecetas(prev => [...prev, { receta: '', nombre: '', cantidadPorUnidad: 0, unidadMedida: 'u' }]);
  };

  const eliminarRecetaConfig = (index) => {
    setConfigRecetas(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarRecetaConfig = (index, campo, valor) => {
    setConfigRecetas(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [campo]: valor };
      if (campo === 'receta') {
        const info = todasLasRecetas.find(r => r._id === valor);
        updated.nombre = info?.nombre || '';
        updated.unidadMedida = info?.rendimiento?.unidadMedida || 'u';
      }
      return updated;
    }));
  };

  const guardarConfigFormula = async () => {
    setConfigError('');
    const recetasValidas = configRecetas.filter(r => r.receta && r.cantidadPorUnidad > 0);
    if (recetasValidas.length === 0) {
      return setConfigError('Agrega al menos una receta con cantidad mayor a 0');
    }
    try {
      setGuardandoConfig(true);
      const payload = recetasValidas.map(r => ({
        receta: r.receta,
        cantidadPorUnidad: r.cantidadPorUnidad
      }));
      await movimientoUnificadoService.guardarFormulaEstandar(producto._id, payload);
      // Recargar fórmula
      await cargarFormula();
      setConfigExito('Fórmula guardada correctamente');
      setTimeout(() => {
        setConfigFormulaOpen(false);
        setConfigExito('');
        // Re-aplicar fórmula con la cantidad actual
        if (cantidadProducir > 0) {
          setModoManual(false);
        }
      }, 1000);
    } catch (err) {
      setConfigError(err.message || 'Error al guardar fórmula');
    } finally {
      setGuardandoConfig(false);
    }
  };

  const eliminarConfigFormula = async () => {
    if (!window.confirm('¿Eliminar la fórmula estándar? Deberás configurar las recetas manualmente en cada producción.')) return;
    try {
      setEliminandoFormula(true);
      await movimientoUnificadoService.eliminarFormulaEstandar(producto._id);
      setFormulaEstandar(null);
      setFormulaCargada(false);
      setModoManual(false);
      setRecetasUtilizadas([]);
      setGuardarFormula(true);
      setConfigFormulaOpen(false);
    } catch (err) {
      setConfigError(err.message || 'Error al eliminar fórmula');
    } finally {
      setEliminandoFormula(false);
    }
  };

  // ========== MODO MANUAL ==========

  const agregarReceta = () => {
    setRecetasUtilizadas(prev => [...prev, { receta: '', cantidadUtilizada: 0, costoUnitario: 0 }]);
  };

  const eliminarReceta = (index) => {
    setRecetasUtilizadas(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarReceta = (index, campo, valor) => {
    setRecetasUtilizadas(prev => prev.map((item, i) =>
      i === index ? { ...item, [campo]: valor } : item
    ));
  };

  const obtenerRecetaInfo = (recetaId) => {
    return recetasDisponibles.find(rec => rec._id === recetaId);
  };

  // ========== CÁLCULOS ==========

  const calcularCostoTotal = () => {
    return recetasUtilizadas.reduce((total, item) => {
      const receta = obtenerRecetaInfo(item.receta);
      return total + (item.cantidadUtilizada * (receta?.costoUnitario || item.costoUnitario || 0));
    }, 0);
  };

  // ========== SUBMIT ==========

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cantidadProducir <= 0) return setError('La cantidad debe ser mayor a 0');
    if (!operador.trim()) return setError('El operador es requerido');
    if (recetasUtilizadas.length === 0) return setError('Debe tener al menos una receta');

    for (let i = 0; i < recetasUtilizadas.length; i++) {
      const item = recetasUtilizadas[i];
      if (!item.receta) return setError(`Seleccione receta en posición ${i + 1}`);
      if (item.cantidadUtilizada <= 0) return setError(`Cantidad de receta ${i + 1} debe ser mayor a 0`);

      const info = obtenerRecetaInfo(item.receta);
      const disp = (info?.inventario?.cantidadProducida || 0) - (info?.inventario?.cantidadUtilizada || 0);
      if (item.cantidadUtilizada > disp) {
        return setError(`Stock insuficiente de ${info?.nombre || 'receta'}. Disponible: ${disp.toFixed(2)}`);
      }
    }

    try {
      setEnviando(true);
      await movimientoUnificadoService.agregarCantidad({
        tipoProducto: 'produccion',
        productoId: producto._id,
        cantidad: cantidadProducir,
        motivo: `Producción: ${observaciones?.trim() || 'Producción manual'}`,
        operador: operador.trim(),
        observaciones: observaciones?.trim() || '',
        fechaProduccion,
        costoTotal: calcularCostoTotal(),
        ingredientesUtilizados: [],
        recetasUtilizadas,
        consumirRecursos: true
      });

      if (guardarFormula && recetasUtilizadas.length > 0) {
        await guardarFormulaDespuesDeProducir();
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al producir');
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen || !producto) return null;

  const costoTotal = calcularCostoTotal();
  const esRapido = formulaCargada && formulaEstandar?.activa && !modoManual;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white sm:rounded-2xl shadow-xl border border-gray-100 w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[95vh] flex flex-col overflow-hidden">

        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-4 sm:px-5 py-3 sm:py-4 sm:rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
              <Factory size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{producto.nombre}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {esRapido ? <><Zap size={12} /> Producción rápida</> : <><Pencil size={12} /> Producción manual</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={abrirConfigFormula}
              disabled={enviando || loading}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl transition-colors"
              title="Configurar fórmula estándar"
            >
              <Settings size={18} />
            </button>
            <button onClick={onClose} disabled={enviando} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* ===== LOADING ===== */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Cargando configuración...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">

              {/* ===== PANEL CANTIDAD ===== */}
              <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-500">Actual</div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">{producto.cantidad || producto.stock || 0}</div>
                    <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidad'}</div>
                  </div>
                  <div className="border-x border-blue-200">
                    <div className="text-xs text-gray-500">Producir</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">+{cantidadProducir}</div>
                    <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidad'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Final</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{(producto.cantidad || producto.stock || 0) + cantidadProducir}</div>
                    <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidad'}</div>
                  </div>
                </div>
              </div>

              {/* ===== INPUT CANTIDAD ===== */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad a Producir *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={cantidadProducir}
                  onChange={(e) => handleCantidadChange(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-lg font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                  disabled={enviando}
                  autoFocus
                />
              </div>

              {/* ===== RECETAS AUTO-CALCULADAS (Modo Rápido) ===== */}
              {esRapido && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Zap size={14} className="text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800">Recetas Auto-calculadas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModoManual(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-800 underline"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {recetasUtilizadas.map((item, i) => {
                      const info = obtenerRecetaInfo(item.receta);
                      const disp = info ? (info.inventario?.cantidadProducida || 0) - (info.inventario?.cantidadUtilizada || 0) : 0;
                      const insuficiente = info && item.cantidadUtilizada > disp;
                      const nombre = info?.nombre || item.nombre || formulaEstandar?.recetas?.[i]?.nombre || 'Receta';
                      const unidad = info?.rendimiento?.unidadMedida || formulaEstandar?.recetas?.[i]?.unidadMedida || 'u';
                      const costoReceta = info?.costoUnitario || item.costoUnitario || 0;

                      return (
                        <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded-xl ${insuficiente ? 'bg-red-50 border border-red-200' : 'bg-white/60'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <ClipboardList size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-800 truncate">{nombre}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-bold ${insuficiente ? 'text-red-600' : 'text-emerald-700'}`}>
                              {item.cantidadUtilizada} {unidad}
                            </span>
                            {info && (
                              <span className={`text-xs ${insuficiente ? 'text-red-500' : 'text-gray-400'}`}>
                                /{disp.toFixed(1)}
                              </span>
                            )}
                            {canViewPrices && costoReceta > 0 && (
                              <span className="text-xs text-green-600">
                                S/.{(item.cantidadUtilizada * costoReceta).toFixed(2)}
                              </span>
                            )}
                            {insuficiente && <AlertCircle size={12} className="text-red-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Costo total */}
                  {canViewPrices && costoTotal > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between">
                      <span className="text-xs text-emerald-700 flex items-center gap-1"><DollarSign size={12} /> Costo total</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-800">S/.{costoTotal.toFixed(2)}</span>
                        <span className="text-xs text-emerald-600 ml-2">(S/.{(costoTotal / cantidadProducir).toFixed(2)}/u)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== MODO MANUAL: SELECCIONAR RECETAS ===== */}
              {(!esRapido) && (
                <div className="bg-gray-50/60 border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-white p-2.5 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-gray-500" />
                      <span className="text-xs font-bold text-gray-700">Recetas ({recetasUtilizadas.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formulaCargada && (
                        <button
                          type="button"
                          onClick={() => { setModoManual(false); aplicarFormula(formulaEstandar, cantidadProducir); }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5"
                        >
                          <Zap size={10} /> Usar fórmula
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={agregarReceta}
                        disabled={enviando}
                        className="px-2 py-1 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-medium transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 space-y-2">
                    {recetasUtilizadas.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <ClipboardList size={24} className="mx-auto mb-1 text-gray-300" />
                        <p className="text-xs">Agrega recetas para producir</p>
                      </div>
                    ) : (
                      recetasUtilizadas.map((item, index) => {
                        const info = obtenerRecetaInfo(item.receta);
                        const disp = info ? (info.inventario?.cantidadProducida || 0) - (info.inventario?.cantidadUtilizada || 0) : 0;
                        const insuficiente = info && item.cantidadUtilizada > disp;
                        const costoReceta = info?.costoUnitario || item.costoUnitario || 0;

                        return (
                          <div key={index} className={`border rounded-xl p-2 ${insuficiente ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 space-y-1.5">
                                <select
                                  value={item.receta}
                                  onChange={(e) => {
                                    actualizarReceta(index, 'receta', e.target.value);
                                    const rec = obtenerRecetaInfo(e.target.value);
                                    actualizarReceta(index, 'costoUnitario', rec?.costoUnitario || 0);
                                  }}
                                  className="w-full p-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                  disabled={enviando}
                                >
                                  <option value="">Seleccionar receta...</option>
                                  {recetasDisponibles.map(rec => {
                                    const d = (rec.inventario?.cantidadProducida || 0) - (rec.inventario?.cantidadUtilizada || 0);
                                    return (
                                      <option key={rec._id} value={rec._id}>
                                        {rec.nombre} (Disp: {d.toFixed(1)} {rec.rendimiento?.unidadMedida || 'u'})
                                      </option>
                                    );
                                  })}
                                </select>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={Math.round(item.cantidadUtilizada * 100) / 100}
                                    onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', Math.round((parseFloat(e.target.value) || 0) * 100) / 100)}
                                    className="flex-1 p-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Cantidad"
                                    disabled={enviando}
                                  />
                                  {info && (
                                    <span className={`text-xs flex-shrink-0 ${insuficiente ? 'text-red-500' : 'text-gray-400'}`}>
                                      /{disp.toFixed(1)} {info.rendimiento?.unidadMedida || 'u'}
                                    </span>
                                  )}
                                  {canViewPrices && costoReceta > 0 && (
                                    <span className="text-xs text-green-600 flex-shrink-0">
                                      S/.{(item.cantidadUtilizada * costoReceta).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => eliminarReceta(index)}
                                disabled={enviando}
                                className="p-1 text-red-500 hover:bg-red-50 rounded-xl flex-shrink-0 mt-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Costo total en modo manual */}
                  {canViewPrices && recetasUtilizadas.length > 0 && costoTotal > 0 && (
                    <div className="bg-green-50 px-3 py-2 flex justify-between border-t border-gray-200">
                      <span className="text-xs text-green-700 flex items-center gap-1"><DollarSign size={12} /> Costo total</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-green-800">S/.{costoTotal.toFixed(2)}</span>
                        <span className="text-xs text-green-600 ml-2">(S/.{(costoTotal / cantidadProducir).toFixed(2)}/u)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== GUARDAR FÓRMULA ===== */}
              <label className="flex items-center gap-2 p-2 bg-gray-50/60 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={guardarFormula}
                  onChange={(e) => setGuardarFormula(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                  disabled={enviando}
                />
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  {formulaCargada ? <><RefreshCw size={12} /> Actualizar fórmula estándar</> : <><Save size={12} /> Guardar como fórmula estándar</>}
                </span>
              </label>

              {/* ===== OPERADOR ===== */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Operador *</label>
                {isSuperAdmin ? (
                  <div className="relative" ref={dropdownRef}>
                    <input
                      type="text"
                      value={operador || busquedaOperador}
                      onChange={(e) => { setBusquedaOperador(e.target.value); setOperador(''); setDropdownAbierto(true); }}
                      onFocus={() => setDropdownAbierto(true)}
                      placeholder={loadingUsuarios ? 'Cargando...' : 'Buscar operador...'}
                      className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                      disabled={enviando || loadingUsuarios}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (operador) { setOperador(''); setBusquedaOperador(''); }
                        setDropdownAbierto(!dropdownAbierto);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {operador ? (
                        <X size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                    {dropdownAbierto && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                        {usuarios
                          .filter(u => u.role !== 'de_baja' && u.is_active !== false)
                          .filter(u => {
                            const term = busquedaOperador.toLowerCase();
                            return (u.nombre_negocio || u.email || '').toLowerCase().includes(term);
                          })
                          .map(u => (
                            <div
                              key={u._id}
                              onClick={() => { setOperador(u.nombre_negocio || u.email); setBusquedaOperador(''); setDropdownAbierto(false); }}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs border-b border-gray-100"
                            >
                              <span className="font-medium">{u.nombre_negocio || u.email}</span>
                              <span className="text-gray-400 ml-1">({u.role})</span>
                            </div>
                          ))
                        }
                        {usuarios.filter(u => u.role !== 'de_baja' && u.is_active !== false).filter(u => (u.nombre_negocio || u.email || '').toLowerCase().includes(busquedaOperador.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-gray-400 text-xs text-center">No se encontraron</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={operador}
                    className="w-full p-2 text-sm border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed outline-none"
                    readOnly
                    title="Tu nombre se completa automáticamente"
                  />
                )}
              </div>

              {/* ===== FECHA Y OBSERVACIONES (Colapsable) ===== */}
              <details className="group">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 list-none flex items-center gap-1">
                  <ChevronRight size={12} className="transition-transform group-open:rotate-90" />
                  Más opciones (fecha, observaciones)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Calendar size={12} className="text-gray-400" /> Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      value={fechaProduccion}
                      onChange={(e) => setFechaProduccion(e.target.value)}
                      max={getLocalDateTimeString()}
                      className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={enviando}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={2}
                      className="w-full p-2 text-sm border border-gray-200 rounded-xl resize-none outline-none"
                      placeholder="Notas adicionales..."
                      disabled={enviando}
                    />
                  </div>
                </div>
              </details>

            </div>

            {/* ===== FOOTER ===== */}
            <div className="bg-gray-50/50 border-t border-gray-100 p-3 sm:rounded-b-2xl flex-shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={enviando}
                  className="flex-1 px-3 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !recetasUtilizadas.length}
                  className="flex-1 px-3 py-2.5 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                >
                  {enviando ? <><Loader2 size={14} className="animate-spin" /> Produciendo...</> : <><Factory size={14} /> Producir {cantidadProducir}</>}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ===== MINI-MODAL CONFIG FÓRMULA ESTÁNDAR ===== */}
      {configFormulaOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-4 py-3 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-amber-50 rounded-xl border border-amber-100">
                  <Settings size={16} className="text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">Configurar Fórmula</h4>
                  <p className="text-xs text-gray-500 truncate">{producto.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setConfigFormulaOpen(false)}
                disabled={guardandoConfig}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-xl transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <p className="text-xs text-gray-500 bg-amber-50/60 border border-amber-100 p-2 rounded-xl flex items-start gap-1">
                <Lightbulb size={12} className="text-amber-500 mt-0.5 flex-shrink-0" /> Define cuántas unidades de cada receta se necesitan <strong>por cada unidad</strong> producida de {producto.nombre}.
              </p>

              {/* Mensajes */}
              {configError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-xl flex items-start gap-1.5">
                  <AlertCircle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600">{configError}</p>
                </div>
              )}
              {configExito && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-xl flex items-start gap-1.5">
                  <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-600">{configExito}</p>
                </div>
              )}

              {/* Lista de recetas para configurar */}
              <div className="space-y-2">
                {configRecetas.map((item, index) => {
                  const recetaInfo = todasLasRecetas.find(r => r._id === item.receta);
                  const disp = recetaInfo ? (recetaInfo.inventario?.cantidadProducida || 0) - (recetaInfo.inventario?.cantidadUtilizada || 0) : 0;

                  return (
                    <div key={index} className="border border-gray-100 rounded-xl p-2.5 bg-white">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <select
                            value={item.receta}
                            onChange={(e) => actualizarRecetaConfig(index, 'receta', e.target.value)}
                            className="w-full p-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                            disabled={guardandoConfig}
                          >
                            <option value="">Seleccionar receta...</option>
                            {todasLasRecetas.map(rec => {
                              const d = (rec.inventario?.cantidadProducida || 0) - (rec.inventario?.cantidadUtilizada || 0);
                              return (
                                <option key={rec._id} value={rec._id}>
                                  {rec.nombre} (Stock: {d.toFixed(1)} {rec.rendimiento?.unidadMedida || 'u'})
                                </option>
                              );
                            })}
                          </select>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 flex-shrink-0">Por unidad:</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.cantidadPorUnidad}
                              onChange={(e) => actualizarRecetaConfig(index, 'cantidadPorUnidad', parseFloat(e.target.value) || 0)}
                              className="flex-1 p-1.5 border border-gray-200 rounded-xl text-xs text-center font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                              placeholder="0"
                              disabled={guardandoConfig}
                            />
                            <span className="text-xs text-gray-400 flex-shrink-0">{item.unidadMedida || recetaInfo?.rendimiento?.unidadMedida || 'u'}</span>
                          </div>
                          {recetaInfo && (
                            <div className="text-xs text-gray-400">
                              Stock actual: <span className={disp > 0 ? 'text-green-600' : 'text-red-500'}>{disp.toFixed(1)}</span> {recetaInfo.rendimiento?.unidadMedida || 'u'}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarRecetaConfig(index)}
                          disabled={guardandoConfig || configRecetas.length <= 1}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex-shrink-0 mt-1 disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón agregar */}
              <button
                type="button"
                onClick={agregarRecetaConfig}
                disabled={guardandoConfig}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                + Agregar receta
              </button>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/50 border-t border-gray-100 p-3 flex gap-2 rounded-b-2xl">
              {formulaCargada && (
                <button
                  type="button"
                  onClick={eliminarConfigFormula}
                  disabled={guardandoConfig || eliminandoFormula}
                  className="px-3 py-2 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {eliminandoFormula ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfigFormulaOpen(false)}
                disabled={guardandoConfig}
                className="flex-1 px-3 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarConfigFormula}
                disabled={guardandoConfig || configRecetas.filter(r => r.receta && r.cantidadPorUnidad > 0).length === 0}
                className="flex-1 px-3 py-2 text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {guardandoConfig ? <><Loader2 size={12} className="animate-spin" /> Guardando...</> : <><Save size={12} /> Guardar Fórmula</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalProducirProducto;
