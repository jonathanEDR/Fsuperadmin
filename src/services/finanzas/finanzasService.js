import api from '../api';
import cuentasBancariasService from './cuentasBancariasService';
import prestamosService from './prestamosService';
import movimientosCajaService from './movimientosCajaService';

/**
 * Servicio principal de finanzas - COORDINADOR
 * Maneja el dashboard, resúmenes generales y coordina entre módulos especializados
 * NO duplica funcionalidades, solo orquesta y provee datos generales
 */
class FinanzasService {
    
    // ==================== DASHBOARD Y RESUMEN GENERAL ====================
    
    /**
     * Obtener resumen financiero general (dashboard principal)
     */
    static async obtenerResumen() {
        try {
            const response = await api.get('/api/finanzas/resumen');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo resumen financiero:', error);
            throw error;
        }
    }
    
    /**
     * Obtener flujo de caja consolidado
     */
    static async obtenerFlujoCaja(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`/api/finanzas/flujo-caja?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo flujo de caja:', error);
            throw error;
        }
    }
    
    /**
     * Obtener proyecciones financieras
     */
    static async obtenerProyecciones(meses = 12) {
        try {
            const response = await api.get(`/api/finanzas/proyecciones?meses=${meses}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo proyecciones:', error);
            throw error;
        }
    }
    
    /**
     * Obtener KPIs financieros principales
     */
    static async obtenerKPIs() {
        try {
            const response = await api.get('/api/finanzas/kpis');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo KPIs:', error);
            throw error;
        }
    }
    
    /**
     * Obtener alertas financieras
     */
    static async obtenerAlertas() {
        try {
            const response = await api.get('/api/finanzas/alertas');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo alertas:', error);
            throw error;
        }
    }
    
    // ==================== ORQUESTACIÓN DE MÓDULOS ====================
    
    /**
     * Obtener resumen consolidado de todos los módulos
     */
    static async obtenerResumenCompleto() {
        try {
            const [
                resumenGeneral,
                resumenCuentas,
                resumenPrestamos,
                resumenMovimientos
            ] = await Promise.all([
                this.obtenerResumen(),
                cuentasBancariasService.obtenerResumen(),
                prestamosService.obtenerResumen(),
                movimientosCajaService.obtenerResumenDia()
            ]);
            
            return {
                general: resumenGeneral,
                cuentas: resumenCuentas,
                prestamos: resumenPrestamos,
                movimientos: resumenMovimientos,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error obteniendo resumen completo:', error);
            throw error;
        }
    }
    
    /**
     * Obtener estadísticas financieras por período
     */
    static async obtenerEstadisticasPeriodo(fechaInicio, fechaFin) {
        try {
            const params = new URLSearchParams({
                fechaInicio,
                fechaFin
            });
            
            const response = await api.get(`/api/finanzas/estadisticas-periodo?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas del período:', error);
            throw error;
        }
    }
    
    // ==================== CONFIGURACIÓN GLOBAL ====================
    
    /**
     * Obtener monedas disponibles en el sistema
     */
    static obtenerMonedas() {
        return [
            { value: 'PEN', label: 'Soles (S/)', simbolo: 'S/' },
            { value: 'USD', label: 'Dólares ($)', simbolo: '$' },
            { value: 'EUR', label: 'Euros (€)', simbolo: '€' }
        ];
    }
    
    /**
     * Obtener configuración de módulos financieros
     */
    static obtenerConfiguracionModulos() {
        return {
            cuentasBancarias: {
                habilitado: true,
                tipos: cuentasBancariasService.obtenerTiposCuenta(),
                operaciones: ['depositar', 'retirar', 'transferir']
            },
            prestamos: {
                habilitado: true,
                tipos: prestamosService.obtenerTiposPrestamo(),
                estados: prestamosService.obtenerEstadosPrestamo()
            },
            movimientosCaja: {
                habilitado: true,
                categorias: movimientosCajaService.constructor.formatearCategorias(),
                metodosPago: movimientosCajaService.constructor.formatearMetodosPago()
            }
        };
    }
    
    // ==================== UTILIDADES COMPARTIDAS ====================
    
    /**
     * Formatear moneda con configuración global
     */
    static formatearMoneda(monto, moneda = 'PEN') {
        const simbolos = {
            'PEN': 'S/',
            'USD': '$',
            'EUR': '€'
        };
        
        // Manejar casos donde monto no es un número
        let montoNum;
        if (typeof monto === 'object' && monto !== null) {
            // Si es un objeto, intentar extraer el valor numérico
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
    static formatearPorcentaje(valor) {
        return `${parseFloat(valor || 0).toFixed(2)}%`;
    }
    
    /**
     * Formatear fecha
     */
    static formatearFecha(fecha) {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-PE');
    }
    
    /**
     * Validar fechas de rango
     */
    static validarRangoFechas(fechaInicio, fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        if (inicio > fin) {
            throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
        }
        
        const diferenciaDias = (fin - inicio) / (1000 * 60 * 60 * 24);
        if (diferenciaDias > 365) {
            throw new Error('El rango de fechas no puede ser mayor a un año');
        }
        
        return { fechaInicio: inicio, fechaFin: fin, diferenciaDias };
    }
    
    // ==================== REFERENCIAS A SERVICIOS ESPECIALIZADOS ====================
    
    /**
     * Obtener referencias a servicios especializados
     * Facilita el acceso desde componentes que usan FinanzasService
     */
    static get servicios() {
        return {
            cuentasBancarias: cuentasBancariasService,
            prestamos: prestamosService,
            movimientosCaja: movimientosCajaService
        };
    }
}

export default FinanzasService;

// Exportaciones individuales para compatibilidad con código existente
export const finanzasService = FinanzasService;

// Servicios especializados re-exportados para acceso directo
export { 
    cuentasBancariasService,
    prestamosService, 
    movimientosCajaService
};
