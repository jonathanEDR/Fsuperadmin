import React, { useState } from 'react';
import { Edit, Trash2, Plus, X, Tag, Loader2, AlertCircle, Save, AlertTriangle, Lightbulb } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import categoryService from '../../services/categoryService';

const CategoryModal = ({ open, onClose, onSubmit }) => {
  const { getToken } = useAuth();

  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  React.useEffect(() => {
    if (open) {
      loadCategories();
      resetForm();
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAllCategories();
      setCategories(data);
      setError('');
    } catch (err) {
      setError('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '' });
    setEditingCategory(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, formData, token);
      } else {
        await categoryService.createCategory(formData, token);
      }
      if (onSubmit) await onSubmit(formData);
      await loadCategories();
      resetForm();
      setError('');
    } catch (err) {
      setError(err.message || 'Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({ nombre: category.nombre, descripcion: category.descripcion || '' });
    setEditingCategory(category);
    setError('');
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      setLoading(true);
      const token = await getToken();
      await categoryService.deleteCategory(categoryToDelete._id, token);
      await loadCategories();
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
      setError('');
      setSuccess('Categoría eliminada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      let errorMessage = 'Error al eliminar la categoría';
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || 'No se puede eliminar esta categoría porque tiene productos asociados';
      } else if (err.response?.status === 404) {
        errorMessage = 'La categoría no existe o ya fue eliminada';
      } else if (err.response?.status === 403) {
        errorMessage = 'No tienes permisos para eliminar esta categoría';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setShowDeleteDialog(false);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-xl border border-green-100">
                <Tag size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gestión de Categorías</h2>
                <p className="text-xs text-gray-500">{categories.length} categorías registradas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Error al procesar categoría:</p>
                    <p className="text-sm text-red-700 mt-0.5">{error}</p>
                    {error.includes('productos asociados') && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-red-700 bg-red-100 p-2 rounded-lg border border-red-200">
                        <Lightbulb size={12} className="mt-0.5 flex-shrink-0" />
                        <span><strong>Solución:</strong> Elimina primero todos los productos de esta categoría o reasígnalos a otra.</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Éxito */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Formulario */}
            <div className="bg-gray-50/60 rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {editingCategory ? `Editar: ${editingCategory.nombre}` : 'Nueva Categoría'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Nombre de la categoría"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                    <input
                      type="text"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      placeholder="Descripción opcional"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : editingCategory ? <Save size={14} /> : <Plus size={14} />}
                    {editingCategory ? 'Actualizar' : 'Crear'}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <X size={14} />
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Lista de categorías */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Categorías Registradas ({categories.length})
              </h3>
              {loading && categories.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Tag size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No hay categorías registradas. ¡Crea la primera!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className={`p-4 border rounded-2xl transition-all duration-200 ${
                        editingCategory?._id === category._id
                          ? 'border-blue-200 bg-blue-50/60'
                          : 'border-gray-100 bg-white hover:shadow-sm hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm truncate flex-1">{category.nombre}</h4>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleEdit(category)}
                            title="Editar categoría"
                            className="p-1.5 rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(category)}
                            title="Eliminar categoría"
                            className="p-1.5 rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {category.descripcion || 'Sin descripción'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          category.estado === 'activo' || !category.estado
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {category.estado || 'activo'}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">...{category._id.slice(-6)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-3 flex justify-end rounded-b-2xl flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-white border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación eliminación */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Confirmar Eliminación</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                ¿Estás seguro que deseas eliminar la categoría <strong>"{categoryToDelete?.nombre}"</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold mb-1">Importante:</p>
                    <ul className="space-y-0.5 text-amber-700">
                      <li> No se pueden eliminar categorías con productos asociados</li>
                      <li> Primero debes eliminar o reasignar los productos</li>
                      <li> Verifica que no haya productos usando esta categoría</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-3 flex justify-end gap-2 rounded-b-2xl">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-white border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border text-red-700 bg-red-50 border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryModal;