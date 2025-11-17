/**
 * Servicio de Asistencias
 * Maneja todas las peticiones HTTP relacionadas con el control de asistencias
 * 
 * Backend: /api/asistencia/*
 * Documentación: backend/docs/RESUMEN-IMPLEMENTACION-ASISTENCIAS.md
 */

import api from './api';

export const asistenciaService = {
  
  // ========== REGISTRO DE ASISTENCIAS ==========
  
  /**
   * Registrar entrada de un colaborador
   * POST /api/asistencia/registrar-entrada
   */
  registrarEntrada: (data) => {
    return api.post('/api/asistencia/registrar-entrada', data);
  },
  
  /**
   * Registrar salida de un colaborador
   * POST /api/asistencia/registrar-salida
   */
  registrarSalida: (data) => {
    return api.post('/api/asistencia/registrar-salida', data);
  },
  
  /**
   * Registrar día completo (entrada y salida simultáneas)
   * POST /api/asistencia/registro-completo
   * 
   * @param {Object} data - Datos de la asistencia
   * @param {string} data.colaboradorUserId - Clerk ID del colaborador
   * @param {Date|string} data.fecha - Fecha de la asistencia
   * @param {Date|string} data.horaEntrada - Hora de entrada
   * @param {Date|string} data.horaSalida - Hora de salida (opcional)
   * @param {string} data.estado - Estado: presente, ausente, tardanza, permiso, falta_justificada, falta_injustificada
   * @param {string} data.tipoRegistro - Tipo: manual_admin, manual_trabajador, biometrico, qr_code, app_movil
   * @param {boolean} data.tienePermiso - Si tiene permiso
   * @param {string} data.motivoPermiso - Motivo del permiso
   * @param {string} data.documentoAdjunto - URL del documento adjunto (opcional)
   */
  registrarDiaCompleto: (data) => {
    return api.post('/api/asistencia/registro-completo', data);
  },
  
  // ========== CONSULTAS ==========
  
  /**
   * Obtener todas las asistencias con filtros opcionales
   * GET /api/asistencia
   * 
   * @param {Object} filtros - Filtros de búsqueda
   * @param {string} filtros.colaboradorUserId - Filtrar por colaborador
   * @param {Date|string} filtros.fechaInicio - Fecha de inicio del rango
   * @param {Date|string} filtros.fechaFin - Fecha de fin del rango
   * @param {string} filtros.estado - Filtrar por estado
   * @param {number} filtros.page - Número de página (paginación)
   * @param {number} filtros.limit - Límite de resultados por página
   * @param {string} filtros.sortBy - Campo para ordenar
   * @param {string} filtros.sortOrder - Orden: asc o desc
   */
  obtenerAsistencias: (filtros = {}) => {
    return api.get('/api/asistencia', { params: filtros });
  },
  
  /**
   * Obtener una asistencia por ID
   * GET /api/asistencia/:id
   */
  obtenerAsistenciaPorId: (id) => {
    return api.get(`/api/asistencia/${id}`);
  },
  
  /**
   * Obtener asistencias de un colaborador específico
   * GET /api/asistencia/colaborador/:colaboradorId
   */
  obtenerPorColaborador: (colaboradorId, filtros = {}) => {
    return api.get(`/api/asistencia/colaborador/${colaboradorId}`, { 
      params: filtros 
    });
  },
  
  /**
   * Obtener todas las asistencias de una fecha específica
   * GET /api/asistencia/fecha/:fecha
   * 
   * @param {Date|string} fecha - Fecha en formato YYYY-MM-DD o Date object
   */
  obtenerPorFecha: (fecha) => {
    // Normalizar fecha a formato YYYY-MM-DD
    const fechaStr = fecha instanceof Date 
      ? fecha.toISOString().split('T')[0] 
      : fecha;
    
    return api.get(`/api/asistencia/fecha/${fechaStr}`);
  },
  
  // ========== ESTADÍSTICAS Y REPORTES ==========
  
  /**
   * Obtener estadísticas básicas de un colaborador
   * GET /api/asistencia/colaborador/:colaboradorId/estadisticas
   * 
   * @param {string} colaboradorId - Clerk ID del colaborador
   * @param {Object} params - Parámetros adicionales
   * @param {number} params.año - Año para las estadísticas
   * @param {number} params.mes - Mes para las estadísticas
   */
  obtenerEstadisticas: (colaboradorId, params = {}) => {
    return api.get(`/api/asistencia/colaborador/${colaboradorId}/estadisticas`, {
      params
    });
  },
  
  /**
   * Generar reporte mensual de asistencia
   * GET /api/asistencia/colaborador/:colaboradorId/reporte-mensual
   * 
   * @param {string} colaboradorId - Clerk ID del colaborador
   * @param {number} año - Año del reporte
   * @param {number} mes - Mes del reporte (1-12)
   */
  obtenerReporteMensual: (colaboradorId, año, mes) => {
    return api.get(`/api/asistencia/colaborador/${colaboradorId}/reporte-mensual`, {
      params: { año, mes }
    });
  },
  
  // ========== ACTUALIZACIÓN ==========
  
  /**
   * Actualizar una asistencia completa
   * PUT /api/asistencia/:id
   * 
   * @param {string} id - ID de la asistencia
   * @param {Object} datosActualizados - Datos a actualizar
   */
  actualizarAsistencia: (id, datosActualizados) => {
    return api.put(`/api/asistencia/${id}`, datosActualizados);
  },
  
  /**
   * Actualizar solo el estado de una asistencia
   * PUT /api/asistencia/:id/estado
   * 
   * @param {string} id - ID de la asistencia
   * @param {string} estado - Nuevo estado
   * @param {Object} datosAdicionales - Datos adicionales (motivo, documento)
   */
  actualizarEstado: (id, estado, datosAdicionales = {}) => {
    return api.put(`/api/asistencia/${id}/estado`, {
      estado,
      ...datosAdicionales
    });
  },
  
  // ========== ELIMINACIÓN ==========
  
  /**
   * Eliminar una asistencia
   * DELETE /api/asistencia/:id
   */
  eliminarAsistencia: (id) => {
    return api.delete(`/api/asistencia/${id}`);
  },
  
  // ========== VALIDACIÓN ==========
  
  /**
   * Validar si existe asistencia para un día específico
   * POST /api/asistencia/validar-dia
   * 
   * @param {string} colaboradorUserId - Clerk ID del colaborador
   * @param {Date|string} fecha - Fecha a validar
   */
  validarAsistenciaDelDia: (colaboradorUserId, fecha) => {
    return api.post('/api/asistencia/validar-dia', {
      colaboradorUserId,
      fecha
    });
  },
  
  // ========== UTILIDADES ==========
  
  /**
   * Normalizar fecha a inicio del día (útil para consultas)
   * @param {Date|string} fecha - Fecha a normalizar
   * @returns {Date} Fecha normalizada a las 00:00:00
   */
  normalizarFecha: (fecha) => {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);
    return fechaNormalizada;
  },
  
  /**
   * Obtener rango de fechas de un mes completo
   * @param {number} año - Año
   * @param {number} mes - Mes (1-12)
   * @returns {Object} { fechaInicio, fechaFin }
   */
  obtenerRangoMes: (año, mes) => {
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0, 23, 59, 59, 999);
    
    return {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString()
    };
  },
  
  /**
   * Validar formato de estado
   * @param {string} estado - Estado a validar
   * @returns {boolean} True si es válido
   */
  esEstadoValido: (estado) => {
    const estadosValidos = [
      'presente',
      'ausente',
      'tardanza',
      'permiso',
      'falta_justificada',
      'falta_injustificada'
    ];
    
    return estadosValidos.includes(estado);
  },
  
  /**
   * Obtener color por estado (para UI)
   * @param {string} estado - Estado de asistencia
   * @returns {Object} { bg, text, border }
   */
  obtenerColorEstado: (estado) => {
    const colores = {
      presente: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        dot: 'bg-green-500'
      },
      ausente: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        dot: 'bg-red-500'
      },
      tardanza: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
        dot: 'bg-orange-500'
      },
      permiso: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        dot: 'bg-blue-500'
      },
      falta_justificada: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        dot: 'bg-yellow-500'
      },
      falta_injustificada: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
        dot: 'bg-gray-500'
      }
    };
    
    return colores[estado] || colores.ausente;
  },
  
  /**
   * Obtener etiqueta en español para estado
   * @param {string} estado - Estado de asistencia
   * @returns {string} Etiqueta en español
   */
  obtenerEtiquetaEstado: (estado) => {
    const etiquetas = {
      presente: 'Presente',
      ausente: 'Ausente',
      tardanza: 'Tardanza',
      permiso: 'Permiso',
      falta_justificada: 'Falta Justificada',
      falta_injustificada: 'Falta Injustificada'
    };
    
    return etiquetas[estado] || 'Sin Registro';
  }
};

export default asistenciaService;
