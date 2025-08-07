import api from './api';

class MovimientosCajaService {
    
    // === REGISTRAR MOVIMIENTOS ===
    
    async registrarIngreso(data) {
        try {
            console.log('💰 Frontend: Registrando ingreso:', data);
            const response = await api.post('/api/movimientos-caja/ingreso', data);
            return response.data;
        } catch (error) {
            console.error('❌ Error registrando ingreso:', error);
            throw this.handleError(error);
        }
    }
    
    async registrarEgreso(data) {
        try {
            console.log('💸 Frontend: Registrando egreso:', data);
            const response = await api.post('/api/movimientos-caja/egreso', data);
            return response.data;
        } catch (error) {
            console.error('❌ Error registrando egreso:', error);
            throw this.handleError(error);
        }
    }
    
    // === CONSULTAS ===
    
    async obtenerResumenDia(fecha = null) {
        try {
            const params = fecha ? { fecha } : {};
            const response = await api.get('/api/movimientos-caja/resumen-dia', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo resumen del día:', error);
            throw this.handleError(error);
        }
    }
    
    async obtenerMovimientos(filtros = {}) {
        try {
            const response = await api.get('/api/movimientos-caja/movimientos', { 
                params: filtros 
            });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo movimientos:', error);
            throw this.handleError(error);
        }
    }
    
    async obtenerArqueo(fecha = null) {
        try {
            const params = fecha ? { fecha } : {};
            const response = await api.get('/api/movimientos-caja/arqueo', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo arqueo:', error);
            throw this.handleError(error);
        }
    }
    
    async obtenerEstadisticasMetodosPago(fechaInicio = null, fechaFin = null) {
        try {
            const params = {};
            if (fechaInicio) params.fechaInicio = fechaInicio;
            if (fechaFin) params.fechaFin = fechaFin;
            
            const response = await api.get('/api/movimientos-caja/estadisticas-metodos-pago', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw this.handleError(error);
        }
    }
    
    // === OPERACIONES ESPECIALES ===
    
    async validarMovimiento(id, observaciones = '') {
        try {
            const response = await api.put(`/api/movimientos-caja/${id}/validar`, { observaciones });
            return response.data;
        } catch (error) {
            console.error('❌ Error validando movimiento:', error);
            throw this.handleError(error);
        }
    }
    
    async anularMovimiento(id, motivo) {
        try {
            const response = await api.put(`/api/movimientos-caja/${id}/anular`, { motivo });
            return response.data;
        } catch (error) {
            console.error('❌ Error anulando movimiento:', error);
            throw this.handleError(error);
        }
    }
    
    // === UTILIDADES ===
    
    async obtenerCategorias() {
        try {
            const response = await api.get('/api/movimientos-caja/categorias');
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw this.handleError(error);
        }
    }
    
    async obtenerMetodosPago() {
        try {
            const response = await api.get('/api/movimientos-caja/metodos-pago');
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo métodos de pago:', error);
            throw this.handleError(error);
        }
    }

    // === NUEVOS MÉTODOS PARA INTEGRACIÓN BANCARIA ===

    async obtenerCuentasDisponibles() {
        try {
            const response = await api.get('/api/movimientos-caja/cuentas-disponibles');
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo cuentas disponibles:', error);
            throw this.handleError(error);
        }
    }

    async obtenerMovimientosIntegrados(filtros = {}) {
        try {
            const response = await api.get('/api/movimientos-caja/movimientos-integrados', { params: filtros });
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo movimientos integrados:', error);
            throw this.handleError(error);
        }
    }

    async anularMovimientoIntegrado(id, motivo) {
        try {
            const response = await api.put(`/api/movimientos-caja/${id}/anular-integrado`, { motivo });
            return response.data;
        } catch (error) {
            console.error('❌ Error anulando movimiento integrado:', error);
            throw this.handleError(error);
        }
    }

    async obtenerResumenIntegracion(fechaInicio = null, fechaFin = null) {
        try {
            const params = {};
            if (fechaInicio) params.fechaInicio = fechaInicio;
            if (fechaFin) params.fechaFin = fechaFin;
            
            const response = await api.get('/api/movimientos-caja/resumen-integracion', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo resumen de integración:', error);
            throw this.handleError(error);
        }
    }
    
    // === HELPERS ===
    
    handleError(error) {
        const message = error.response?.data?.message || error.message || 'Error desconocido';
        const status = error.response?.status || 500;
        
        return {
            message,
            status,
            data: error.response?.data
        };
    }
    
    // Calcular total de billetes y monedas
    static calcularTotalEfectivo(billetes, monedas) {
        const totalBilletes = 
            (billetes.b200 || 0) * 200 +
            (billetes.b100 || 0) * 100 +
            (billetes.b50 || 0) * 50 +
            (billetes.b20 || 0) * 20 +
            (billetes.b10 || 0) * 10;
            
        const totalMonedas =
            (monedas.m5 || 0) * 5 +
            (monedas.m2 || 0) * 2 +
            (monedas.m1 || 0) * 1 +
            (monedas.c50 || 0) * 0.5 +
            (monedas.c20 || 0) * 0.2 +
            (monedas.c10 || 0) * 0.1;
            
        return parseFloat((totalBilletes + totalMonedas).toFixed(2));
    }
    
    // Formatear categorías para el frontend
    static formatearCategorias(categorias) {
        const opciones = {
            ingresos: [
                { value: 'venta_producto', label: 'Venta de Productos' },
                { value: 'venta_servicio', label: 'Venta de Servicios' },
                { value: 'cobro_cliente', label: 'Cobro a Cliente' },
                { value: 'prestamo_recibido', label: 'Préstamo Recibido' },
                { value: 'devolucion', label: 'Devolución' },
                { value: 'otros_ingresos', label: 'Otros Ingresos' }
            ],
            egresos: [
                { value: 'compra_materia_prima', label: 'Compra Materia Prima' },
                { value: 'pago_proveedor', label: 'Pago a Proveedor' },
                { value: 'pago_servicio', label: 'Pago de Servicios' },
                { value: 'gasto_operativo', label: 'Gasto Operativo' },
                { value: 'pago_prestamo', label: 'Pago de Préstamo' },
                { value: 'gasto_personal', label: 'Gasto Personal' },
                { value: 'impuestos', label: 'Impuestos' },
                { value: 'otros_egresos', label: 'Otros Egresos' }
            ]
        };
        
        return opciones;
    }
    
    // Formatear métodos de pago para el frontend
    static formatearMetodosPago() {
        return [
            { value: 'efectivo', label: 'Efectivo', icon: '💵' },
            { value: 'yape', label: 'Yape', icon: '📱' },
            { value: 'plin', label: 'Plin', icon: '📲' },
            { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
            { value: 'tarjeta', label: 'Tarjeta', icon: '💳' }
        ];
    }
    
    // Formatear estado para mostrar
    static formatearEstado(estado) {
        const estados = {
            'pendiente': { label: 'Pendiente', color: 'yellow', icon: '⏳' },
            'validado': { label: 'Validado', color: 'blue', icon: '✅' },
            'aplicado': { label: 'Aplicado', color: 'green', icon: '🔗' },
            'anulado': { label: 'Anulado', color: 'red', icon: '❌' }
        };
        
        return estados[estado] || { label: estado, color: 'gray', icon: '❓' };
    }
}

// Exportar instancia única (singleton)
export const movimientosCajaService = new MovimientosCajaService();
export default MovimientosCajaService;
