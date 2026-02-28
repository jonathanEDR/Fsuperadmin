// Modal Producir Stock - v4.0 Panel Rápido con Fórmula Estándar
import React, { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { getFullApiUrl, safeFetch } from '../../../config/api';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white sm:rounded-xl shadow-2xl w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[95vh] flex flex-col">

        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 sm:rounded-t-xl">
          <div className="flex items-center gap-2 text-white min-w-0">
            <span className="text-xl flex-shrink-0">🏭</span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate">{producto.nombre}</h3>
              <p className="text-xs opacity-80">
                {esRapido ? '⚡ Producción rápida' : '✏️ Producción manual'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={abrirConfigFormula}
              disabled={enviando || loading}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
              title="Configurar fórmula estándar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button onClick={onClose} disabled={enviando} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">❌ {error}</p>
          </div>
        )}

        {/* ===== LOADING ===== */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Cargando configuración...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">

              {/* ===== PANEL CANTIDAD ===== */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
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
                  className="w-full p-2.5 text-lg font-bold border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  disabled={enviando}
                  autoFocus
                />
              </div>

              {/* ===== RECETAS AUTO-CALCULADAS (Modo Rápido) ===== */}
              {esRapido && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">⚡</span>
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
                        <div key={i} className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${insuficiente ? 'bg-red-50 border border-red-200' : 'bg-white/60'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm flex-shrink-0">📋</span>
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
                            {insuficiente && <span className="text-xs">❌</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Costo total */}
                  {canViewPrices && costoTotal > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between">
                      <span className="text-xs text-emerald-700">💰 Costo total</span>
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
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">📋</span>
                      <span className="text-xs font-bold text-gray-700">Recetas ({recetasUtilizadas.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formulaCargada && (
                        <button
                          type="button"
                          onClick={() => { setModoManual(false); aplicarFormula(formulaEstandar, cantidadProducir); }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          ⚡ Usar fórmula
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={agregarReceta}
                        disabled={enviando}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 space-y-2">
                    {recetasUtilizadas.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <div className="text-2xl mb-1">📋</div>
                        <p className="text-xs">Agrega recetas para producir</p>
                      </div>
                    ) : (
                      recetasUtilizadas.map((item, index) => {
                        const info = obtenerRecetaInfo(item.receta);
                        const disp = info ? (info.inventario?.cantidadProducida || 0) - (info.inventario?.cantidadUtilizada || 0) : 0;
                        const insuficiente = info && item.cantidadUtilizada > disp;
                        const costoReceta = info?.costoUnitario || item.costoUnitario || 0;

                        return (
                          <div key={index} className={`border rounded-lg p-2 ${insuficiente ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 space-y-1.5">
                                <select
                                  value={item.receta}
                                  onChange={(e) => {
                                    actualizarReceta(index, 'receta', e.target.value);
                                    const rec = obtenerRecetaInfo(e.target.value);
                                    actualizarReceta(index, 'costoUnitario', rec?.costoUnitario || 0);
                                  }}
                                  className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500"
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
                                    className="flex-1 p-1.5 border border-gray-300 rounded text-xs focus:ring-blue-500"
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
                                className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0 mt-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
                      <span className="text-xs text-green-700">💰 Costo total</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-green-800">S/.{costoTotal.toFixed(2)}</span>
                        <span className="text-xs text-green-600 ml-2">(S/.{(costoTotal / cantidadProducir).toFixed(2)}/u)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== GUARDAR FÓRMULA ===== */}
              <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={guardarFormula}
                  onChange={(e) => setGuardarFormula(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                  disabled={enviando}
                />
                <span className="text-xs text-gray-600">
                  {formulaCargada ? '🔄 Actualizar fórmula estándar' : '💾 Guardar como fórmula estándar'}
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
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
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
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    {dropdownAbierto && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-36 overflow-y-auto">
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
                    className="w-full p-2 text-sm border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                    readOnly
                    title="Tu nombre se completa automáticamente"
                  />
                )}
              </div>

              {/* ===== FECHA Y OBSERVACIONES (Colapsable) ===== */}
              <details className="group">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 list-none flex items-center gap-1">
                  <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  Más opciones (fecha, observaciones)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">📅 Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      value={fechaProduccion}
                      onChange={(e) => setFechaProduccion(e.target.value)}
                      max={getLocalDateTimeString()}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={enviando}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      rows={2}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none"
                      placeholder="Notas adicionales..."
                      disabled={enviando}
                    />
                  </div>
                </div>
              </details>

            </div>

            {/* ===== FOOTER ===== */}
            <div className="border-t border-gray-200 p-3 bg-white sm:rounded-b-xl">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={enviando}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !recetasUtilizadas.length}
                  className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {enviando ? 'Produciendo...' : `🏭 Producir ${cantidadProducir}`}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ===== MINI-MODAL CONFIG FÓRMULA ESTÁNDAR ===== */}
      {configFormulaOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-xl">
              <div className="flex items-center gap-2 text-white min-w-0">
                <span className="text-lg">⚙️</span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold truncate">Configurar Fórmula</h4>
                  <p className="text-xs opacity-80 truncate">{producto.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setConfigFormulaOpen(false)}
                disabled={guardandoConfig}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <p className="text-xs text-gray-500 bg-amber-50 p-2 rounded-lg">
                💡 Define cuántas unidades de cada receta se necesitan <strong>por cada unidad</strong> producida de {producto.nombre}.
              </p>

              {/* Mensajes */}
              {configError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">❌ {configError}</p>
                </div>
              )}
              {configExito && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-600">✅ {configExito}</p>
                </div>
              )}

              {/* Lista de recetas para configurar */}
              <div className="space-y-2">
                {configRecetas.map((item, index) => {
                  const recetaInfo = todasLasRecetas.find(r => r._id === item.receta);
                  const disp = recetaInfo ? (recetaInfo.inventario?.cantidadProducida || 0) - (recetaInfo.inventario?.cantidadUtilizada || 0) : 0;

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-2.5 bg-white">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <select
                            value={item.receta}
                            onChange={(e) => actualizarRecetaConfig(index, 'receta', e.target.value)}
                            className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-amber-500 focus:border-amber-500"
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
                              className="flex-1 p-1.5 border border-gray-300 rounded text-xs text-center font-medium focus:ring-amber-500"
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
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded flex-shrink-0 mt-1 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                + Agregar receta
              </button>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 flex gap-2">
              {formulaCargada && (
                <button
                  type="button"
                  onClick={eliminarConfigFormula}
                  disabled={guardandoConfig || eliminandoFormula}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {eliminandoFormula ? '...' : '🗑️'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfigFormulaOpen(false)}
                disabled={guardandoConfig}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarConfigFormula}
                disabled={guardandoConfig || configRecetas.filter(r => r.receta && r.cantidadPorUnidad > 0).length === 0}
                className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {guardandoConfig ? 'Guardando...' : '💾 Guardar Fórmula'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalProducirProducto;
