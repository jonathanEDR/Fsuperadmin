import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Loader,
  Flag,
  Calendar,
  Tag,
  FolderOpen,
  User,
  FileText,
  CheckSquare,
  Trash2,
  LayoutTemplate,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { getLocalDateTimeString } from '../../utils/fechaHoraUtils';

const PRIORIDADES = [
  { value: 'urgente', label: 'Urgente', color: 'text-red-600' },
  { value: 'alta', label: 'Alta', color: 'text-orange-600' },
  { value: 'media', label: 'Media', color: 'text-yellow-600' },
  { value: 'baja', label: 'Baja', color: 'text-green-600' }
];

/**
 * Modal para crear nueva tarea
 */
export default function CrearTareaModal({
  isOpen,
  onClose,
  onCrear,
  categorias = [],
  etiquetas = [],
  plantillas = [],
  userRole
}) {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    prioridad: 'media',
    categoriaId: '',
    etiquetas: [],
    fechaVencimiento: '',
    fechaProgramada: '',
    asignadoA: '',
    requiereRevision: true,
    subtareas: []
  });

  // Estado para nueva subtarea
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  // Estado para mostrar selector de plantillas
  const [showPlantillas, setShowPlantillas] = useState(false);

  // Cargar usuarios si es admin
  useEffect(() => {
    if (isOpen && ['admin', 'super_admin'].includes(userRole)) {
      cargarUsuarios();
    }
  }, [isOpen, userRole]);

  // Reset form al abrir - Inicializar con fecha y hora actual (hora Lima)
  useEffect(() => {
    if (isOpen) {
      const fechaHoraHoy = getLocalDateTimeString(false); // Formato YYYY-MM-DDTHH:mm
      setFormData({
        titulo: '',
        contenido: '',
        prioridad: 'media',
        categoriaId: '',
        etiquetas: [],
        fechaVencimiento: fechaHoraHoy,
        fechaProgramada: fechaHoraHoy,
        asignadoA: '',
        requiereRevision: true,
        subtareas: []
      });
      setNuevaSubtarea('');
      setShowPlantillas(false);
    }
  }, [isOpen]);

  // Aplicar plantilla seleccionada
  const handleAplicarPlantilla = (plantilla) => {
    // Calcular fecha de vencimiento basada en días
    let fechaVencimiento = '';
    if (plantilla.diasParaVencimiento) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + plantilla.diasParaVencimiento);
      fechaVencimiento = fecha.toISOString().split('T')[0];
    }

    setFormData(prev => ({
      ...prev,
      titulo: plantilla.tituloBase || '',
      contenido: plantilla.contenidoBase || '',
      prioridad: plantilla.prioridadDefecto || 'media',
      categoriaId: plantilla.categoriaId || '',
      fechaVencimiento: fechaVencimiento,
      etiquetas: plantilla.etiquetasPredefinidas || [],
      subtareas: (plantilla.subtareasPredefinidas || []).map(st => ({
        titulo: st.titulo,
        descripcion: st.descripcion || ''
      }))
    }));
    setShowPlantillas(false);
  };

  const cargarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const endpoint = userRole === 'super_admin'
        ? '/api/admin/users'
        : '/api/notes/my-users';
      const response = await api.get(endpoint);
      setUsuarios(response.data.users || response.data || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEtiquetaToggle = (etiquetaId) => {
    setFormData(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(etiquetaId)
        ? prev.etiquetas.filter(id => id !== etiquetaId)
        : [...prev.etiquetas, etiquetaId]
    }));
  };

  const handleAgregarSubtarea = () => {
    if (!nuevaSubtarea.trim()) return;
    setFormData(prev => ({
      ...prev,
      subtareas: [...prev.subtareas, { titulo: nuevaSubtarea.trim(), descripcion: '' }]
    }));
    setNuevaSubtarea('');
  };

  const handleEliminarSubtarea = (index) => {
    setFormData(prev => ({
      ...prev,
      subtareas: prev.subtareas.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para enviar
      const datosEnviar = {
        ...formData,
        etiquetas: formData.etiquetas.length > 0 ? formData.etiquetas : undefined,
        categoriaId: formData.categoriaId || undefined,
        fechaVencimiento: formData.fechaVencimiento || undefined,
        fechaProgramada: formData.fechaProgramada || undefined,
        asignadoA: formData.asignadoA || undefined,
        subtareas: formData.subtareas.length > 0 ? formData.subtareas : undefined
      };

      await onCrear(datosEnviar);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Plus className="text-blue-600" size={24} />
              Nueva Tarea
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Selector de Plantillas */}
            {plantillas.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <button
                  type="button"
                  onClick={() => setShowPlantillas(!showPlantillas)}
                  className="w-full flex items-center justify-between text-sm font-medium text-purple-700"
                >
                  <span className="flex items-center gap-2">
                    <LayoutTemplate size={16} />
                    Usar Plantilla
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${showPlantillas ? 'rotate-180' : ''}`} />
                </button>

                {showPlantillas && (
                  <div className="mt-3 space-y-2">
                    {plantillas.filter(p => p.activa !== false).map(plantilla => (
                      <button
                        key={plantilla._id}
                        type="button"
                        onClick={() => handleAplicarPlantilla(plantilla)}
                        className="w-full text-left px-3 py-2 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-6 rounded-full"
                            style={{
                              backgroundColor: categorias.find(c => c._id === plantilla.categoriaId)?.color || '#6B7280'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{plantilla.nombre}</p>
                            {plantilla.descripcion && (
                              <p className="text-xs text-gray-500 truncate">{plantilla.descripcion}</p>
                            )}
                          </div>
                          {plantilla.subtareasPredefinidas?.length > 0 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {plantilla.subtareasPredefinidas.length} subtareas
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={16} className="inline mr-1" />
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título de la tarea"
                required
              />
            </div>

            {/* Contenido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="contenido"
                value={formData.contenido}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Descripción detallada de la tarea..."
              />
            </div>

            {/* Prioridad y Categoría */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Flag size={16} className="inline mr-1" />
                  Prioridad
                </label>
                <select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PRIORIDADES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FolderOpen size={16} className="inline mr-1" />
                  Categoría
                </label>
                <select
                  name="categoriaId"
                  value={formData.categoriaId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fechas con hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Fecha y Hora Programada
                </label>
                <input
                  type="datetime-local"
                  name="fechaProgramada"
                  value={formData.fechaProgramada}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1 text-red-500" />
                  Fecha y Hora de Vencimiento
                </label>
                <input
                  type="datetime-local"
                  name="fechaVencimiento"
                  value={formData.fechaVencimiento}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Asignar a usuario (solo admin) */}
            {['admin', 'super_admin'].includes(userRole) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={16} className="inline mr-1" />
                  Asignar a
                </label>
                <select
                  name="asignadoA"
                  value={formData.asignadoA}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingUsuarios}
                >
                  <option value="">Sin asignar (para mí)</option>
                  {usuarios.map(u => (
                    <option key={u.clerk_id || u.id} value={u.clerk_id || u.id}>
                      {u.nombre_negocio || u.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Etiquetas */}
            {etiquetas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag size={16} className="inline mr-1" />
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {etiquetas.map(etiqueta => (
                    <button
                      key={etiqueta._id}
                      type="button"
                      onClick={() => handleEtiquetaToggle(etiqueta._id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        formData.etiquetas.includes(etiqueta._id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                      style={formData.etiquetas.includes(etiqueta._id) && etiqueta.color ? {
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

            {/* Subtareas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckSquare size={16} className="inline mr-1" />
                Subtareas (Checklist)
              </label>

              {/* Lista de subtareas */}
              {formData.subtareas.length > 0 && (
                <div className="mb-3 space-y-2">
                  {formData.subtareas.map((subtarea, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg"
                    >
                      <CheckSquare size={16} className="text-gray-400" />
                      <span className="flex-1 text-sm">{subtarea.titulo}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarSubtarea(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar subtarea */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaSubtarea}
                  onChange={(e) => setNuevaSubtarea(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarSubtarea())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Agregar subtarea..."
                />
                <button
                  type="button"
                  onClick={handleAgregarSubtarea}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Requiere revisión */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="requiereRevision"
                name="requiereRevision"
                checked={formData.requiereRevision}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="requiereRevision" className="text-sm text-gray-700">
                Requiere revisión de administrador antes de completar
              </label>
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.titulo.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Crear Tarea
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
