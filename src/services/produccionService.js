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

export const produccionService = {
  // Obtener todas las producciones
  async obtenerProducciones(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.operador) params.append('operador', filtros.operador);
    if (filtros.limite) params.append('limite', filtros.limite);
    if (filtros.pagina) params.append('pagina', filtros.pagina);

    const response = await api.get(`/produccion?${params}`);
    return response.data;
  },

  // Obtener producción por ID (alias para compatibilidad)
  async obtenerPorId(id) {
    return this.obtenerProduccionPorId(id);
  },

  // Obtener producción por ID
  async obtenerProduccionPorId(id) {
    const response = await api.get(`/produccion/${id}`);
    return response.data;
  },

  // Eliminar producción
  async eliminarProduccion(id) {
    console.log('🗑️ Servicio: eliminando producción con ID:', id);
    
    if (!id) {
      throw new Error('ID de producción requerido');
    }
    
    try {
      const response = await api.delete(`/produccion/${id}`);
      console.log('✅ Producción eliminada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en servicio eliminar:', error);
      throw error;
    }
  },

  // Crear producción desde receta
  async crearProduccionDesdeReceta(datos) {
    const response = await api.post('/produccion/desde-receta', datos);
    return response.data;
  },

  // Crear producción manual
  async crearProduccionManual(datos) {
    const response = await api.post('/produccion/manual', datos);
    return response.data;
  },

  // Ejecutar producción
  async ejecutarProduccion(id) {
    const response = await api.post(`/produccion/${id}/ejecutar`);
    return response.data;
  },

  // Cancelar producción
  async cancelarProduccion(id, motivo) {
    const response = await api.post(`/produccion/${id}/cancelar`, { motivo });
    return response.data;
  },

  // Obtener reporte de producción
  async obtenerReporte(fechaInicio, fechaFin) {
    const response = await api.get(`/produccion/reportes/resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  },

  // Actualizar producción
  async actualizarProduccion(id, datos) {
    const response = await api.put(`/produccion/${id}`, datos);
    return response.data;
  }
};
