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

export const estadisticasService = {
  // Obtener estadísticas del dashboard
  async obtenerEstadisticasDashboard() {
    try {
      const response = await api.get('/estadisticas/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      throw error;
    }
  },

  // Obtener resumen del inventario
  async obtenerResumenInventario() {
    try {
      const response = await api.get('/estadisticas/resumen-inventario');
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen del inventario:', error);
      throw error;
    }
  }
};
