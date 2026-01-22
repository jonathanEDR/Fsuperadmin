import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Loader
} from 'lucide-react';
import { tareasService } from '../../services/tareas';

/**
 * Componente para gestionar subtareas (checklist) de una tarea
 */
export default function SubtareasChecklist({
  tareaId,
  subtareas = [],
  onActualizar,
  puedeEditar = true
}) {
  const [loading, setLoading] = useState(null); // ID de subtarea en proceso
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');
  const [agregando, setAgregando] = useState(false);

  // Calcular progreso
  const completadas = subtareas.filter(s => s.completada).length;
  const total = subtareas.length;
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const handleToggleSubtarea = async (subtareaId, completada) => {
    setLoading(subtareaId);
    try {
      const response = completada
        ? await tareasService.descompletarSubtarea(tareaId, subtareaId)
        : await tareasService.completarSubtarea(tareaId, subtareaId);
      onActualizar(response.data);
    } catch (err) {
      console.error('Error al actualizar subtarea:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleAgregarSubtarea = async () => {
    if (!nuevaSubtarea.trim()) return;
    setAgregando(true);
    try {
      const response = await tareasService.agregarSubtarea(tareaId, {
        titulo: nuevaSubtarea.trim()
      });
      onActualizar(response.data);
      setNuevaSubtarea('');
    } catch (err) {
      console.error('Error al agregar subtarea:', err);
    } finally {
      setAgregando(false);
    }
  };

  const handleEliminarSubtarea = async (subtareaId) => {
    if (!window.confirm('¿Eliminar esta subtarea?')) return;
    setLoading(subtareaId);
    try {
      const response = await tareasService.eliminarSubtarea(tareaId, subtareaId);
      onActualizar(response.data);
    } catch (err) {
      console.error('Error al eliminar subtarea:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Progreso */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progreso</span>
            <span className="font-medium text-gray-800">{completadas}/{total} ({progreso}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                progreso === 100 ? 'bg-green-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de subtareas */}
      <div className="space-y-2">
        {subtareas.map(subtarea => (
          <div
            key={subtarea._id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              subtarea.completada
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => handleToggleSubtarea(subtarea._id, subtarea.completada)}
              disabled={loading === subtarea._id || !puedeEditar}
              className={`flex-shrink-0 transition-colors ${
                subtarea.completada ? 'text-green-600' : 'text-gray-400 hover:text-blue-600'
              }`}
            >
              {loading === subtarea._id ? (
                <Loader size={20} className="animate-spin" />
              ) : subtarea.completada ? (
                <CheckSquare size={20} />
              ) : (
                <Square size={20} />
              )}
            </button>

            {/* Título */}
            <div className="flex-1">
              <span className={`text-sm ${
                subtarea.completada ? 'text-gray-500 line-through' : 'text-gray-800'
              }`}>
                {subtarea.titulo}
              </span>
              {subtarea.descripcion && (
                <p className="text-xs text-gray-500 mt-0.5">{subtarea.descripcion}</p>
              )}
              {subtarea.completada && subtarea.completadaAt && (
                <p className="text-xs text-green-600 mt-0.5">
                  Completada el {new Date(subtarea.completadaAt).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>

            {/* Eliminar */}
            {puedeEditar && (
              <button
                onClick={() => handleEliminarSubtarea(subtarea._id)}
                disabled={loading === subtarea._id}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Agregar nueva subtarea */}
      {puedeEditar && (
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={nuevaSubtarea}
            onChange={(e) => setNuevaSubtarea(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAgregarSubtarea()}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nueva subtarea..."
            disabled={agregando}
          />
          <button
            onClick={handleAgregarSubtarea}
            disabled={agregando || !nuevaSubtarea.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {agregando ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
          </button>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && !puedeEditar && (
        <p className="text-sm text-gray-500 text-center py-4">
          No hay subtareas
        </p>
      )}
    </div>
  );
}
