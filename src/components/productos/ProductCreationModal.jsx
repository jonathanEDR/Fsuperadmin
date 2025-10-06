import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import api from '../../services/api';
import categoryService from '../../services/categoryService';
import SearchableSelect from '../common/SearchableSelect';


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
  const [selectedCatalogo, setSelectedCatalogo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    precio: '',
    cantidad: '',
    categoryId: '',
    catalogoProductoId: ''
  });

  useEffect(() => {
    const loadInitialData = async () => {
      if (!isOpen) {
        // Limpiar estado al cerrar
        setError('');
        setFormData({
          precio: '',
          cantidad: '',
          categoryId: '',
          catalogoProductoId: ''
        });
        setSelectedCatalogo(null);
        setSelectedCategory(null);
        return;
      }

      try {
        // Cargar categorías y catálogo en paralelo
        const [categoriesData, catalogoData] = await Promise.all([
          categoryService.getAllCategories(),
          api.get('/api/catalogo')
        ]);

        setCategories(categoriesData);
        setCatalogoProductos(catalogoData.data);

        // Si estamos editando, cargar los datos iniciales
        if (isEditing && initialData) {
          // console.log('[ProductCreationModal] Cargando datos para edición:', initialData);
          
          // Buscar la categoría completa
          const categoria = categoriesData.find(cat => cat._id === initialData.categoryId);
          setSelectedCategory(categoria);

          // Buscar el producto del catálogo completo
          const catalogoProducto = catalogoData.data.find(prod => prod._id === initialData.catalogoProductoId);
          setSelectedCatalogo(catalogoProducto);

          setFormData({
            precio: initialData.precio?.toString() || '',
            cantidad: initialData.cantidad?.toString() || '',
            categoryId: initialData.categoryId || '',
            catalogoProductoId: initialData.catalogoProductoId || ''
          });
        }
      } catch (err) {
        console.error('[ProductCreationModal] Error al cargar datos:', err);
        setError('Error al cargar los datos necesarios');
      }
    };

    loadInitialData();
  }, [isOpen, initialData, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validaciones específicas según el modo
    if (isEditing) {
      // En modo edición, solo validar precio
      if (!formData.precio || parseFloat(formData.precio) <= 0) {
        setError('El precio debe ser mayor a 0');
        setIsSubmitting(false);
        return;
      }
    } else {
      // En modo creación, validar todos los campos
      if (!formData.categoryId) {
        setError('Debes seleccionar una categoría');
        setIsSubmitting(false);
        return;
      }

      if (!formData.catalogoProductoId) {
        setError('Debes seleccionar un producto del catálogo');
        setIsSubmitting(false);
        return;
      }

      if (!formData.precio || parseFloat(formData.precio) <= 0) {
        setError('El precio debe ser mayor a 0');
        setIsSubmitting(false);
        return;
      }

      if (!formData.cantidad || parseInt(formData.cantidad) < 0) {
        setError('La cantidad debe ser mayor o igual a 0');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      let data;
      
      if (isEditing) {
        // En modo edición, solo enviar precio
        data = {
          precio: parseFloat(formData.precio)
        };
      } else {
        // En modo creación, enviar todos los datos
        data = {
          precio: parseFloat(formData.precio),
          cantidad: parseInt(formData.cantidad),
          categoryId: formData.categoryId,
          catalogoProductoId: formData.catalogoProductoId,
          creatorName: user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0],
          creatorEmail: user?.primaryEmailAddress?.emailAddress
        };
      }

      // console.log('[ProductCreationModal] Datos enviados al backend:', data);
      // console.log('[ProductCreationModal] Modo edición:', isEditing);
      // console.log('[ProductCreationModal] ID del producto:', initialData?._id);

      let response;
      if (isEditing && initialData?._id) {
        response = await api.put(`/api/productos/${initialData._id}`, data);
      } else {
        response = await api.post('/api/productos', data);
      }

      // console.log('[ProductCreationModal] Respuesta del backend:', response);

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

    // Actualizar los objetos seleccionados para mostrar información adicional
    if (name === 'categoryId') {
      const categoria = categories.find(cat => cat._id === value);
      setSelectedCategory(categoria);
    }

    if (name === 'catalogoProductoId') {
      const catalogoProducto = catalogoProductos.find(prod => prod._id === value);
      setSelectedCatalogo(catalogoProducto);
    }
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
          {/* Información del producto en modo edición */}
          {isEditing && initialData && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Información del Producto</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span> {initialData.nombre}
                </div>
                <div>
                  <span className="font-medium">Código:</span> {initialData.codigoProducto}
                </div>
                <div>
                  <span className="font-medium">Categoría:</span> {selectedCategory?.nombre || 'Cargando...'}
                </div>
                <div>
                  <span className="font-medium">Cantidad Actual:</span> {initialData.cantidad}
                </div>
              </div>
            </div>
          )}

          {/* Categoría - Solo mostrar en modo creación */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <SearchableSelect
                name="categoryId"
                options={categories.map(cat => ({
                  id: cat._id,
                  label: cat.nombre,
                  description: cat.descripcion
                }))}
                value={formData.categoryId}
                onChange={(value) => handleChange({
                  target: { name: 'categoryId', value }
                })}
                placeholder="Selecciona una categoría"
                searchPlaceholder="Buscar categorías..."
                required={true}
                className="mt-1"
              />
              {selectedCategory && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Categoría seleccionada:</strong> {selectedCategory.nombre}
                  {selectedCategory.descripcion && (
                    <>
                      <br />
                      <span className="text-blue-600">{selectedCategory.descripcion}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Producto del Catálogo - Solo mostrar en modo creación */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto del Catálogo *
              </label>
              <SearchableSelect
                name="catalogoProductoId"
                options={catalogoProductos.map(producto => ({
                  id: producto._id,
                  code: producto.codigoproducto || producto.codigoProducto,
                  label: producto.nombre,
                  description: producto.descripcion,
                  categoria: producto.categoria
                }))}
                value={formData.catalogoProductoId}
                onChange={(value) => handleChange({
                  target: { name: 'catalogoProductoId', value }
                })}
                placeholder="Selecciona un producto del catálogo"
                searchPlaceholder="Buscar por código o nombre..."
                required={true}
                className="mt-1"
                filterFn={(productos, searchTerm) => {
                  const term = searchTerm.toLowerCase();
                  return productos.filter(producto => 
                    producto.label.toLowerCase().includes(term) ||
                    (producto.code && producto.code.toLowerCase().includes(term)) ||
                    (producto.categoria && producto.categoria.toLowerCase().includes(term))
                  );
                }}
              />
              {selectedCatalogo && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong>Producto:</strong> {selectedCatalogo.nombre}
                    </div>
                    <div>
                      <strong>Código:</strong> {selectedCatalogo.codigoproducto || selectedCatalogo.codigoProducto}
                    </div>
                    {selectedCatalogo.categoria && (
                      <div className="col-span-2">
                        <strong>Categoría:</strong> {selectedCatalogo.categoria}
                      </div>
                    )}
                    {selectedCatalogo.descripcion && (
                      <div className="col-span-2">
                        <strong>Descripción:</strong> {selectedCatalogo.descripcion}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Precio - Siempre editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💰 Precio * {isEditing && <span className="text-blue-600">(Campo editable)</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                S/
              </span>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={`
                  pl-8 pr-3 py-2 w-full border rounded-md shadow-sm focus:outline-none transition-colors duration-200
                  ${formData.precio && parseFloat(formData.precio) > 0
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }
                `}
                placeholder="0.00"
              />
            </div>
            {formData.precio && parseFloat(formData.precio) > 0 && (
              <p className="mt-1 text-xs text-green-600">
                ✓ Precio válido: S/ {parseFloat(formData.precio).toFixed(2)}
              </p>
            )}
          </div>

          {/* Cantidad - Solo en modo creación */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📦 Cantidad Inicial *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  required
                  min="0"
                  className={`
                    pr-16 py-2 w-full border rounded-md shadow-sm focus:outline-none transition-colors duration-200
                    ${formData.cantidad && parseInt(formData.cantidad) >= 0
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }
                  `}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  unidades
                </span>
              </div>
              {formData.cantidad && parseInt(formData.cantidad) >= 0 && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Stock inicial: {parseInt(formData.cantidad)} unidades
                </p>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || (!isEditing && (!formData.categoryId || !formData.catalogoProductoId))}
              className={`
                flex-1 flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                ${isSubmitting || (!isEditing && (!formData.categoryId || !formData.catalogoProductoId))
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
                transition-colors duration-200
              `}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                isEditing ? '💾 Actualizar Precio' : '✨ Crear Producto'
              )}
            </button>
          </div>

          {/* Hint de ayuda */}
          {!isEditing && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>💡 Tip:</strong> Usa la búsqueda para encontrar rápidamente categorías y productos. 
                Puedes buscar por nombre, código o categoría.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProductCreationModal;

/* 
 * Modal mejorado para creación y edición de productos
 * 
 * Características:
 * - En modo creación: permite seleccionar categoría, producto del catálogo, precio y cantidad
 * - En modo edición: solo permite editar el precio, muestra información del producto
 * - Carga automáticamente datos al abrir el modal
 * - Validaciones específicas según el modo
 * - Manejo mejorado de errores
 * - Interfaz más clara y user-friendly
 */
