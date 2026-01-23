/**
 * 🎯 Servicio de Metas y Bonificaciones por Sucursal
 * 
 * Consume la API del backend para:
 * - Configurar metas mensuales por sucursal
 * - Calcular progreso de metas (individual por trabajador)
 * - Evaluar metas y registrar bonificaciones
 * - Consultar historial de metas
 * 
 * Backend: /api/metas-sucursal/*
 * Documentación: backend/docs/RESUMEN-METAS-BONIFICACIONES.md
 */

import api from './api';

export const metasSucursalService = {
  
  // ========== CONFIGURACIÓN DE METAS ==========
  
  /**
   * Configurar meta mensual para una sucursal
   * POST /api/metas-sucursal/configurar/:sucursalId
   * 
   * @param {string} sucursalId - ID de la sucursal
   * @param {Object} metaConfig - Configuración de la meta
   * @param {boolean} metaConfig.activo - Si el sistema de metas está activo
   * @param {number} metaConfig.metaMensual - Monto de la meta mensual
   * @param {number} metaConfig.bonificacionPorCumplimiento - Bonificación al cumplir
   * @param {string} metaConfig.tipoMedicion - 'cobros' o 'ventas'
   * @param {string} metaConfig.notas - Notas adicionales
   */
  configurarMeta: async (sucursalId, metaConfig) => {
    try {
      const response = await api.post(`/api/metas-sucursal/configurar/${sucursalId}`, metaConfig);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al configurar meta');
    }
  },
  
  /**
   * Obtener configuración de meta de una sucursal
   * GET /api/metas-sucursal/configuracion/:sucursalId
   * 
   * @param {string} sucursalId - ID de la sucursal
   */
  obtenerConfiguracion: async (sucursalId) => {
    try {
      const response = await api.get(`/api/metas-sucursal/configuracion/${sucursalId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener configuración');
    }
  },
  
  // ========== PROGRESO Y EVALUACIÓN ==========
  
  /**
   * Calcular progreso de meta por trabajador en una sucursal
   * GET /api/metas-sucursal/progreso/:sucursalId
   * 
   * @param {string} sucursalId - ID de la sucursal
   * @param {number} mes - Mes (1-12), opcional (default: mes actual)
   * @param {number} año - Año, opcional (default: año actual)
   */
  obtenerProgreso: async (sucursalId, mes = null, anio = null) => {
    try {
      if (!sucursalId) {
        throw new Error('sucursalId es requerido');
      }
      const params = {};
      if (mes) params.mes = mes;
      if (anio) params.anio = anio;
      
      const response = await api.get(`/api/metas-sucursal/progreso/${sucursalId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener progreso');
    }
  },

  /**
   * Obtener progreso de TODAS las sucursales
   * GET /api/metas-sucursal/progreso-global
   * 
   * @param {number} mes - Mes (1-12), opcional (default: mes actual)
   * @param {number} anio - Año, opcional (default: año actual)
   * @returns {Object} Progreso de todas las sucursales con resumen global
   */
  obtenerProgresoGlobal: async (mes = null, anio = null) => {
    try {
      const params = {};
      if (mes) params.mes = mes;
      if (anio) params.anio = anio;
      
      const response = await api.get('/api/metas-sucursal/progreso-global', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener progreso global');
    }
  },
  
  /**
   * Evaluar meta de una sucursal para un periodo
   * POST /api/metas-sucursal/evaluar/:sucursalId
   * 
   * @param {string} sucursalId - ID de la sucursal
   * @param {number} mes - Mes a evaluar (1-12)
   * @param {number} año - Año a evaluar
   * @param {boolean} registrarBonificaciones - Si se deben registrar bonificaciones
   */
  evaluarMeta: async (sucursalId, mes, anio, registrarBonificaciones = false) => {
    try {
      if (!sucursalId) {
        throw new Error('sucursalId es requerido');
      }
      const response = await api.post(`/api/metas-sucursal/evaluar/${sucursalId}`, {
        mes,
        anio,
        registrarBonificaciones
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al evaluar meta');
    }
  },
  
  /**
   * Evaluar metas de TODAS las sucursales para un periodo
   * POST /api/metas-sucursal/evaluar-todas
   * 
   * @param {number} mes - Mes a evaluar (1-12)
   * @param {number} año - Año a evaluar
   * @param {boolean} registrarBonificaciones - Si se deben registrar bonificaciones
   */
  evaluarTodasLasMetas: async (mes, año, registrarBonificaciones = false) => {
    try {
      const response = await api.post('/api/metas-sucursal/evaluar-todas', {
        mes,
        año,
        registrarBonificaciones
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al evaluar todas las metas');
    }
  },
  
  // ========== HISTORIAL ==========
  
  /**
   * Obtener historial de metas de una sucursal
   * GET /api/metas-sucursal/historial/:sucursalId
   * 
   * @param {string} sucursalId - ID de la sucursal
   */
  obtenerHistorialSucursal: async (sucursalId) => {
    try {
      const response = await api.get(`/api/metas-sucursal/historial/${sucursalId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener historial');
    }
  },
  
  /**
   * Obtener historial de metas de un trabajador
   * GET /api/metas-sucursal/historial-trabajador/:colaboradorUserId
   * 
   * @param {string} colaboradorUserId - Clerk ID del trabajador
   */
  obtenerHistorialTrabajador: async (colaboradorUserId) => {
    try {
      const response = await api.get(`/api/metas-sucursal/historial-trabajador/${colaboradorUserId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener historial del trabajador');
    }
  },
  
  // ========== LISTADOS ==========
  
  /**
   * Listar todas las sucursales con información de sus metas
   * GET /api/metas-sucursal/sucursales
   */
  obtenerSucursalesConMetas: async () => {
    try {
      const response = await api.get('/api/metas-sucursal/sucursales');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener sucursales');
    }
  },
  
  // ========== UTILIDADES ==========
  
  /**
   * Formatear monto a moneda local
   * @param {number} monto - Monto a formatear
   * @returns {string} Monto formateado
   */
  formatearMoneda: (monto) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto || 0);
  },
  
  /**
   * Calcular porcentaje de cumplimiento
   * @param {number} alcanzado - Monto alcanzado
   * @param {number} meta - Meta establecida
   * @returns {number} Porcentaje (0-100+)
   */
  calcularPorcentaje: (alcanzado, meta) => {
    if (!meta || meta <= 0) return 0;
    return Math.round((alcanzado / meta) * 100 * 100) / 100;
  },
  
  /**
   * Obtener color según porcentaje de cumplimiento
   * @param {number} porcentaje - Porcentaje de cumplimiento
   * @returns {Object} Clases de Tailwind para colores
   */
  obtenerColorPorcentaje: (porcentaje) => {
    if (porcentaje >= 100) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        progress: 'bg-green-500'
      };
    } else if (porcentaje >= 75) {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        progress: 'bg-yellow-500'
      };
    } else if (porcentaje >= 50) {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
        progress: 'bg-orange-500'
      };
    } else {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        progress: 'bg-red-500'
      };
    }
  },
  
  /**
   * Obtener nombre del mes
   * @param {number} mes - Número del mes (1-12)
   * @returns {string} Nombre del mes en español
   */
  obtenerNombreMes: (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || '';
  }
};

export default metasSucursalService;
