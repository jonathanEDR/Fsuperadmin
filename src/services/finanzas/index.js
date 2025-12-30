/**
 * Índice principal de servicios de finanzas optimizados
 *
 * NUEVA ARQUITECTURA - MODULAR Y ESCALABLE
 * ===============================================
 *
 * Estructura:
 * - BaseFinanzasService: Servicio base con operaciones CRUD comunes
 * - FinanzasService: Coordinador principal y dashboard
 * - CuentasBancariasService: Gestión especializada de cuentas
 * - PrestamosService: Gestión especializada de préstamos
 * - GarantiasService: Gestión especializada de garantías
 * - MovimientosCajaService: Gestión especializada de movimientos
 *
 * Beneficios:
 * ✅ Separación de responsabilidades (SRP)
 * ✅ Reutilización de código (DRY)
 * ✅ Fácil testing y mantenimiento
 * ✅ Escalabilidad y extensibilidad
 * ✅ Tipado consistente
 */

// ==================== SERVICIO PRINCIPAL ====================
export { default as FinanzasService, finanzasService } from './finanzasService';

// ==================== SERVICIOS ESPECIALIZADOS ====================
export { default as cuentasBancariasService, CuentasBancariasService } from './cuentasBancariasService';
export { default as prestamosService, PrestamosServiceOptimizado } from './prestamosService';
export { default as garantiasService, GarantiasService } from './garantiasService';
export { default as movimientosCajaService, MovimientosCajaServiceOptimizado } from './movimientosCajaService';

// ==================== SERVICIO BASE ====================
export { default as BaseFinanzasService } from './BaseFinanzasService';

// ==================== EXPORTACIÓN POR DEFECTO ====================
// Para mantener compatibilidad con imports existentes
import FinanzasService from './finanzasService';
export default FinanzasService;

// ==================== CONFIGURACIÓN DE SERVICIOS ====================
export const SERVICIOS_CONFIG = {
    version: '2.1.0',
    modulos: {
        cuentasBancarias: 'CuentasBancariasService',
        prestamos: 'PrestamosServiceOptimizado',
        garantias: 'GarantiasService',
        movimientosCaja: 'MovimientosCajaServiceOptimizado',
        coordinador: 'FinanzasService'
    },
    caracteristicas: [
        'Operaciones CRUD optimizadas',
        'Manejo de errores centralizado',
        'Validaciones incorporadas',
        'Formateo de datos consistente',
        'Patrón singleton para performance',
        'Extensibilidad para nuevos módulos',
        'Gestión completa de garantías'
    ]
};

// ==================== UTILIDADES GLOBALES ====================
export const FINANZAS_UTILS = {
    formatearMoneda: FinanzasService.formatearMoneda,
    formatearPorcentaje: FinanzasService.formatearPorcentaje,
    formatearFecha: FinanzasService.formatearFecha,
    validarRangoFechas: FinanzasService.validarRangoFechas,
    obtenerMonedas: FinanzasService.obtenerMonedas
};
