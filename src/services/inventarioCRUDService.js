import api from './api';

const inventarioCRUDService = {
  // Registrar nueva entrada/lote individual
  async crearEntradaInventario(data, token) {
    return await api.post('/api/inventario-producto', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Listar todas las entradas/lotes con filtros opcionales
  async listarEntradasInventario(token, filtros = {}) {
    const params = new URLSearchParams();
    
    // Agregar filtros si existen
    if (filtros.catalogoProductoId) params.append('catalogoProductoId', filtros.catalogoProductoId);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.usuario) params.append('usuario', filtros.usuario);
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    if (filtros.lote) params.append('lote', filtros.lote);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.skip) params.append('skip', filtros.skip);
    if (filtros.sortBy) params.append('sortBy', filtros.sortBy);
    if (filtros.sortOrder) params.append('sortOrder', filtros.sortOrder);

    const queryString = params.toString();
    const url = `/api/inventario-producto${queryString ? `?${queryString}` : ''}`;
    
    return await api.get(url, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
  },

  // Obtener historial de entradas (para compatibilidad con el frontend actual)
  async obtenerHistorialEntradas(token, limit = 100) {
    return await api.get(`/api/inventario-producto/historial?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Obtener todas las entradas (alias para getAllEntries)
  async getAllEntries(token) {
    return await api.get('/api/inventario-producto', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Obtener detalle de una entrada/lote específica
  async obtenerEntradaPorId(id, token) {
    return await api.get(`/api/inventario-producto/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Actualizar entrada/lote
  async actualizarEntradaInventario(id, data, token) {
    return await api.put(`/api/inventario-producto/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Eliminar entrada/lote
  async eliminarEntradaInventario(id, token) {
    return await api.delete(`/api/inventario-producto/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Obtener resumen de inventario por producto
  async obtenerResumenPorProducto(catalogoProductoId, token) {
    return await api.get(`/api/inventario-producto/resumen/${catalogoProductoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Obtener estadísticas generales del inventario
  async obtenerEstadisticasGenerales(token) {
    return await api.get('/api/inventario-producto/estadisticas/general', {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Consumir stock de una entrada específica
  async consumirStock(inventarioId, cantidad, descripcion, token) {
    return await api.post(`/api/inventario-producto/${inventarioId}/consumir`, {
      cantidad,
      descripcion
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

// Funciones exportadas para ser usadas directamente con hooks
export const createEntry = async (data, token) => {
  return inventarioCRUDService.crearEntradaInventario(data, token);
};

export const updateEntry = async (id, data, token) => {
  return inventarioCRUDService.actualizarEntradaInventario(id, data, token);
};

export const deleteEntry = async (id, token) => {
  return inventarioCRUDService.eliminarEntradaInventario(id, token);
};

export const getHistory = async (productoId = null, token) => {
  if (productoId) {
    return inventarioCRUDService.obtenerResumenPorProducto(productoId, token);
  }
  return inventarioCRUDService.obtenerHistorialEntradas(token);
};

export const getAllEntries = async (token) => {
  const response = await inventarioCRUDService.listarEntradasInventario(token);
  // El servicio devuelve { entradas: [...], total, page, totalPages }
  return response.data;
};

export default inventarioCRUDService;
