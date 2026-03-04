import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Users, Building2, Loader2,
  AlertCircle, CheckCircle, X, UserPlus, Trash2, Copy, Zap,
  RefreshCw, Info
} from 'lucide-react';
import { asignacionSucursalService } from '../../services/asignacionSucursalService';
import { getAllSucursales } from '../../services/sucursalService';
import api from '../../services/api';
import PatronSemanalModal from './PatronSemanalModal';

// Colores para distinguir usuarios en el calendario
const COLORES_USUARIO = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', dot: 'bg-teal-500' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-500' },
];

const NOMBRES_DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Componente principal de Calendario de Asignaciones por Sucursal
 */
export default function CalendarioSucursal({ onAsignacionChange }) {
  // ── Estado de navegación ──
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);

  // ── Datos ──
  const [sucursales, setSucursales] = useState([]);
  const [calendario, setCalendario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [plantillas, setPlantillas] = useState([]);

  // ── UI ──
  const [loading, setLoading] = useState(false);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [showPatronModal, setShowPatronModal] = useState(false);
  const [showAsignarDia, setShowAsignarDia] = useState(false);


  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Mapa de colores por usuario ──
  const colorMap = useMemo(() => {
    if (!calendario?.asignaciones) return {};
    const map = {};
    let colorIdx = 0;
    Object.values(calendario.asignaciones).forEach(asig => {
      if (asig.usuarioId && !map[asig.usuarioId]) {
        map[asig.usuarioId] = COLORES_USUARIO[colorIdx % COLORES_USUARIO.length];
        colorIdx++;
      }
    });
    return map;
  }, [calendario]);

  // ── Carga inicial ──
  useEffect(() => {
    cargarSucursales();
    cargarUsuarios();
    cargarPlantillas();
  }, []);

  useEffect(() => {
    if (sucursalSeleccionada) {
      cargarCalendario();
    }
  }, [sucursalSeleccionada, mes, anio]);

  const cargarSucursales = async () => {
    try {
      setLoadingSucursales(true);
      const data = await getAllSucursales();
      const lista = (data?.sucursales || data || []).filter(s => s.activo !== false);
      setSucursales(lista);
      if (lista.length > 0 && !sucursalSeleccionada) {
        setSucursalSeleccionada(lista[0]._id);
      }
    } catch {
      showToast('Error al cargar sucursales', 'error');
    } finally {
      setLoadingSucursales(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/api/admin/users?limit=500&role=all');
      const lista = (res.data.users || []).filter(u => {
        const role = u.role || u.publicMetadata?.role || 'user';
        return role !== 'de_baja' && ['user', 'admin', 'super_admin'].includes(role);
      });
      setUsuarios(lista);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const cargarPlantillas = async () => {
    try {
      const res = await api.get('/api/plantillas-tareas');
      setPlantillas(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Error cargando plantillas:', err);
    }
  };

  const cargarCalendario = useCallback(async () => {
    if (!sucursalSeleccionada) return;
    setLoading(true);
    try {
      const res = await asignacionSucursalService.obtenerCalendario(sucursalSeleccionada, mes, anio);
      setCalendario(res.data);
    } catch {
      showToast('Error al cargar calendario', 'error');
      setCalendario(null);
    } finally {
      setLoading(false);
    }
  }, [sucursalSeleccionada, mes, anio, showToast]);

  // ── Navegación de meses ──
  const mesAnterior = () => {
    if (mes === 1) { setMes(12); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };

  const mesSiguiente = () => {
    if (mes === 12) { setMes(1); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };

  const irAHoy = () => {
    setMes(hoy.getMonth() + 1);
    setAnio(hoy.getFullYear());
  };

  // ── Generar datos del calendario ──
  const datosCalendario = useMemo(() => {
    if (!calendario) return [];

    const primerDia = new Date(anio, mes - 1, 1);
    const diaInicio = primerDia.getDay(); // 0=Dom
    const diasEnMes = calendario.diasDelMes;

    const celdas = [];

    // Celdas vacías antes del día 1
    for (let i = 0; i < diaInicio; i++) {
      celdas.push({ tipo: 'vacia' });
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const asignacion = calendario.asignaciones[dia] || null;
      const fechaDia = new Date(anio, mes - 1, dia);
      const esHoy = dia === hoy.getDate() && mes === (hoy.getMonth() + 1) && anio === hoy.getFullYear();
      const esPasado = fechaDia < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

      celdas.push({
        tipo: 'dia',
        dia,
        asignacion,
        esHoy,
        esPasado,
        diaSemana: fechaDia.getDay()
      });
    }

    return celdas;
  }, [calendario, mes, anio]);

  // ── Asignar día individual ──
  const handleAsignarDia = async (dia, usuarioId, usuarioNombre) => {
    try {
      const fecha = new Date(anio, mes - 1, dia, 0, 0, 0);
      const payload = {
        sucursalId: sucursalSeleccionada,
        usuarioId,
        usuarioNombre,
        fecha: fecha.toISOString(),
        plantillaIds: []
      };
      console.log('📅 [CalendarioSucursal] Asignando día:', JSON.stringify(payload, null, 2));
      console.log('📅 [CalendarioSucursal] Fecha local:', fecha.toLocaleDateString('es-PE'));
      console.log('📅 [CalendarioSucursal] Fecha ISO enviada:', fecha.toISOString());
      
      const response = await asignacionSucursalService.asignarDia(payload);
      console.log('✅ [CalendarioSucursal] Respuesta:', JSON.stringify(response, null, 2));
      
      showToast(`${usuarioNombre} asignado al día ${dia}`);
      setShowAsignarDia(false);
      setDiaSeleccionado(null);
      cargarCalendario();
      // Notificar al padre para que recargue la lista de trabajadores
      if (onAsignacionChange) onAsignacionChange();
    } catch (err) {
      console.error('❌ [CalendarioSucursal] Error asignando:', err);
      showToast(err.message, 'error');
    }
  };

  // ── Eliminar asignación ──
  const handleEliminarDia = async (dia) => {
    try {
      const fecha = new Date(anio, mes - 1, dia, 0, 0, 0);
      await asignacionSucursalService.eliminarDia(sucursalSeleccionada, fecha.toISOString());
      showToast('Asignación eliminada');
      setDiaSeleccionado(null);
      cargarCalendario();
      if (onAsignacionChange) onAsignacionChange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };



  // ── Patrón aplicado ──
  const handlePatronAplicado = () => {
    setShowPatronModal(false);
    cargarCalendario();
    showToast('Patrón semanal aplicado correctamente');
    if (onAsignacionChange) onAsignacionChange();
  };

  // ── Estadísticas del mes ──
  const stats = useMemo(() => {
    if (!calendario?.asignaciones) return { asignados: 0, sinCubrir: 0, total: 0, cobertura: 0 };
    const total = calendario.diasDelMes;
    const asignados = Object.keys(calendario.asignaciones).length;
    return {
      asignados,
      sinCubrir: total - asignados,
      total,
      cobertura: Math.round((asignados / total) * 100)
    };
  }, [calendario]);

  // ── Nombre sucursal seleccionada ──
  const nombreSucursal = useMemo(() => {
    return sucursales.find(s => s._id === sucursalSeleccionada)?.nombre || '';
  }, [sucursales, sucursalSeleccionada]);

  // ═══════════════════════ RENDER ═══════════════════════

  if (loadingSucursales) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.tipo === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.tipo === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* ═══ Header ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-blue-600" size={24} />
              Calendario de Asignaciones
            </h1>
            <p className="text-sm text-gray-500 mt-1">Planifica las asignaciones mensuales por sucursal</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPatronModal(true)}
              disabled={!sucursalSeleccionada}
              className="px-3 py-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <Zap size={16} />
              <span className="hidden sm:inline">Patrón Semanal</span>
              <span className="sm:hidden">Patrón</span>
            </button>

            <button
              onClick={cargarCalendario}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ═══ Selector de sucursal ═══ */}
        <div className="mt-4 flex flex-wrap gap-2">
          {sucursales.map(suc => (
            <button
              key={suc._id}
              onClick={() => setSucursalSeleccionada(suc._id)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                sucursalSeleccionada === suc._id
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Building2 size={14} className="inline mr-1" />
              {suc.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Navegación del mes + Stats ═══ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={mesAnterior} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800">
              {asignacionSucursalService.getNombreMes(mes)} {anio}
            </h2>
            <button onClick={irAHoy} className="text-xs text-blue-600 hover:text-blue-700">
              Ir a hoy
            </button>
          </div>

          <button onClick={mesSiguiente} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Stats compactos */}
        {calendario && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-blue-700">{stats.asignados}</p>
              <p className="text-xs text-blue-600">Días cubiertos</p>
            </div>
            <div className={`rounded-lg p-2 text-center ${stats.sinCubrir > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className={`text-lg font-bold ${stats.sinCubrir > 0 ? 'text-red-700' : 'text-green-700'}`}>{stats.sinCubrir}</p>
              <p className={`text-xs ${stats.sinCubrir > 0 ? 'text-red-600' : 'text-green-600'}`}>Sin cubrir</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-gray-700">{stats.total}</p>
              <p className="text-xs text-gray-600">Días del mes</p>
            </div>
            <div className={`rounded-lg p-2 text-center ${stats.cobertura === 100 ? 'bg-green-50' : 'bg-amber-50'}`}>
              <p className={`text-lg font-bold ${stats.cobertura === 100 ? 'text-green-700' : 'text-amber-700'}`}>{stats.cobertura}%</p>
              <p className={`text-xs ${stats.cobertura === 100 ? 'text-green-600' : 'text-amber-600'}`}>Cobertura</p>
            </div>
          </div>
        )}

        {/* ═══ Calendario Grid ═══ */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : !calendario ? (
          <div className="text-center py-16 text-gray-500">
            <Calendar size={40} className="mx-auto mb-3 opacity-40" />
            <p>Selecciona una sucursal para ver el calendario</p>
          </div>
        ) : (
          <div>
            {/* Header días de la semana */}
            <div className="grid grid-cols-7 mb-1">
              {NOMBRES_DIAS.map((nombre, i) => (
                <div key={i} className={`text-center text-xs font-semibold py-1.5 ${
                  i === 0 || i === 6 ? 'text-red-400' : 'text-gray-500'
                }`}>
                  {nombre}
                </div>
              ))}
            </div>

            {/* Grid del calendario */}
            <div className="grid grid-cols-7 gap-1">
              {datosCalendario.map((celda, idx) => {
                if (celda.tipo === 'vacia') {
                  return <div key={`v-${idx}`} className="h-16 sm:h-20" />;
                }

                const { dia, asignacion, esHoy, esPasado, diaSemana } = celda;
                const colores = asignacion ? colorMap[asignacion.usuarioId] : null;
                const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

                return (
                  <button
                    key={dia}
                    onClick={() => {
                      setDiaSeleccionado(dia);
                      setShowAsignarDia(true);
                    }}
                    className={`h-16 sm:h-20 rounded-lg border text-left p-1 sm:p-1.5 transition-all relative group ${
                      esHoy ? 'ring-2 ring-blue-400 border-blue-300' : ''
                    } ${
                      asignacion
                        ? `${colores?.bg || 'bg-gray-100'} ${colores?.border || 'border-gray-300'} border`
                        : esPasado
                          ? 'bg-gray-50 border-gray-100 opacity-60'
                          : 'bg-white border-gray-150 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    {/* Número del día */}
                    <span className={`text-xs font-semibold ${
                      esHoy ? 'text-blue-600' : esFinDeSemana ? 'text-red-400' : 'text-gray-600'
                    }`}>
                      {dia}
                    </span>

                    {/* Nombre del usuario asignado */}
                    {asignacion && (
                      <div className="mt-0.5">
                        <p className={`text-[10px] sm:text-xs font-medium truncate ${colores?.text || 'text-gray-700'}`}>
                          {asignacion.usuarioNombre?.split(' ')[0] || '?'}
                        </p>
                        {asignacion.tareasCreadas && (
                          <CheckCircle size={10} className="text-green-500 absolute top-1 right-1" />
                        )}
                      </div>
                    )}

                    {/* Indicador vacío para días futuros */}
                    {!asignacion && !esPasado && (
                      <UserPlus size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 absolute bottom-1 right-1 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ═══ Leyenda de usuarios ═══ */}
            {Object.keys(colorMap).length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Usuarios asignados este mes:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(colorMap).map(([uid, colores]) => {
                    const nombre = Object.values(calendario.asignaciones).find(a => a.usuarioId === uid)?.usuarioNombre || uid;
                    const diasCount = Object.values(calendario.asignaciones).filter(a => a.usuarioId === uid).length;
                    return (
                      <span key={uid} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${colores.bg} ${colores.text}`}>
                        <span className={`w-2 h-2 rounded-full ${colores.dot}`} />
                        {nombre} ({diasCount}d)
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Modal Asignar Día ═══ */}
      {showAsignarDia && diaSeleccionado && (
        <AsignarDiaModal
          dia={diaSeleccionado}
          mes={mes}
          anio={anio}
          asignacionActual={calendario?.asignaciones?.[diaSeleccionado] || null}
          usuarios={usuarios}
          onAsignar={handleAsignarDia}
          onEliminar={handleEliminarDia}
          onClose={() => { setShowAsignarDia(false); setDiaSeleccionado(null); }}
        />
      )}

      {/* ═══ Modal Patrón Semanal ═══ */}
      {showPatronModal && (
        <PatronSemanalModal
          sucursalId={sucursalSeleccionada}
          sucursalNombre={nombreSucursal}
          mes={mes}
          anio={anio}
          usuarios={usuarios}
          plantillas={plantillas}
          onAplicado={handlePatronAplicado}
          onClose={() => setShowPatronModal(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-componente: Modal para asignar un día específico
// ═══════════════════════════════════════════════════════════════════

function AsignarDiaModal({ dia, mes, anio, asignacionActual, usuarios, onAsignar, onEliminar, onClose }) {
  const [busqueda, setBusqueda] = useState('');
  const [eliminando, setEliminando] = useState(false);

  const fecha = new Date(anio, mes - 1, dia);
  const nombreDia = NOMBRES_DIAS[fecha.getDay()];
  const esPasado = fecha < new Date(new Date().setHours(0, 0, 0, 0));

  const usuariosFiltrados = useMemo(() => {
    if (!busqueda) return usuarios;
    const q = busqueda.toLowerCase();
    return usuarios.filter(u =>
      (u.nombre_negocio || '').toLowerCase().includes(q) ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [usuarios, busqueda]);

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await onEliminar(dia);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              {nombreDia} {dia} de {asignacionSucursalService.getNombreMes(mes)}
            </h3>
            {asignacionActual && (
              <p className="text-xs text-gray-500 mt-0.5">
                Asignado: <span className="font-medium text-gray-700">{asignacionActual.usuarioNombre}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-xl">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {esPasado && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
              <Info size={14} />
              Este día ya pasó. Puedes asignar para referencia.
            </div>
          )}

          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Lista de usuarios */}
          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            {usuariosFiltrados.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">No se encontraron usuarios</div>
            ) : (
              usuariosFiltrados.map(u => {
                const uid = u.clerk_id || u.id;
                const nombre = u.nombre_negocio || u.firstName || u.email;
                const esActual = asignacionActual?.usuarioId === uid;

                return (
                  <button
                    key={uid}
                    onClick={() => onAsignar(dia, uid, nombre)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors border-b border-gray-50 last:border-b-0 ${
                      esActual
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      {nombre[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{nombre}</p>
                      <p className="text-xs text-gray-400">{u.role || 'user'}</p>
                    </div>
                    {esActual && <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        {asignacionActual && !asignacionActual.tareasCreadas && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleEliminar}
              disabled={eliminando}
              className="w-full px-4 py-2 text-sm text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {eliminando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Quitar asignación de este día
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
