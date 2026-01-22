import api from '../api';

const BASE_URL = '/api/etiquetas-tareas';

/**
 * Servicio para gestión de Etiquetas de Tareas
 * Endpoints: /api/etiquetas-tareas
 */
const etiquetasService = {
  /**
   * Listar todas las etiquetas
   * @param {boolean} incluirInactivas - Incluir etiquetas inactivas
   */
  async listar(incluirInactivas = false) {
    try {
      const params = incluirInactivas ? '?incluirInactivas=true' : '';
      const response = await api.get(`${BASE_URL}${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al listar etiquetas:', error);
      throw error;
    }
  },

  /**
   * Buscar etiquetas por nombre (autocompletado)
   * @param {string} termino - Término de búsqueda
   */
  async buscar(termino) {
    try {
      const response = await api.get(`${BASE_URL}/buscar?termino=${encodeURIComponent(termino)}`);
      return response.data;
    } catch (error) {
      console.error('Error al buscar etiquetas:', error);
      throw error;
    }
  },

  /**
   * Obtener etiquetas más usadas
   * @param {number} limite - Número de etiquetas a retornar (default: 10)
   */
  async obtenerMasUsadas(limite = 10) {
    try {
      const response = await api.get(`${BASE_URL}/mas-usadas?limite=${limite}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener etiquetas más usadas:', error);
      throw error;
    }
  },

  /**
   * Obtener etiqueta por ID
   * @param {string} id - ID de la etiqueta
   */
  async obtenerPorId(id) {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener etiqueta:', error);
      throw error;
    }
  },

  /**
   * Crear nueva etiqueta
   * @param {Object} datos - Datos de la etiqueta
   * @param {string} datos.nombre - Nombre (requerido)
   * @param {string} datos.color - Color en hex (#RRGGBB)
   * @param {string} datos.descripcion - Descripción
   */
  async crear(datos) {
    try {
      const response = await api.post(BASE_URL, datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear etiqueta:', error);
      throw error;
    }
  },

  /**
   * Actualizar etiqueta
   * @param {string} id - ID de la etiqueta
   * @param {Object} datos - Datos a actualizar
   */
  async actualizar(id, datos) {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar etiqueta:', error);
      throw error;
    }
  },

  /**
   * Eliminar etiqueta (soft delete)
   * @param {string} id - ID de la etiqueta
   */
  async eliminar(id) {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar etiqueta:', error);
      throw error;
    }
  }
};

export default etiquetasService;
