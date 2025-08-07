import BaseFinanzasService from './BaseFinanzasService';
import api from '../api';

/**
 * Servicio especializado para gestión de préstamos
 * Extiende BaseFinanzasService y añade funcionalidades específicas de préstamos
 * Incluye cálculos financieros, tabla de amortización y reportes
 */
class PrestamosServiceOptimizado extends BaseFinanzasService {
    constructor() {
        super('/api/prestamos');
    }
    
    // ==================== OPERACIONES ESPECÍFICAS DE PRÉSTAMOS ====================
    
    /**
     * Aprobar préstamo
     */
    async aprobar(id, datos) {
        try {
            return await this.ejecutarAccion(id, 'aprobar', datos);
        } catch (error) {
            console.error('Error aprobando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Desembolsar préstamo
     */
    async desembolsar(id, datos) {
        try {
            return await this.ejecutarAccion(id, 'desembolsar', datos);
        } catch (error) {
            console.error('Error desembolsando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Cancelar préstamo
     */
    async cancelar(id, datos) {
        try {
            return await this.ejecutarAccion(id, 'cancelar', datos);
        } catch (error) {
            console.error('Error cancelando préstamo:', error);
            throw error;
        }
    }
    
    // ==================== CÁLCULOS FINANCIEROS ====================
    
    /**
     * Calcular cuota mensual
     */
    async calcularCuota(datos) {
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
    async obtenerTablaAmortizacion(id) {
        try {
            return await this.obtenerRelacionados(id, 'tabla-amortizacion');
        } catch (error) {
            console.error('Error obteniendo tabla de amortización:', error);
            throw error;
        }
    }
    
    /**
     * Generar tabla de amortización con parámetros
     */
    async generarTablaAmortizacion(datos) {
        try {
            const response = await api.post('/api/prestamos/utilidades/generar-amortizacion', datos);
            return response.data;
        } catch (error) {
            console.error('Error generando tabla de amortización:', error);
            throw error;
        }
    }
    
    // ==================== REPORTES Y ESTADÍSTICAS ====================
    
    /**
     * Obtener resumen de préstamos
     */
    async obtenerResumen(filtros = {}) {
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
    async obtenerEstadisticas(periodo = 'mensual') {
        try {
            const response = await api.get(`/api/prestamos/estadisticas?periodo=${periodo}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }
    
    // ==================== CONFIGURACIÓN Y OPCIONES ====================
    
    /**
     * Obtener tipos de préstamo disponibles
     */
    obtenerTiposPrestamo() {
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
    obtenerEstadosPrestamo() {
        return [
            { value: 'solicitado', label: 'Solicitado', color: 'yellow' },
            { value: 'en_evaluacion', label: 'En Evaluación', color: 'blue' },
            { value: 'aprobado', label: 'Aprobado', color: 'green' },
            { value: 'rechazado', label: 'Rechazado', color: 'red' },
            { value: 'desembolsado', label: 'Desembolsado', color: 'green' },
            { value: 'vigente', label: 'Vigente', color: 'green' },
            { value: 'vencido', label: 'Vencido', color: 'red' },
            { value: 'cancelado', label: 'Cancelado', color: 'gray' }
        ];
    }
    
    /**
     * Obtener tipos de entidad financiera
     */
    obtenerTiposEntidad() {
        return [
            { value: 'banco', label: 'Banco' },
            { value: 'financiera', label: 'Financiera' },
            { value: 'cooperativa', label: 'Cooperativa' },
            { value: 'prestamista', label: 'Prestamista' },
            { value: 'otro', label: 'Otro' }
        ];
    }
    
    // ==================== UTILIDADES Y FORMATEO ====================
    
    /**
     * Formatear moneda peruana
     */
    formatearMoneda(monto, moneda = 'PEN') {
        const simbolos = {
            'PEN': 'S/',
            'USD': '$',
            'EUR': '€'
        };
        
        let montoNum;
        if (typeof monto === 'object' && monto !== null) {
            montoNum = monto.value || monto.amount || monto.saldo || 0;
        } else {
            montoNum = parseFloat(monto) || 0;
        }
        
        return `${simbolos[moneda] || 'S/'} ${montoNum.toLocaleString('es-PE', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        })}`;
    }
    
    /**
     * Formatear porcentaje
     */
    formatearPorcentaje(valor) {
        return `${parseFloat(valor || 0).toFixed(2)}%`;
    }
    
    /**
     * Formatear fecha
     */
    formatearFecha(fecha) {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-PE');
    }
    
    /**
     * Calcular totales de una lista de préstamos
     */
    calcularTotales(prestamos) {
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
    
    /**
     * Validar datos de préstamo
     */
    validarDatosPrestamo(datos) {
        const errores = [];
        
        if (!datos.clienteNombre || datos.clienteNombre.trim().length < 3) {
            errores.push('El nombre del cliente debe tener al menos 3 caracteres');
        }
        
        if (!datos.tipo || !this.obtenerTiposPrestamo().find(t => t.value === datos.tipo)) {
            errores.push('Debe seleccionar un tipo de préstamo válido');
        }
        
        if (!datos.montoSolicitado || datos.montoSolicitado <= 0) {
            errores.push('El monto solicitado debe ser mayor a 0');
        }
        
        if (!datos.tasaInteres || datos.tasaInteres <= 0) {
            errores.push('La tasa de interés debe ser mayor a 0');
        }
        
        if (!datos.plazo || datos.plazo <= 0) {
            errores.push('El plazo debe ser mayor a 0');
        }
        
        return errores;
    }
}

// Exportar instancia singleton
export default new PrestamosServiceOptimizado();

// También exportar la clase para testing o herencia
export { PrestamosServiceOptimizado };
