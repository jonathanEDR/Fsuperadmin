/**
 * Hook maestro para gestión de asistencias
 * 
 * Centraliza TODA la lógica de estado y fetching del módulo de asistencias
 * Usa useReducer para consolidar estados y reducir re-renders
 * Sigue el patrón de useGestionPersonal
 * 
 * Uso:
 * const {
 *   state,
 *   actions: {
 *     cargarAsistencias,
 *     registrarAsistencia,
 *     actualizarAsistencia,
 *     eliminarAsistencia,
 *     ...
 *   },
 *   selectors
 * } = useAsistencias();
 */

import { useReducer, useCallback, useEffect } from 'react';
import { asistenciaReducer, initialAsistenciaState, selectors } from './asistenciaReducer';
import { asistenciaService } from '../../../services';

export function useAsistencias(autoLoad = false, colaboradorId = null) {
  const [state, dispatch] = useReducer(asistenciaReducer, initialAsistenciaState);
  
  // ========== CARGA DE DATOS ==========
  
  /**
   * Cargar asistencias con filtros
   */
  const cargarAsistencias = useCallback(async (filtrosPersonalizados = null) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const filtros = filtrosPersonalizados || state.filtrosAsistencia;
      
      // Construir parámetros de consulta
      const params = {};
      
      if (filtros.colaboradorId) {
        params.colaboradorUserId = filtros.colaboradorId;
      }
      
      if (filtros.estado && filtros.estado !== 'todos') {
        params.estado = filtros.estado;
      }
      
      // Si hay año y mes, construir rango de fechas
      if (filtros.año && filtros.mes) {
        const rango = asistenciaService.obtenerRangoMes(filtros.año, filtros.mes);
        params.fechaInicio = rango.fechaInicio;
        params.fechaFin = rango.fechaFin;
      }
      
      // Si hay rango custom, usarlo en su lugar
      if (filtros.fechaInicio && filtros.fechaFin) {
        params.fechaInicio = filtros.fechaInicio;
        params.fechaFin = filtros.fechaFin;
      }
      
      // Paginación
      params.page = state.pagination.page;
      params.limit = state.pagination.limit;
      params.sortBy = 'fecha';
      params.sortOrder = 'desc';
      
      const response = await asistenciaService.obtenerAsistencias(params);
      
      dispatch({
        type: 'ASISTENCIA_LOAD_SUCCESS',
        payload: {
          data: response.data.data || [],
          pagination: response.data.pagination || {}
        }
      });
      
    } catch (error) {
      console.error('❌ Error al cargar asistencias:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message || 'Error al cargar asistencias'
      });
    }
  }, [state.filtrosAsistencia, state.pagination.page, state.pagination.limit]);
  
  /**
   * Cargar asistencias de un colaborador específico
   */
  const cargarAsistenciasColaborador = useCallback(async (colaboradorId, filtros = {}) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.obtenerPorColaborador(colaboradorId, filtros);
      
      dispatch({
        type: 'ASISTENCIA_LOAD_SUCCESS',
        payload: response.data.data || []
      });
      
      console.log(`✅ Asistencias del colaborador ${colaboradorId} cargadas`);
      
    } catch (error) {
      console.error('❌ Error al cargar asistencias del colaborador:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
    }
  }, []);
  
  /**
   * Cargar reporte mensual de un colaborador
   */
  const cargarReporteMensual = useCallback(async (colaboradorId, año, mes) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.obtenerReporteMensual(colaboradorId, año, mes);
      
      dispatch({
        type: 'SET_REPORTE_MENSUAL',
        payload: response.data
      });
      
      console.log(`✅ Reporte mensual cargado: ${año}-${mes}`);
      
    } catch (error) {
      console.error('❌ Error al cargar reporte mensual:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
    }
  }, []);
  
  /**
   * Cargar estadísticas de un colaborador
   */
  const cargarEstadisticas = useCallback(async (colaboradorId, año, mes) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.obtenerEstadisticas(colaboradorId, { año, mes });
      
      dispatch({
        type: 'SET_ESTADISTICAS_ASISTENCIA',
        payload: response.data
      });
      
      console.log('✅ Estadísticas de asistencia cargadas');
      
    } catch (error) {
      console.error('❌ Error al cargar estadísticas:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
    }
  }, []);
  
  /**
   * Cargar asistencias de una fecha específica
   */
  const cargarAsistenciasPorFecha = useCallback(async (fecha) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.obtenerPorFecha(fecha);
      
      dispatch({
        type: 'ASISTENCIA_LOAD_SUCCESS',
        payload: response.data.data || []
      });
      
      console.log('✅ Asistencias de la fecha cargadas');
      
    } catch (error) {
      console.error('❌ Error al cargar asistencias por fecha:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
    }
  }, []);
  
  // ========== CRUD OPERACIONES ==========
  
  /**
   * Registrar nueva asistencia (día completo)
   */
  const registrarAsistencia = useCallback(async (data) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.registrarDiaCompleto(data);
      
      dispatch({
        type: 'ADD_ASISTENCIA',
        payload: response.data.data
      });
      
      dispatch({ type: 'CLOSE_MODAL_ASISTENCIA' });
      
      // Recargar lista
      await cargarAsistencias();
      
      return response.data.data;
      
    } catch (error) {
      console.error('❌ Error al registrar asistencia:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message || 'Error al registrar asistencia'
      });
      throw error;
    }
  }, [cargarAsistencias]);
  
  /**
   * Registrar solo entrada
   */
  const registrarEntrada = useCallback(async (data) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.registrarEntrada(data);
      
      dispatch({
        type: 'ADD_ASISTENCIA',
        payload: response.data.data
      });
      
      console.log('✅ Entrada registrada exitosamente');
      
      await cargarAsistencias();
      
      return response.data.data;
      
    } catch (error) {
      console.error('❌ Error al registrar entrada:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, [cargarAsistencias]);
  
  /**
   * Registrar solo salida
   */
  const registrarSalida = useCallback(async (data) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.registrarSalida(data);
      
      dispatch({
        type: 'UPDATE_ASISTENCIA',
        payload: response.data.data
      });
      
      console.log('✅ Salida registrada exitosamente');
      
      await cargarAsistencias();
      
      return response.data.data;
      
    } catch (error) {
      console.error('❌ Error al registrar salida:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, [cargarAsistencias]);
  
  /**
   * Actualizar asistencia existente
   */
  const actualizarAsistencia = useCallback(async (id, datosActualizados) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.actualizarAsistencia(id, datosActualizados);
      
      dispatch({
        type: 'UPDATE_ASISTENCIA',
        payload: response.data.data
      });
      
      dispatch({ type: 'CLOSE_MODAL_ASISTENCIA' });
      
      console.log('✅ Asistencia actualizada exitosamente');
      
      return response.data.data;
      
    } catch (error) {
      console.error('❌ Error al actualizar asistencia:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);
  
  /**
   * Actualizar solo el estado de una asistencia
   */
  const actualizarEstado = useCallback(async (id, estado, datosAdicionales = {}) => {
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      const response = await asistenciaService.actualizarEstado(id, estado, datosAdicionales);
      
      dispatch({
        type: 'UPDATE_ASISTENCIA',
        payload: response.data.data
      });
      
      console.log('✅ Estado de asistencia actualizado');
      
      return response.data.data;
      
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);
  
  /**
   * Eliminar asistencia
   */
  const eliminarAsistencia = useCallback(async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta asistencia?')) {
      return;
    }
    
    dispatch({ type: 'ASISTENCIA_LOAD_START' });
    
    try {
      await asistenciaService.eliminarAsistencia(id);
      
      dispatch({
        type: 'DELETE_ASISTENCIA',
        payload: id
      });
      
      console.log('✅ Asistencia eliminada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al eliminar asistencia:', error);
      dispatch({
        type: 'ASISTENCIA_LOAD_ERROR',
        payload: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, []);
  
  // ========== VALIDACIÓN ==========
  
  /**
   * Validar si existe asistencia en un día específico
   */
  const validarAsistenciaDelDia = useCallback(async (colaboradorUserId, fecha) => {
    try {
      const response = await asistenciaService.validarAsistenciaDelDia(colaboradorUserId, fecha);
      return response.data;
    } catch (error) {
      console.error('❌ Error al validar asistencia:', error);
      return { existe: false, asistencia: null };
    }
  }, []);
  
  // ========== MODAL GESTIÓN ==========
  
  /**
   * Abrir modal de asistencia
   */
  const abrirModalAsistencia = useCallback((modo = 'crear', asistencia = null, colaborador = null) => {
    dispatch({
      type: 'OPEN_MODAL_ASISTENCIA',
      payload: { modo, asistencia, colaborador }
    });
  }, []);
  
  /**
   * Cerrar modal de asistencia
   */
  const cerrarModalAsistencia = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL_ASISTENCIA' });
  }, []);
  
  // ========== FILTROS ==========
  
  /**
   * Actualizar filtros generales
   * Recarga automáticamente los datos con los nuevos filtros
   */
  const setFiltrosAsistencia = useCallback(async (filtros) => {
    dispatch({ type: 'SET_FILTROS_ASISTENCIA', payload: filtros });
    // Recargar datos con los nuevos filtros
    await cargarAsistencias(filtros);
  }, [cargarAsistencias]);
  
  /**
   * Cambiar colaborador filtrado
   */
  const setFiltroColaborador = useCallback((colaboradorId) => {
    dispatch({ type: 'SET_FILTRO_COLABORADOR', payload: colaboradorId });
  }, []);
  
  /**
   * Cambiar mes/año filtrado
   */
  const setFiltroMes = useCallback((año, mes) => {
    dispatch({ type: 'SET_FILTRO_MES', payload: { año, mes } });
  }, []);
  
  /**
   * Cambiar estado filtrado
   */
  const setFiltroEstado = useCallback((estado) => {
    dispatch({ type: 'SET_FILTRO_ESTADO', payload: estado });
  }, []);
  
  /**
   * Resetear filtros a valores por defecto
   */
  const resetFiltros = useCallback(() => {
    dispatch({ type: 'RESET_FILTROS' });
  }, []);
  
  // ========== VISTA ==========
  
  /**
   * Cambiar vista actual (calendario, lista, reporte)
   */
  const setVistaAsistencia = useCallback((vista) => {
    dispatch({ type: 'SET_VISTA_ASISTENCIA', payload: vista });
  }, []);
  
  // ========== SELECCIÓN ==========
  
  /**
   * Seleccionar una asistencia
   */
  const seleccionarAsistencia = useCallback((asistencia) => {
    dispatch({ type: 'SELECT_ASISTENCIA', payload: asistencia });
  }, []);
  
  // ========== PAGINACIÓN ==========
  
  /**
   * Cambiar página
   */
  const setPage = useCallback((page) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);
  
  /**
   * Cargar siguiente página
   */
  const cargarSiguientePagina = useCallback(async () => {
    if (!state.pagination.hasMore) return;
    
    const siguientePagina = state.pagination.page + 1;
    dispatch({ type: 'SET_PAGE', payload: siguientePagina });
    await cargarAsistencias();
  }, [state.pagination.hasMore, state.pagination.page, cargarAsistencias]);
  
  // ========== UTILIDADES ==========
  
  /**
   * Limpiar error
   */
  const limpiarError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);
  
  /**
   * Resetear estado completo
   */
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);
  
  // ========== EFECTO INICIAL ==========
  
  useEffect(() => {
    if (autoLoad) {
      if (colaboradorId) {
        cargarAsistenciasColaborador(colaboradorId);
      } else {
        cargarAsistencias();
      }
    }
  }, [autoLoad, colaboradorId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // ========== RETURN API ==========
  
  return {
    // Estado completo
    state,
    
    // Acciones organizadas por categoría
    actions: {
      // Carga de datos
      cargarAsistencias,
      cargarAsistenciasColaborador,
      cargarReporteMensual,
      cargarEstadisticas,
      cargarAsistenciasPorFecha,
      
      // CRUD
      registrarAsistencia,
      registrarEntrada,
      registrarSalida,
      actualizarAsistencia,
      actualizarEstado,
      eliminarAsistencia,
      
      // Validación
      validarAsistenciaDelDia,
      
      // Modal
      abrirModalAsistencia,
      cerrarModalAsistencia,
      
      // Filtros
      setFiltrosAsistencia,
      setFiltroColaborador,
      setFiltroMes,
      setFiltroEstado,
      resetFiltros,
      
      // Vista
      setVistaAsistencia,
      
      // Selección
      seleccionarAsistencia,
      
      // Paginación
      setPage,
      cargarSiguientePagina,
      
      // Utilidades
      limpiarError,
      resetState
    },
    
    // Selectores memoizados
    selectors: {
      isLoading: selectors.isLoading(state),
      hasError: selectors.hasError(state),
      isModalOpen: selectors.isModalOpen(state),
      getModalMode: selectors.getModalMode(state),
      hasAsistenciaSeleccionada: selectors.hasAsistenciaSeleccionada(state),
      getVistaActual: selectors.getVistaActual(state),
      hasMorePages: selectors.hasMorePages(state),
      getTotalRegistros: selectors.getTotalRegistros(state),
      getAsistenciasPorColaborador: (colaboradorId) => 
        selectors.getAsistenciasPorColaborador(state, colaboradorId),
      getAsistenciasPorFecha: (fecha) => 
        selectors.getAsistenciasPorFecha(state, fecha),
      getAsistenciasPorEstado: (estado) => 
        selectors.getAsistenciasPorEstado(state, estado),
      getAsistenciasMesActual: () => 
        selectors.getAsistenciasMesActual(state),
      getEstadisticasRapidas: () => 
        selectors.getEstadisticasRapidas(state)
    }
  };
}

export default useAsistencias;
