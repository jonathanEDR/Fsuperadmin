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

/**
 * Servicio para gestionar inventario de sucursales y transferencias
 */
class SucursalInventarioService {
    /**
     * Registrar transferencia de material a sucursal
     * @param {Object} data - Datos de la transferencia
     * @returns {Promise<Object>} Resultado de la transferencia
     */
    async registrarTransferencia(data) {
        try {
            const response = await api.post('/sucursales-inventario/inventario/transferencia', data);
            return response.data;
        } catch (error) {
            console.error('Error al registrar transferencia:', error);
            throw new Error(
                error.response?.data?.message || 
                'Error al registrar la transferencia'
            );
        }
    }

    /**
     * Obtener inventario de una sucursal
     * @param {string} sucursalId - ID de la sucursal
     * @returns {Promise<Object>} Inventario de la sucursal
     */
    async obtenerInventarioSucursal(sucursalId) {
        try {
            const response = await api.get(`/sucursales-inventario/${sucursalId}/inventario`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener inventario:', error);
            throw new Error(
                error.response?.data?.message || 
                'Error al obtener el inventario de la sucursal'
            );
        }
    }

    /**
     * Obtener historial de movimientos de una sucursal
     * @param {string} sucursalId - ID de la sucursal
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de movimientos
     */
    async obtenerMovimientosSucursal(sucursalId, filtros = {}) {
        try {
            const params = new URLSearchParams(filtros).toString();
            const response = await api.get(
                `/sucursales-inventario/${sucursalId}/movimientos${params ? `?${params}` : ''}`
            );
            return response.data;
        } catch (error) {
            console.error('Error al obtener movimientos:', error);
            throw new Error(
                error.response?.data?.message || 
                'Error al obtener los movimientos'
            );
        }
    }

    /**
     * Obtener estadísticas de inventario por sucursal
     * @param {Object} filtros - Filtros opcionales (fechaInicio, fechaFin)
     * @returns {Promise<Array>} Estadísticas agregadas
     */
    async obtenerEstadisticas(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros).toString();
            const response = await api.get(
                `/sucursales-inventario/inventario/estadisticas${params ? `?${params}` : ''}`
            );
            return response.data;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw new Error(
                error.response?.data?.message || 
                'Error al obtener las estadísticas'
            );
        }
    }

    /**
     * Obtener materiales disponibles para transferencia
     * @returns {Promise<Array>} Lista de materiales disponibles
     */
    async obtenerMaterialesDisponibles() {
        try {
            const response = await api.get('/sucursales-inventario/materiales/disponibles');
            return response.data;
        } catch (error) {
            console.error('Error al obtener materiales:', error);
            throw new Error(
                error.response?.data?.message || 
                'Error al obtener los materiales disponibles'
            );
        }
    }

    /**
     * Revertir una transferencia
     * @param {string} movimientoId - ID del movimiento a revertir
     * @param {string} motivo - Motivo de la reversión
     * @returns {Promise<Object>} Resultado de la reversión
     */
    async revertirTransferencia(movimientoId, motivo) {
        try {
            const response = await api.post('/sucursales-inventario/revertir-transferencia', {
                movimientoId,
                motivo
            });
            return response.data;
        } catch (error) {
            console.error('Error al revertir transferencia:', error);
            throw new Error(
                error.response?.data?.message || 
                'Error al revertir la transferencia'
            );
        }
    }

    /**
     * Obtener historial completo de transferencias
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de transferencias
     */
    async obtenerHistorialCompleto(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros).toString();
            const response = await api.get(
                `/sucursales-inventario/historial-completo${params ? `?${params}` : ''}`
            );
            return response.data;
        } catch (error) {
            console.error('Error al obtener historial:', error);
            throw new Error(
                error.response?.data?.message || 
                'Error al obtener el historial'
            );
        }
    }

    /**
     * Obtener sucursales activas para transferencias
     * @returns {Promise<Array>} Lista de sucursales activas
     */
    async obtenerSucursalesActivas() {
        try {
            const response = await api.get('/sucursales-inventario/activas-para-transferencia');
            return response.data;
        } catch (error) {
            console.error('Error al obtener sucursales:', error);
            throw new Error(
                error.response?.data?.message || 
                'Error al obtener las sucursales'
            );
        }
    }
}

export const sucursalInventarioService = new SucursalInventarioService();
