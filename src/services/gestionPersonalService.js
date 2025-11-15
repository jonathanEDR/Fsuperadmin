import api from './api';

// Servicio para gestión de personal
export const gestionPersonalService = {
  // Obtener todos los registros de gestión personal
  obtenerRegistros: async () => {
    try {
      const response = await api.get('/api/gestion-personal');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener registros');
    }
  },
  // Obtener colaboradores disponibles
  obtenerColaboradores: async () => {
    try {
      const response = await api.get('/api/gestion-personal/colaboradores');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener colaboradores');
    }  },

  // Obtener mis registros como colaborador
  obtenerMisRegistros: async () => {
    try {
      const response = await api.get('/api/gestion-personal/mis-registros');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener mis registros');
    }
  },

  // Crear nuevo registro
  crearRegistro: async (datos) => {
    try {
      const response = await api.post('/api/gestion-personal', datos);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear registro');
    }
  },

  // Crear registro con datos sugeridos automáticamente desde cobros
  crearRegistroConSugerencias: async (datos) => {
    try {
      const response = await api.post('/api/gestion-personal/crear-con-sugerencias', datos);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al crear registro con sugerencias');
    }
  },

  // Obtener resumen de cobros de un colaborador - VERSIÓN MEJORADA
  obtenerResumenCobros: async (colaboradorUserId, fechaInicio = null, fechaFin = null, metodo = 'corregido') => {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      params.append('metodo', metodo); // corregido, original, simple
      
      const url = `/api/gestion-personal/cobros-resumen/${colaboradorUserId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener resumen de cobros');
    }
  },

  // NUEVO: Diagnóstico completo de la relación Ventas → Cobros → Gestión Personal
  diagnosticarColaborador: async (colaboradorUserId) => {
    try {
      const response = await api.get(`/api/gestion-personal/diagnostico/${colaboradorUserId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al realizar diagnóstico del colaborador');
    }
  },

  // Obtener datos sugeridos para un colaborador en una fecha específica
  obtenerDatosSugeridos: async (colaboradorUserId, fechaGestion) => {
    try {
      const response = await api.get(`/api/gestion-personal/datos-sugeridos/${colaboradorUserId}?fechaGestion=${fechaGestion}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener datos sugeridos');
    }
  },
  // Obtener registros de un colaborador específico
  obtenerRegistrosColaborador: async (colaboradorId, filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      
      const url = `/api/gestion-personal/colaborador/${colaboradorId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener registros del colaborador');
    }
  },

  // Obtener estadísticas de un colaborador
  obtenerEstadisticasColaborador: async (colaboradorId) => {
    try {
      const response = await api.get(`/api/gestion-personal/colaborador/${colaboradorId}/estadisticas`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  },

  // NUEVO: Obtener estadísticas mejoradas con datos automáticos de cobros
  obtenerEstadisticasMejoradas: async (colaboradorId) => {
    try {
      const response = await api.get(`/api/gestion-personal/colaborador/${colaboradorId}/estadisticas-mejoradas`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas mejoradas');
    }
  },

  // 🚀 NUEVO: Obtener estadísticas para múltiples colaboradores en paralelo (OPTIMIZACIÓN)
  obtenerEstadisticasBulk: async (colaboradorIds = null) => {
    try {
      const params = new URLSearchParams();
      if (colaboradorIds && Array.isArray(colaboradorIds)) {
        params.append('colaboradorIds', colaboradorIds.join(','));
      }
      
      const url = `/api/gestion-personal/estadisticas-bulk${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas bulk');
    }
  },

  // Actualizar registro existente
  actualizarRegistro: async (registroId, datos) => {
    try {
      const response = await api.put(`/api/gestion-personal/${registroId}`, datos);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar registro');
    }
  },

  // Eliminar registro
  eliminarRegistro: async (registroId) => {
    try {
      const response = await api.delete(`/api/gestion-personal/${registroId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al eliminar registro');
    }
  },

  // Obtener resumen general de todos los colaboradores - VERSIÓN MEJORADA
  obtenerResumenGeneral: async (usarDatosCorregidos = true) => {
    try {
      const [colaboradores, registros] = await Promise.all([
        api.get('/api/gestion-personal/colaboradores'),
        api.get('/api/gestion-personal')
      ]);

      // Calcular estadísticas por colaborador
      const resumen = await Promise.all(
        colaboradores.data.map(async (colaborador) => {
          const registrosColaborador = registros.data.filter(
            registro => registro.colaboradorUserId === colaborador.clerk_id
          );

          const totales = registrosColaborador.reduce((acc, registro) => ({
            gastos: acc.gastos + (registro.monto || 0),
            faltantes: acc.faltantes + (registro.faltante || 0),
            adelantos: acc.adelantos + (registro.adelanto || 0),
            pagosDiarios: acc.pagosDiarios + (registro.pagodiario || 0)
          }), { gastos: 0, faltantes: 0, adelantos: 0, pagosDiarios: 0 });

          // Si está habilitado, obtener datos corregidos de cobros
          let datosCorregidos = null;
          if (usarDatosCorregidos) {
            try {
              // Usar referencia directa para evitar circular reference
              const params = new URLSearchParams();
              params.append('metodo', 'corregido');
              const response = await api.get(`/api/gestion-personal/cobros-resumen/${colaborador.clerk_id}?${params.toString()}`);
              const resumenCobros = response.data;
              datosCorregidos = {
                faltantesPendientes: resumenCobros.resumen?.totalFaltantes || 0,
                gastosPendientes: resumenCobros.resumen?.totalGastosImprevistos || 0,
                ventasRelacionadas: resumenCobros.resumen?.totalVentas || 0,
                cobrosRelacionados: resumenCobros.resumen?.totalCobros || 0
              };
            } catch (error) {
              console.warn(`No se pudieron obtener datos corregidos para ${colaborador.nombre_negocio}:`, error.message);
            }
          }

          return {
            ...colaborador,
            totales: {
              ...totales,
              totalAPagar: totales.pagosDiarios - (totales.faltantes + totales.adelantos)
            },
            datosCorregidos,
            totalAPagarConCobros: datosCorregidos ? 
              totales.pagosDiarios - (totales.faltantes + datosCorregidos.faltantesPendientes + totales.adelantos) : 
              null,
            cantidadRegistros: registrosColaborador.length
          };
        })
      );

      return resumen;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener resumen general');
    }
  },

  // Exportar datos para reportes
  exportarDatos: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
      if (filtros.colaboradorId) params.append('colaboradorId', filtros.colaboradorId);
        const response = await api.get(`/api/gestion-personal/export?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al exportar datos');
    }
  },

  // 🚀 NUEVO V2: Obtener todos los datos en una sola petición optimizada
  obtenerDatosCompletos: async () => {
    try {
      const response = await api.get('/api/gestion-personal/datos-completos');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener datos completos');
    }
  }
};

export default gestionPersonalService;
