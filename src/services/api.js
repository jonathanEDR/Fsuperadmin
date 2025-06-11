import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true   // Permite enviar cookies junto con cada petición
});

export default api;

// Obtener todos los productos (inventario)
export const getProductos = async () => {
  try {
    const response = await api.get('/productos');  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

// Crear un nuevo producto (registrar producto)
export const createProducto = async (producto) => {
  try {
    const response = await api.post('/productos', producto);  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al agregar producto:', error);
    throw error;
  }
};
