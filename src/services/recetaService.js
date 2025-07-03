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

export const recetaService = {
  // Obtener todas las recetas
  async obtenerRecetas(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.activo !== undefined) params.append('activo', filtros.activo);

    const response = await api.get(`/recetas?${params}`);
    return response.data;
  },

  // Obtener receta por ID
  async obtenerRecetaPorId(id) {
    const response = await api.get(`/recetas/${id}`);
    return response.data;
  },

  // Crear nueva receta
  async crearReceta(datos) {
    const response = await api.post('/recetas', datos);
    return response.data;
  },

  // Actualizar receta
  async actualizarReceta(id, datos) {
    const response = await api.put(`/recetas/${id}`, datos);
    return response.data;
  },

  // Verificar disponibilidad para producir
  async verificarDisponibilidad(id, cantidad = 1) {
    const response = await api.get(`/recetas/${id}/disponibilidad?cantidad=${cantidad}`);
    return response.data;
  },

  // Calcular costo de producción
  async calcularCosto(id, cantidad = 1) {
    const response = await api.get(`/recetas/${id}/costo?cantidad=${cantidad}`);
    return response.data;
  },

  // Desactivar receta
  async desactivarReceta(id) {
    const response = await api.delete(`/recetas/${id}`);
    return response.data;
  },

  // Cambiar categoría de receta (preparado -> terminado, etc.)
  async cambiarCategoria(id, categoria) {
    const response = await api.put(`/recetas/${id}/estado`, { categoria });
    return response.data;
  }
};
