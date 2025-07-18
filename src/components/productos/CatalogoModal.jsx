import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Switch, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from '@mui/material';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import catalogoService from '../../services/catalogoService';
import { useAuth } from '@clerk/clerk-react';


function CatalogoModal({ open, onClose }) {
  const { getToken } = useAuth();
  const [catalogo, setCatalogo] = useState([]);
  const [form, setForm] = useState({ codigoproducto: '', nombre: '', activo: true });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchCatalogo();
  }, [open]);

  const fetchCatalogo = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await catalogoService.getCatalogo(token);
      setCatalogo(data);
    } catch (err) {
      setError('Error al cargar catálogo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (!form.codigoproducto || !form.nombre) {
        setError('Completa todos los campos');
        return;
      }
      const token = await getToken();
      if (isEditing) {
        await catalogoService.editCatalogoProducto(editId, form, token);
      } else {
        await catalogoService.addCatalogoProducto(form, token);
      }
      setForm({ codigoproducto: '', nombre: '', activo: true });
      setIsEditing(false);
      setEditId(null);
      fetchCatalogo();
    } catch (err) {
      setError('Error al guardar producto');
    }
  };
  // Activar/desactivar producto desde la tabla
  const handleToggleActivo = async (producto) => {
    setError(null);
    try {
      const token = await getToken();
      await catalogoService.setCatalogoEstado(producto._id, !producto.activo, token);
      fetchCatalogo();
    } catch (err) {
      setError('Error al cambiar estado');
    }
  };

  const handleEdit = (producto) => {
    setForm({
      codigoproducto: producto.codigoproducto,
      nombre: producto.nombre,
      activo: producto.activo
    });
    setIsEditing(true);
    setEditId(producto._id);
  };

  // Función para eliminar producto
  const handleDelete = async (id) => {
    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      await catalogoService.deleteCatalogoProducto(id, token);
      fetchCatalogo();
    } catch (err) {
      setError('Error al eliminar producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Catálogo de Productos</DialogTitle>
      <DialogContent>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <form style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <TextField
            label="Código"
            name="codigoproducto"
            value={form.codigoproducto}
            onChange={handleChange}
            required
          />
          <TextField
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Activo</span>
            <Switch
              checked={form.activo}
              name="activo"
              onChange={handleChange}
              color="primary"
            />
          </div>
          <Button variant="contained" color="primary" onClick={handleSubmit} startIcon={<Plus size={18} />}>
            {isEditing ? 'Guardar Cambios' : 'Agregar'}
          </Button>
        </form>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {catalogo.map(producto => (
              <TableRow key={producto._id}>
                <TableCell>{producto.codigoproducto}</TableCell>
                <TableCell>{producto.nombre}</TableCell>
                <TableCell>
                  <Switch
                    checked={producto.activo}
                    onChange={() => handleToggleActivo(producto)}
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(producto)} title="Editar">
                    <Edit2 size={18} />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(producto._id)} title="Eliminar" color="error">
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CatalogoModal;
