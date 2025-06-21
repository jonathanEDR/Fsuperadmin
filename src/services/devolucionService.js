import api from './api';

export const getDevoluciones = async () => {
  try {
    const response = await api.get('/api/devoluciones');
    return response.data;
  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    throw error;
  }
};

export const getDevolucion = async (id) => {
  try {
    const response = await api.get(`/api/devoluciones/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener devolución:', error);
    throw error;
  }
};

export const createDevolucion = async (devolucionData) => {
  try {
    const response = await api.post('/api/devoluciones', devolucionData);
    return response.data;
  } catch (error) {
    console.error('Error al crear devolución:', error);
    throw error;
  }
};

export const updateDevolucion = async (id, devolucionData) => {
  try {
    const response = await api.put(`/api/devoluciones/${id}`, devolucionData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar devolución:', error);
    throw error;
  }
};

export const deleteDevolucion = async (id) => {
  try {
    const response = await api.delete(`/api/devoluciones/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar devolución:', error);
    throw error;
  }
};