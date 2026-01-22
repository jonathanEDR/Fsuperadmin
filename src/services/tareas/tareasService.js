import api from '../api';

const BASE_URL = '/api/tareas';

/**
 * Servicio para gestión de Tareas
 * Endpoints: /api/tareas
 */
const tareasService = {
  // ==================== LISTADO Y ESTADÍSTICAS ====================

  /**
   * Listar tareas con filtros y paginación
   * @param {Object} filtros - Filtros opcionales
   * @param {string} filtros.estado - Estado de la tarea
   * @param {string} filtros.prioridad - Prioridad de la tarea
   * @param {string} filtros.categoriaId - ID de categoría
   * @param {string[]} filtros.etiquetas - Array de IDs de etiquetas
   * @param {string} filtros.fechaDesde - Fecha desde (ISO)
   * @param {string} filtros.fechaHasta - Fecha hasta (ISO)
   * @param {boolean} filtros.soloVencidas - Solo tareas vencidas
   * @param {boolean} filtros.soloUrgentes - Solo tareas urgentes
   * @param {boolean} filtros.enRevision - Solo en revisión
   * @param {string} filtros.buscar - Término de búsqueda
   * @param {number} filtros.pagina - Número de página
   * @param {number} filtros.limite - Límite por página
   * @param {string} filtros.ordenarPor - Campo para ordenar
   * @param {string} filtros.ordenDir - Dirección de orden (asc/desc)
   */
  async listar(filtros = {}) {
    try {
      const params = new URLSearchParams();

      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });

      const response = await api.get(`${BASE_URL}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al listar tareas:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas generales de tareas
   */
  async obtenerEstadisticas() {
    try {
      const response = await api.get(`${BASE_URL}/estadisticas`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  /**
   * Obtener resumen del día
   */
  async obtenerResumenDiario() {
    try {
      const response = await api.get(`${BASE_URL}/resumen-diario`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen diario:', error);
      throw error;
    }
  },

  /**
   * Obtener usuarios con tareas (solo admin)
   */
  async obtenerUsuariosConTareas() {
    try {
      const response = await api.get(`${BASE_URL}/usuarios-con-tareas`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios con tareas:', error);
      throw error;
    }
  },

  // ==================== CRUD ====================

  /**
   * Obtener tarea por ID
   * @param {string} id - ID de la tarea
   */
  async obtenerPorId(id) {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener tarea:', error);
      throw error;
    }
  },

  /**
   * Crear nueva tarea
   * @param {Object} datos - Datos de la tarea
   * @param {string} datos.titulo - Título (requerido)
   * @param {string} datos.contenido - Contenido/descripción
   * @param {string} datos.categoriaId - ID de categoría
   * @param {string[]} datos.etiquetas - Array de IDs de etiquetas
   * @param {string} datos.prioridad - 'urgente' | 'alta' | 'media' | 'baja'
   * @param {string} datos.fechaVencimiento - Fecha de vencimiento (ISO)
   * @param {string} datos.fechaProgramada - Fecha programada (ISO)
   * @param {string} datos.asignadoA - ID del usuario asignado
   * @param {Object[]} datos.subtareas - Array de subtareas
   * @param {string} datos.plantillaId - ID de plantilla (opcional, para crear desde plantilla)
   */
  async crear(datos) {
    try {
      const response = await api.post(BASE_URL, datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear tarea:', error);
      throw error;
    }
  },

  /**
   * Actualizar tarea
   * @param {string} id - ID de la tarea
   * @param {Object} datos - Datos a actualizar
   */
  async actualizar(id, datos) {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      throw error;
    }
  },

  /**
   * Eliminar tarea
   * @param {string} id - ID de la tarea
   */
  async eliminar(id) {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      throw error;
    }
  },

  // ==================== ESTADO ====================

  /**
   * Cambiar estado de tarea
   * @param {string} id - ID de la tarea
   * @param {string} estado - 'pendiente' | 'en_progreso' | 'en_revision' | 'completada' | 'cancelada'
   */
  async cambiarEstado(id, estado) {
    try {
      const response = await api.patch(`${BASE_URL}/${id}/estado`, { estado });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      throw error;
    }
  },

  /**
   * Marcar tarea como completada
   * @param {string} id - ID de la tarea
   */
  async marcarCompletada(id) {
    try {
      const response = await api.patch(`${BASE_URL}/${id}/completar`);
      return response.data;
    } catch (error) {
      console.error('Error al completar tarea:', error);
      throw error;
    }
  },

  /**
   * Enviar tarea a revisión
   * @param {string} id - ID de la tarea
   */
  async enviarARevision(id) {
    try {
      const response = await api.patch(`${BASE_URL}/${id}/enviar-revision`);
      return response.data;
    } catch (error) {
      console.error('Error al enviar a revisión:', error);
      throw error;
    }
  },

  /**
   * Revisar tarea (aprobar/rechazar) - Solo admin
   * @param {string} id - ID de la tarea
   * @param {string} resultado - 'aprobada' | 'rechazada'
   * @param {string} comentario - Comentario de revisión (opcional)
   */
  async revisar(id, resultado, comentario = '') {
    try {
      const response = await api.patch(`${BASE_URL}/${id}/revisar`, {
        resultado,
        comentario
      });
      return response.data;
    } catch (error) {
      console.error('Error al revisar tarea:', error);
      throw error;
    }
  },

  // ==================== SUBTAREAS ====================

  /**
   * Agregar subtarea
   * @param {string} tareaId - ID de la tarea
   * @param {Object} subtarea - Datos de la subtarea
   * @param {string} subtarea.titulo - Título (requerido)
   * @param {string} subtarea.descripcion - Descripción (opcional)
   */
  async agregarSubtarea(tareaId, subtarea) {
    try {
      const response = await api.post(`${BASE_URL}/${tareaId}/subtareas`, subtarea);
      return response.data;
    } catch (error) {
      console.error('Error al agregar subtarea:', error);
      throw error;
    }
  },

  /**
   * Completar subtarea
   * @param {string} tareaId - ID de la tarea
   * @param {string} subtareaId - ID de la subtarea
   */
  async completarSubtarea(tareaId, subtareaId) {
    try {
      const response = await api.patch(`${BASE_URL}/${tareaId}/subtareas/${subtareaId}/completar`);
      return response.data;
    } catch (error) {
      console.error('Error al completar subtarea:', error);
      throw error;
    }
  },

  /**
   * Descompletar subtarea (marcar como pendiente)
   * @param {string} tareaId - ID de la tarea
   * @param {string} subtareaId - ID de la subtarea
   */
  async descompletarSubtarea(tareaId, subtareaId) {
    try {
      const response = await api.patch(`${BASE_URL}/${tareaId}/subtareas/${subtareaId}/descompletar`);
      return response.data;
    } catch (error) {
      console.error('Error al descompletar subtarea:', error);
      throw error;
    }
  },

  /**
   * Eliminar subtarea
   * @param {string} tareaId - ID de la tarea
   * @param {string} subtareaId - ID de la subtarea
   */
  async eliminarSubtarea(tareaId, subtareaId) {
    try {
      const response = await api.delete(`${BASE_URL}/${tareaId}/subtareas/${subtareaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar subtarea:', error);
      throw error;
    }
  },

  // ==================== COMENTARIOS ====================

  /**
   * Agregar comentario
   * @param {string} tareaId - ID de la tarea
   * @param {string} contenido - Contenido del comentario
   */
  async agregarComentario(tareaId, contenido) {
    try {
      const response = await api.post(`${BASE_URL}/${tareaId}/comentarios`, { contenido });
      return response.data;
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      throw error;
    }
  }
};

export default tareasService;
