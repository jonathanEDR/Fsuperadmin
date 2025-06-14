// Servicio para gestionar las ventas
import api from './api';

// Actualizar el estado de completado de una venta
export const updateVentaCompletion = async (ventaId, action) => {
  try {
    const response = await api.post(`/ventas/${ventaId}/completion`, {
      completionStatus: action,
      isCompleted: action === 'approved',
      completionDate: new Date().toISOString(),
      completionNotes: action === 'approved' ? 'Venta aprobada' : 'Venta rechazada'
    });

    if (!response.data) {
      throw new Error('No se recibieron datos del servidor');
    }
    
    return response.data;
  } catch (error) {
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un error
      throw new Error(error.response.data.message || 'Error al actualizar estado de venta');
    } else if (error.request) {
      // No se pudo contactar al servidor
      throw new Error('No se pudo conectar con el servidor');
    } else {
      // Error en la configuración de la petición
      throw new Error(error.message || 'Error al actualizar estado de venta');
    }
  }
};
