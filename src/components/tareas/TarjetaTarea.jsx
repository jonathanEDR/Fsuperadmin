import React from 'react';
import {
  User,
  Calendar,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Clock,
  ChevronRight,
  Flag,
  Tag,
  CheckSquare,
  MessageSquare,
  Send,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

// Configuración de colores por prioridad
const PRIORIDAD_CONFIG = {
  urgente: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: 'text-red-500' },
  alta: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: 'text-orange-500' },
  media: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: 'text-yellow-500' },
  baja: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: 'text-green-500' }
};

// Configuración de colores por estado
const ESTADO_CONFIG = {
  pendiente: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pendiente' },
  en_progreso: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Progreso' },
  en_revision: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Revisión' },
  completada: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completada' },
  cancelada: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
};

/**
 * Componente para mostrar una tarjeta de tarea
 */
export default function TarjetaTarea({
  tarea,
  onVerDetalle,
  onCambiarEstado,
  onEnviarRevision,
  onRevisar,
  onEliminar,
  userRole,
  userId,
  mostrarAccionesRevision = false
}) {
  const prioridadConfig = PRIORIDAD_CONFIG[tarea.prioridad] || PRIORIDAD_CONFIG.media;
  const estadoConfig = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG.pendiente;

  // Calcular progreso de subtareas
  const subtareasCompletadas = tarea.subtareas?.filter(s => s.completada).length || 0;
  const subtareasTotales = tarea.subtareas?.length || 0;
  const progresoSubtareas = subtareasTotales > 0
    ? Math.round((subtareasCompletadas / subtareasTotales) * 100)
    : 0;

  // Verificar si está vencida
  const estaVencida = tarea.fechaVencimiento && new Date(tarea.fechaVencimiento) < new Date() && tarea.estado !== 'completada';

  // Verificar permisos
  const esPropietario = tarea.userId === userId || tarea.asignadoA === userId;
  const esAdmin = ['admin', 'super_admin'].includes(userRole);
  const puedeEditar = esPropietario || esAdmin;
  const puedeEliminar = esAdmin;
  const puedeRevisar = esAdmin && tarea.estado === 'en_revision';

  return (
    <div
      className={`border rounded-xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 bg-white ${
        estaVencida ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            {/* Código de tarea */}
            {tarea.codigo && (
              <span className="text-[10px] sm:text-xs font-mono bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                {tarea.codigo}
              </span>
            )}
            {/* Badge de prioridad */}
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full flex items-center gap-1 ${prioridadConfig.bg} ${prioridadConfig.text}`}>
              <Flag size={10} className={`sm:w-3 sm:h-3 ${prioridadConfig.icon}`} />
              {tarea.prioridad?.charAt(0).toUpperCase() + tarea.prioridad?.slice(1)}
            </span>
            {/* Badge de estado */}
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${estadoConfig.bg} ${estadoConfig.text}`}>
              {estadoConfig.label}
            </span>
            {/* Badge de tarea permanente */}
            {tarea.esPermanente && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <RefreshCw size={9} />
                Diaria
              </span>
            )}
            {/* Indicador de vencimiento */}
            {estaVencida && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                <AlertTriangle size={10} className="sm:w-3 sm:h-3" />
                Vencida
              </span>
            )}
          </div>
          <h3
            className="text-base sm:text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
            onClick={() => onVerDetalle(tarea)}
          >
            {tarea.titulo}
          </h3>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2">
          {puedeEliminar && (
            <button
              onClick={() => onEliminar(tarea._id)}
              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => onVerDetalle(tarea)}
            className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            title="Ver detalles"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      {tarea.contenido && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {tarea.contenido}
        </p>
      )}

      {/* Categoría y etiquetas */}
      <div className="flex flex-wrap gap-2 mb-3">
        {tarea.categoriaId && (
          <span
            className="px-2 py-1 text-xs rounded-full flex items-center gap-1"
            style={{
              backgroundColor: tarea.categoriaId.color ? `${tarea.categoriaId.color}20` : '#e5e7eb',
              color: tarea.categoriaId.color || '#374151'
            }}
          >
            {tarea.categoriaId.nombre}
          </span>
        )}
        {tarea.etiquetas?.map(etiqueta => (
          <span
            key={etiqueta._id}
            className="px-2 py-1 text-xs rounded-full flex items-center gap-1"
            style={{
              backgroundColor: etiqueta.color ? `${etiqueta.color}20` : '#dbeafe',
              color: etiqueta.color || '#1d4ed8'
            }}
          >
            <Tag size={10} />
            {etiqueta.nombre}
          </span>
        ))}
      </div>

      {/* Progreso de subtareas */}
      {subtareasTotales > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare size={14} />
              Subtareas
            </span>
            <span>{subtareasCompletadas}/{subtareasTotales}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progresoSubtareas}%` }}
            />
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
        {/* Asignado a */}
        {tarea.asignadoNombre && (
          <div className="flex items-center gap-1">
            <User size={14} />
            <span>{tarea.asignadoNombre}</span>
          </div>
        )}
        {/* Fecha de vencimiento */}
        {tarea.fechaVencimiento && (
          <div className={`flex items-center gap-1 ${estaVencida ? 'text-red-600 font-medium' : ''}`}>
            <Calendar size={14} />
            <span>
              {new Date(tarea.fechaVencimiento).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </div>
        )}
        {/* Comentarios */}
        {tarea.comentarios?.length > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare size={14} />
            <span>{tarea.comentarios.length}</span>
          </div>
        )}
        {/* Creado */}
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>
            {new Date(tarea.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short'
            })}
          </span>
        </div>
      </div>

      {/* Acciones según estado */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
        {/* Acciones para el propietario */}
        {esPropietario && tarea.estado === 'pendiente' && (
          <button
            onClick={() => onCambiarEstado(tarea._id, 'en_progreso')}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors"
          >
            <Play size={14} />
            Iniciar
          </button>
        )}

        {esPropietario && tarea.estado === 'en_progreso' && (
          <>
            <button
              onClick={() => onCambiarEstado(tarea._id, 'pendiente')}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1 transition-colors"
            >
              <Pause size={14} />
              Pausar
            </button>
            {tarea.requiereRevision ? (
              <button
                onClick={() => onEnviarRevision(tarea._id)}
                className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 flex items-center gap-1 transition-colors"
              >
                <Send size={14} />
                Enviar a Revisión
              </button>
            ) : (
              <button
                onClick={() => onCambiarEstado(tarea._id, 'completada')}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1 transition-colors"
              >
                <Check size={14} />
                Completar
              </button>
            )}
          </>
        )}

        {/* Acciones de revisión para admin */}
        {mostrarAccionesRevision && puedeRevisar && (
          <>
            <button
              onClick={() => onRevisar(tarea._id, 'aprobada')}
              className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 transition-colors"
            >
              <Check size={16} />
              Aprobar
            </button>
            <button
              onClick={() => onRevisar(tarea._id, 'rechazada')}
              className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center justify-center gap-1 transition-colors"
            >
              <X size={16} />
              Rechazar
            </button>
          </>
        )}
      </div>

      {/* Info del creador (para admins) */}
      {esAdmin && tarea.creatorName && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span>Creada por: </span>
          <span className="font-medium">{tarea.creatorName}</span>
          {tarea.creatorRole && (
            <span className={`ml-2 px-1.5 py-0.5 rounded ${
              tarea.creatorRole === 'super_admin' ? 'bg-purple-100 text-purple-700' :
              tarea.creatorRole === 'admin' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {tarea.creatorRole}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
