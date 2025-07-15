import axios from 'axios';

const API = '/api/productos';

export const getCatalogo = () => axios.get(API);
export const crearProductoCatalogo = (data) => axios.post(API, data);
