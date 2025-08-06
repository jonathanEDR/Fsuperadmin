import api from './api';

class FinanzasService {
    // ==================== DASHBOARD Y RESUMEN ====================
    
    /**
     * Obtener resumen financiero general
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
     * Obtener flujo de caja
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
     * Obtener KPIs financieros
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
    
    // ==================== CUENTAS BANCARIAS ====================
    
    /**
     * Obtener cuentas bancarias
     */
    static async obtenerCuentasBancarias(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            // Usar la ruta directa de cuentas bancarias
            const response = await api.get(`/api/cuentas-bancarias?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo cuentas bancarias:', error);
            throw error;
        }
    }
    
    /**
     * Obtener resumen de cuentas bancarias
     */
    static async obtenerResumenCuentasBancarias() {
        try {
            const response = await api.get('/api/cuentas-bancarias/resumen');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo resumen de cuentas bancarias:', error);
            throw error;
        }
    }

    /**
     * Obtener cuenta bancaria por ID
     */
    static async obtenerCuentaBancaria(id) {
        try {
            const response = await api.get(`/api/cuentas-bancarias/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo cuenta bancaria:', error);
            throw error;
        }
    }
    
    /**
     * Crear cuenta bancaria
     */
    static async crearCuentaBancaria(datos) {
        try {
            // Usar la ruta directa de cuentas bancarias
            const response = await api.post('/api/cuentas-bancarias', datos);
            return response.data;
        } catch (error) {
            console.error('Error creando cuenta bancaria:', error);
            throw error;
        }
    }
    
    /**
     * Actualizar cuenta bancaria
     */
    static async actualizarCuentaBancaria(id, datos) {
        try {
            const response = await api.put(`/api/cuentas-bancarias/${id}`, datos);
            return response.data;
        } catch (error) {
            console.error('Error actualizando cuenta bancaria:', error);
            throw error;
        }
    }
    
    /**
     * Eliminar cuenta bancaria
     */
    static async eliminarCuentaBancaria(id) {
        try {
            const response = await api.delete(`/api/cuentas-bancarias/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error eliminando cuenta bancaria:', error);
            throw error;
        }
    }
    
    /**
     * Realizar depósito
     */
    static async realizarDeposito(id, datos) {
        try {
            const response = await api.post(`/api/cuentas-bancarias/${id}/depositar`, datos);
            return response.data;
        } catch (error) {
            console.error('Error realizando depósito:', error);
            throw error;
        }
    }
    
    /**
     * Realizar retiro
     */
    static async realizarRetiro(id, datos) {
        try {
            const response = await api.post(`/api/cuentas-bancarias/${id}/retirar`, datos);
            return response.data;
        } catch (error) {
            console.error('Error realizando retiro:', error);
            throw error;
        }
    }
    
    /**
     * Obtener movimientos de cuenta
     */
    static async obtenerMovimientosCuenta(id, filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`/api/cuentas-bancarias/${id}/movimientos?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo movimientos:', error);
            throw error;
        }
    }

    /**
     * Obtener cuenta bancaria por ID (alias para compatibilidad)
     */
    static async obtenerCuentaBancariaPorId(id) {
        return await this.obtenerCuentaBancaria(id);
    }

    /**
     * Obtener movimientos bancarios (alias para compatibilidad)
     */
    static async obtenerMovimientosBancarios(cuentaId, filtros = {}) {
        return await this.obtenerMovimientosCuenta(cuentaId, filtros);
    }
    
    // ==================== PRÉSTAMOS ====================
    
    /**
     * Obtener préstamos
     */
    static async obtenerPrestamos(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`/finanzas/prestamos?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo préstamos:', error);
            throw error;
        }
    }
    
    /**
     * Obtener préstamo por ID
     */
    static async obtenerPrestamo(id) {
        try {
            const response = await api.get(`/finanzas/prestamos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Crear préstamo
     */
    static async crearPrestamo(datos) {
        try {
            const response = await api.post('/finanzas/prestamos', datos);
            return response.data;
        } catch (error) {
            console.error('Error creando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Actualizar préstamo
     */
    static async actualizarPrestamo(id, datos) {
        try {
            const response = await api.put(`/finanzas/prestamos/${id}`, datos);
            return response.data;
        } catch (error) {
            console.error('Error actualizando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Eliminar préstamo
     */
    static async eliminarPrestamo(id) {
        try {
            const response = await api.delete(`/finanzas/prestamos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error eliminando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Aprobar préstamo
     */
    static async aprobarPrestamo(id, datos) {
        try {
            const response = await api.post(`/finanzas/prestamos/${id}/aprobar`, datos);
            return response.data;
        } catch (error) {
            console.error('Error aprobando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Desembolsar préstamo
     */
    static async desembolsarPrestamo(id, datos) {
        try {
            const response = await api.post(`/finanzas/prestamos/${id}/desembolsar`, datos);
            return response.data;
        } catch (error) {
            console.error('Error desembolsando préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Obtener tabla de amortización
     */
    static async obtenerTablaAmortizacion(id) {
        try {
            const response = await api.get(`/finanzas/prestamos/${id}/tabla-amortizacion`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo tabla de amortización:', error);
            throw error;
        }
    }
    
    /**
     * Calcular cuota mensual
     */
    static async calcularCuota(datos) {
        try {
            const response = await api.post('/finanzas/prestamos/utilidades/calcular-cuota', datos);
            return response.data;
        } catch (error) {
            console.error('Error calculando cuota:', error);
            throw error;
        }
    }

    /**
     * Obtener préstamo por ID
     */
    static async obtenerPrestamoPorId(id) {
        try {
            const response = await api.get(`/finanzas/prestamos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo préstamo por ID:', error);
            throw error;
        }
    }
    
    // ==================== PAGOS DE FINANCIAMIENTO ====================
    
    /**
     * Obtener pagos de financiamiento
     */
    static async obtenerPagosFinanciamiento(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`/finanzas/pagos-financiamiento?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo pagos:', error);
            throw error;
        }
    }
    
    /**
     * Registrar pago
     */
    static async registrarPago(datos) {
        try {
            const response = await api.post('/finanzas/pagos-financiamiento', datos);
            return response.data;
        } catch (error) {
            console.error('Error registrando pago:', error);
            throw error;
        }
    }
    
    /**
     * Obtener pagos de un préstamo
     */
    static async obtenerPagosPrestamo(prestamoId, filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`/finanzas/pagos-financiamiento/prestamo/${prestamoId}?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo pagos del préstamo:', error);
            throw error;
        }
    }
    
    /**
     * Obtener pagos vencidos
     */
    static async obtenerPagosVencidos() {
        try {
            const response = await api.get('/finanzas/pagos-financiamiento/vencidos');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo pagos vencidos:', error);
            throw error;
        }
    }

    /**
     * Crear pago de financiamiento
     */
    static async crearPagoFinanciamiento(datos) {
        try {
            const response = await api.post('/finanzas/pagos-financiamiento', datos);
            return response.data;
        } catch (error) {
            console.error('Error creando pago de financiamiento:', error);
            throw error;
        }
    }

    /**
     * Actualizar pago de financiamiento
     */
    static async actualizarPagoFinanciamiento(id, datos) {
        try {
            const response = await api.put(`/finanzas/pagos-financiamiento/${id}`, datos);
            return response.data;
        } catch (error) {
            console.error('Error actualizando pago de financiamiento:', error);
            throw error;
        }
    }

    /**
     * Eliminar pago de financiamiento
     */
    static async eliminarPagoFinanciamiento(id) {
        try {
            const response = await api.delete(`/finanzas/pagos-financiamiento/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error eliminando pago de financiamiento:', error);
            throw error;
        }
    }

    /**
     * Obtener pago de financiamiento por ID
     */
    static async obtenerPagoFinanciamientoPorId(id) {
        try {
            const response = await api.get(`/finanzas/pagos-financiamiento/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo pago de financiamiento por ID:', error);
            throw error;
        }
    }
    
    // ==================== GARANTÍAS ====================
    
    /**
     * Obtener garantías
     */
    static async obtenerGarantias(filtros = {}) {
        try {
            const params = new URLSearchParams(filtros);
            const response = await api.get(`/finanzas/garantias?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo garantías:', error);
            throw error;
        }
    }
    
    /**
     * Crear garantía
     */
    static async crearGarantia(datos) {
        try {
            const response = await api.post('/finanzas/garantias', datos);
            return response.data;
        } catch (error) {
            console.error('Error creando garantía:', error);
            throw error;
        }
    }
    
    /**
     * Aprobar garantía
     */
    static async aprobarGarantia(id, datos) {
        try {
            const response = await api.post(`/finanzas/garantias/${id}/aprobar`, datos);
            return response.data;
        } catch (error) {
            console.error('Error aprobando garantía:', error);
            throw error;
        }
    }
    
    /**
     * Obtener garantías de un préstamo
     */
    static async obtenerGarantiasPrestamo(prestamoId) {
        try {
            const response = await api.get(`/finanzas/garantias/prestamo/${prestamoId}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo garantías del préstamo:', error);
            throw error;
        }
    }

    /**
     * Obtener garantía por ID
     */
    static async obtenerGarantiaPorId(id) {
        try {
            const response = await api.get(`/finanzas/garantias/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo garantía por ID:', error);
            throw error;
        }
    }

    /**
     * Actualizar garantía
     */
    static async actualizarGarantia(id, datos) {
        try {
            const response = await api.put(`/finanzas/garantias/${id}`, datos);
            return response.data;
        } catch (error) {
            console.error('Error actualizando garantía:', error);
            throw error;
        }
    }

    /**
     * Eliminar garantía
     */
    static async eliminarGarantia(id) {
        try {
            const response = await api.delete(`/finanzas/garantias/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error eliminando garantía:', error);
            throw error;
        }
    }
    
    // ==================== UTILIDADES ====================
    
    /**
     * Obtener tipos de cuenta
     */
    static obtenerTiposCuenta() {
        return [
            { value: 'ahorro', label: 'Cuenta de Ahorro' },
            { value: 'corriente', label: 'Cuenta Corriente' },
            { value: 'plazo_fijo', label: 'Plazo Fijo' },
            { value: 'inversion', label: 'Inversión' },
            { value: 'efectivo', label: 'Efectivo' }
        ];
    }
    
    /**
     * Obtener monedas disponibles
     */
    static obtenerMonedas() {
        return [
            { value: 'PEN', label: 'Soles (S/)', simbolo: 'S/' },
            { value: 'USD', label: 'Dólares ($)', simbolo: '$' },
            { value: 'EUR', label: 'Euros (€)', simbolo: '€' }
        ];
    }
    
    /**
     * Obtener tipos de préstamo
     */
    static obtenerTiposPrestamo() {
        return [
            { value: 'personal', label: 'Préstamo Personal' },
            { value: 'hipotecario', label: 'Préstamo Hipotecario' },
            { value: 'vehicular', label: 'Préstamo Vehicular' },
            { value: 'comercial', label: 'Préstamo Comercial' },
            { value: 'microempresa', label: 'Microempresa' },
            { value: 'capital_trabajo', label: 'Capital de Trabajo' }
        ];
    }
    
    /**
     * Obtener estados de préstamo
     */
    static obtenerEstadosPrestamo() {
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
     * Formatear moneda
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
        return `${valor.toFixed(2)}%`;
    }
}

export default FinanzasService;

// Exportaciones individuales para uso específico
export const finanzasService = FinanzasService;
export const cuentasBancariasService = {
    obtenerTodos: FinanzasService.obtenerCuentasBancarias,
    crear: FinanzasService.crearCuentaBancaria,
    actualizar: FinanzasService.actualizarCuentaBancaria,
    eliminar: FinanzasService.eliminarCuentaBancaria,
    obtenerPorId: FinanzasService.obtenerCuentaBancariaPorId,
    obtenerMovimientos: FinanzasService.obtenerMovimientosBancarios,
    realizarDeposito: FinanzasService.realizarDeposito,
    realizarRetiro: FinanzasService.realizarRetiro
};

export const prestamosService = {
    obtenerTodos: FinanzasService.obtenerPrestamos,
    crear: FinanzasService.crearPrestamo,
    actualizar: FinanzasService.actualizarPrestamo,
    eliminar: FinanzasService.eliminarPrestamo,
    obtenerPorId: FinanzasService.obtenerPrestamoPorId
};

export const pagosFinanciamientoService = {
    obtenerTodos: FinanzasService.obtenerPagosFinanciamiento,
    crear: FinanzasService.crearPagoFinanciamiento,
    actualizar: FinanzasService.actualizarPagoFinanciamiento,
    eliminar: FinanzasService.eliminarPagoFinanciamiento,
    obtenerPorId: FinanzasService.obtenerPagoFinanciamientoPorId
};

export const garantiasService = {
    obtenerTodos: FinanzasService.obtenerGarantias,
    crear: FinanzasService.crearGarantia,
    actualizar: FinanzasService.actualizarGarantia,
    eliminar: FinanzasService.eliminarGarantia,
    obtenerPorId: FinanzasService.obtenerGarantiaPorId
};
