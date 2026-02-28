import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Building2, MapPin, ClipboardList, Clock, Check, Play, RefreshCw,
  CheckSquare, ChevronDown, ChevronUp, Loader2, Edit3, Save, X
} from 'lucide-react';
import api from '../../services/api';

const MapaPicker = lazy(() => import('../mapa/MapaPicker'));

/**
 * Componente que muestra la sucursal asignada al usuario:
 * - Tarjeta con nombre y dirección editable
 * - Mapa interactivo (con edición de ubicación)
 * - Tareas pendientes / en progreso (nunca completadas)
 */
export default function SucursalAsignada() {
  const { getToken } = useAuth();

  const [sucursal, setSucursal] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [expandirTareas, setExpandirTareas] = useState(true);
  const [mostrarMapa, setMostrarMapa] = useState(false);

  // Edición de ubicación
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ ubicacion: '', referenciaDireccion: '', lat: null, lng: null });
  const [editMsg, setEditMsg] = useState({ tipo: '', texto: '' });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const profileRes = await api.get('/api/auth/my-profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = profileRes.data?.user;
      if (!userData?.sucursalActual) {
        setSucursal(null);
        setLoading(false);
        return;
      }

      const suc = userData.sucursalActual;
      setSucursal(suc);

      // Inicializar datos de edición con coordenadas
      const coords = suc.coordenadas?.coordinates;
      setEditData({
        ubicacion: suc.ubicacion || '',
        referenciaDireccion: suc.referenciaDireccion || '',
        lat: coords && coords[1] !== 0 ? coords[1] : null,
        lng: coords && coords[0] !== 0 ? coords[0] : null,
      });

      // Solo tareas pendientes o en progreso (nunca completadas)
      setLoadingTareas(true);
      try {
        const tareasRes = await api.get('/api/tareas', {
          params: { sucursalId: suc._id, estado: 'pendiente,en_progreso', limite: 30 },
          headers: { Authorization: `Bearer ${token}` }
        });
        setTareas(tareasRes.data?.data || []);
      } catch {
        setTareas([]);
      } finally {
        setLoadingTareas(false);
      }
    } catch (err) {
      console.error('Error SucursalAsignada:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleGuardarUbicacion = async () => {
    if (!editData.ubicacion.trim()) {
      setEditMsg({ tipo: 'error', texto: 'La dirección no puede estar vacía' });
      return;
    }
    try {
      setSaving(true);
      setEditMsg({ tipo: '', texto: '' });
      const token = await getToken();
      await api.put('/api/sucursales/mi-ubicacion', {
        ubicacion: editData.ubicacion.trim(),
        referenciaDireccion: editData.referenciaDireccion.trim(),
        lat: editData.lat,
        lng: editData.lng,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEditMsg({ tipo: 'success', texto: 'Ubicación actualizada correctamente' });
      setEditando(false);
      setTimeout(() => setEditMsg({ tipo: '', texto: '' }), 3000);
      await cargarDatos();
    } catch (err) {
      setEditMsg({ tipo: 'error', texto: err.response?.data?.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelarEdicion = () => {
    if (sucursal) {
      const coords = sucursal.coordenadas?.coordinates;
      setEditData({
        ubicacion: sucursal.ubicacion || '',
        referenciaDireccion: sucursal.referenciaDireccion || '',
        lat: coords && coords[1] !== 0 ? coords[1] : null,
        lng: coords && coords[0] !== 0 ? coords[0] : null,
      });
    }
    setEditando(false);
    setEditMsg({ tipo: '', texto: '' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!sucursal) return null;

  // Solo tareas activas (pendiente + en_progreso) — completadas nunca se muestran
  const tareasEnProgreso = tareas.filter(t => t.estado === 'en_progreso').length;
  const tareasPendientes = tareas.filter(t => t.estado === 'pendiente').length;
  const totalActivas = tareas.length;

  const getEstadoConfig = (estado) => {
    switch (estado) {
      case 'en_progreso':
        return { icon: <Play size={14} className="text-blue-500" />, bg: 'bg-blue-50', text: 'text-blue-700', label: 'En progreso' };
      default:
        return { icon: <Clock size={14} className="text-amber-500" />, bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pendiente' };
    }
  };

  const getPrioridadBadge = (prioridad) => {
    switch (prioridad) {
      case 'urgente': return 'bg-red-100 text-red-700';
      case 'alta': return 'bg-orange-100 text-orange-700';
      case 'media': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const tieneCoords = editData.lat !== null && editData.lng !== null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Mi Sucursal</h2>
              <p className="text-emerald-100 text-sm">{sucursal.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalActivas > 0 && (
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 text-white text-sm font-medium flex items-center gap-1.5">
                <ClipboardList size={14} />
                {totalActivas} activa{totalActivas !== 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={cargarDatos}
              className="p-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors text-white"
              title="Actualizar"
            >
              <RefreshCw size={16} className={loading || loadingTareas ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Info + edición de ubicación */}
      <div className="px-6 py-4 border-b border-gray-100 space-y-3">
        {/* Mensaje de feedback */}
        {editMsg.texto && (
          <div className={`text-xs px-3 py-2 rounded-lg font-medium ${
            editMsg.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {editMsg.texto}
          </div>
        )}

        {editando ? (
          /* Modo edición */
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Dirección *</label>
              <input
                type="text"
                value={editData.ubicacion}
                onChange={(e) => setEditData(p => ({ ...p, ubicacion: e.target.value }))}
                placeholder="Ej: Av. Principal 123, Colonia Centro"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Referencia</label>
              <input
                type="text"
                value={editData.referenciaDireccion}
                onChange={(e) => setEditData(p => ({ ...p, referenciaDireccion: e.target.value }))}
                placeholder="Ej: Frente al parque central"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Mapa interactivo en modo edición */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                Ubicación en mapa {tieneCoords ? '(arrastra el pin para ajustar)' : '(haz clic para colocar el pin)'}
              </p>
              <Suspense fallback={<div className="h-56 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm"><Loader2 size={18} className="animate-spin mr-2" />Cargando mapa…</div>}>
                <MapaPicker
                  initialPosition={tieneCoords ? { lat: editData.lat, lng: editData.lng } : null}
                  onLocationChange={(pos) => setEditData(p => ({ ...p, lat: pos.lat, lng: pos.lng }))}
                  height="224px"
                  zoom={15}
                  editable={true}
                  showSearch={true}
                  showMyLocation={true}
                />
              </Suspense>
            </div>

            {/* Botones guardar / cancelar */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleGuardarUbicacion}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={handleCancelarEdicion}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                <X size={14} />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Modo vista */
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="text-gray-400 flex-shrink-0 mt-0.5" size={16} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{sucursal.ubicacion || 'Sin dirección registrada'}</p>
                {sucursal.referenciaDireccion && (
                  <p className="text-xs text-gray-400 mt-0.5">{sucursal.referenciaDireccion}</p>
                )}
              </div>
              <button
                onClick={() => { setEditando(true); setMostrarMapa(false); }}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                title="Editar dirección"
              >
                <Edit3 size={13} />
                Editar
              </button>
            </div>

            {sucursal.descripcion && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{sucursal.descripcion}</p>
            )}

            {/* Toggle mapa (solo lectura) */}
            {tieneCoords && (
              <button
                onClick={() => setMostrarMapa(v => !v)}
                className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                <MapPin size={13} />
                {mostrarMapa ? 'Ocultar mapa' : 'Ver mapa'}
              </button>
            )}

            {mostrarMapa && tieneCoords && (
              <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm"><Loader2 size={18} className="animate-spin mr-2" />Cargando mapa…</div>}>
                <MapaPicker
                  initialPosition={{ lat: editData.lat, lng: editData.lng }}
                  height="192px"
                  zoom={15}
                  editable={false}
                  showSearch={false}
                  showMyLocation={false}
                />
              </Suspense>
            )}
          </div>
        )}
      </div>

      {/* Sección de tareas activas */}
      <div className="px-6 py-4">
        <button
          onClick={() => setExpandirTareas(!expandirTareas)}
          className="w-full flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Tareas activas{totalActivas > 0 ? ` (${totalActivas})` : ''}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {totalActivas > 0 && (
              <div className="flex items-center gap-1.5">
                {tareasEnProgreso > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-0.5">
                    <Play size={9} />{tareasEnProgreso}
                  </span>
                )}
                {tareasPendientes > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-0.5">
                    <Clock size={9} />{tareasPendientes}
                  </span>
                )}
              </div>
            )}
            {expandirTareas ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </button>

        {expandirTareas && (
          <div className="space-y-2">
            {loadingTareas ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : totalActivas === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Check size={24} className="text-green-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">¡Todo al día!</p>
                <p className="text-xs text-gray-400 mt-1">No hay tareas pendientes</p>
              </div>
            ) : (
              tareas.map(tarea => {
                const estadoConf = getEstadoConfig(tarea.estado);
                const subtareasTotal = tarea.subtareas?.length || 0;
                const subtareasCompletas = tarea.subtareas?.filter(s => s.completada)?.length || 0;

                return (
                  <div
                    key={tarea._id}
                    className={`rounded-lg border p-3 transition-colors ${
                      tarea.estado === 'en_progreso'
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex-shrink-0">{estadoConf.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-800">{tarea.titulo}</p>
                          {tarea.esPermanente && (
                            <RefreshCw size={11} className="text-green-400 flex-shrink-0" title="Tarea diaria" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${estadoConf.bg} ${estadoConf.text}`}>
                            {estadoConf.label}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getPrioridadBadge(tarea.prioridad)}`}>
                            {tarea.prioridad?.charAt(0).toUpperCase() + tarea.prioridad?.slice(1)}
                          </span>
                          {tarea.categoriaId && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: tarea.categoriaId.color ? `${tarea.categoriaId.color}20` : '#e5e7eb',
                                color: tarea.categoriaId.color || '#374151'
                              }}
                            >
                              {tarea.categoriaId.nombre}
                            </span>
                          )}
                        </div>
                        {subtareasTotal > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <CheckSquare size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">Subtareas: {subtareasCompletas}/{subtareasTotal}</span>
                            </div>
                            <div className="space-y-0.5 pl-1">
                              {tarea.subtareas.map((sub, idx) => (
                                <div key={sub._id || idx} className="flex items-center gap-1.5 text-xs">
                                  {sub.completada ? (
                                    <Check size={10} className="text-green-500 flex-shrink-0" />
                                  ) : (
                                    <div className="w-2.5 h-2.5 rounded-sm border border-gray-300 flex-shrink-0" />
                                  )}
                                  <span className={sub.completada ? 'text-gray-400 line-through' : 'text-gray-600'}>
                                    {sub.titulo || sub.texto}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
