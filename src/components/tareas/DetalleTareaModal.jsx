import React, { useState } from 'react';
import {
  X,
  Flag,
  Calendar,
  User,
  Clock,
  Tag,
  FolderOpen,
  MessageSquare,
  History,
  Check,
  Play,
  Pause,
  Send,
  AlertTriangle,
  Loader
} from 'lucide-react';
import SubtareasChecklist from './SubtareasChecklist';
import { tareasService } from '../../services/tareas';

// Configuración de colores
const PRIORIDAD_CONFIG = {
  urgente: { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgente' },
  alta: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Alta' },
  media: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Media' },
  baja: { bg: 'bg-green-100', text: 'text-green-800', label: 'Baja' }
};

const ESTADO_CONFIG = {
  pendiente: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pendiente' },
  en_progreso: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Progreso' },
  en_revision: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Revisión' },
  completada: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completada' },
  cancelada: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
};

/**
 * Modal para ver detalles completos de una tarea
 */
export default function DetalleTareaModal({
  isOpen,
  onClose,
  tarea,
  onActualizar,
  onCambiarEstado,
  onRevisar,
  userRole,
  userId
}) {
  const [activeTab, setActiveTab] = useState('detalle');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [comentarioRevision, setComentarioRevision] = useState('');
  const [accionEnProceso, setAccionEnProceso] = useState(null); // 'estado', 'revision'

  if (!isOpen || !tarea) return null;

  const prioridadConfig = PRIORIDAD_CONFIG[tarea.prioridad] || PRIORIDAD_CONFIG.media;
  const estadoConfig = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG.pendiente;

  const esPropietario = tarea.userId === userId || tarea.asignadoA === userId;
  const esAdmin = ['admin', 'super_admin'].includes(userRole);
  const puedeEditar = esPropietario || esAdmin;
  const puedeRevisar = esAdmin && tarea.estado === 'en_revision';

  const estaVencida = tarea.fechaVencimiento &&
    new Date(tarea.fechaVencimiento) < new Date() &&
    tarea.estado !== 'completada';

  // Manejar cambio de estado con loading y cierre de modal
  const handleCambiarEstadoConCierre = async (id, nuevoEstado) => {
    if (accionEnProceso) return; // Evitar doble clic
    setAccionEnProceso('estado');
    try {
      await onCambiarEstado(id, nuevoEstado);
      // Cerrar modal solo para acciones que cambian significativamente el estado
      if (['en_revision', 'completada', 'cancelada'].includes(nuevoEstado)) {
        onClose();
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    } finally {
      setAccionEnProceso(null);
    }
  };

  // Manejar revisión con loading y cierre de modal
  const handleRevisarConCierre = async (id, resultado, comentario) => {
    if (accionEnProceso) return; // Evitar doble clic
    setAccionEnProceso('revision');
    try {
      await onRevisar(id, resultado, comentario);
      onClose();
    } catch (err) {
      console.error('Error al revisar:', err);
    } finally {
      setAccionEnProceso(null);
    }
  };

  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const response = await tareasService.agregarComentario(tarea._id, nuevoComentario);
      onActualizar(tarea._id, response.data);
      setNuevoComentario('');
    } catch (err) {
      console.error('Error al agregar comentario:', err);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleSubtareaActualizada = (tareaActualizada) => {
    onActualizar(tarea._id, tareaActualizada);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex-1 pr-3 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                {tarea.codigo && (
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {tarea.codigo}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${prioridadConfig.bg} ${prioridadConfig.text}`}>
                  <Flag size={12} className="inline mr-1" />
                  {prioridadConfig.label}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoConfig.bg} ${estadoConfig.text}`}>
                  {estadoConfig.label}
                </span>
                {estaVencida && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    <AlertTriangle size={12} className="inline mr-1" />
                    Vencida
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 break-words">{tarea.titulo}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-hide">
            <button
              onClick={() => setActiveTab('detalle')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'detalle'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Detalle
            </button>
            <button
              onClick={() => setActiveTab('subtareas')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'subtareas'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Subtareas
              {tarea.subtareas?.length > 0 && (
                <span className="bg-gray-200 text-gray-700 text-xs px-1.5 rounded">
                  {tarea.subtareas.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('comentarios')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'comentarios'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare size={14} className="sm:hidden" />
              <MessageSquare size={16} className="hidden sm:block" />
              <span className="hidden sm:inline">Comentarios</span>
              <span className="sm:hidden">Notas</span>
              {tarea.comentarios?.length > 0 && (
                <span className="bg-gray-200 text-gray-700 text-xs px-1.5 rounded">
                  {tarea.comentarios.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'historial'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <History size={14} className="sm:hidden" />
              <History size={16} className="hidden sm:block" />
              Historial
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === 'detalle' && (
              <div className="space-y-6">
                {/* Descripción */}
                {tarea.contenido && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Descripción</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-600 whitespace-pre-wrap">
                      {tarea.contenido}
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Categoría */}
                  {tarea.categoriaId && (
                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen size={16} className="text-gray-400" />
                      <span className="text-gray-600">Categoría:</span>
                      <span
                        className="px-2 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: tarea.categoriaId.color ? `${tarea.categoriaId.color}20` : '#e5e7eb',
                          color: tarea.categoriaId.color || '#374151'
                        }}
                      >
                        {tarea.categoriaId.nombre}
                      </span>
                    </div>
                  )}

                  {/* Asignado a */}
                  {tarea.asignadoNombre && (
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-600">Asignado a:</span>
                      <span className="font-medium">{tarea.asignadoNombre}</span>
                    </div>
                  )}

                  {/* Fecha programada */}
                  {tarea.fechaProgramada && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-600">Programada:</span>
                      <span>{new Date(tarea.fechaProgramada).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}

                  {/* Fecha vencimiento */}
                  {tarea.fechaVencimiento && (
                    <div className={`flex items-center gap-2 text-sm ${estaVencida ? 'text-red-600' : ''}`}>
                      <Calendar size={16} className={estaVencida ? 'text-red-500' : 'text-gray-400'} />
                      <span className={estaVencida ? 'text-red-600' : 'text-gray-600'}>Vencimiento:</span>
                      <span className={estaVencida ? 'font-medium' : ''}>
                        {new Date(tarea.fechaVencimiento).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}

                  {/* Creado */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-600">Creado:</span>
                    <span>{new Date(tarea.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>

                  {/* Creador */}
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-600">Creado por:</span>
                    <span className="font-medium">{tarea.creatorName}</span>
                  </div>
                </div>

                {/* Etiquetas */}
                {tarea.etiquetas?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Tag size={14} />
                      Etiquetas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tarea.etiquetas.map(etiqueta => (
                        <span
                          key={etiqueta._id}
                          className="px-3 py-1 text-sm rounded-full"
                          style={{
                            backgroundColor: etiqueta.color ? `${etiqueta.color}20` : '#dbeafe',
                            color: etiqueta.color || '#1d4ed8'
                          }}
                        >
                          {etiqueta.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info de revisión */}
                {tarea.revisadoPor && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Revisión</h3>
                    <div className="text-sm text-blue-700">
                      <p>Revisado por: {tarea.revisadoNombre}</p>
                      <p>Fecha: {new Date(tarea.revisadoAt).toLocaleDateString('es-ES')}</p>
                      <p>Resultado: <span className="font-medium capitalize">{tarea.resultadoRevision}</span></p>
                      {tarea.comentarioRevision && (
                        <p className="mt-2 italic">"{tarea.comentarioRevision}"</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subtareas' && (
              <SubtareasChecklist
                tareaId={tarea._id}
                subtareas={tarea.subtareas || []}
                onActualizar={handleSubtareaActualizada}
                puedeEditar={puedeEditar}
              />
            )}

            {activeTab === 'comentarios' && (
              <div className="space-y-4">
                {/* Lista de comentarios */}
                {tarea.comentarios?.length > 0 ? (
                  <div className="space-y-3">
                    {tarea.comentarios.map((comentario, index) => (
                      <div key={comentario._id || index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">{comentario.usuarioNombre}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comentario.fecha).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{comentario.contenido}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No hay comentarios</p>
                )}

                {/* Agregar comentario */}
                <div className="pt-4 border-t border-gray-200">
                  <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Agregar un comentario..."
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAgregarComentario}
                      disabled={enviandoComentario || !nuevoComentario.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {enviandoComentario ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="space-y-3">
                {tarea.historial?.length > 0 ? (
                  tarea.historial.slice().reverse().map((item, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2" />
                      <div>
                        <p className="text-gray-800">{item.descripcion}</p>
                        <p className="text-xs text-gray-500">
                          {item.usuarioNombre} - {new Date(item.fecha).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No hay historial</p>
                )}
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            {/* Acciones de revisión para admin */}
            {puedeRevisar && (
              <div className="space-y-3">
                <textarea
                  value={comentarioRevision}
                  onChange={(e) => setComentarioRevision(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Comentario de revisión (opcional)..."
                  disabled={accionEnProceso === 'revision'}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRevisarConCierre(tarea._id, 'aprobada', comentarioRevision)}
                    disabled={accionEnProceso === 'revision'}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accionEnProceso === 'revision' ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleRevisarConCierre(tarea._id, 'rechazada', comentarioRevision)}
                    disabled={accionEnProceso === 'revision'}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accionEnProceso === 'revision' ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <X size={18} />
                    )}
                    Rechazar
                  </button>
                </div>
              </div>
            )}

            {/* Acciones para el propietario */}
            {esPropietario && !puedeRevisar && (
              <div className="flex gap-3">
                {tarea.estado === 'pendiente' && (
                  <button
                    onClick={() => handleCambiarEstadoConCierre(tarea._id, 'en_progreso')}
                    disabled={accionEnProceso === 'estado'}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accionEnProceso === 'estado' ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Play size={18} />
                    )}
                    Iniciar Tarea
                  </button>
                )}
                {tarea.estado === 'en_progreso' && (
                  <>
                    <button
                      onClick={() => handleCambiarEstadoConCierre(tarea._id, 'pendiente')}
                      disabled={accionEnProceso === 'estado'}
                      className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {accionEnProceso === 'estado' ? (
                        <Loader size={18} className="animate-spin" />
                      ) : (
                        <Pause size={18} />
                      )}
                      Pausar
                    </button>
                    {tarea.requiereRevision ? (
                      <button
                        onClick={() => handleCambiarEstadoConCierre(tarea._id, 'en_revision')}
                        disabled={accionEnProceso === 'estado'}
                        className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {accionEnProceso === 'estado' ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                        Enviar a Revisión
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCambiarEstadoConCierre(tarea._id, 'completada')}
                        disabled={accionEnProceso === 'estado'}
                        className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {accionEnProceso === 'estado' ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Check size={18} />
                        )}
                        Completar
                      </button>
                    )}
                  </>
                )}
                {tarea.estado === 'en_revision' && (
                  <p className="text-center text-yellow-600 w-full py-2">
                    <Clock size={18} className="inline mr-2" />
                    Pendiente de revisión por administrador
                  </p>
                )}
              </div>
            )}

            {/* Mensaje si ya está completada */}
            {tarea.estado === 'completada' && (
              <p className="text-center text-green-600 py-2">
                <Check size={18} className="inline mr-2" />
                Tarea completada
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
