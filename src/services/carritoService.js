import api from './api';

/**
 * Servicio de Carritos - Unidades Móviles de Ventas
 * Gestiona la creación, asignación y liberación de carritos/motos/vehículos de venta
 */

const carritoService = {
  // ============================================================
  // CONSULTAS
  // ============================================================

  /** Obtener todos los carritos (admin/super_admin) */
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.sucursalBase) params.append('sucursalBase', filtros.sucursalBase);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.soloActivos !== undefined) params.append('soloActivos', filtros.soloActivos);

    const response = await api.get(`/api/carritos?${params.toString()}`);
    return response.data;
  },

  /** Obtener solo carritos disponibles (cualquier autenticado) */
  getDisponibles: async () => {
    const response = await api.get('/api/carritos/disponibles');
    return response.data;
  },

  /** Obtener carrito por ID */
  getById: async (id) => {
    const response = await api.get(`/api/carritos/${id}`);
    return response.data;
  },

  // ============================================================
  // CRUD
  // ============================================================

  /** Crear nuevo carrito */
  create: async (data) => {
    const response = await api.post('/api/carritos', data);
    return response.data;
  },

  /** Actualizar datos del carrito */
  update: async (id, data) => {
    const response = await api.put(`/api/carritos/${id}`, data);
    return response.data;
  },

  /** Desactivar carrito */
  delete: async (id) => {
    const response = await api.delete(`/api/carritos/${id}`);
    return response.data;
  },

  // ============================================================
  // ASIGNACIONES
  // ============================================================

  /** Asignar carrito a un usuario */
  asignar: async (carritoId, usuarioClerkId, notas = '') => {
    const response = await api.post(`/api/carritos/${carritoId}/asignar`, {
      usuarioClerkId,
      notas
    });
    return response.data;
  },

  /** Liberar carrito (quitar asignación actual) */
  liberar: async (carritoId) => {
    const response = await api.post(`/api/carritos/${carritoId}/liberar`);
    return response.data;
  },

  // ============================================================
  // HELPERS
  // ============================================================

  /** Obtener ícono/emoji por tipo */
  getEmojiTipo: (tipo) => {
    const emojis = {
      carrito: '🛒',
      moto: '🏍️',
      bicicleta: '🚲',
      auto: '🚗',
      camioneta: '🚐',
      otro: '📦'
    };
    return emojis[tipo] || '📦';
  },

  /** Obtener color de badge por estado */
  getEstadoColor: (estado) => {
    const colors = {
      disponible: 'bg-green-100 text-green-700',
      asignado: 'bg-blue-100 text-blue-700',
      mantenimiento: 'bg-yellow-100 text-yellow-700',
      inactivo: 'bg-gray-100 text-gray-500'
    };
    return colors[estado] || 'bg-gray-100 text-gray-500';
  }
};

export default carritoService;
export { carritoService };
