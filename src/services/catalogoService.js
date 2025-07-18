
import api from './api';

const catalogoService = {
  // Obtener lista de productos del catálogo
  async getCatalogo(token) {
    const res = await api.get('/api/catalogo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Agregar producto al catálogo
  async addCatalogoProducto(data, token) {
    const res = await api.post('/api/catalogo', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Editar producto del catálogo
  async editCatalogoProducto(id, data, token) {
    const res = await api.put(`/api/catalogo/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Activar/desactivar producto
  async setCatalogoEstado(id, activo, token) {
    const res = await api.put(`/api/catalogo/${id}/estado`, { activo }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Eliminar producto del catálogo
  async deleteCatalogoProducto(id, token) {
    const res = await api.delete(`/api/catalogo/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};

export default catalogoService;
