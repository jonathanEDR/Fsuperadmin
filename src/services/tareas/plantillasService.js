import api from '../api';

const BASE_URL = '/api/plantillas-tareas';

/**
 * Servicio para gestión de Plantillas de Tareas
 * Endpoints: /api/plantillas-tareas
 */
const plantillasService = {
  /**
   * Listar todas las plantillas
   * @param {Object} filtros - Filtros opcionales
   * @param {string} filtros.categoriaId - Filtrar por categoría
   * @param {boolean} filtros.incluirInactivas - Incluir plantillas inactivas
   */
  async listar(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros).toString();
      const response = await api.get(`${BASE_URL}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al listar plantillas:', error);
      throw error;
    }
  },

  /**
   * Obtener plantillas más usadas
   * @param {number} limite - Número de plantillas a retornar (default: 5)
   */
  async obtenerMasUsadas(limite = 5) {
    try {
      const response = await api.get(`${BASE_URL}/mas-usadas?limite=${limite}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener plantillas más usadas:', error);
      throw error;
    }
  },

  /**
   * Obtener plantilla por ID
   * @param {string} id - ID de la plantilla
   */
  async obtenerPorId(id) {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener plantilla:', error);
      throw error;
    }
  },

  /**
   * Crear nueva plantilla (solo admin)
   * @param {Object} datos - Datos de la plantilla
   * @param {string} datos.nombre - Nombre (requerido)
   * @param {string} datos.codigo - Código único
   * @param {string} datos.descripcion - Descripción
   * @param {string} datos.tituloBase - Título base para tareas creadas
   * @param {string} datos.contenidoBase - Contenido base
   * @param {string} datos.categoriaId - ID de categoría
   * @param {string} datos.prioridadDefecto - Prioridad por defecto
   * @param {number} datos.diasParaVencimiento - Días para calcular vencimiento
   * @param {Object[]} datos.subtareasPredefinidas - Subtareas predefinidas
   * @param {string[]} datos.etiquetasPredefinidas - IDs de etiquetas predefinidas
   */
  async crear(datos) {
    try {
      const response = await api.post(BASE_URL, datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      throw error;
    }
  },

  /**
   * Inicializar plantillas predeterminadas (solo admin)
   */
  async inicializarPredeterminadas() {
    try {
      const response = await api.post(`${BASE_URL}/inicializar`);
      return response.data;
    } catch (error) {
      console.error('Error al inicializar plantillas:', error);
      throw error;
    }
  },

  /**
   * Duplicar una plantilla (solo admin)
   * @param {string} id - ID de la plantilla a duplicar
   */
  async duplicar(id) {
    try {
      const response = await api.post(`${BASE_URL}/${id}/duplicar`);
      return response.data;
    } catch (error) {
      console.error('Error al duplicar plantilla:', error);
      throw error;
    }
  },

  /**
   * Actualizar plantilla (solo admin)
   * @param {string} id - ID de la plantilla
   * @param {Object} datos - Datos a actualizar
   */
  async actualizar(id, datos) {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar plantilla:', error);
      throw error;
    }
  },

  /**
   * Agregar subtarea a plantilla (solo admin)
   * @param {string} plantillaId - ID de la plantilla
   * @param {Object} subtarea - Datos de la subtarea
   * @param {string} subtarea.titulo - Título (requerido)
   * @param {string} subtarea.descripcion - Descripción
   * @param {number} subtarea.orden - Orden de la subtarea
   */
  async agregarSubtarea(plantillaId, subtarea) {
    try {
      const response = await api.post(`${BASE_URL}/${plantillaId}/subtareas`, subtarea);
      return response.data;
    } catch (error) {
      console.error('Error al agregar subtarea:', error);
      throw error;
    }
  },

  /**
   * Eliminar subtarea de plantilla (solo admin)
   * @param {string} plantillaId - ID de la plantilla
   * @param {string} subtareaId - ID de la subtarea
   */
  async eliminarSubtarea(plantillaId, subtareaId) {
    try {
      const response = await api.delete(`${BASE_URL}/${plantillaId}/subtareas/${subtareaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar subtarea:', error);
      throw error;
    }
  },

  /**
   * Eliminar plantilla (soft delete, solo admin)
   * @param {string} id - ID de la plantilla
   */
  async eliminar(id) {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      throw error;
    }
  }
};

export default plantillasService;
