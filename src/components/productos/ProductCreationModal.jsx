import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../../services/api';
import categoryService from '../../services/categoryService';

const ProductCreationModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData = null, 
  isEditing = false 
}) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    cantidad: '',
    categoryId: ''
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getAllCategories();
        setCategories(data);
      } catch (err) {
        setError('Error al cargar las categorías');
      }
    };

    if (isOpen) {
      loadCategories();
      if (initialData) {
        setFormData({
          nombre: initialData.nombre || '',
          precio: initialData.precio || '',
          cantidad: initialData.cantidad || '',
          categoryId: initialData.categoryId || ''
        });
      }
    } else {
      setError('');
      setFormData({
        nombre: '',
        precio: '',
        cantidad: '',
        categoryId: ''
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validación extra: categoría seleccionada
    if (!formData.categoryId) {
      setError('Debes seleccionar una categoría');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await getToken();
      const data = {
        nombre: formData.nombre.trim(),
        precio: parseFloat(formData.precio),
        cantidad: parseInt(formData.cantidad),
        categoryId: formData.categoryId,
        creatorName: user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0],
        creatorEmail: user?.primaryEmailAddress?.emailAddress
      };

      let response;
      if (isEditing && initialData?._id) {
        response = await api.put(`/api/productos/${initialData._id}`, data, token);
      } else {
        response = await api.post('/api/productos', data, token);
      }

      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || error.message || 'Error al procesar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre del Producto
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Precio
            </label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cantidad
            </label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              required
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Producto')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductCreationModal;

// Asegúrate de que este archivo esté guardado como ProductCreationModal.jsx
// y que esté en la misma carpeta que ProductoList.jsx
