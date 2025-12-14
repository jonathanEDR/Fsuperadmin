import api from './api';

// Obtener todas las sucursales activas
export const getSucursalesActivas = async () => {
  try {
    const response = await api.get('/api/sucursales/activas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener sucursales activas:', error);
    throw error;
  }
};

// Obtener todas las sucursales (incluidas inactivas)
export const getAllSucursales = async () => {
  try {
    const response = await api.get('/api/sucursales');
    return response.data;
  } catch (error) {
    console.error('Error al obtener todas las sucursales:', error);
    throw error;
  }
};

// Crear nueva sucursal
export const createSucursal = async (sucursalData) => {
  try {
    const response = await api.post('/api/sucursales', sucursalData);
    return response.data;
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    throw error;
  }
};

// Actualizar sucursal
export const updateSucursal = async (sucursalId, sucursalData) => {
  try {
    const response = await api.put(`/api/sucursales/${sucursalId}`, sucursalData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    throw error;
  }
};

// Eliminar (desactivar) sucursal
export const deleteSucursal = async (sucursalId) => {
  try {
    const response = await api.delete(`/api/sucursales/${sucursalId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar sucursal:', error);
    throw error;
  }
};

// Obtener sucursal por ID
export const getSucursalById = async (sucursalId) => {
  try {
    const response = await api.get(`/api/sucursales/${sucursalId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener sucursal:', error);
    throw error;
  }
};
