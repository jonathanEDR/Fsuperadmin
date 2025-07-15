import axios from 'axios';

const API = '/api/inventario';

export const getInventario = () => axios.get(API);
export const agregarStock = (codigoCatalogo, cantidad) => axios.post(`${API}/ingreso`, { codigoCatalogo, cantidad });
export const registrarVenta = (inventarioId, cantidad) => axios.post(`${API}/venta`, { inventarioId, cantidad });
export const registrarDevolucion = (inventarioId, cantidad) => axios.post(`${API}/devolucion`, { inventarioId, cantidad });
export const getMovimientos = (inventarioId) => axios.get(`${API}/${inventarioId}/movimientos`);
