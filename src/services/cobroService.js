import api from './api';

export const getResumen = async () => {
  try {
    const response = await api.get('/api/cobros/resumen');
    return response.data;
  } catch (error) {
    console.error('Error al obtener resumen de cobros:', error);
    throw new Error(error.response?.data?.message || 'No se pudo obtener el resumen de cobros');
  }
};

export const getPendingVentas = async () => {
  try {
    console.log('Obteniendo ventas pendientes...');
    const response = await api.get('/api/cobros/ventas-pendientes');
    return response.data.ventas || response.data;
  } catch (error) {
    console.error('Error al obtener ventas pendientes:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener las ventas pendientes');
  }
};

export const createCobro = async (cobroData) => {
  try {
    console.log('Creando cobro con datos:', cobroData);
    
    // Validar datos antes de enviar
    if (!cobroData.ventas || cobroData.ventas.length === 0) {
      throw new Error('No hay ventas seleccionadas');
    }

    if (!cobroData.montoTotal || cobroData.montoTotal <= 0) {
      throw new Error('El monto total no es válido');
    }

    // La información del usuario se maneja en el interceptor de api.js,
    // no necesitamos agregarla aquí

    // Asegurar que todos los montos sean números
    const dataToSend = {
      ...cobroData,
      yape: Number(cobroData.yape),
      efectivo: Number(cobroData.efectivo),
      gastosImprevistos: Number(cobroData.gastosImprevistos),
      montoTotal: Number(cobroData.montoTotal)
    };

    const response = await api.post('/api/cobros', dataToSend);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al crear el cobro');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error al crear cobro:', error);
    throw new Error(error.response?.data?.message || error.message || 'Error al crear el cobro');
  }
};

export const getPaymentHistory = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/cobros/historial?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener el historial de pagos');
  }
};

export const getCobrosHistorial = async (page = 1, limit = 10) => {
  try {
    console.log('Obteniendo historial de cobros...');
    const response = await api.get('/api/cobros', {
      params: { page, limit }
    });
    
    if (!response.data || !response.data.cobros) {
      console.warn('Respuesta vacía o sin cobros:', response.data);
      return {
        cobros: [],
        currentPage: 1,
        totalPages: 1,
        total: 0
      };
    }

    return {
      cobros: response.data.cobros,
      currentPage: response.data.currentPage,
      totalPages: response.data.totalPages,
      total: response.data.total
    };
  } catch (error) {
    console.error('Error al obtener historial de cobros:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener el historial de cobros');
  }
};

export const deleteCobro = async (cobroId) => {
  try {
    const response = await api.delete(`/api/cobros/${cobroId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar cobro:', error);
    throw new Error(error.response?.data?.message || 'Error al eliminar el cobro');
  }
};
