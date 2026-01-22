import api from '../api';

const BASE_URL = '/api/categorias-tareas';

/**
 * Servicio para gestión de Categorías de Tareas
 * Endpoints: /api/categorias-tareas
 */
const categoriasService = {
  /**
   * Listar todas las categorías con sus subcategorías
   * @param {boolean} incluirInactivas - Incluir categorías inactivas
   */
  async listar(incluirInactivas = false) {
    try {
      const params = incluirInactivas ? '?incluirInactivas=true' : '';
      const response = await api.get(`${BASE_URL}${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al listar categorías:', error);
      throw error;
    }
  },

  /**
   * Listar categorías sin agrupar (planas)
   * @param {Object} filtros - Filtros opcionales
   */
  async listarPlanas(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros).toString();
      const response = await api.get(`${BASE_URL}/planas?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al listar categorías planas:', error);
      throw error;
    }
  },

  /**
   * Obtener categoría por ID
   * @param {string} id - ID de la categoría
   */
  async obtenerPorId(id) {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      throw error;
    }
  },

  /**
   * Crear nueva categoría (solo admin)
   * @param {Object} datos - Datos de la categoría
   * @param {string} datos.nombre - Nombre (requerido)
   * @param {string} datos.codigo - Código único
   * @param {string} datos.descripcion - Descripción
   * @param {string} datos.color - Color en hex (#RRGGBB)
   * @param {string} datos.icono - Nombre del icono
   * @param {string} datos.areaNegocio - Área de negocio
   * @param {string} datos.categoriaPadreId - ID de categoría padre (para subcategorías)
   */
  async crear(datos) {
    try {
      const response = await api.post(BASE_URL, datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  },

  /**
   * Inicializar categorías predeterminadas (solo admin)
   */
  async inicializarPredeterminadas() {
    try {
      const response = await api.post(`${BASE_URL}/inicializar`);
      return response.data;
    } catch (error) {
      console.error('Error al inicializar categorías:', error);
      throw error;
    }
  },

  /**
   * Actualizar categoría (solo admin)
   * @param {string} id - ID de la categoría
   * @param {Object} datos - Datos a actualizar
   */
  async actualizar(id, datos) {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw error;
    }
  },

  /**
   * Reordenar categorías (solo admin)
   * @param {Array} ordenamientos - Array de { id, orden }
   */
  async reordenar(ordenamientos) {
    try {
      const response = await api.put(`${BASE_URL}/reordenar`, { ordenamientos });
      return response.data;
    } catch (error) {
      console.error('Error al reordenar categorías:', error);
      throw error;
    }
  },

  /**
   * Eliminar categoría (soft delete, solo admin)
   * @param {string} id - ID de la categoría
   */
  async eliminar(id) {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  }
};

export default categoriasService;
