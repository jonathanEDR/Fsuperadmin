import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Edit2, Trash2, MapPin, CheckCircle, XCircle,
  Search, RefreshCw, Map, Users, User, AlertCircle, X, Save,
  UserCheck, UserX, ArrowRightLeft, ClipboardList, Clock, Check, Play, Zap, ListTodo, Loader2, Calendar, Eye
} from 'lucide-react';

// Helper para obtener la URL del avatar del trabajador
const getAvatarUrl = (t) => t?.avatar_url || t?.avatar?.url || null;
import { getAllSucursales, deleteSucursal } from '../services/sucursalService';
import api from '../services/api';
import SucursalFormModal from '../components/sucursales/SucursalFormModal';
import CalendarioSucursal from '../components/sucursales/CalendarioSucursal';
import { asignacionSucursalService } from '../services/asignacionSucursalService';

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ color, icon: Icon, label, value }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 flex items-center gap-3">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colors[color] || colors.blue} flex items-center justify-center flex-shrink-0`}>
        <Icon className="text-white" size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs sm:text-sm font-medium text-gray-600 leading-snug">{label}</p>
      </div>
    </div>
  );
};

// ─── Modal para asignar trabajador a sucursal ────────────────────────────────
const AsignarTrabajadorModal = ({ isOpen, onClose, onSaved, trabajador, sucursales }) => {
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && trabajador) {
      setSucursalSeleccionada(
        trabajador.sucursalEfectiva?._id?.toString() || 
        trabajador.sucursalActual?._id?.toString() || 
        ''
      );
      setError('');
    }
  }, [isOpen, trabajador]);

  const handleAsignar = async () => {
    try {
      setSaving(true);
      setError('');
      await api.put('/api/sucursales/asignar-trabajador', {
        userId: trabajador._id || trabajador.clerk_id,
        sucursalId: sucursalSeleccionada || null
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al asignar');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !trabajador) return null;

  const sucursalesActivas = sucursales.filter(s => s.activo !== false);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="text-green-600" size={20} />
            Asignar Sucursal
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Info del trabajador */}
          <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            {getAvatarUrl(trabajador) ? (
              <img src={getAvatarUrl(trabajador)} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                {(trabajador.nombre_negocio || trabajador.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800">{trabajador.nombre_negocio || trabajador.email}</p>
              <p className="text-xs text-gray-500">{trabajador.email}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">
                {trabajador.role} · {trabajador.departamento || 'Sin departamento'}
              </p>
            </div>
          </div>

          {/* Sucursal actual */}
          {(trabajador.sucursalEfectiva || trabajador.sucursalActual) && (
            <div className={`border rounded-xl px-4 py-2 ${
              trabajador.fuenteAsignacion === 'calendario' ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'
            }`}>
              <p className={`text-xs font-medium mb-0.5 ${
                trabajador.fuenteAsignacion === 'calendario' ? 'text-indigo-600' : 'text-blue-600'
              }`}>
                Sucursal actual {trabajador.fuenteAsignacion === 'calendario' ? '(desde calendario)' : '(permanente)'}:
              </p>
              <p className={`text-sm font-semibold ${
                trabajador.fuenteAsignacion === 'calendario' ? 'text-indigo-800' : 'text-blue-800'
              }`}>
                {trabajador.sucursalEfectiva?.nombre || trabajador.sucursalActual?.nombre}
              </p>
            </div>
          )}

          {/* Selector de sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asignar a sucursal
            </label>
            <select
              value={sucursalSeleccionada}
              onChange={(e) => setSucursalSeleccionada(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Sin asignar (remover de sucursal)</option>
              {sucursalesActivas.map(s => (
                <option key={s._id} value={s._id}>
                  {s.nombre} — {s.ubicacion}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleAsignar}
              disabled={saving}
              className="px-5 py-2 text-sm text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : sucursalSeleccionada ? <UserCheck size={16} /> : <UserX size={16} />}
              {saving ? 'Guardando...' : sucursalSeleccionada ? 'Asignar' : 'Remover'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Gestión de Tareas del Día ────────────────────────────────────────
const TareasHoyModal = ({ isOpen, onClose, sucursalId, sucursalNombre, onActualizado }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!isOpen || !sucursalId) { setData(null); setSavedIds(new Set()); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/sucursales/${sucursalId}/tareas-hoy`);
        setData(res.data);
        const init = {};
        for (const t of res.data.tareas) {
          init[t._id] = { usuarioId: t.asignadoA || '', usuarioNombre: t.asignadoNombre || '' };
        }
        setPending(init);
        setSavedIds(new Set());
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    })();
  }, [isOpen, sucursalId]);

  const seleccionar = (tareaId, usuarioId) => {
    const u = (data?.usuariosHoy || []).find(u => u.usuarioId === usuarioId);
    setPending(p => ({ ...p, [tareaId]: { usuarioId, usuarioNombre: u?.usuarioNombre || '' } }));
    setSavedIds(prev => { const s = new Set(prev); s.delete(tareaId); return s; });
  };

  const guardar = async (tareaId) => {
    const { usuarioId, usuarioNombre } = pending[tareaId] || {};
    setSavingId(tareaId);
    try {
      await api.put(`/api/sucursales/tareas/${tareaId}/asignar`, {
        usuarioId: usuarioId || null,
        usuarioNombre: usuarioNombre || null
      });
      setSavedIds(prev => new Set([...prev, tareaId]));
      setData(prev => ({
        ...prev,
        tareas: prev.tareas.map(t => t._id === tareaId
          ? { ...t, asignadoA: usuarioId || null, asignadoNombre: usuarioNombre || null }
          : t)
      }));
      if (onActualizado) onActualizado();
    } catch { /* silencioso */ }
    finally { setSavingId(null); }
  };

  if (!isOpen) return null;

  const tareas = data?.tareas || [];
  const sinAsignar = tareas.filter(t => !t.asignadoA).length;
  const PRIORIDAD = { urgente: 'bg-red-100 text-red-700', alta: 'bg-orange-100 text-orange-700', media: 'bg-yellow-100 text-yellow-700', baja: 'bg-gray-100 text-gray-600' };
  const ESTADO = { pendiente: 'text-amber-600', en_progreso: 'text-blue-600', completada: 'text-green-600', en_revision: 'text-purple-600' };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="text-blue-600" size={20} />
              Tareas del Día
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{sucursalNombre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Stats bar */}
        {data && (
          <div className="px-5 py-2.5 border-b border-gray-100 flex gap-4 flex-wrap text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <ListTodo size={14} className="text-gray-400" />Total: <strong>{tareas.length}</strong>
            </span>
            <span className={`flex items-center gap-1 ${sinAsignar > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              <AlertCircle size={14} />Sin asignar: <strong>{sinAsignar}</strong>
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <Users size={14} />Trabajadores hoy: <strong>{data.usuariosHoy?.length || 0}</strong>
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <Check size={14} />Completadas: <strong>{tareas.filter(t => t.estado === 'completada').length}</strong>
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay tareas para hoy en esta sucursal</p>
              <p className="text-gray-400 text-sm mt-1">Las tareas se generan al inicio del día si hay trabajadores asignados al calendario</p>
            </div>
          ) : (
            <>
              {/* Usuarios hoy */}
              {(data?.usuariosHoy || []).length > 0 && (
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                    <Users size={13} /> Trabajadores disponibles hoy ({data.usuariosHoy.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.usuariosHoy.map(u => (
                      <span key={u.usuarioId} className="text-xs px-2.5 py-1 bg-white rounded-full border border-blue-200 text-blue-700 font-medium">
                        {u.usuarioNombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de tareas */}
              {tareas.map(t => {
                const asign = pending[t._id] || {};
                const changed = asign.usuarioId !== (t.asignadoA || '');
                const isSaved = savedIds.has(t._id) && !changed;
                const isSaving = savingId === t._id;
                const estaCompletada = t.estado === 'completada';
                return (
                  <div key={t._id} className={`rounded-xl border p-4 ${
                    !asign.usuarioId && !estaCompletada ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100 bg-white'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORIDAD[t.prioridad] || PRIORIDAD.media}`}>{t.prioridad}</span>
                          <span className={`text-[10px] font-medium capitalize ${ESTADO[t.estado] || 'text-gray-500'}`}>{t.estado?.replace('_', ' ')}</span>
                          {t.esPermanente && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-0.5">
                              <RefreshCw size={9} /> Diaria
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-semibold ${estaCompletada ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.titulo}</p>
                        {t.asignadoA && !changed && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <UserCheck size={11} className="text-green-500" />{t.asignadoNombre}
                          </p>
                        )}
                        {!asign.usuarioId && !estaCompletada && (
                          <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-1">
                            <AlertCircle size={11} /> Sin asignar
                          </p>
                        )}
                      </div>
                      {!estaCompletada && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select
                            value={asign.usuarioId || ''}
                            onChange={e => seleccionar(t._id, e.target.value)}
                            disabled={isSaving}
                            className={`text-sm border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-[140px] ${
                              !asign.usuarioId ? 'border-orange-200 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-800'
                            }`}
                          >
                            <option value="">— Sin asignar —</option>
                            {(data?.usuariosHoy || []).map(u => (
                              <option key={u.usuarioId} value={u.usuarioId}>{u.usuarioNombre}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => guardar(t._id)}
                            disabled={!changed || isSaving}
                            className={`px-3 py-1.5 text-xs rounded-xl border font-medium transition-all flex items-center gap-1 disabled:opacity-40 ${
                              isSaved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 disabled:hover:bg-blue-50'
                            }`}
                          >
                            {isSaving ? <Loader2 size={13} className="animate-spin" /> : isSaved ? <Check size={13} /> : <UserCheck size={13} />}
                            {isSaving ? 'Guardando' : isSaved ? 'Guardado' : 'Asignar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const SucursalesPage = () => {
  const [tab, setTab] = useState('sucursales');
  const [sucursales, setSucursales] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loadingSuc, setLoadingSuc] = useState(true);
  const [loadingTrab, setLoadingTrab] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalSucursal, setModalSucursal] = useState({ open: false, editar: null });
  const [modalAsignar, setModalAsignar] = useState({ open: false, trabajador: null });
  const [modalTareasHoy, setModalTareasHoy] = useState({ open: false, sucursalId: null, sucursalNombre: '' });
  const [confirmEliminar, setConfirmEliminar] = useState({ open: false, id: null, nombre: '' });

  // Tareas por sucursal
  const [tareasResumen, setTareasResumen] = useState({});

  // Asignaciones de hoy (calendario)
  const [asignacionesHoy, setAsignacionesHoy] = useState({});

  // Toast simple
  const [toast, setToast] = useState(null);
  const showToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Carga datos ──
  const cargarSucursales = useCallback(async () => {
    try {
      setLoadingSuc(true);
      const data = await getAllSucursales();
      const lista = data?.sucursales || data || [];
      setSucursales(Array.isArray(lista) ? lista : []);
    } catch {
      showToast('Error al cargar sucursales', 'error');
    } finally {
      setLoadingSuc(false);
    }
  }, []);

  const cargarTrabajadores = useCallback(async () => {
    try {
      setLoadingTrab(true);
      const res = await api.get('/api/sucursales/trabajadores/completo');
      const lista = res.data?.trabajadores || [];
      setTrabajadores(Array.isArray(lista) ? lista : []);
    } catch {
      showToast('Error al cargar trabajadores', 'error');
    } finally {
      setLoadingTrab(false);
    }
  }, []);

  const cargarTareasResumen = useCallback(async () => {
    try {
      const res = await api.get('/api/sucursales/tareas-resumen');
      setTareasResumen(res.data?.resumen || {});
    } catch {
      // Silencioso - las tareas son info complementaria
    }
  }, []);

  const cargarAsignacionesHoy = useCallback(async () => {
    try {
      const data = await asignacionSucursalService.obtenerAsignacionesHoy();
      setAsignacionesHoy(data || {});
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    cargarSucursales();
    cargarTrabajadores();
    cargarTareasResumen();
    cargarAsignacionesHoy();
  }, []);

  // ── Acciones ──
  const handleEliminarSucursal = async () => {
    try {
      await deleteSucursal(confirmEliminar.id);
      showToast('Sucursal eliminada');
      cargarSucursales();
      cargarTrabajadores();
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setConfirmEliminar({ open: false, id: null, nombre: '' });
    }
  };

  // ── Filtrado ──
  const sucursalesFiltradas = sucursales.filter(s =>
    !busqueda || s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.ubicacion?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const trabajadoresFiltrados = trabajadores.filter(t => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      t.nombre_negocio?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.sucursalActual?.nombre?.toLowerCase().includes(q) ||
      t.sucursalEfectiva?.nombre?.toLowerCase().includes(q) ||
      t.departamento?.toLowerCase().includes(q)
    );
  });

  // ── Stats ──
  const statsSuc = {
    total: sucursales.length,
    activas: sucursales.filter(s => s.activo !== false).length,
    inactivas: sucursales.filter(s => s.activo === false).length,
    conMapa: sucursales.filter(s => s.coordenadasConfiguradas).length,
  };

  const statsTrab = {
    total: trabajadores.length,
    asignados: trabajadores.filter(t => t.sucursalEfectiva).length,
    sinAsignar: trabajadores.filter(t => !t.sucursalEfectiva).length,
    desdeCalendario: trabajadores.filter(t => t.fuenteAsignacion === 'calendario').length,
  };

  // Agrupar trabajadores por sucursal (usando asignación efectiva)
  const trabajadoresPorSucursal = (sucursalId) =>
    trabajadores.filter(t => {
      const efectivaId = t.sucursalEfectiva?._id?.toString();
      return efectivaId === sucursalId?.toString();
    });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all border ${
          toast.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.tipo === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmEliminar.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm">
            <AlertCircle className="text-red-500 mx-auto mb-3" size={40} />
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">¿Eliminar sucursal?</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Se eliminará <strong>{confirmEliminar.nombre}</strong> de forma permanente. Los trabajadores asignados serán desvinculados automáticamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar({ open: false, id: null, nombre: '' })}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarSucursal}
                className="flex-1 px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="text-white" size={20} />
          </div>
          Gestión de Sucursales
        </h1>
        <p className="text-sm text-gray-500 mt-1 ml-[52px]">Administra sucursales y asigna trabajadores a sus lugares de trabajo</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-200 rounded-xl p-1 mb-6">
        {[
          { key: 'sucursales', label: 'Sucursales', mobileLabel: 'Sucursales', icon: Building2, count: statsSuc.total },
          { key: 'personal', label: 'Personal y Calendario', mobileLabel: 'Personal', icon: Users, count: statsTrab.total },
        ].map(({ key, label, mobileLabel, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setBusqueda(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="sm:hidden">{mobileLabel}</span>
            <span className="hidden sm:inline">{label}</span>
            {count !== undefined && (
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                tab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-300 text-gray-600'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ╔═══════════════════════════════════════╗ */}
      {/* ║          TAB: SUCURSALES              ║ */}
      {/* ╚═══════════════════════════════════════╝ */}
      {tab === 'sucursales' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard color="blue" icon={Building2} label="Total" value={statsSuc.total} />
            <StatCard color="green" icon={CheckCircle} label="Activas" value={statsSuc.activas} />
            <StatCard color="red" icon={XCircle} label="Inactivas" value={statsSuc.inactivas} />
            <StatCard color="purple" icon={Map} label="Con mapa" value={statsSuc.conMapa} />
          </div>

          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar sucursal..."
              />
            </div>
            <button
              onClick={() => { cargarSucursales(); cargarTrabajadores(); cargarTareasResumen(); cargarAsignacionesHoy(); }}
              className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={loadingSuc ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={() => setModalSucursal({ open: true, editar: null })}
              className="w-full sm:w-auto px-5 py-2.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Nueva Sucursal
            </button>
          </div>

          {/* Grid de sucursales */}
          {loadingSuc ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : sucursalesFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Building2 className="text-gray-300 mx-auto mb-3" size={48} />
              <p className="text-gray-500 font-medium">No hay sucursales</p>
              <p className="text-gray-400 text-sm mt-1">Crea la primera sucursal haciendo click en "Nueva Sucursal"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sucursalesFiltradas.map(suc => {
                const trab = trabajadoresPorSucursal(suc._id);
                return (
                  <div key={suc._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                    {/* Card header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Building2 className="text-white" size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-base leading-tight">{suc.nombre}</p>
                            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                              suc.activo !== false
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {suc.activo !== false ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                        </div>
                        {/* Badges */}
                        <div className="flex flex-col gap-1 items-end">
                          <div className="bg-blue-50 border border-blue-100 rounded-xl px-2.5 py-1 text-blue-700 text-xs font-medium flex items-center gap-1">
                            <Users size={13} />
                            {trab.length}
                          </div>
                          {tareasResumen[suc._id]?.total > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1 text-amber-700 text-xs font-medium flex items-center gap-1">
                              <ClipboardList size={12} />
                              {tareasResumen[suc._id].completadas}/{tareasResumen[suc._id].total}
                            </div>
                          )}
                          {tareasResumen[suc._id]?.sinAsignar > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1 text-orange-600 text-xs font-medium flex items-center gap-1">
                              <AlertCircle size={12} />
                              {tareasResumen[suc._id].sinAsignar} pendiente
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="text-gray-400 flex-shrink-0 mt-0.5" size={15} />
                        <p className="text-sm text-gray-600 leading-snug">{suc.ubicacion || 'Sin dirección'}</p>
                      </div>

                      {suc.descripcion && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 line-clamp-2">
                          {suc.descripcion}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        {suc.coordenadasConfiguradas ? (
                          <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                            <Map size={12} /> Mapa configurado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                            <Map size={12} /> Sin mapa
                          </span>
                        )}
                      </div>

                      {/* Trabajadores asignados */}
                      {trab.length > 0 && (
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">Trabajadores ({trab.length}):</p>
                          <div className="space-y-1.5">
                            {trab.slice(0, 3).map(t => (
                              <div key={t._id} className="flex items-center gap-2 text-xs">
                                {getAvatarUrl(t) ? (
                                  <img src={getAvatarUrl(t)} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold">
                                    {(t.nombre_negocio || t.email || '?')[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="text-gray-700 truncate">{t.nombre_negocio || t.email}</span>
                              </div>
                            ))}
                            {trab.length > 3 && (
                              <p className="text-xs text-gray-400 pl-7">+{trab.length - 3} más</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Asignado hoy (desde el Calendario) */}
                      {(() => {
                        const asigHoy = asignacionesHoy[suc._id];
                        if (!asigHoy || asigHoy.trabajadores.length === 0) return null;
                        return (
                          <div className="border-t border-gray-100 pt-3">
                            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                              <Calendar size={12} className="text-indigo-500" />
                              Asignado hoy ({asigHoy.trabajadores.length}):
                            </p>
                            <div className="space-y-1.5">
                              {asigHoy.trabajadores.map((t, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold">
                                    {(t.usuarioNombre || '?')[0].toUpperCase()}
                                  </div>
                                  <span className="text-gray-700 truncate">{t.usuarioNombre}</span>
                                  {t.tareasCreadas && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                                      Tareas creadas
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Tareas de hoy para esta sucursal */}
                      {(() => {
                        const resumen = tareasResumen[suc._id];
                        if (!resumen || resumen.total === 0) {
                          return (
                            <div className="border-t border-gray-100 pt-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                  <ClipboardList size={12} /> Sin tareas hoy
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="border-t border-gray-100 pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <ClipboardList size={12} /> Tareas hoy ({resumen.total})
                              </p>
                              <div className="flex items-center gap-1.5">
                                {resumen.completadas > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-0.5">
                                    <Check size={9} />{resumen.completadas}
                                  </span>
                                )}
                                {resumen.enProgreso > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-0.5">
                                    <Play size={9} />{resumen.enProgreso}
                                  </span>
                                )}
                                {resumen.pendientes > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-0.5">
                                    <Clock size={9} />{resumen.pendientes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              {resumen.tareas.slice(0, 3).map(t => {
                                const iconoEstado = t.estado === 'completada'
                                  ? <Check size={10} className="text-green-500" />
                                  : t.estado === 'en_progreso'
                                    ? <Play size={10} className="text-blue-500" />
                                    : <Clock size={10} className="text-amber-500" />;
                                return (
                                  <div key={t._id} className="flex items-center gap-2 text-xs">
                                    <div className="flex-shrink-0">{iconoEstado}</div>
                                    <span className={`truncate ${
                                      t.estado === 'completada' ? 'text-gray-400 line-through' : 'text-gray-700'
                                    }`}>{t.titulo}</span>
                                    {t.esPermanente && <RefreshCw size={9} className="text-green-400 flex-shrink-0" />}
                                  </div>
                                );
                              })}
                              {resumen.tareas.length > 3 && (
                                <p className="text-[10px] text-gray-400 pl-5">+{resumen.tareas.length - 3} más</p>
                              )}
                            </div>
                            {/* Barra de progreso */}
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.round((resumen.completadas / resumen.total) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Card footer */}
                    <div className="px-4 pb-4 flex gap-2">
                      <button
                        onClick={() => setModalTareasHoy({ open: true, sucursalId: suc._id.toString(), sucursalNombre: suc.nombre })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors font-medium"
                      >
                        <ClipboardList size={13} />
                        Tareas hoy
                        {tareasResumen[suc._id]?.sinAsignar > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">{tareasResumen[suc._id].sinAsignar}</span>
                        )}
                      </button>
                      <button
                        onClick={() => setModalSucursal({ open: true, editar: suc })}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                      <button
                        onClick={() => setConfirmEliminar({ open: true, id: suc._id, nombre: suc.nombre })}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors font-medium"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ╔═══════════════════════════════════════╗ */}
      {/* ║    TAB: PERSONAL Y CALENDARIO         ║ */}
      {/* ╚═══════════════════════════════════════╝ */}
      {tab === 'personal' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard color="blue" icon={Users} label="Total trabajadores" value={statsTrab.total} />
            <StatCard color="green" icon={UserCheck} label="Con sucursal" value={statsTrab.asignados} />
            <StatCard color="orange" icon={UserX} label="Sin asignar" value={statsTrab.sinAsignar} />
            <StatCard color="purple" icon={Calendar} label="Desde calendario" value={statsTrab.desdeCalendario} />
          </div>

          {/* ═══ CALENDARIO MENSUAL ═══ */}
          <CalendarioSucursal onAsignacionChange={() => { cargarTrabajadores(); cargarAsignacionesHoy(); }} />

          {/* ═══ SEPARADOR ═══ */}
          <div className="mt-8 mb-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <Users size={14} />
              <span className="sm:hidden">Personal Hoy</span>
              <span className="hidden sm:inline">Personal — Asignaciones de Hoy</span>
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ═══ BARRA DE BÚSQUEDA Y ACCIONES ═══ */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar por nombre, email, sucursal..."
              />
            </div>
            <button
              onClick={() => { cargarTrabajadores(); cargarAsignacionesHoy(); }}
              className="px-4 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={loadingTrab ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {/* ═══ TABLA DE PERSONAL ═══ */}
          {loadingTrab ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : trabajadoresFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Users className="text-gray-300 mx-auto mb-3" size={48} />
              <p className="text-gray-500 font-medium">No hay trabajadores</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Trabajador</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Departamento</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Rol</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Sucursal Hoy</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {trabajadoresFiltrados.map(t => (
                      <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {getAvatarUrl(t) ? (
                              <img src={getAvatarUrl(t)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                {(t.nombre_negocio || t.email || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{t.nombre_negocio || 'Sin nombre'}</p>
                              <p className="text-xs text-gray-400">{t.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-600 capitalize">{t.departamento || '—'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            t.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {t.role === 'admin' ? 'Admin' : 'Usuario'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {t.sucursalEfectiva ? (
                            <div className="flex items-center gap-2">
                              <Building2 size={14} className={t.fuenteAsignacion === 'calendario' ? 'text-indigo-600' : 'text-green-600'} />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{t.sucursalEfectiva.nombre}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {t.fuenteAsignacion === 'calendario' ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium flex items-center gap-0.5">
                                      <Calendar size={9} /> Calendario
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-0.5">
                                      <Building2 size={9} /> Permanente
                                    </span>
                                  )}
                                  {t.asignacionHoy?.tareasCreadas && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-0.5">
                                      <Check size={9} /> Tareas
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit">
                              <AlertCircle size={12} /> Sin asignar
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModalAsignar({ open: true, trabajador: t })}
                              className="px-3 py-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors flex items-center gap-1"
                              title={t.sucursalEfectiva ? "Cambiar sucursal" : "Asignar sucursal"}
                            >
                              <ArrowRightLeft size={13} />
                              {t.sucursalEfectiva ? 'Mover' : 'Asignar'}
                            </button>
                            {t.sucursalEfectiva && (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put('/api/sucursales/asignar-trabajador', {
                                      userId: t._id || t.clerk_id,
                                      sucursalId: null
                                    });
                                    showToast('Trabajador removido de sucursal');
                                    cargarTrabajadores();
                                  } catch {
                                    showToast('Error al remover', 'error');
                                  }
                                }}
                                className="px-3 py-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1"
                                title="Remover de sucursal"
                              >
                                <UserX size={13} /> Remover
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {trabajadoresFiltrados.map(t => (
                  <div key={t._id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {getAvatarUrl(t) ? (
                        <img src={getAvatarUrl(t)} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                          {(t.nombre_negocio || t.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{t.nombre_negocio || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-400 truncate">{t.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 capitalize">{t.departamento || '—'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            t.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {t.role === 'admin' ? 'Admin' : 'Usuario'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {t.sucursalEfectiva ? (
                      <div className={`rounded-xl px-3 py-2 flex items-center gap-2 ${
                        t.fuenteAsignacion === 'calendario' ? 'bg-indigo-50' : 'bg-green-50'
                      }`}>
                        <Building2 size={14} className={t.fuenteAsignacion === 'calendario' ? 'text-indigo-600' : 'text-green-600'} />
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${t.fuenteAsignacion === 'calendario' ? 'text-indigo-800' : 'text-green-800'}`}>
                            {t.sucursalEfectiva.nombre}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {t.fuenteAsignacion === 'calendario' ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium flex items-center gap-0.5">
                                <Calendar size={9} /> Calendario
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-0.5">
                                <Building2 size={9} /> Permanente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-orange-50 rounded-xl px-3 py-2 flex items-center gap-2">
                        <AlertCircle size={14} className="text-orange-500" />
                        <p className="text-xs font-medium text-orange-600">Sin sucursal asignada</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setModalAsignar({ open: true, trabajador: t })}
                        className="flex-1 py-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <ArrowRightLeft size={13} />
                        {t.sucursalEfectiva ? 'Mover' : 'Asignar'}
                      </button>
                      {t.sucursalEfectiva && (
                        <button
                          onClick={async () => {
                            try {
                              await api.put('/api/sucursales/asignar-trabajador', {
                                userId: t._id || t.clerk_id,
                                sucursalId: null
                              });
                              showToast('Trabajador removido de sucursal');
                              cargarTrabajadores();
                            } catch {
                              showToast('Error al remover', 'error');
                            }
                          }}
                          className="px-4 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modales */}
      <TareasHoyModal
        isOpen={modalTareasHoy.open}
        onClose={() => setModalTareasHoy({ open: false, sucursalId: null, sucursalNombre: '' })}
        sucursalId={modalTareasHoy.sucursalId}
        sucursalNombre={modalTareasHoy.sucursalNombre}
        onActualizado={() => { cargarTareasResumen(); cargarAsignacionesHoy(); }}
      />

      <SucursalFormModal
        isOpen={modalSucursal.open}
        onClose={() => setModalSucursal({ open: false, editar: null })}
        onSaved={() => { cargarSucursales(); showToast(modalSucursal.editar ? 'Sucursal actualizada' : 'Sucursal creada'); }}
        sucursalEditar={modalSucursal.editar}
      />

      <AsignarTrabajadorModal
        isOpen={modalAsignar.open}
        onClose={() => setModalAsignar({ open: false, trabajador: null })}
        onSaved={() => { cargarTrabajadores(); cargarSucursales(); cargarAsignacionesHoy(); showToast('Asignación actualizada'); }}
        trabajador={modalAsignar.trabajador}
        sucursales={sucursales}
      />
    </div>
  );
};

export default SucursalesPage;
