import axios from 'axios';

console.log('✅ INICIO: catalogoProduccionService.js se está cargando');

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const BASE_URL = `${API_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  timeout: 10000
});

// Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(async config => {
  try {
    // Obtener el token y la sesión de Clerk
    const token = await window.Clerk?.session?.getToken();
    const user = window.Clerk?.user;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (user) {
      config.headers['X-User-Email'] = user.primaryEmailAddress?.emailAddress;
      config.headers['X-User-Name'] = `${user.firstName} ${user.lastName}`.trim();
      config.headers['X-User-Id'] = user.id;
    }
    
    return config;
  } catch (error) {
    console.warn('Error en interceptor de autenticación:', error);
    return config; // Continuar sin token
  }
});

console.log('✅ API axios configurada correctamente');

export const catalogoProduccionService = {
  
  // ==================== DIAGNÓSTICO ====================
  
  async testConexion() {
    try {
      const response = await api.get('/catalogo-produccion/test');
      return {
        success: true,
        data: response.data,
        backend: true
      };
    } catch (error) {
      console.error('Error de conexión:', error);
      return {
        success: false,
        error: error.message,
        backend: false
      };
    }
  },

  // ==================== MÓDULOS DEL SISTEMA ====================
  
  async obtenerModulosDisponibles() {
    try {
      const response = await api.get('/catalogo-produccion/modulos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener módulos:', error);
      throw error;
    }
  },

  // ==================== PRODUCTOS DEL CATÁLOGO ====================

  async obtenerProductosCatalogo(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.moduloSistema) params.append('moduloSistema', filtros.moduloSistema);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      
      const response = await api.get(`/catalogo-produccion?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos del catálogo:', error);
      throw error;
    }
  },

  // ✨ NUEVO: Obtener productos específicos para producción
  async obtenerProductosProduccion(filtros = {}) {
    try {
      const response = await api.get('/catalogo-produccion/produccion');
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos de producción:', error);
      throw error;
    }
  },

  // ✨ NUEVO: Obtener productos por módulo con filtros avanzados
  async obtenerProductosPorModulo(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.moduloSistema) params.append('moduloSistema', filtros.moduloSistema);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      
      const response = await api.get(`/catalogo-produccion/modulo?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos por módulo:', error);
      throw error;
    }
  },

  // ==================== GESTIÓN DE PRODUCTOS ====================

  async crearProductoCatalogo(datos) {
    try {
      const response = await api.post('/catalogo-produccion', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  },

  async actualizarProductoCatalogo(id, datos) {
    try {
      const response = await api.put(`/catalogo-produccion/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  },

  async obtenerProductoPorId(id) {
    try {
      const response = await api.get(`/catalogo-produccion/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      throw error;
    }
  },

  async eliminarProducto(id) {
    try {
      const response = await api.delete(`/catalogo-produccion/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  },

  async toggleActivoProducto(id, activo) {
    try {
      const response = await api.patch(`/catalogo-produccion/${id}/toggle-activo`, { activo });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado del producto:', error);
      throw error;
    }
  },

  // ==================== ESTADÍSTICAS ====================

  async obtenerEstadisticasCatalogo() {
    try {
      const response = await api.get('/catalogo-produccion/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
};

console.log('✅ FINAL: catalogoProduccionService exportado correctamente:', catalogoProduccionService);

export default catalogoProduccionService;
