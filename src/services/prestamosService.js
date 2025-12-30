import api from './api';

/**
 * Servicio específico para préstamos
 * Maneja todas las operaciones CRUD y cálculos relacionados con préstamos
 */
class PrestamosService {
    // ==================== OPERACIONES CRUD ====================
    
    /**
     * Obtener todos los préstamos
     */
    static async obtenerTodos(filtros = {}) {
        try {
            const params = new URLSearchParams();
            
            // Agregar filtros a los parámetros
            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
                    params.append(key, filtros[key]);
                }
            });
            
            const response = await api.get(`/api/prestamos?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo préstamos:', error);
            throw error;
        }
    }
    
    /**
     * Obtener préstamo por ID
     */
    static async obtenerPorId(id) {
        try {
            const response = await api.get(`/api/prestamos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Crear nuevo préstamo
     */
    static async crear(datos) {
        try {
            const response = await api.post('/api/prestamos', datos);
            return response.data;
        } catch (error) {
            console.error('Error creando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Actualizar préstamo existente
     */
    static async actualizar(id, datos) {
        try {
            const response = await api.put(`/api/prestamos/${id}`, datos);
            return response.data;
        } catch (error) {
            console.error('Error actualizando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Eliminar préstamo
     */
    static async eliminar(id) {
        try {
            const response = await api.delete(`/api/prestamos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error eliminando préstamo:', error);
            throw error;
        }
    }
    
    // ==================== OPERACIONES ESPECIALES ====================
    
    /**
     * Aprobar préstamo
     */
    static async aprobar(id, datos) {
        try {
            const response = await api.post(`/api/prestamos/${id}/aprobar`, datos);
            return response.data;
        } catch (error) {
            console.error('Error aprobando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Desembolsar préstamo
     */
    static async desembolsar(id, datos) {
        try {
            const response = await api.post(`/api/prestamos/${id}/desembolsar`, datos);
            return response.data;
        } catch (error) {
            console.error('Error desembolsando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Cancelar préstamo
     */
    static async cancelar(id, datos) {
        try {
            const response = await api.post(`/api/prestamos/${id}/cancelar`, datos);
            return response.data;
        } catch (error) {
            console.error('Error cancelando préstamo:', error);
            throw error;
        }
    }
    
    // ==================== CÁLCULOS Y UTILIDADES ====================
    
    /**
     * Calcular cuota mensual
     */
    static async calcularCuota(datos) {
        try {
            const response = await api.post('/api/prestamos/utilidades/calcular-cuota', datos);
            return response.data;
        } catch (error) {
            console.error('Error calculando cuota:', error);
            throw error;
        }
    }
    
    /**
     * Obtener tabla de amortización
     */
    static async obtenerTablaAmortizacion(id) {
        try {
            const response = await api.get(`/api/prestamos/${id}/tabla-amortizacion`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo tabla de amortización:', error);
            throw error;
        }
    }
    
    /**
     * Generar tabla de amortización con parámetros
     */
    static async generarTablaAmortizacion(datos) {
        try {
            const response = await api.post('/api/prestamos/utilidades/generar-amortizacion', datos);
            return response.data;
        } catch (error) {
            console.error('Error generando tabla de amortización:', error);
            throw error;
        }
    }
    
    // ==================== PRÉSTAMOS A EXTERNOS/TRABAJADORES ====================

    /**
     * Obtener lista de trabajadores disponibles para préstamos
     */
    static async obtenerTrabajadoresDisponibles(filtros = {}) {
        try {
            const params = new URLSearchParams();
            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
                    params.append(key, filtros[key]);
                }
            });
            const response = await api.get(`/api/prestamos/externos/trabajadores?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo trabajadores disponibles:', error);
            throw error;
        }
    }

    /**
     * Obtener información completa de un trabajador
     */
    static async obtenerInfoTrabajador(trabajadorId) {
        try {
            const response = await api.get(`/api/prestamos/externos/trabajador/${trabajadorId}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo información del trabajador:', error);
            throw error;
        }
    }

    /**
     * Calcular capacidad de endeudamiento de un trabajador
     */
    static async calcularCapacidadEndeudamiento(trabajadorId) {
        try {
            const response = await api.get(`/api/prestamos/externos/trabajador/${trabajadorId}/capacidad`);
            return response.data;
        } catch (error) {
            console.error('Error calculando capacidad de endeudamiento:', error);
            throw error;
        }
    }

    /**
     * Validar si un prestatario puede recibir un préstamo
     */
    static async validarPrestatario(datos) {
        try {
            const response = await api.post('/api/prestamos/externos/validar-prestatario', datos);
            return response.data;
        } catch (error) {
            console.error('Error validando prestatario:', error);
            throw error;
        }
    }

    /**
     * Calcular descuento de nómina para un préstamo
     */
    static async calcularDescuentoNomina(datos) {
        try {
            const response = await api.post('/api/prestamos/externos/calcular-descuento', datos);
            return response.data;
        } catch (error) {
            console.error('Error calculando descuento de nómina:', error);
            throw error;
        }
    }

    /**
     * Obtener préstamos filtrados por tipo de prestatario
     */
    static async obtenerPrestamosPorTipo(tipo = 'todos', limite = 50, pagina = 1) {
        try {
            const response = await api.get(`/api/prestamos/externos/por-tipo?tipo=${tipo}&limite=${limite}&pagina=${pagina}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo préstamos por tipo:', error);
            throw error;
        }
    }

    /**
     * Obtener resumen de préstamos a trabajadores
     */
    static async obtenerResumenTrabajadores() {
        try {
            const response = await api.get('/api/prestamos/externos/resumen-trabajadores');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo resumen de trabajadores:', error);
            throw error;
        }
    }

    /**
     * Obtener tipos de prestatario disponibles
     */
    static async obtenerTiposPrestatario() {
        try {
            const response = await api.get('/api/prestamos/externos/tipos-prestatario');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo tipos de prestatario:', error);
            // Retornar valores por defecto en caso de error
            return {
                success: true,
                data: [
                    { value: 'particular', label: 'Particular' },
                    { value: 'trabajador', label: 'Trabajador/Empleado' },
                    { value: 'proveedor', label: 'Proveedor' },
                    { value: 'cliente', label: 'Cliente' },
                    { value: 'interno', label: 'Interno' },
                    { value: 'otro', label: 'Otro' }
                ]
            };
        }
    }

    // ==================== REPORTES Y ESTADÍSTICAS ====================

    /**
     * Obtener resumen de préstamos
     */
    static async obtenerResumen(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`/api/prestamos/resumen?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo resumen de préstamos:', error);
            throw error;
        }
    }
    
    /**
     * Obtener estadísticas de préstamos
     */
    static async obtenerEstadisticas(periodo = 'mensual') {
        try {
            const response = await api.get(`/api/prestamos/estadisticas?periodo=${periodo}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }
    
    // ==================== OPCIONES Y CONFIGURACIÓN ====================
    
    /**
     * Obtener tipos de préstamo disponibles
     */
    static obtenerTiposPrestamo() {
        return [
            { value: 'personal', label: 'Personal' },
            { value: 'hipotecario', label: 'Hipotecario' },
            { value: 'vehicular', label: 'Vehicular' },
            { value: 'comercial', label: 'Comercial' },
            { value: 'microempresa', label: 'Microempresa' },
            { value: 'capital_trabajo', label: 'Capital de Trabajo' },
            { value: 'inversion', label: 'Inversión' }
        ];
    }
    
    /**
     * Obtener estados de préstamo disponibles
     */
    static obtenerEstadosPrestamo() {
        return [
            { value: 'aprobado', label: 'Aprobado', color: 'green' },
            { value: 'cancelado', label: 'Cancelado', color: 'gray' }
        ];
    }
    
    /**
     * Obtener tipos de entidad financiera
     */
    static obtenerTiposEntidad() {
        return [
            { value: 'banco', label: 'Banco' },
            { value: 'financiera', label: 'Financiera' },
            { value: 'cooperativa', label: 'Cooperativa' },
            { value: 'prestamista', label: 'Prestamista' },
            { value: 'otro', label: 'Otro' }
        ];
    }
    
    // ==================== UTILIDADES DE FORMATEO ====================
    
    /**
     * Formatear moneda peruana
     */
    static formatearMoneda(monto) {
        return `S/ ${parseFloat(monto || 0).toLocaleString('es-PE', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        })}`;
    }
    
    /**
     * Formatear porcentaje
     */
    static formatearPorcentaje(porcentaje) {
        return `${parseFloat(porcentaje || 0).toFixed(2)}%`;
    }
    
    /**
     * Formatear fecha
     */
    static formatearFecha(fecha) {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-PE');
    }
    
    /**
     * Calcular totales de una lista de préstamos
     */
    static calcularTotales(prestamos) {
        if (!Array.isArray(prestamos) || prestamos.length === 0) {
            return {
                total: 0,
                montoSolicitado: 0,
                montoAprobado: 0,
                montoPendiente: 0,
                montoIntereses: 0
            };
        }
        
        return prestamos.reduce((totales, prestamo) => {
            const montoSolicitado = parseFloat(prestamo.montoSolicitado || 0);
            const montoAprobado = parseFloat(prestamo.montoAprobado || montoSolicitado);
            const montoPagado = parseFloat(prestamo.montoPagado || 0);
            const montoPendiente = Math.max(0, montoAprobado - montoPagado);
            
            // Calcular intereses estimados
            const tasaAnual = parseFloat(prestamo.tasaInteres?.porcentaje || 0) / 100;
            const plazoMeses = prestamo.plazo?.unidad === 'años' ? 
                (parseFloat(prestamo.plazo?.cantidad || 0) * 12) : 
                parseFloat(prestamo.plazo?.cantidad || 0);
            const montoIntereses = montoAprobado * tasaAnual * (plazoMeses / 12);
            
            return {
                total: totales.total + 1,
                montoSolicitado: totales.montoSolicitado + montoSolicitado,
                montoAprobado: totales.montoAprobado + montoAprobado,
                montoPendiente: totales.montoPendiente + montoPendiente,
                montoIntereses: totales.montoIntereses + montoIntereses
            };
        }, {
            total: 0,
            montoSolicitado: 0,
            montoAprobado: 0,
            montoPendiente: 0,
            montoIntereses: 0
        });
    }
}

export default PrestamosService;
