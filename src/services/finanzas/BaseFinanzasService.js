import api from '../api';

/**
 * Servicio base para operaciones CRUD comunes del módulo de finanzas
 * Implementa el patrón Template Method para reutilización de código
 */
class BaseFinanzasService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    
    /**
     * Obtener todos los elementos con filtros opcionales
     */
    async obtenerTodos(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`${this.baseURL}?${params}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo elementos de ${this.baseURL}:`, error);
            throw error;
        }
    }
    
    /**
     * Obtener elemento por ID
     */
    async obtenerPorId(id) {
        try {
            const response = await api.get(`${this.baseURL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo elemento ${id} de ${this.baseURL}:`, error);
            throw error;
        }
    }
    
    /**
     * Crear nuevo elemento
     */
    async crear(datos) {
        try {
            const response = await api.post(this.baseURL, datos);
            return response.data;
        } catch (error) {
            console.error(`Error creando elemento en ${this.baseURL}:`, error);
            throw error;
        }
    }
    
    /**
     * Actualizar elemento existente
     */
    async actualizar(id, datos) {
        try {
            const response = await api.put(`${this.baseURL}/${id}`, datos);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando elemento ${id} en ${this.baseURL}:`, error);
            throw error;
        }
    }
    
    /**
     * Eliminar elemento
     */
    async eliminar(id) {
        try {
            const response = await api.delete(`${this.baseURL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error eliminando elemento ${id} de ${this.baseURL}:`, error);
            throw error;
        }
    }
    
    /**
     * Método helper para manejar acciones específicas
     */
    async ejecutarAccion(id, accion, datos = {}) {
        try {
            const response = await api.post(`${this.baseURL}/${id}/${accion}`, datos);
            return response.data;
        } catch (error) {
            console.error(`Error ejecutando acción ${accion} en elemento ${id}:`, error);
            throw error;
        }
    }
    
    /**
     * Obtener elementos relacionados
     */
    async obtenerRelacionados(id, relacion, filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`${this.baseURL}/${id}/${relacion}?${params}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo ${relacion} del elemento ${id}:`, error);
            throw error;
        }
    }
}

export default BaseFinanzasService;
