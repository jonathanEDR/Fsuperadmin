import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, AlertCircle, X, Tag } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import categoryService from '../../services/categoryService';
import CategoryModal from './CategoryModal';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  const { getToken } = useAuth();

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      setError('Error al cargar las categorías');
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateClick = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const handleEditClick = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleDeleteClick = (category) => {
    setDeleteTarget(category);
    setDeleteDialogOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    try {
      const token = await getToken();
      if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory._id, formData, token);
      } else {
        await categoryService.createCategory(formData, token);
      }
      loadCategories();
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Error al guardar la categoría');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = await getToken();
      await categoryService.deleteCategory(deleteTarget._id, token);
      loadCategories();
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Error al eliminar la categoría');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Categorías
        </h2>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category._id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-semibold text-gray-800">
                  {category.nombre}
                </h3>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleEditClick(category)}
                    className="p-1.5 rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="p-1.5 rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {category.descripcion || 'Sin descripción'}
              </p>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  category.estado === 'activo' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {category.estado}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedCategory}
      />

      {/* Modal de confirmación de eliminación */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Confirmar Eliminación</h3>
            </div>
            <div className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar la categoría "{deleteTarget?.nombre}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border text-red-700 bg-red-50 border-red-200 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
