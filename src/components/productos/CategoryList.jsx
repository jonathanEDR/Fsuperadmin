import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nueva Categoría
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-800">
                  {category.nombre}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(category)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-gray-600">
                {category.descripcion || 'Sin descripción'}
              </p>
              <div className="mt-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  category.estado === 'activo' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro que deseas eliminar la categoría "{deleteTarget?.nombre}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
