import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import api from '../../services/api';
import categoryService from '../../services/categoryService';


const ProductCreationModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData = null, 
  isEditing = false 
}) => {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [catalogoProductos, setCatalogoProductos] = useState([]);
  const [formData, setFormData] = useState({
    precio: '',
    cantidad: '',
    categoryId: '',
    catalogoProductoId: ''
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

    const loadCatalogo = async () => {
      try {
        const productos = await api.get('/api/catalogo');
        setCatalogoProductos(productos.data);
      } catch (err) {
        setError('Error al cargar el catálogo');
      }
    };

    if (isOpen) {
      loadCategories();
      loadCatalogo();
      if (initialData) {
        setFormData({
          precio: initialData.precio || '',
          cantidad: initialData.cantidad || '',
          categoryId: initialData.categoryId || '',
          catalogoProductoId: initialData.catalogoProductoId || ''
        });
      }
    } else {
      setError('');
      setFormData({
        precio: '',
        cantidad: '',
        categoryId: '',
        catalogoProductoId: ''
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
      const data = {
        precio: parseFloat(formData.precio),
        cantidad: parseInt(formData.cantidad),
        categoryId: formData.categoryId,
        catalogoProductoId: formData.catalogoProductoId,
        creatorName: user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0],
        creatorEmail: user?.primaryEmailAddress?.emailAddress
      };

      console.log('[ProductCreationModal] Datos enviados al backend:', data);

      let response;
      if (isEditing && initialData?._id) {
        response = await api.put(`/api/productos/${initialData._id}`, data);
      } else {
        response = await api.post('/api/productos', data);
      }

      console.log('[ProductCreationModal] Respuesta del backend:', response);

      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (error) {
      console.error('[ProductCreationModal] Error al guardar producto:', error);
      if (error.response) {
        console.error('[ProductCreationModal] Error response data:', error.response.data);
      }
      
      // Manejo específico de errores comunes
      let errorMessage = 'Error al procesar el producto';
      
      if (error.response?.status === 409) {
        errorMessage = error.response.data?.message || 'Ya existe un producto con estos datos';
      } else if (error.response?.status === 401) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Datos inválidos';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
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
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative min-h-[400px] max-h-[90vh] overflow-y-auto">
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
              Producto del Catálogo
            </label>
            <select
              name="catalogoProductoId"
              value={formData.catalogoProductoId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un producto</option>
              {catalogoProductos.map(producto => (
                <option key={producto._id} value={producto._id}>
                  {producto.codigoproducto} - {producto.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* El campo de nombre se elimina porque se selecciona desde el catálogo */}

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
