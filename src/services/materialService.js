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
    
    // Agregar rol del usuario si está disponible
    if (user.publicMetadata?.role) {
      config.headers['X-User-Role'] = user.publicMetadata.role;
    }
    
    return config;
  } catch (error) {
    console.error('Error en interceptor de autenticación:', error);
    return Promise.reject(error);
  }
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Error en respuesta de API:', error);
    
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un código de error
      const errorMessage = error.response.data?.message || error.message;
      console.error('Error del servidor:', errorMessage);
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // La solicitud se hizo pero no hubo respuesta
      console.error('No se recibió respuesta del servidor');
      return Promise.reject(new Error('No se pudo conectar con el servidor'));
    } else {
      // Error en la configuración de la solicitud
      console.error('Error en la configuración:', error.message);
      return Promise.reject(error);
    }
  }
);

export const materialService = {
  // Obtener todos los materiales
  async obtenerMateriales(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    if (filtros.unidadMedida) params.append('unidadMedida', filtros.unidadMedida);
    if (filtros.activo !== undefined) params.append('activo', filtros.activo);

    const response = await api.get(`/materiales?${params}`);
    return response.data;
  },

  // Obtener material por ID
  async obtenerMaterialPorId(id) {
    const response = await api.get(`/materiales/${id}`);
    return response.data;
  },

  // Crear nuevo material
  async crearMaterial(datos) {
    const response = await api.post('/materiales', datos);
    return response.data;
  },

  // Actualizar material
  async actualizarMaterial(id, datos) {
    const response = await api.put(`/materiales/${id}`, datos);
    return response.data;
  },

  // Actualizar cantidad específica
  async actualizarCantidad(id, cantidad, motivo) {
    const response = await api.put(`/materiales/${id}/cantidad`, {
      cantidad,
      motivo
    });
    return response.data;
  },

  // Ajustar inventario
  async ajustarInventario(id, ajuste, motivo) {
    const response = await api.post(`/materiales/${id}/ajustar`, {
      ajuste,
      motivo
    });
    return response.data;
  },

  // Obtener movimientos de un material
  async obtenerMovimientos(id, limite = 50) {
    const response = await api.get(`/materiales/${id}/movimientos?limite=${limite}`);
    return response.data;
  },

  // Desactivar material
  async desactivarMaterial(id) {
    const response = await api.delete(`/materiales/${id}`);
    return response.data;
  }
};