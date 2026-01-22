import React from 'react';
import {
  Search,
  Flag,
  FolderOpen,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';

const PRIORIDADES = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' }
];

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'en_revision', label: 'En Revisión' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' }
];

/**
 * Componente de filtros para tareas
 */
export default function FiltrosTareas({
  filtros,
  onChange,
  categorias = [],
  etiquetas = []
}) {
  const handleChange = (campo, valor) => {
    onChange({ ...filtros, [campo]: valor });
  };

  const handleCheckboxChange = (campo) => {
    onChange({ ...filtros, [campo]: !filtros[campo] });
  };

  const limpiarFiltros = () => {
    onChange({
      estado: '',
      prioridad: '',
      categoriaId: '',
      buscar: '',
      soloVencidas: false,
      soloUrgentes: false
    });
  };

  const hayFiltrosActivos = filtros.estado || filtros.prioridad || filtros.categoriaId ||
    filtros.buscar || filtros.soloVencidas || filtros.soloUrgentes;

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={filtros.buscar}
          onChange={(e) => handleChange('buscar', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar tareas..."
        />
      </div>

      {/* Filtros en grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ESTADOS.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Flag size={14} className="inline mr-1" />
            Prioridad
          </label>
          <select
            value={filtros.prioridad}
            onChange={(e) => handleChange('prioridad', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {PRIORIDADES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FolderOpen size={14} className="inline mr-1" />
            Categoría
          </label>
          <select
            value={filtros.categoriaId}
            onChange={(e) => handleChange('categoriaId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filtros.soloVencidas}
              onChange={() => handleCheckboxChange('soloVencidas')}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <AlertTriangle size={14} className="text-red-500" />
              Solo vencidas
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filtros.soloUrgentes}
              onChange={() => handleCheckboxChange('soloUrgentes')}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Clock size={14} className="text-orange-500" />
              Solo urgentes
            </span>
          </label>
        </div>
      </div>

      {/* Limpiar filtros */}
      {hayFiltrosActivos && (
        <div className="flex justify-end">
          <button
            onClick={limpiarFiltros}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Etiquetas seleccionables */}
      {etiquetas.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por etiquetas
          </label>
          <div className="flex flex-wrap gap-2">
            {etiquetas.slice(0, 10).map(etiqueta => (
              <button
                key={etiqueta._id}
                type="button"
                onClick={() => {
                  const etiquetasActuales = filtros.etiquetas || [];
                  const nuevasEtiquetas = etiquetasActuales.includes(etiqueta._id)
                    ? etiquetasActuales.filter(id => id !== etiqueta._id)
                    : [...etiquetasActuales, etiqueta._id];
                  handleChange('etiquetas', nuevasEtiquetas);
                }}
                className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                  (filtros.etiquetas || []).includes(etiqueta._id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                style={(filtros.etiquetas || []).includes(etiqueta._id) && etiqueta.color ? {
                  backgroundColor: `${etiqueta.color}20`,
                  borderColor: etiqueta.color,
                  color: etiqueta.color
                } : {}}
              >
                {etiqueta.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
