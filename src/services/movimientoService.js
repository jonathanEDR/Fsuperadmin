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

export const movimientoService = {
  // Obtener todos los movimientos
  async obtenerMovimientos(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.tipoItem) params.append('tipoItem', filtros.tipoItem);
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.operador) params.append('operador', filtros.operador);
    if (filtros.limite) params.append('limite', filtros.limite);
    if (filtros.pagina) params.append('pagina', filtros.pagina);

    const response = await api.get(`/movimientos?${params}`);
    return response.data;
  },

  // Obtener movimiento por ID
  async obtenerMovimientoPorId(id) {
    const response = await api.get(`/movimientos/${id}`);
    return response.data;
  },

  // Obtener resumen por tipo
  async obtenerResumenPorTipo(fechaInicio, fechaFin) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    const response = await api.get(`/movimientos/resumen/por-tipo?${params}`);
    return response.data;
  },

  // Obtener resumen por operador
  async obtenerResumenPorOperador(fechaInicio, fechaFin) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    const response = await api.get(`/movimientos/resumen/por-operador?${params}`);
    return response.data;
  }
};
