/**
 * Componente de Gestion de Metas por Sucursal
 * - Ver sucursales con sus metas configuradas
 * - Configurar metas DIARIAS y MENSUALES con sus bonificaciones
 * - Ver progreso de trabajadores
 * - Evaluar metas y otorgar bonificaciones
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  TrendingUp,
  Award,
  Building2,
  Users,
  Calendar,
  CalendarDays,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Loader2,
  Store,
  Trophy,
  CircleDot,
  Zap
} from 'lucide-react';
import metasSucursalService from '../../../services/metasSucursalService';

// ---- Avatar con foto de perfil ----
const AvatarColab = ({ nombre, avatarUrl, size = 'md' }) => {
  const [err, setErr] = React.useState(false);
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  if (avatarUrl && !err) {
    return <img src={avatarUrl} alt={nombre} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`} onError={() => setErr(true)} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}>
      {(nombre || '?').charAt(0).toUpperCase()}
    </div>
  );
};

// ---- Formato moneda ----
const fmtMoneda = (m) => metasSucursalService.formatearMoneda(m);
const fmtPct = (p) => `${p || 0}%`;

// ============================================================================
// TARJETA DE SUCURSAL
// ============================================================================
const SucursalCard = ({ sucursal, onVerProgreso, onConfigurar }) => {
  const metaActiva = sucursal.metasConfig?.activo;
  const metaMensual = sucursal.metasConfig?.metaMensual || 0;
  const bonifMensual = sucursal.metasConfig?.bonificacionMensual || sucursal.metasConfig?.bonificacionPorCumplimiento || 0;
  const metaDiaria = sucursal.metasConfig?.metaDiaria || 0;
  const bonifDiaria = sucursal.metasConfig?.bonificacionDiaria || 0;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
      metaActiva ? 'border-emerald-200' : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        metaActiva ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100' : 'bg-gray-50/60 border-b border-gray-100'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={16} className={metaActiva ? 'text-emerald-600' : 'text-gray-400'} />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-gray-800 truncate">{sucursal.nombre}</h3>
            {sucursal.ubicacion && <p className="text-[11px] text-gray-400 truncate">{sucursal.ubicacion}</p>}
          </div>
        </div>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
          metaActiva
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : 'text-gray-500 bg-gray-50 border-gray-200'
        }`}>
          {metaActiva ? <><Target size={10} /> Activa</> : 'Sin Meta'}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        {metaActiva ? (
          <div className="space-y-2">
            {metaDiaria > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-orange-50 rounded-xl px-3 py-2 border border-orange-100">
                  <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                    <CalendarDays size={10} /> Meta Diaria
                  </span>
                  <p className="text-sm font-bold text-orange-700">{fmtMoneda(metaDiaria)}</p>
                </div>
                <div className="bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Bonif. Diaria</span>
                  <p className="text-sm font-bold text-amber-700">{fmtMoneda(bonifDiaria)}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                  <Calendar size={10} /> Meta Mensual
                </span>
                <p className="text-sm font-bold text-blue-700">{fmtMoneda(metaMensual)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Bonif. Mensual</span>
                <p className="text-sm font-bold text-emerald-700">{fmtMoneda(bonifMensual)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-4">No hay metas configuradas</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={() => onVerProgreso(sucursal)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all">
          <TrendingUp size={14} /> Ver Progreso
        </button>
        <button onClick={() => onConfigurar(sucursal)}
          className="p-2 rounded-lg border text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100 transition-all">
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL CONFIGURACION
// ============================================================================
const ModalConfiguracion = ({ sucursal, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    activo: false, metaMensual: 0, bonificacionMensual: 0,
    metaDiaria: 0, bonificacionDiaria: 0, tipoMedicion: 'cobros', notas: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sucursal?.metasConfig) {
      setFormData({
        activo: sucursal.metasConfig.activo || false,
        metaMensual: sucursal.metasConfig.metaMensual || 0,
        bonificacionMensual: sucursal.metasConfig.bonificacionMensual || sucursal.metasConfig.bonificacionPorCumplimiento || 0,
        metaDiaria: sucursal.metasConfig.metaDiaria || 0,
        bonificacionDiaria: sucursal.metasConfig.bonificacionDiaria || 0,
        tipoMedicion: sucursal.metasConfig.tipoMedicion || 'cobros',
        notas: sucursal.metasConfig.notas || ''
      });
    }
  }, [sucursal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sucursalId = sucursal?._id || sucursal?.sucursalId;
      if (!sucursalId) throw new Error('No se pudo identificar la sucursal');
      await onSave(sucursalId, formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Target size={18} className="text-blue-600" />
            Configurar Meta
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">{sucursal?.nombre}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs">{error}</div>
          )}

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Sistema de Metas</span>
            <button type="button" onClick={() => setFormData(p => ({ ...p, activo: !p.activo }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.activo ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${formData.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Meta Diaria */}
          <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-100 space-y-2">
            <h4 className="font-medium text-sm text-orange-800 flex items-center gap-1.5"><CalendarDays size={14} /> Meta Diaria</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Meta (S/)</label>
                <input type="number" value={formData.metaDiaria} onChange={(e) => setFormData(p => ({ ...p, metaDiaria: parseFloat(e.target.value) || 0 }))}
                  min="0" step="10" className={inputCls} placeholder="500" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Bonificacion (S/)</label>
                <input type="number" value={formData.bonificacionDiaria} onChange={(e) => setFormData(p => ({ ...p, bonificacionDiaria: parseFloat(e.target.value) || 0 }))}
                  min="0" step="5" className={inputCls} placeholder="20" />
              </div>
            </div>
          </div>

          {/* Meta Mensual */}
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-2">
            <h4 className="font-medium text-sm text-blue-800 flex items-center gap-1.5"><Calendar size={14} /> Meta Mensual</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Meta (S/)</label>
                <input type="number" value={formData.metaMensual} onChange={(e) => setFormData(p => ({ ...p, metaMensual: parseFloat(e.target.value) || 0 }))}
                  min="0" step="100" className={inputCls} placeholder="15000" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Bonificacion (S/)</label>
                <input type="number" value={formData.bonificacionMensual} onChange={(e) => setFormData(p => ({ ...p, bonificacionMensual: parseFloat(e.target.value) || 0 }))}
                  min="0" step="10" className={inputCls} placeholder="200" />
              </div>
            </div>
          </div>

          {/* Tipo medicion */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Medir por</label>
            <select value={formData.tipoMedicion} onChange={(e) => setFormData(p => ({ ...p, tipoMedicion: e.target.value }))} className={inputCls}>
              <option value="cobros">Cobros (montoPagado)</option>
              <option value="ventas">Ventas (montoTotal)</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Notas (opcional)</label>
            <textarea value={formData.notas} onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))} rows={2} className={inputCls} />
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// VISTA PROGRESO SUCURSAL
// ============================================================================
const ProgresoSucursal = ({ sucursal, onVolver }) => {
  const [progreso, setProgreso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [evaluando, setEvaluando] = useState(false);
  const [confirmBonif, setConfirmBonif] = useState(false);

  const sucursalId = sucursal?._id || sucursal?.sucursalId;

  const cargarProgreso = useCallback(async () => {
    if (!sucursalId) { setError('No se pudo identificar la sucursal'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await metasSucursalService.obtenerProgreso(sucursalId, mes, anio);
      setProgreso(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, mes, anio]);

  useEffect(() => { cargarProgreso(); }, [cargarProgreso]);

  const handleEvaluar = async (registrarBonificaciones = false) => {
    if (registrarBonificaciones && !confirmBonif) {
      setConfirmBonif(true);
      return;
    }
    setConfirmBonif(false);
    setEvaluando(true);
    setMensaje(null);
    try {
      const response = await metasSucursalService.evaluarMeta(sucursalId, mes, anio, registrarBonificaciones);
      setMensaje({
        tipo: 'success',
        texto: registrarBonificaciones
          ? `Evaluacion completada. ${response.data?.totalBonificacionesOtorgadas || 0} bonificaciones registradas.`
          : 'Simulacion completada correctamente.'
      });
      await cargarProgreso();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEvaluando(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-blue-400" /></div>;
  }

  const rg = progreso?.resumenGlobal;
  const cfg = progreso?.configuracion;
  const cumplida = rg?.sucursalCumplioMetaMensual;
  const pctGlobal = rg?.porcentajeCumplimientoGlobal || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <button onClick={onVolver} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mb-1 transition-colors">
            <ArrowLeft size={14} /> Volver a Sucursales
          </button>
          <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <Building2 size={20} className="text-blue-600" />
            {sucursal.nombre}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{metasSucursalService.obtenerNombreMes(i + 1)}</option>
            ))}
          </select>
          <input type="number" value={anio} onChange={(e) => setAnio(parseInt(e.target.value))} min="2020" max="2030"
            className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200" />
          <button onClick={cargarProgreso} className="p-1.5 rounded-lg border text-slate-500 border-slate-200 hover:bg-slate-50 transition-all" title="Recargar">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-600 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {mensaje && (
        <div className={`px-4 py-3 rounded-xl text-sm border flex items-center gap-2 ${
          mensaje.tipo === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {mensaje.texto}
          <button onClick={() => setMensaje(null)} className="ml-auto text-current opacity-50 hover:opacity-100"><XCircle size={14} /></button>
        </div>
      )}

      {!progreso?.metaActiva ? (
        <div className="px-4 py-3 rounded-xl text-sm border bg-amber-50 border-amber-200 text-amber-700 flex items-center gap-2">
          <AlertCircle size={16} /> El sistema de metas no esta activo para esta sucursal.
        </div>
      ) : (
        <>
          {/* Resumen global */}
          {rg && (
            <div className={`rounded-2xl p-4 border-2 ${cumplida ? 'bg-emerald-50/60 border-emerald-300' : 'bg-blue-50/60 border-blue-200'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-2 text-gray-800">
                    <Store size={16} className={cumplida ? 'text-emerald-600' : 'text-blue-600'} />
                    Progreso Global de la Sucursal
                    {cumplida && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                        <Trophy size={13} /> Meta Cumplida
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">La meta mensual es para TODA la sucursal combinada</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">
                    {fmtMoneda(rg.montoTotalSucursal)}
                    <span className="text-gray-300 text-base"> / </span>
                    <span className="text-sm font-medium text-gray-500">{fmtMoneda(rg.metaMensual)}</span>
                  </p>
                  <p className={`text-xs font-semibold ${pctGlobal >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {pctGlobal}% completado
                  </p>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="mt-3 w-full bg-gray-200/60 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${cumplida ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(pctGlobal, 100)}%` }} />
              </div>
              {/* Nota bonificacion */}
              {cumplida && cfg?.bonificacionMensual > 0 && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <strong className="flex items-center gap-1"><DollarSign size={12} /> Bonificacion disponible:</strong> {fmtMoneda(cfg.bonificacionMensual)}
                  <br/><span className="text-[11px]">La distribucion de la bonificacion mensual es <strong>MANUAL</strong>. Registre desde el perfil de cada colaborador.</span>
                </div>
              )}
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {cfg?.metaDiaria > 0 && (
              <>
                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                  <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide"><CalendarDays size={10} /> Meta Diaria</span>
                  <p className="text-lg font-bold text-orange-700 mt-1">{fmtMoneda(cfg.metaDiaria)}</p>
                  <p className="text-[10px] text-gray-400">Por colaborador</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide block">Bonif. Diaria</span>
                  <p className="text-lg font-bold text-amber-700 mt-1">{fmtMoneda(cfg.bonificacionDiaria)}</p>
                  <p className="text-[10px] text-gray-400">Automatica</p>
                </div>
              </>
            )}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide"><Calendar size={10} /> Meta Mensual</span>
              <p className="text-lg font-bold text-blue-700 mt-1">{fmtMoneda(cfg?.metaMensual)}</p>
              <p className="text-[10px] text-gray-400">Global (sucursal)</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide block">Bonif. Mensual</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">{fmtMoneda(cfg?.bonificacionMensual || cfg?.bonificacionPorCumplimiento)}</p>
              <p className="text-[10px] text-gray-400">Manual</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide"><Users size={10} /> Trabajadores</span>
              <p className="text-lg font-bold text-purple-700 mt-1">{progreso.resumen?.totalTrabajadores || 0}</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide"><Zap size={10} /> Cumplen Diaria</span>
              <p className="text-lg font-bold text-indigo-700 mt-1">{progreso.resumen?.trabajadoresCumplenDiaria || 0}</p>
            </div>
          </div>

          {/* Tabla de trabajadores */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trabajador</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Alcanzado</th>
                    {cfg?.metaDiaria > 0 && (
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center justify-center gap-1"><CalendarDays size={11} /> Diario</span>
                      </th>
                    )}
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-1"><Calendar size={11} /> Mensual</span>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Bonificacion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {progreso.progresoPorTrabajador?.map((t) => {
                    const colM = metasSucursalService.obtenerColorPorcentaje(t.porcentajeCumplimiento);
                    const colD = metasSucursalService.obtenerColorPorcentaje(t.porcentajeCumplimientoDiario || 0);
                    return (
                      <tr key={t.colaboradorUserId} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <AvatarColab nombre={t.nombreColaborador} avatarUrl={t.avatarUrl} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{t.nombreColaborador}</p>
                              <p className="text-[11px] text-gray-400">{t.cantidadCobros} cobros</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm font-semibold text-gray-700">{fmtMoneda(t.montoAlcanzado)}</span>
                        </td>
                        {cfg?.metaDiaria > 0 && (
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200/60 rounded-full h-2 min-w-[50px]">
                                  <div className={`h-2 rounded-full ${colD.progress}`} style={{ width: `${Math.min(t.porcentajeCumplimientoDiario || 0, 100)}%` }} />
                                </div>
                                <span className={`text-[11px] font-medium ${colD.text} whitespace-nowrap`}>{fmtPct(t.porcentajeCumplimientoDiario)}</span>
                              </div>
                              <p className="text-[10px] text-gray-400">Prom: {fmtMoneda(t.promedioDiario || 0)}/dia</p>
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200/60 rounded-full h-2 min-w-[50px]">
                              <div className={`h-2 rounded-full ${colM.progress}`} style={{ width: `${Math.min(t.porcentajeCumplimiento, 100)}%` }} />
                            </div>
                            <span className={`text-[11px] font-medium ${colM.text} whitespace-nowrap`}>{fmtPct(t.porcentajeCumplimiento)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {cfg?.metaDiaria > 0 && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                t.cumplioMetaDiaria
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : 'text-orange-600 bg-orange-50 border-orange-200'
                              }`}>
                                <CalendarDays size={10} /> {t.cumplioMetaDiaria ? <CheckCircle size={10} /> : <CircleDot size={10} />}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border text-gray-500 bg-gray-50 border-gray-200">
                              <CircleDot size={10} /> Pendiente
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-col gap-0.5 text-right">
                            {cfg?.metaDiaria > 0 && t.bonificacionDiariaPotencial > 0 && (
                              <span className="text-orange-600 text-[11px]"><CalendarDays size={10} className="inline" /> {fmtMoneda(t.bonificacionDiariaPotencial)}</span>
                            )}
                            {t.bonificacionPotencial > 0 && (
                              <span className="text-blue-600 font-medium text-xs border-t border-gray-100 pt-0.5">Auto: {fmtMoneda(t.bonificacionPotencial)}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!progreso.progresoPorTrabajador || progreso.progresoPorTrabajador.length === 0) && (
                    <tr><td colSpan={cfg?.metaDiaria > 0 ? 6 : 5} className="px-4 py-8 text-center text-sm text-gray-400 italic">Sin datos de trabajadores</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Acciones evaluacion */}
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={() => handleEvaluar(false)} disabled={evaluando}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-all">
              <History size={14} /> Simular Evaluacion
            </button>
            <button onClick={() => handleEvaluar(true)} disabled={evaluando}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-all">
              <Award size={14} /> {evaluando ? 'Evaluando...' : 'Evaluar y Registrar Bonificaciones'}
            </button>
          </div>

          {/* Modal confirmacion bonificaciones */}
          {confirmBonif && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-500" /> Confirmar Registro
                  </h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-5">
                    Se registraran las bonificaciones en Gestion de Personal. Esta accion no se puede deshacer.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setConfirmBonif(false)}
                      className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={() => handleEvaluar(true)} disabled={evaluando}
                      className="px-4 py-2 text-sm font-medium border text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 rounded-lg disabled:opacity-50 transition-all">
                      {evaluando ? 'Registrando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const MetasSucursal = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('lista');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [modalConfiguracion, setModalConfiguracion] = useState({ isOpen: false, sucursal: null });

  const cargarSucursales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await metasSucursalService.obtenerSucursalesConMetas();
      setSucursales(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarSucursales(); }, [cargarSucursales]);

  const handleVerProgreso = (s) => { setSucursalSeleccionada(s); setVista('progreso'); };
  const handleConfigurar = (s) => setModalConfiguracion({ isOpen: true, sucursal: s });
  const handleGuardarConfiguracion = async (id, config) => { await metasSucursalService.configurarMeta(id, config); await cargarSucursales(); };
  const handleVolver = () => { setVista('lista'); setSucursalSeleccionada(null); };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-blue-400" /></div>;
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-600">
        <p className="font-medium">Error al cargar sucursales</p>
        <p className="text-xs mt-1">{error}</p>
        <button onClick={cargarSucursales} className="mt-2 text-xs text-red-700 underline hover:no-underline">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Target size={18} className="text-blue-600" />
                Metas y Bonificaciones
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Configura metas diarias y mensuales por sucursal</p>
            </div>
            {vista === 'lista' && (
              <button onClick={cargarSucursales} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100 transition-all">
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {vista === 'lista' ? (
            <>
              {sucursales.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay sucursales registradas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sucursales.map((s) => (
                    <SucursalCard key={s._id || s.sucursalId} sucursal={s} onVerProgreso={handleVerProgreso} onConfigurar={handleConfigurar} />
                  ))}
                </div>
              )}
            </>
          ) : vista === 'progreso' && sucursalSeleccionada ? (
            <ProgresoSucursal sucursal={sucursalSeleccionada} onVolver={handleVolver} />
          ) : null}
        </div>
      </div>

      {/* Modal configuracion */}
      <ModalConfiguracion
        sucursal={modalConfiguracion.sucursal}
        isOpen={modalConfiguracion.isOpen}
        onClose={() => setModalConfiguracion({ isOpen: false, sucursal: null })}
        onSave={handleGuardarConfiguracion}
      />
    </div>
  );
};

export default MetasSucursal;