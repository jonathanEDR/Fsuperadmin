import api from './api';

// Función de utilidad para manejar errores
const handleApiError = (error, defaultMessage) => {
  console.error('Error en cobroService:', error);
  const errorMessage = error.response?.data?.message || error.message || defaultMessage;
  throw new Error(errorMessage);
};

// Función de utilidad para validar montos
const validateMontos = (montos) => {
  const { yape = 0, efectivo = 0, gastosImprevistos = 0 } = montos;
  
  // Convertir a números y validar
  const montosNumericos = {
    yape: Number(yape),
    efectivo: Number(efectivo),
    gastosImprevistos: Number(gastosImprevistos)
  };

  // Verificar que no haya valores negativos
  Object.entries(montosNumericos).forEach(([key, value]) => {
    if (value < 0) throw new Error(`El monto de ${key} no puede ser negativo`);
  });

  // Calcular el monto total basándose en los métodos de pago
  const montoTotal = montosNumericos.yape + montosNumericos.efectivo + montosNumericos.gastosImprevistos;
  
  return {
    ...montosNumericos,
    montoTotal
  };
};

export const getResumen = async () => {
  try {
    const response = await api.get('/api/cobros/resumen');
    return response.data;
  } catch (error) {
    handleApiError(error, 'No se pudo obtener el resumen de cobros');
  }
};

export const getPendingVentas = async () => {
  try {
    const response = await api.get('/api/cobros/ventas-pendientes');
    return response.data.ventas || [];
  } catch (error) {
    handleApiError(error, 'Error al obtener las ventas pendientes');
  }
};

export const createCobro = async (cobroData) => {
  try {
    console.log('Preparando datos para crear cobro:', cobroData);
    
    // Validaciones iniciales
    if (!cobroData.ventas || !Array.isArray(cobroData.ventas) || cobroData.ventas.length === 0) {
      throw new Error('Debe seleccionar al menos una venta');
    }

    // Validar fecha de cobro
    if (!cobroData.fechaCobro) {
      throw new Error('La fecha de cobro es requerida');
    }

    const fechaSeleccionada = new Date(cobroData.fechaCobro);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    if (isNaN(fechaSeleccionada.getTime())) {
      throw new Error('La fecha de cobro no es válida');
    }

    if (fechaSeleccionada > hoy) {
      throw new Error('La fecha de cobro no puede ser en el futuro');
    }

    // Validar montos primero
    const montos = validateMontos({
      yape: cobroData.yape,
      efectivo: cobroData.efectivo,
      gastosImprevistos: cobroData.gastosImprevistos
    });

    console.log('Montos validados:', montos);

    // Calcular cuánto se va a pagar por cada venta
    // Si hay múltiples ventas, distribuir el monto total proporcionalmente
    const totalVentasPendientes = cobroData.ventas.reduce((sum, venta) => 
      sum + (Number(venta.montoPendiente) || 0), 0
    );

    console.log('Total ventas pendientes:', totalVentasPendientes);
    console.log('Monto total a pagar:', montos.montoTotal);

    // Preparar la distribución de pagos
    const distribucionPagos = cobroData.ventas.map(venta => {
      const montoPendiente = Number(venta.montoPendiente) || 0;
      
      // Si el monto total a pagar es igual al total pendiente, se paga completo
      // Si no, se distribuye proporcionalmente
      const montoPagado = totalVentasPendientes === montos.montoTotal 
        ? montoPendiente 
        : (montoPendiente / totalVentasPendientes) * montos.montoTotal;

      return {
        ventaId: venta._id,
        montoPagado: Number(montoPagado.toFixed(2)),
        montoOriginal: Number(venta.montoTotal) || 0,
        montoPendiente: Number((montoPendiente - montoPagado).toFixed(2))
      };
    });

    // Preparar datos para enviar al backend
    const dataToSend = {
      ventas: distribucionPagos.map(d => ({
        ventaId: d.ventaId,
        montoPagado: d.montoPagado
      })),
      distribucionPagos,
      ...montos,
      descripcion: cobroData.descripcion || '',
      fechaCobro: cobroData.fechaCobro
    };

    console.log('Enviando datos al backend:', dataToSend);
    const response = await api.post('/api/cobros', dataToSend);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al crear el cobro');
    }
    
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error al crear el cobro');
  }
};

export const getPaymentHistory = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/cobros/historial?page=${page}&limit=${limit}`);
    return {
      pagos: response.data.cobros || [],
      total: response.data.total || 0,
      currentPage: response.data.currentPage || 1,
      totalPages: response.data.totalPages || 1
    };
  } catch (error) {
    handleApiError(error, 'Error al obtener el historial de pagos');
  }
};

export const getCobrosHistorial = async (page = 1, limit = 10) => {
  try {
    console.log('Obteniendo historial de cobros...');
    const response = await api.get('/api/cobros', {
      params: { page, limit }
    });
    
    return {
      cobros: response.data.cobros || [],
      currentPage: response.data.currentPage || 1,
      totalPages: response.data.totalPages || 1,
      total: response.data.total || 0,
      totalCobros: response.data.total || 0
    };
  } catch (error) {
    handleApiError(error, 'Error al obtener el historial de cobros');
  }
};

export const procesarPagoVenta = async (ventaId, datoPago) => {
  try {
    // Validar que se incluya la fecha de cobro
    if (!datoPago.fechaCobro) {
      throw new Error('La fecha de cobro es requerida');
    }

    // Validar montos
    const montos = validateMontos({
      yape: datoPago.yape,
      efectivo: datoPago.efectivo,
      gastosImprevistos: datoPago.gastosImprevistos
    });

    console.log('Montos validados:', montos);

    // Preparar datos para el cobro
    const cobroData = {
      ventas: [{
        ventaId,
        montoPagado: montos.montoTotal // Este es el monto que se está pagando
      }],
      distribucionPagos: [{
        ventaId,
        montoPagado: montos.montoTotal, // Monto que se está pagando
        montoOriginal: montos.montoTotal, // Para este caso, será el mismo
        montoPendiente: 0 // Se está pagando completo
      }],
      ...montos,
      descripcion: datoPago.descripcion || '',
      fechaCobro: datoPago.fechaCobro // Incluir la fecha de cobro
    };

    console.log('Procesando pago de venta:', cobroData);
    const response = await api.post('/api/cobros', cobroData);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al procesar el pago');
    }
    
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error al procesar el pago de la venta');
  }
};

export const deleteCobro = async (cobroId) => {
  try {
    if (!cobroId) throw new Error('ID de cobro no proporcionado');
    const response = await api.delete(`/api/cobros/${cobroId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error al eliminar el cobro');
  }
};
