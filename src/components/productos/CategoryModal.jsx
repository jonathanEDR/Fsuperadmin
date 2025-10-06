import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  IconButton,
  Chip
} from '@mui/material';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import categoryService from '../../services/categoryService';

const CategoryModal = ({ open, onClose, onSubmit }) => {
  const { getToken } = useAuth();
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  
  // Estados para la gestión
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Cargar categorías cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      loadCategories();
      resetForm();
    }
  }, [open]);

  // Cargar lista de categorías
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAllCategories();
      setCategories(data);
      setError('');
    } catch (err) {
      setError('Error al cargar las categorías');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: ''
    });
    setEditingCategory(null);
    setError('');
  };

  // Manejar envío del formulario
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
        // Actualizar categoría existente
        await categoryService.updateCategory(editingCategory._id, formData, token);
      } else {
        // Crear nueva categoría
        await categoryService.createCategory(formData, token);
      }
      
      // Ejecutar callback si existe
      if (onSubmit) {
        await onSubmit(formData);
      }
      
      // Recargar lista y resetear formulario
      await loadCategories();
      resetForm();
      setError('');
    } catch (err) {
      setError(err.message || 'Error al guardar la categoría');
      console.error('Error saving category:', err);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición de categoría
  const handleEdit = (category) => {
    setFormData({
      nombre: category.nombre,
      descripcion: category.descripcion || ''
    });
    setEditingCategory(category);
    setError('');
  };

  // Confirmar eliminación
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  // Eliminar categoría
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setLoading(true);
      const token = await getToken();
      await categoryService.deleteCategory(categoryToDelete._id, token);
      
      // Recargar lista
      await loadCategories();
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
      setError('');
      
      // Mostrar mensaje de éxito temporal
      setSuccess('Categoría eliminada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error deleting category:', err);
      
      // Manejar diferentes tipos de error con mensajes específicos
      let errorMessage = 'Error al eliminar la categoría';
      
      if (err.response?.status === 400) {
        // Error de validación del backend (categoría con productos asociados)
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
      
      // Limpiar error después de 5 segundos
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span>Gestión de Categorías</span>
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </div>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <span className="text-red-600 font-semibold text-lg">⚠️</span>
                  <div>
                    <strong>Error al procesar categoría:</strong>
                    <p className="mt-1 text-sm">{error}</p>
                    {error.includes('productos asociados') && (
                      <p className="mt-2 text-xs bg-red-100 p-2 rounded border">
                        💡 <strong>Solución:</strong> Elimina primero todos los productos de esta categoría o reasígnalos a otra categoría.
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600 font-bold text-sm"
                  title="Cerrar mensaje"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Formulario para crear/editar categoría */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Typography variant="h6" className="mb-3">
              {editingCategory ? `Editar: ${editingCategory.nombre}` : 'Nueva Categoría'}
            </Typography>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  name="nombre"
                  label="Nombre de la categoría"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  name="descripcion"
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={editingCategory ? <Edit size={16} /> : <Plus size={16} />}
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </Button>
                
                {editingCategory && (
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancelar Edición
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de categorías con acciones */}
          <div>
            <Typography variant="h6" className="mb-3">
              Categorías Registradas ({categories.length})
            </Typography>
            
            {loading && categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Cargando categorías...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay categorías registradas. ¡Crea la primera!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className={`p-4 border rounded-lg transition-all duration-200 ${
                      editingCategory?._id === category._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {category.nombre}
                      </h4>
                      <div className="flex gap-1 ml-2">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar categoría"
                        >
                          <Edit size={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(category)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar categoría"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {category.descripcion || 'Sin descripción'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Chip
                        label={category.estado || 'activo'}
                        size="small"
                        color={category.estado === 'activo' ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <span className="text-xs text-gray-400">
                        ID: {category._id.slice(-6)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro que deseas eliminar la categoría <strong>"{categoryToDelete?.nombre}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" className="mt-2">
            Esta acción no se puede deshacer.
          </Typography>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
            <Typography variant="body2" color="warning.main" className="font-medium">
              ⚠️ Importante:
            </Typography>
            <Typography variant="body2" color="textSecondary" className="mt-1">
              • No se pueden eliminar categorías que tengan productos asociados<br/>
              • Primero debes eliminar o reasignar todos los productos de esta categoría<br/>
              • Si la eliminación falla, verifica que no haya productos usando esta categoría
            </Typography>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={<Trash2 size={16} />}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CategoryModal;
