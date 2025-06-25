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

  // Obtener resumen general de todos los colaboradores
  obtenerResumenGeneral: async () => {
    try {
      const [colaboradores, registros] = await Promise.all([
        api.get('/api/gestion-personal/colaboradores'),
        api.get('/api/gestion-personal')
      ]);

      // Calcular estadísticas por colaborador
      const resumen = colaboradores.data.map(colaborador => {
        const registrosColaborador = registros.data.filter(
          registro => registro.colaboradorUserId === colaborador.clerk_id
        );

        const totales = registrosColaborador.reduce((acc, registro) => ({
          gastos: acc.gastos + (registro.monto || 0),
          faltantes: acc.faltantes + (registro.faltante || 0),
          adelantos: acc.adelantos + (registro.adelanto || 0),
          pagosDiarios: acc.pagosDiarios + (registro.pagodiario || 0)
        }), { gastos: 0, faltantes: 0, adelantos: 0, pagosDiarios: 0 });

        return {
          ...colaborador,
          totales: {
            ...totales,
            totalAPagar: totales.pagosDiarios - (totales.faltantes + totales.adelantos)
          },
          cantidadRegistros: registrosColaborador.length
        };
      });

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
  }
};

export default gestionPersonalService;
