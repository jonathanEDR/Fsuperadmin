import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Loader2, DollarSign, Package, Save, Sparkles, Check, Lightbulb, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
              <Package size={18} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del producto en modo edición */}
          {isEditing && initialData && (
            <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100 mb-4">
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
                <div className="mt-2 p-2 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
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
                <div className="mt-2 p-2 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
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
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <DollarSign size={14} className="text-gray-500" />
              Precio * {isEditing && <span className="text-blue-600 text-xs">(Campo editable)</span>}
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
                  pl-8 pr-3 py-2 w-full border rounded-xl outline-none focus:ring-2 transition-colors duration-200
                  ${formData.precio && parseFloat(formData.precio) > 0
                    ? 'border-green-200 focus:ring-green-400' 
                    : 'border-gray-200 focus:ring-blue-500'
                  }
                `}
                placeholder="0.00"
              />
            </div>
            {formData.precio && parseFloat(formData.precio) > 0 && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <Check size={11} /> Precio válido: S/ {parseFloat(formData.precio).toFixed(2)}
              </p>
            )}
          </div>

          {/* Cantidad - Solo en modo creación */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Package size={14} className="text-gray-500" /> Cantidad Inicial *
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
                    pr-16 py-2 w-full border rounded-xl outline-none focus:ring-2 transition-colors duration-200
                    ${formData.cantidad && parseInt(formData.cantidad) >= 0
                      ? 'border-green-200 focus:ring-green-400' 
                      : 'border-gray-200 focus:ring-blue-500'
                    }
                  `}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  unidades
                </span>
              </div>
              {formData.cantidad && parseInt(formData.cantidad) >= 0 && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <Check size={11} /> Stock inicial: {parseInt(formData.cantidad)} unidades
                </p>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || (!isEditing && (!formData.categoryId || !formData.catalogoProductoId))}
              className="flex-1 flex justify-center items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" /> Procesando...</>
              ) : isEditing ? (
                <><Save size={14} /> Actualizar Precio</>
              ) : (
                <><Sparkles size={14} /> Crear Producto</>
              )}
            </button>
          </div>

          {/* Hint de ayuda */}
          {!isEditing && (
            <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-600 flex items-start gap-1.5">
                <Lightbulb size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span><strong>Tip:</strong> Usa la búsqueda para encontrar rápidamente categorías y productos. Puedes buscar por nombre, código o categoría.</span>
              </p>
            </div>
          )}
        </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-3 rounded-b-2xl flex-shrink-0" />
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
