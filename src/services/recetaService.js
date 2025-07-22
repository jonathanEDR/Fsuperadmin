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

  // Eliminar receta completamente
  async eliminarReceta(id) {
    const response = await api.delete(`/recetas/${id}`);
    return response.data;
  },

  // Cambiar categoría de receta (preparado -> terminado, etc.)
  async cambiarCategoria(id, categoria) {
    const response = await api.put(`/recetas/${id}/estado`, { categoria });
    return response.data;
  },

  // ============= NUEVOS MÉTODOS PARA FLUJO DE TRABAJO =============
  
  // Iniciar proceso de producción
  async iniciarProceso(id) {
    const response = await api.post(`/recetas/${id}/iniciar-proceso`);
    return response.data;
  },

  // Avanzar a la siguiente fase del proceso
  async avanzarFase(id, datosAdicionales = {}) {
    const response = await api.post(`/recetas/${id}/avanzar-fase`, datosAdicionales);
    return response.data;
  },

  // Agregar ingrediente a la fase actual
  async agregarIngredienteAFaseActual(id, ingredienteData) {
    const response = await api.post(`/recetas/${id}/agregar-ingrediente-fase`, ingredienteData);
    return response.data;
  },

  // Pausar proceso
  async pausarProceso(id, motivo = '') {
    const response = await api.put(`/recetas/${id}/pausar-proceso`, { motivo });
    return response.data;
  },

  // Reanudar proceso
  async reanudarProceso(id) {
    const response = await api.put(`/recetas/${id}/reanudar-proceso`);
    return response.data;
  },

  // 🎯 NUEVO: Reiniciar receta al estado inicial
  async reiniciarReceta(id, motivo) {
    if (!motivo) motivo = 'Reinicio manual';
    const response = await api.put(`/recetas/${id}/reiniciar`, { motivo });
    return response.data;
  },

  // 🧹 UTILIDAD: Limpiar recetas inactivas de la base de datos
  async limpiarRecetasInactivas() {
    const response = await api.post('/recetas/limpiar-inactivas');
    return response.data;
  }
};
