// Servicio del catálogo de producción - Conexión real al backend
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Configurar axios con interceptores para manejar errores
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para incluir token de autenticación si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Error de API:', error);
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const catalogoProduccionService = {
  // ==================== TIPOS DE PRODUCCIÓN ====================
  
  obtenerTiposProduccion: async function(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      
      const response = await api.get(`/catalogo-produccion/tipos?${params}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener tipos de producción');
    }
  },

  crearTipoProduccion: async function(datos) {
    try {
      // Agregar código automático basado en el nombre
      const datosCompletos = {
        ...datos,
        codigo: datos.nombre.substring(0, 3).toUpperCase() + '_' + Date.now()
      };
      
      const response = await api.post('/catalogo-produccion/tipos', datosCompletos);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear tipo de producción');
    }
  },

  actualizarTipoProduccion: async function(id, datos) {
    try {
      const response = await api.put(`/catalogo-produccion/tipos/${id}`, datos);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar tipo de producción');
    }
  },

  eliminarTipoProduccion: async function(id) {
    try {
      const response = await api.delete(`/catalogo-produccion/tipos/${id}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar tipo de producción');
    }
  },

  desactivarTipoProduccion: async function(id) {
    try {
      const response = await api.patch(`/catalogo-produccion/tipos/${id}/desactivar`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al desactivar tipo de producción');
    }
  },

  activarTipoProduccion: async function(id) {
    try {
      const response = await api.patch(`/catalogo-produccion/tipos/${id}/activar`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al activar tipo de producción');
    }
  },

  // ==================== PRODUCTOS DEL CATÁLOGO ====================

  obtenerProductosCatalogo: async function(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.tipoProduccion) params.append('tipoProduccion', filtros.tipoProduccion);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      
      const response = await api.get(`/catalogo-produccion?${params}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener productos del catálogo');
    }
  },

  obtenerProductoCatalogoPorId: async function(id) {
    try {
      const response = await api.get(`/catalogo-produccion/${id}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener producto del catálogo');
    }
  },

  crearProductoCatalogo: async function(datos) {
    try {
      const response = await api.post('/catalogo-produccion', datos);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear producto en catálogo');
    }
  },

  actualizarProductoCatalogo: async function(id, datos) {
    try {
      const response = await api.put(`/catalogo-produccion/${id}`, datos);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar producto del catálogo');
    }
  },

  desactivarProductoCatalogo: async function(id) {
    try {
      const response = await api.delete(`/catalogo-produccion/${id}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al desactivar producto del catálogo');
    }
  },

  activarProductoCatalogo: async function(id) {
    try {
      // Asumir que existe un endpoint similar para activar
      const response = await api.patch(`/catalogo-produccion/${id}/activar`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al activar producto del catálogo');
    }
  },

  eliminarProductoCatalogo: async function(id) {
    try {
      const response = await api.delete(`/catalogo-produccion/${id}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar producto del catálogo');
    }
  },

  // ==================== MÉTODOS AUXILIARES ====================

  generarCodigoAutomatico: async function(tipoProduccionId) {
    try {
      const response = await api.get(`/catalogo-produccion/generar-codigo/${tipoProduccionId}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al generar código automático');
    }
  },

  obtenerEstadisticasCatalogo: async function() {
    try {
      const response = await api.get('/catalogo-produccion/estadisticas');
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas del catálogo');
    }
  },

  inicializarDatosDefecto: async function() {
    try {
      const response = await api.post('/catalogo-produccion/inicializar');
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al inicializar datos por defecto');
    }
  },

  // ==================== MÉTODOS DE PRUEBA ====================

  testConexion: async function() {
    try {
      const response = await api.get('/catalogo-produccion/test');
      return {
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error de conexión con el servidor');
    }
  }
};

export default catalogoProduccionService;
