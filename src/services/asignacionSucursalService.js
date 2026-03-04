import api from './api';

/**
 * Servicio de Asignaciones de Sucursales
 * Gestiona el calendario mensual de asignaciones usuario-sucursal
 */

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const NOMBRES_DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const NOMBRES_DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const asignacionSucursalService = {

  // ═══════════════════════ CONSULTAS ═══════════════════════

  /**
   * Obtener calendario mensual de una sucursal
   */
  obtenerCalendario: async (sucursalId, mes, anio) => {
    try {
      const response = await api.get(`/api/asignaciones-sucursal/calendario/${sucursalId}`, {
        params: { mes, anio }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener calendario');
    }
  },

  /**
   * Obtener resumen global de todas las sucursales
   */
  obtenerResumen: async (mes, anio) => {
    try {
      const response = await api.get('/api/asignaciones-sucursal/resumen', {
        params: { mes, anio }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener resumen');
    }
  },

  /**
   * Obtener asignaciones de hoy agrupadas por sucursal
   * Retorna { [sucursalId]: { sucursalNombre, trabajadores: [...] } }
   */
  obtenerAsignacionesHoy: async () => {
    try {
      const response = await api.get('/api/asignaciones-sucursal/hoy');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error obteniendo asignaciones de hoy:', error);
      return {};
    }
  },

  // ═══════════════════════ ASIGNACIÓN INDIVIDUAL ═══════════════════════

  /**
   * Asignar un usuario a una sucursal en una fecha
   */
  asignarDia: async (datos) => {
    try {
      const response = await api.post('/api/asignaciones-sucursal/asignar', datos);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al asignar día');
    }
  },

  /**
   * Eliminar asignación de un día
   */
  eliminarDia: async (sucursalId, fecha) => {
    try {
      const fechaStr = new Date(fecha).toISOString().split('T')[0];
      const response = await api.delete(`/api/asignaciones-sucursal/${sucursalId}/fecha/${fechaStr}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar asignación');
    }
  },

  // ═══════════════════════ PATRÓN SEMANAL ═══════════════════════

  /**
   * Aplicar patrón semanal a un mes
   * @param {Object} datos
   * @param {string} datos.sucursalId
   * @param {number} datos.mes - 1-12
   * @param {number} datos.anio
   * @param {Array} datos.patron - 7 elementos [Dom, Lun, Mar, Mié, Jue, Vie, Sáb]
   * @param {Array} datos.plantillaIds
   * @param {boolean} datos.sobreescribir
   */
  aplicarPatron: async (datos) => {
    try {
      const response = await api.post('/api/asignaciones-sucursal/patron', datos);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al aplicar patrón');
    }
  },

  // ═══════════════════════ GENERACIÓN DE TAREAS ═══════════════════════

  /**
   * Generar tareas del día
   */
  generarTareasHoy: async () => {
    try {
      const response = await api.post('/api/asignaciones-sucursal/generar-tareas');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al generar tareas');
    }
  },

  // ═══════════════════════ COPIAR MES ═══════════════════════

  /**
   * Copiar asignaciones de un mes a otro
   */
  copiarMes: async (datos) => {
    try {
      const response = await api.post('/api/asignaciones-sucursal/copiar-mes', datos);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al copiar mes');
    }
  },

  // ═══════════════════════ HELPERS ═══════════════════════

  getNombreMes: (mes) => NOMBRES_MESES[mes - 1] || '',
  getNombreDia: (dia) => NOMBRES_DIAS[dia] || '',
  getNombreDiaLargo: (dia) => NOMBRES_DIAS_LARGO[dia] || '',
  NOMBRES_MESES,
  NOMBRES_DIAS,
  NOMBRES_DIAS_LARGO
};

export default asignacionSucursalService;
