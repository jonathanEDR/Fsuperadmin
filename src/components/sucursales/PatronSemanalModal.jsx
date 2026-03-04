import React, { useState, useMemo } from 'react';
import {
  X, Zap, Loader2, AlertCircle, CheckCircle, Calendar,
  Users, Building2, Info, FileText
} from 'lucide-react';
import { asignacionSucursalService } from '../../services/asignacionSucursalService';

const DIAS_SEMANA = [
  { idx: 1, nombre: 'Lunes', corto: 'Lun' },
  { idx: 2, nombre: 'Martes', corto: 'Mar' },
  { idx: 3, nombre: 'Miércoles', corto: 'Mié' },
  { idx: 4, nombre: 'Jueves', corto: 'Jue' },
  { idx: 5, nombre: 'Viernes', corto: 'Vie' },
  { idx: 6, nombre: 'Sábado', corto: 'Sáb' },
  { idx: 0, nombre: 'Domingo', corto: 'Dom' },
];

/**
 * Modal para configurar y aplicar un patrón semanal
 * Permite asignar un usuario diferente a cada día de la semana
 * y aplicarlo a todo el mes de una vez
 */
export default function PatronSemanalModal({
  sucursalId,
  sucursalNombre,
  mes,
  anio,
  usuarios,
  plantillas,
  onAplicado,
  onClose
}) {
  // Patrón: array de 7 (0=Dom...6=Sáb), cada uno { usuarioId, usuarioNombre } o null
  const [patron, setPatron] = useState(Array(7).fill(null));
  const [plantillaIds, setPlantillaIds] = useState([]);
  const [sobreescribir, setSobreescribir] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState('');

  // Usuarios para selección rápida
  const usuariosActivos = useMemo(() => {
    return usuarios.filter(u => {
      const role = u.role || u.publicMetadata?.role || 'user';
      return role !== 'de_baja';
    });
  }, [usuarios]);

  // Usuarios únicos seleccionados en el patrón
  const usuariosEnPatron = useMemo(() => {
    const ids = new Set();
    const lista = [];
    patron.forEach(p => {
      if (p && !ids.has(p.usuarioId)) {
        ids.add(p.usuarioId);
        lista.push({ id: p.usuarioId, nombre: p.usuarioNombre });
      }
    });
    return lista;
  }, [patron]);

  // Preview: cuántos días se generarán
  const previewDias = useMemo(() => {
    const ultimoDia = new Date(anio, mes, 0).getDate();
    let count = 0;
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const diaSemana = new Date(anio, mes - 1, dia).getDay();
      if (patron[diaSemana]) count++;
    }
    return count;
  }, [patron, mes, anio]);

  // ── Handlers ──
  const handleSeleccionarUsuario = (diaIdx, usuario) => {
    const nuevoPatron = [...patron];
    if (usuario) {
      nuevoPatron[diaIdx] = {
        usuarioId: usuario.clerk_id || usuario.id,
        usuarioNombre: usuario.nombre_negocio || usuario.firstName || usuario.email
      };
    } else {
      nuevoPatron[diaIdx] = null;
    }
    setPatron(nuevoPatron);
  };

  const handleAsignarRango = (usuario, desde, hasta) => {
    // desde y hasta son índices de DIAS_SEMANA (0=Dom...6=Sáb)
    const nuevoPatron = [...patron];
    for (let i = desde; i <= hasta; i++) {
      if (usuario) {
        nuevoPatron[i] = {
          usuarioId: usuario.clerk_id || usuario.id,
          usuarioNombre: usuario.nombre_negocio || usuario.firstName || usuario.email
        };
      } else {
        nuevoPatron[i] = null;
      }
    }
    setPatron(nuevoPatron);
  };

  const handleTogglePlantilla = (plantillaId) => {
    setPlantillaIds(prev =>
      prev.includes(plantillaId)
        ? prev.filter(id => id !== plantillaId)
        : [...prev, plantillaId]
    );
  };

  const handleAplicar = async () => {
    // Validar que al menos un día tenga asignación
    if (patron.every(p => p === null)) {
      setError('Debes asignar al menos un día de la semana');
      return;
    }

    setAplicando(true);
    setError('');
    try {
      await asignacionSucursalService.aplicarPatron({
        sucursalId,
        mes,
        anio,
        patron,
        plantillaIds,
        sobreescribir
      });
      onAplicado();
    } catch (err) {
      setError(err.message);
    } finally {
      setAplicando(false);
    }
  };

  // Atajos rápidos
  const handleAtajoLunesViernes = (usuario) => {
    // Lun=1, Mar=2, Mié=3, Jue=4, Vie=5
    handleAsignarRango(usuario, 1, 5);
  };

  const handleAtajoFinDeSemana = (usuario) => {
    // Sáb=6, Dom=0
    const nuevoPatron = [...patron];
    const data = usuario ? {
      usuarioId: usuario.clerk_id || usuario.id,
      usuarioNombre: usuario.nombre_negocio || usuario.firstName || usuario.email
    } : null;
    nuevoPatron[0] = data; // Domingo
    nuevoPatron[6] = data; // Sábado
    setPatron(nuevoPatron);
  };

  const handleLimpiarTodo = () => {
    setPatron(Array(7).fill(null));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Zap className="text-purple-600" size={20} />
                Patrón Semanal
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                <Building2 size={14} className="inline mr-1" />
                {sucursalNombre} — {asignacionSucursalService.getNombreMes(mes)} {anio}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              Configura quién trabaja cada día de la semana. El patrón se aplicará a
              <strong> todo {asignacionSucursalService.getNombreMes(mes)} {anio}</strong>.
              Después puedes ajustar días individuales en el calendario.
            </div>
          </div>

          {/* ═══ Atajos Rápidos ═══ */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Asignación rápida por rango:</p>
            <div className="flex flex-wrap gap-2">
              {usuariosActivos.slice(0, 6).map(u => {
                const nombre = u.nombre_negocio || u.firstName || u.email || '?';
                return (
                  <div key={u.clerk_id || u.id} className="flex gap-1">
                    <button
                      onClick={() => handleAtajoLunesViernes(u)}
                      className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                      title={`Asignar ${nombre} de Lunes a Viernes`}
                    >
                      {nombre.split(' ')[0]} L-V
                    </button>
                    <button
                      onClick={() => handleAtajoFinDeSemana(u)}
                      className="px-2 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                      title={`Asignar ${nombre} Sábado y Domingo`}
                    >
                      S-D
                    </button>
                  </div>
                );
              })}
              <button
                onClick={handleLimpiarTodo}
                className="px-2 py-1 text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          </div>

          {/* ═══ Selector por Día ═══ */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Asignación por día:</p>
            <div className="space-y-2">
              {DIAS_SEMANA.map(({ idx, nombre, corto }) => {
                const asig = patron[idx];
                const esFinDeSemana = idx === 0 || idx === 6;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                      asig ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-150'
                    } ${esFinDeSemana ? 'ring-1 ring-orange-100' : ''}`}
                  >
                    <span className={`text-sm font-medium w-20 ${
                      esFinDeSemana ? 'text-orange-600' : 'text-gray-700'
                    }`}>
                      {nombre}
                    </span>

                    <select
                      value={asig?.usuarioId || ''}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          handleSeleccionarUsuario(idx, null);
                        } else {
                          const u = usuariosActivos.find(u => (u.clerk_id || u.id) === e.target.value);
                          if (u) handleSeleccionarUsuario(idx, u);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    >
                      <option value="">— Sin asignar —</option>
                      {usuariosActivos.map(u => {
                        const uid = u.clerk_id || u.id;
                        const nombre = u.nombre_negocio || u.firstName || u.email;
                        return (
                          <option key={uid} value={uid}>
                            {nombre} ({u.role || 'user'})
                          </option>
                        );
                      })}
                    </select>

                    {asig && (
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ Plantillas Asociadas (Opcional) ═══ */}
          {plantillas.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                <FileText size={14} className="inline mr-1" />
                Plantillas de tareas a crear (opcional):
              </p>
              <div className="flex flex-wrap gap-2">
                {plantillas.map(p => {
                  const seleccionada = plantillaIds.includes(p._id);
                  return (
                    <button
                      key={p._id}
                      onClick={() => handleTogglePlantilla(p._id)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        seleccionada
                          ? 'bg-purple-50 text-purple-700 border-purple-300 font-medium'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {seleccionada && <CheckCircle size={12} className="inline mr-1" />}
                      {p.nombre}
                    </button>
                  );
                })}
              </div>
              {plantillaIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Se crearán {plantillaIds.length} tarea(s) por día al generar tareas
                </p>
              )}
            </div>
          )}

          {/* ═══ Opción de sobreescribir ═══ */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={sobreescribir}
              onChange={(e) => setSobreescribir(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-400"
            />
            Sobreescribir asignaciones existentes (solo las que aún no generaron tareas)
          </label>

          {/* ═══ Preview ═══ */}
          <div className="bg-gray-50 rounded-xl border border-gray-150 p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Días a generar:</span>
                <span className="font-semibold text-gray-800 ml-1">{previewDias}</span>
              </div>
              <div>
                <span className="text-gray-500">Usuarios:</span>
                <span className="font-semibold text-gray-800 ml-1">{usuariosEnPatron.length}</span>
              </div>
              {plantillaIds.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500">Tareas por día:</span>
                  <span className="font-semibold text-gray-800 ml-1">{plantillaIds.length}</span>
                  <span className="text-gray-400 ml-1">({plantillaIds.length * previewDias} total en el mes)</span>
                </div>
              )}
            </div>
            {usuariosEnPatron.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {usuariosEnPatron.map(u => (
                  <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700">
                    <Users size={10} />
                    {u.nombre.split(' ')[0]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAplicar}
            disabled={aplicando || patron.every(p => p === null)}
            className="px-6 py-2.5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
          >
            {aplicando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            Aplicar al Mes ({previewDias} días)
          </button>
        </div>
      </div>
    </div>
  );
}
