import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const BASE_URL = `${API_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
});

// Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(async config => {
  try {
    // Obtener el token y la sesión de Clerk
    const token = await window.Clerk?.session?.getToken();
    const user = window.Clerk?.user;
    
    if (!token || !user) {
      throw new Error('No hay sesión activa');
    }

    // Agregar token a los headers
    config.headers['Authorization'] = `Bearer ${token}`;
    
    // Agregar información del usuario a los headers
    config.headers['X-User-Email'] = user.primaryEmailAddress?.emailAddress;
    config.headers['X-User-Name'] = `${user.firstName} ${user.lastName}`.trim();
    config.headers['X-User-Id'] = user.id;
    
    return config;
  } catch (error) {
    console.error('Error en interceptor de autenticación:', error);
    return Promise.reject(error);
  }
});

export const ingredienteService = {
  // Obtener todos los ingredientes
  async obtenerIngredientes(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    if (filtros.unidadMedida) params.append('unidadMedida', filtros.unidadMedida);
    if (filtros.activo !== undefined) params.append('activo', filtros.activo);

    const response = await api.get(`/ingredientes?${params}`);
    return response.data;
  },

  // Obtener ingrediente por ID
  async obtenerIngredientePorId(id) {
    const response = await api.get(`/ingredientes/${id}`);
    return response.data;
  },

  // Crear nuevo ingrediente
  async crearIngrediente(datos) {
    const response = await api.post('/ingredientes', datos);
    return response.data;
  },

  // Actualizar ingrediente
  async actualizarIngrediente(id, datos) {
    const response = await api.put(`/ingredientes/${id}`, datos);
    return response.data;
  },

  // Actualizar cantidad específica
  async actualizarCantidad(id, cantidad, motivo) {
    const response = await api.put(`/ingredientes/${id}/cantidad`, {
      cantidad,
      motivo
    });
    return response.data;
  },

  // Ajustar inventario
  async ajustarInventario(id, ajuste, motivo) {
    const response = await api.post(`/ingredientes/${id}/ajustar`, {
      ajuste,
      motivo
    });
    return response.data;
  },

  // Obtener movimientos de un ingrediente
  async obtenerMovimientos(id, limite = 50) {
    const response = await api.get(`/ingredientes/${id}/movimientos?limite=${limite}`);
    return response.data;
  },

  // Desactivar ingrediente
  async desactivarIngrediente(id) {
    const response = await api.delete(`/ingredientes/${id}`);
    return response.data;
  }
};
