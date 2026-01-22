import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Loader,
  FolderOpen,
  Edit2,
  Trash2,
  Save,
  Palette,
  Check,
  AlertTriangle,
  Settings,
  Power
} from 'lucide-react';
import { categoriasService } from '../../services/tareas';

// Colores predefinidos para categorías
const COLORES_PREDEFINIDOS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

/**
 * Modal para gestionar categorías de tareas
 */
export default function GestionCategoriasModal({ isOpen, onClose, onCategoriasChange }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado para nueva categoría
  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: '',
    descripcion: '',
    color: '#3B82F6',
    codigo: ''
  });

  // Estado para edición
  const [editandoId, setEditandoId] = useState(null);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  // Cargar categorías al abrir
  useEffect(() => {
    if (isOpen) {
      cargarCategorias();
    }
  }, [isOpen]);

  const cargarCategorias = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await categoriasService.listar(true); // incluir inactivas
      setCategorias(response.data || []);
    } catch (err) {
      setError('Error al cargar categorías');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await categoriasService.crear(nuevaCategoria);
      setCategorias(prev => [...prev, response.data]);
      setNuevaCategoria({ nombre: '', descripcion: '', color: '#3B82F6', codigo: '' });
      setSuccess('Categoría creada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      if (onCategoriasChange) onCategoriasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleInicializarPredeterminadas = async () => {
    if (!window.confirm('¿Crear categorías predeterminadas? Esto agregará categorías base del sistema.')) return;

    setSaving(true);
    setError('');
    try {
      const response = await categoriasService.inicializarPredeterminadas();
      setSuccess(response.message || 'Categorías inicializadas');
      await cargarCategorias();
      if (onCategoriasChange) onCategoriasChange();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al inicializar categorías');
    } finally {
      setSaving(false);
    }
  };

  const handleEditarCategoria = (categoria) => {
    setEditandoId(categoria._id);
    setCategoriaEditando({ ...categoria });
  };

  const handleGuardarEdicion = async () => {
    if (!categoriaEditando.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await categoriasService.actualizar(editandoId, categoriaEditando);
      setCategorias(prev => prev.map(c => c._id === editandoId ? response.data : c));
      setEditandoId(null);
      setCategoriaEditando(null);
      setSuccess('Categoría actualizada');
      setTimeout(() => setSuccess(''), 3000);
      if (onCategoriasChange) onCategoriasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelarEdicion = () => {
    setEditandoId(null);
    setCategoriaEditando(null);
  };

  const handleEliminarCategoria = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Las tareas asociadas quedarán sin categoría.')) return;

    setSaving(true);
    setError('');
    try {
      await categoriasService.eliminar(id);
      setCategorias(prev => prev.filter(c => c._id !== id));
      setSuccess('Categoría eliminada');
      setTimeout(() => setSuccess(''), 3000);
      if (onCategoriasChange) onCategoriasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (categoria) => {
    setSaving(true);
    setError('');
    try {
      const nuevoEstado = !categoria.activo;
      const response = await categoriasService.actualizar(categoria._id, { activo: nuevoEstado });
      setCategorias(prev => prev.map(c => c._id === categoria._id ? response.data : c));
      setSuccess(nuevoEstado ? 'Categoría activada' : 'Categoría desactivada');
      setTimeout(() => setSuccess(''), 3000);
      if (onCategoriasChange) onCategoriasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setSaving(false);
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
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="text-blue-600" size={24} />
              Gestión de Categorías
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Mensajes */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <Check size={18} />
                {success}
              </div>
            )}

            {/* Formulario nueva categoría */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Plus size={16} />
                Nueva Categoría
              </h3>
              <form onSubmit={handleCrearCategoria} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={nuevaCategoria.nombre}
                      onChange={(e) => setNuevaCategoria(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Ventas"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                    <input
                      type="text"
                      value={nuevaCategoria.codigo}
                      onChange={(e) => setNuevaCategoria(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: VEN"
                      maxLength={5}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={nuevaCategoria.descripcion}
                    onChange={(e) => setNuevaCategoria(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción de la categoría"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <Palette size={12} className="inline mr-1" />
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 flex-wrap">
                      {COLORES_PREDEFINIDOS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNuevaCategoria(prev => ({ ...prev, color }))}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            nuevaCategoria.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={nuevaCategoria.color}
                      onChange={(e) => setNuevaCategoria(prev => ({ ...prev, color: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleInicializarPredeterminadas}
                    disabled={saving}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Crear Predeterminadas
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !nuevaCategoria.nombre.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                    Crear
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de categorías */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FolderOpen size={16} />
                Categorías Existentes ({categorias.length})
              </h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader className="animate-spin text-blue-600" size={32} />
                </div>
              ) : categorias.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <FolderOpen size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No hay categorías creadas</p>
                  <p className="text-sm">Crea una nueva o usa las predeterminadas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categorias.map(categoria => (
                    <div
                      key={categoria._id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        editandoId === categoria._id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {editandoId === categoria._id ? (
                        // Modo edición
                        <>
                          <input
                            type="color"
                            value={categoriaEditando.color || '#3B82F6'}
                            onChange={(e) => setCategoriaEditando(prev => ({ ...prev, color: e.target.value }))}
                            className="w-8 h-8 rounded cursor-pointer flex-shrink-0"
                          />
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={categoriaEditando.nombre}
                              onChange={(e) => setCategoriaEditando(prev => ({ ...prev, nombre: e.target.value }))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Nombre"
                            />
                            <input
                              type="text"
                              value={categoriaEditando.codigo || ''}
                              onChange={(e) => setCategoriaEditando(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Código"
                              maxLength={5}
                            />
                            <input
                              type="text"
                              value={categoriaEditando.descripcion || ''}
                              onChange={(e) => setCategoriaEditando(prev => ({ ...prev, descripcion: e.target.value }))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Descripción"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleGuardarEdicion}
                              disabled={saving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Guardar"
                            >
                              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                            </button>
                            <button
                              onClick={handleCancelarEdicion}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </>
                      ) : (
                        // Modo visualización
                        <>
                          <div
                            className="w-8 h-8 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: categoria.color || '#3B82F6' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{categoria.nombre}</span>
                              {categoria.codigo && (
                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  {categoria.codigo}
                                </span>
                              )}
                              {!categoria.activo && (
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                  Inactiva
                                </span>
                              )}
                            </div>
                            {categoria.descripcion && (
                              <p className="text-xs text-gray-500 truncate">{categoria.descripcion}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleToggleActivo(categoria)}
                              disabled={saving}
                              className={`p-1.5 rounded transition-colors ${
                                categoria.activo
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={categoria.activo ? 'Desactivar' : 'Activar'}
                            >
                              <Power size={16} />
                            </button>
                            <button
                              onClick={() => handleEditarCategoria(categoria)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleEliminarCategoria(categoria._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
