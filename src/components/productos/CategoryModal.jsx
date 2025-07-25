import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography
} from '@mui/material';
import categoryService from '../../services/categoryService';

const CategoryModal = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    descripcion: initialData?.descripcion || ''
  });

  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  React.useEffect(() => {
    if (open) {
      categoryService.getAllCategories().then(setCategories).catch(() => setCategories([]));
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    await onSubmit(formData);
    setError('');
    // Recargar categorías
    categoryService.getAllCategories().then(setCategories).catch(() => setCategories([]));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Editar Categoría' : 'Nueva Categoría'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" variant="body2" gutterBottom>
              {error}
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="nombre"
            label="Nombre"
            type="text"
            fullWidth
            value={formData.nombre}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            name="descripcion"
            label="Descripción"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={formData.descripcion}
            onChange={handleChange}
          />

          {/* Tabla de categorías agregadas */}
          <Typography variant="h6" className="mt-6 mb-2">Categorías agregadas</Typography>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#f9fafb'}}>
                  <th style={{padding: '8px', textAlign: 'left', fontSize: '13px', color: '#6b7280'}}>Nombre</th>
                  <th style={{padding: '8px', textAlign: 'left', fontSize: '13px', color: '#6b7280'}}>Descripción</th>
                  <th style={{padding: '8px', textAlign: 'left', fontSize: '13px', color: '#6b7280'}}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{padding: '16px', textAlign: 'center', color: '#6b7280'}}>No hay categorías registradas.</td>
                  </tr>
                ) : (
                  categories.map(cat => (
                    <tr key={cat._id}>
                      <td style={{padding: '8px'}}>{cat.nombre}</td>
                      <td style={{padding: '8px'}}>{cat.descripcion || 'Sin descripción'}</td>
                      <td style={{padding: '8px'}}>
                        <span style={{padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: cat.estado === 'activo' ? '#d1fae5' : '#f3f4f6', color: cat.estado === 'activo' ? '#065f46' : '#374151'}}>{cat.estado}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancelar
          </Button>
          <Button type="submit" color="primary" variant="contained">
            {initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoryModal;
