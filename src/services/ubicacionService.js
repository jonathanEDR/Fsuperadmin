import api from './api';

/**
 * Servicio de ubicaciones - Módulo central de geolocalización
 * Proporciona funciones para gestionar ubicaciones de usuarios y sucursales
 */
export const ubicacionService = {
  // ============================================================
  // MAPA GENERAL (Super Admin)
  // ============================================================

  /**
   * Obtener todos los puntos del mapa (usuarios + sucursales)
   * Solo super_admin
   */
  getMapaGeneral: async (token) => {
    const response = await api.get('/api/ubicaciones/mapa-general', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ============================================================
  // UBICACIONES DE USUARIOS
  // ============================================================

  /**
   * Obtener ubicaciones de todos los usuarios (admin/super_admin)
   */
  getUbicacionesUsuarios: async (token, filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.soloConfiguradas) params.append('soloConfiguradas', 'true');
    if (filtros.departamento) params.append('departamento', filtros.departamento);
    if (filtros.role) params.append('role', filtros.role);

    const response = await api.get(`/api/ubicaciones/usuarios?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ============================================================
  // UBICACIÓN PROPIA (Mi perfil)
  // ============================================================

  /**
   * Obtener mi ubicación actual
   */
  getMyLocation: async (token) => {
    const response = await api.get('/api/auth/my-location', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Actualizar mi ubicación
   */
  updateMyLocation: async (token, locationData) => {
    const response = await api.put('/api/auth/update-my-location', locationData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ============================================================
  // UBICACIONES DE SUCURSALES
  // ============================================================

  /**
   * Obtener ubicaciones de sucursales
   */
  getUbicacionesSucursales: async (token, filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.soloActivas) params.append('soloActivas', 'true');
    if (filtros.soloConfiguradas) params.append('soloConfiguradas', 'true');

    const response = await api.get(`/api/ubicaciones/sucursales?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Actualizar ubicación de una sucursal (admin/super_admin)
   */
  updateUbicacionSucursal: async (token, sucursalId, locationData) => {
    const response = await api.put(`/api/ubicaciones/sucursal/${sucursalId}`, locationData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export default ubicacionService;
