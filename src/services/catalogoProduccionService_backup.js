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
  async actualizarTipoProduccion(id, datos) {
    const response = await api.put(`/api/catalogo-produccion/tipos/${id}`, datos);
    return response.data;
  },

  // Eliminar tipo de producción
  async eliminarTipoProduccion(id) {
    const response = await api.delete(`/api/catalogo-produccion/tipos/${id}`);
    return response.data;
  },

  // Desactivar tipo de producción
  async desactivarTipoProduccion(id) {
    const response = await api.patch(`/api/catalogo-produccion/tipos/${id}/desactivar`);
    return response.data;
  },

  // Activar tipo de producción
  async activarTipoProduccion(id) {
    const response = await api.patch(`/api/catalogo-produccion/tipos/${id}/activar`);
    return response.data;
  },

  // ==================== CATÁLOGO DE PRODUCTOS ====================

  // Obtener todos los productos del catálogo
  async obtenerProductosCatalogo(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    if (filtros.tipoProduccion) params.append('tipoProduccion', filtros.tipoProduccion);
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.activo !== undefined) params.append('activo', filtros.activo);

    const response = await api.get(`/api/catalogo-produccion?${params}`);
    return response.data;
  },

  // Obtener producto específico del catálogo
  async obtenerProductoCatalogoPorId(id) {
    const response = await api.get(`/api/catalogo-produccion/${id}`);
    return response.data;
  },

  // Crear producto en catálogo
  async crearProductoCatalogo(datos) {
    const response = await api.post('/api/catalogo-produccion', datos);
    return response.data;
  },

  // Actualizar producto del catálogo
  async actualizarProductoCatalogo(id, datos) {
    const response = await api.put(`/api/catalogo-produccion/${id}`, datos);
    return response.data;
  },

  // Desactivar producto del catálogo
  async desactivarProductoCatalogo(id) {
    const response = await api.patch(`/api/catalogo-produccion/${id}/desactivar`);
    return response.data;
  },

  // Activar producto del catálogo
  async activarProductoCatalogo(id) {
    const response = await api.patch(`/api/catalogo-produccion/${id}/activar`);
    return response.data;
  },

  // Eliminar producto del catálogo
  async eliminarProductoCatalogo(id) {
    const response = await api.delete(`/api/catalogo-produccion/${id}`);
    return response.data;
  },

  // ==================== MÉTODOS AUXILIARES ====================

  // Generar código automático
  async generarCodigoAutomatico(tipoProduccionId) {
    const response = await api.get(`/api/catalogo-produccion/generar-codigo/${tipoProduccionId}`);
    return response.data;
  },

  // Obtener estadísticas del catálogo
  async obtenerEstadisticasCatalogo() {
    const response = await api.get('/api/catalogo-produccion/estadisticas');
    return response.data;
  },

  // Inicializar datos por defecto
  async inicializarDatosDefecto() {
    const response = await api.post('/api/catalogo-produccion/inicializar');
    return response.data;
  }
};

console.log('✅ FINAL: catalogoProduccionService exportado correctamente:', catalogoProduccionService);

export default catalogoProduccionService;
