import BaseFinanzasService from './BaseFinanzasService';
import api from '../api';

/**
 * Servicio especializado para gestión de cuentas bancarias
 * Extiende BaseFinanzasService para operaciones CRUD básicas
 * y añade funcionalidades específicas de cuentas bancarias
 */
class CuentasBancariasService extends BaseFinanzasService {
    constructor() {
        super('/api/cuentas-bancarias');
    }
    
    /**
     * Obtener resumen de todas las cuentas bancarias
     */
    async obtenerResumen() {
        try {
            const response = await api.get('/api/cuentas-bancarias/resumen');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo resumen de cuentas bancarias:', error);
            throw error;
        }
    }
    
    /**
     * Realizar depósito en cuenta específica
     */
    async realizarDeposito(id, datos) {
        try {
            return await this.ejecutarAccion(id, 'depositar', datos);
        } catch (error) {
            console.error('Error realizando depósito:', error);
            throw error;
        }
    }
    
    /**
     * Realizar retiro de cuenta específica
     */
    async realizarRetiro(id, datos) {
        try {
            return await this.ejecutarAccion(id, 'retirar', datos);
        } catch (error) {
            console.error('Error realizando retiro:', error);
            throw error;
        }
    }
    
    /**
     * Obtener movimientos de una cuenta específica
     */
    async obtenerMovimientos(id, filtros = {}) {
        try {
            return await this.obtenerRelacionados(id, 'movimientos', filtros);
        } catch (error) {
            console.error('Error obteniendo movimientos:', error);
            throw error;
        }
    }
    
    /**
     * Obtener tipos de cuenta disponibles
     */
    obtenerTiposCuenta() {
        return [
            { value: 'ahorro', label: 'Cuenta de Ahorro' },
            { value: 'corriente', label: 'Cuenta Corriente' },
            { value: 'plazo_fijo', label: 'Plazo Fijo' },
            { value: 'inversion', label: 'Inversión' },
            { value: 'efectivo', label: 'Efectivo' }
        ];
    }
    
    /**
     * Validar datos de cuenta bancaria
     */
    validarDatosCuenta(datos) {
        const errores = [];
        
        if (!datos.nombre || datos.nombre.trim().length < 3) {
            errores.push('El nombre de la cuenta debe tener al menos 3 caracteres');
        }
        
        if (!datos.tipo || !this.obtenerTiposCuenta().find(t => t.value === datos.tipo)) {
            errores.push('Debe seleccionar un tipo de cuenta válido');
        }
        
        if (!datos.moneda) {
            errores.push('Debe especificar la moneda');
        }
        
        if (datos.saldoInicial !== undefined && datos.saldoInicial < 0) {
            errores.push('El saldo inicial no puede ser negativo');
        }
        
        return errores;
    }
    
    /**
     * Formatear datos para mostrar
     */
    formatearCuenta(cuenta) {
        return {
            ...cuenta,
            saldoFormateado: this.formatearMoneda(cuenta.saldo, cuenta.moneda),
            tipoLabel: this.obtenerTiposCuenta().find(t => t.value === cuenta.tipo)?.label || cuenta.tipo
        };
    }
    
    /**
     * Formatear moneda
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
}

// Exportar instancia singleton
export default new CuentasBancariasService();

// También exportar la clase para testing o herencia
export { CuentasBancariasService };
