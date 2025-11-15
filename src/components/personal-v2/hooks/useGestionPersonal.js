/**
 * Hook maestro para Gestión de Personal V2
 * 
 * Centraliza TODA la lógica de estado y fetching del módulo
 * Usa useReducer para consolidar estados y reducir re-renders
 * 
 * Uso:
 * const {
 *   state,
 *   actions: {
 *     cargarDatos,
 *     crearRegistro,
 *     eliminarRegistro,
 *     abrirModal,
 *     mostrarDetalle,
 *     ...
 *   }
 * } = useGestionPersonal();
 */

import { useReducer, useCallback, useEffect, useMemo } from 'react';
import { gestionPersonalReducer, initialState, selectors } from './gestionPersonalReducer';
import { gestionPersonalService } from '../../../services';
import { getPagosRealizados } from '../../../services/api';
import api from '../../../services/api';

export function useGestionPersonal(autoLoad = true) {
  const [state, dispatch] = useReducer(gestionPersonalReducer, initialState);
  
  // ========== CARGA DE DATOS ==========
  
  /**
   * Cargar todos los datos en UNA SOLA petición
   * 🚀 OPTIMIZACIÓN: Usa endpoint /datos-completos
   */
  const cargarDatos = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    
    try {
      // Intentar endpoint optimizado primero
      try {
        const datos = await gestionPersonalService.obtenerDatosCompletos();
        
        dispatch({
          type: 'LOAD_COMPLETE',
          payload: {
            registros: datos.registros || [],
            colaboradores: datos.colaboradores || [],
            pagosRealizados: datos.pagosRealizados || [],
            estadisticasBulk: datos.estadisticasBulk || {}
          }
        });
        
        console.log('✅ Datos cargados con endpoint optimizado');
        return;
      } catch (endpointError) {
        console.warn('⚠️ Endpoint /datos-completos no disponible, usando método fallback');
      }
      
      // FALLBACK: Si el endpoint no existe aún, cargar en paralelo
      const [registros, colaboradores, pagos] = await Promise.all([
        gestionPersonalService.obtenerRegistros(),
        gestionPersonalService.obtenerColaboradores(),
        getPagosRealizados()
      ]);
      
      // Obtener IDs de colaboradores para estadísticas bulk
      const colaboradorIds = colaboradores.map(c => c.clerk_id);
      
      // Cargar estadísticas bulk (optimizado en backend)
      let estadisticasBulk = {};
      try {
        const statsResult = await gestionPersonalService.obtenerEstadisticasBulk(colaboradorIds);
        if (statsResult.success && statsResult.resultados) {
          estadisticasBulk = statsResult.resultados.reduce((acc, resultado) => {
            if (resultado.success && resultado.estadisticas) {
              acc[resultado.colaboradorId] = resultado.estadisticas;
            }
            return acc;
          }, {});
        }
      } catch (statsError) {
        console.warn('⚠️ Error al cargar estadísticas bulk:', statsError.message);
      }
      
      dispatch({
        type: 'LOAD_COMPLETE',
        payload: {
          registros,
          colaboradores,
          pagosRealizados: pagos || [],
          estadisticasBulk
        }
      });
      
      console.log('✅ Datos cargados con método fallback paralelo');
      
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      dispatch({
        type: 'LOAD_ERROR',
        payload: error.message || 'Error al cargar los datos'
      });
    }
  }, []);
  
  /**
   * Cargar datos de cobros para un colaborador específico
   */
  const cargarDatosCobros = useCallback(async (colaboradorId) => {
    try {
      const datosCobros = await gestionPersonalService.obtenerResumenCobros(
        colaboradorId,
        null,
        null,
        'corregido'
      );
      return datosCobros;
    } catch (error) {
      console.warn('⚠️ Error al cargar datos de cobros:', error.message);
      return null;
    }
  }, []);
  
  // ========== CRUD REGISTROS ==========
  
  /**
   * Crear nuevo registro de gestión personal
   */
  const crearRegistro = useCallback(async (datosRegistro) => {
    dispatch({ type: 'LOAD_START' });
    
    try {
      const nuevoRegistro = await gestionPersonalService.crearRegistro(datosRegistro);
      
      // Recargar datos completos para actualizar estadísticas
      await cargarDatos();
      
      // Cerrar modal
      dispatch({ type: 'CLOSE_MODAL' });
      
      console.log('✅ Registro creado exitosamente');
      return nuevoRegistro;
    } catch (error) {
      console.error('❌ Error al crear registro:', error);
      dispatch({
        type: 'LOAD_ERROR',
        payload: error.message || 'Error al crear el registro'
      });
      throw error;
    }
  }, [cargarDatos]);
  
  /**
   * Eliminar registro de gestión personal
   */
  const eliminarRegistro = useCallback(async (registroId) => {
    if (!registroId) return;
    
    dispatch({ type: 'LOAD_START' });
    
    try {
      await gestionPersonalService.eliminarRegistro(registroId);
      
      // Actualizar estado local
      dispatch({ type: 'DELETE_REGISTRO', payload: registroId });
      
      // Recargar datos completos para actualizar estadísticas
      await cargarDatos();
      
      console.log('✅ Registro eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error al eliminar registro:', error);
      dispatch({
        type: 'LOAD_ERROR',
        payload: error.message || 'Error al eliminar el registro'
      });
      throw error;
    }
  }, [cargarDatos]);
  
  // ========== CRUD PAGOS REALIZADOS ==========
  
  /**
   * Crear nuevo pago realizado
   * NUEVO: Soporta registrosIds para selección de días específicos
   */
  const crearPago = useCallback(async (datosPago) => {
    dispatch({ type: 'LOAD_START' });
    
    try {
      const response = await api.post('/api/pagos-realizados', datosPago);
      
      // Respuesta mejorada del backend incluye: { pago, registrosActualizados, mensaje }
      const { pago, registrosActualizados } = response.data;
      
      // Actualizar estado local sin recargar todo
      if (pago) {
        dispatch({ type: 'AGREGAR_PAGO', payload: pago });
      }
      
      if (registrosActualizados && registrosActualizados.length > 0) {
        dispatch({ type: 'UPDATE_REGISTROS_BULK', payload: registrosActualizados });
        console.log(`✅ ${registrosActualizados.length} registros marcados como pagados`);
      }
      
      // Recargar solo estadísticas (más ligero que recargar todo)
      await cargarDatos();
      
      console.log('✅ Pago registrado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear pago:', error);
      dispatch({
        type: 'LOAD_ERROR',
        payload: error.message || 'Error al registrar el pago'
      });
      throw error;
    }
  }, [cargarDatos]);
  
  /**
   * Eliminar pago realizado
   * NUEVO: Revierte estado de registros asociados
   */
  const eliminarPago = useCallback(async (pagoId) => {
    if (!pagoId) return;
    
    dispatch({ type: 'LOAD_START' });
    
    try {
      const response = await api.delete(`/api/pagos-realizados/${pagoId}`);
      
      // Respuesta incluye: { pago, registrosRevertidos }
      const { registrosRevertidos } = response.data;
      
      // Actualizar estado local
      dispatch({ type: 'ELIMINAR_PAGO', payload: pagoId });
      
      if (registrosRevertidos && registrosRevertidos.length > 0) {
        dispatch({ type: 'UPDATE_REGISTROS_BULK', payload: registrosRevertidos });
        console.log(`✅ ${registrosRevertidos.length} registros revertidos a pendiente`);
      }
      
      // Recargar estadísticas
      await cargarDatos();
      
      console.log('✅ Pago eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error al eliminar pago:', error);
      dispatch({
        type: 'LOAD_ERROR',
        payload: error.message || 'Error al eliminar el pago'
      });
      throw error;
    }
  }, [cargarDatos]);
  
  // ========== MODAL GESTIÓN ==========
  
  const abrirModal = useCallback((colaborador) => {
    dispatch({ type: 'OPEN_MODAL', payload: colaborador });
  }, []);
  
  const cerrarModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);
  
  const abrirConfirmacion = useCallback((registroId) => {
    dispatch({ type: 'OPEN_CONFIRM_DELETE', payload: registroId });
  }, []);
  
  const cerrarConfirmacion = useCallback(() => {
    dispatch({ type: 'CLOSE_CONFIRM_DELETE' });
  }, []);
  
  const confirmarEliminar = useCallback(async () => {
    if (state.modalState.registroToDelete) {
      await eliminarRegistro(state.modalState.registroToDelete);
    }
  }, [state.modalState.registroToDelete, eliminarRegistro]);
  
  // ========== NAVEGACIÓN VISTAS ==========
  
  /**
   * Mostrar detalle de un colaborador
   */
  const mostrarDetalle = useCallback(async (colaborador) => {
    // Cargar datos de cobros en paralelo
    const datosCobros = await cargarDatosCobros(colaborador.clerk_id);
    
    dispatch({
      type: 'SHOW_COLABORADOR_DETALLE',
      payload: {
        colaborador,
        datosCobros
      }
    });
    
    console.log('📊 Mostrando detalle de:', colaborador.nombre_negocio);
  }, [cargarDatosCobros]);
  
  const volverAColaboradores = useCallback(() => {
    dispatch({ type: 'VOLVER_COLABORADORES' });
  }, []);
  
  // ========== FILTROS ==========
  
  const setFiltroFecha = useCallback((filtro) => {
    dispatch({ type: 'SET_FILTRO_FECHA', payload: filtro });
  }, []);
  
  const setCustomDateRange = useCallback((field, value) => {
    dispatch({
      type: 'SET_CUSTOM_DATE_RANGE',
      payload: { field, value }
    });
  }, []);
  
  // ========== PAGINACIÓN ==========
  
  const verMasRegistros = useCallback(() => {
    dispatch({ type: 'VER_MAS_REGISTROS' });
  }, []);
  
  const resetPaginacion = useCallback(() => {
    dispatch({ type: 'RESET_PAGINACION' });
  }, []);
  
  // ========== UTILIDADES ==========
  
  /**
   * Formatear moneda peruana
   */
  const formatearMoneda = useCallback((cantidad) => {
    if (cantidad === null || cantidad === undefined) return 'S/0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(cantidad);
  }, []);
  
  // ========== SELECTORES MEMOIZADOS ==========
  
  /**
   * Obtener registros de un colaborador (memoizado)
   */
  const getRegistrosColaborador = useCallback((colaboradorId) => {
    return selectors.getRegistrosColaborador(state, colaboradorId);
  }, [state]);
  
  /**
   * Obtener estadísticas de un colaborador (memoizado)
   */
  const getEstadisticasColaborador = useCallback((colaboradorId) => {
    return selectors.getEstadisticasColaborador(state, colaboradorId);
  }, [state]);
  
  /**
   * Obtener total de pagos realizados (memoizado)
   */
  const getTotalPagosRealizados = useCallback((colaboradorId) => {
    return selectors.getTotalPagosRealizados(state, colaboradorId);
  }, [state]);
  
  // ========== EFECTO INICIAL ==========
  
  useEffect(() => {
    if (autoLoad) {
      cargarDatos();
    }
  }, [autoLoad, cargarDatos]);
  
  // ========== RETURN API ==========
  
  return {
    // Estado completo
    state,
    
    // Acciones organizadas por categoría
    actions: {
      // Datos
      cargarDatos,
      cargarDatosCobros,
      
      // CRUD Registros
      crearRegistro,
      eliminarRegistro,
      
      // CRUD Pagos
      crearPago,
      eliminarPago,
      
      // Modales
      abrirModal,
      cerrarModal,
      abrirConfirmacion,
      cerrarConfirmacion,
      confirmarEliminar,
      
      // Navegación
      mostrarDetalle,
      volverAColaboradores,
      
      // Filtros
      setFiltroFecha,
      setCustomDateRange,
      
      // Paginación
      verMasRegistros,
      resetPaginacion,
      
      // Utilidades
      formatearMoneda
    },
    
    // Selectores
    selectors: {
      getRegistrosColaborador,
      getEstadisticasColaborador,
      getTotalPagosRealizados,
      isLoading: selectors.isLoading(state),
      hasError: selectors.hasError(state),
      isDetalleView: selectors.isDetalleView(state)
    }
  };
}

export default useGestionPersonal;
