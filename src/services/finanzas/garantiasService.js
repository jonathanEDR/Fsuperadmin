import BaseFinanzasService from './BaseFinanzasService';
import api from '../api';

/**
 * Servicio especializado para gestión de garantías
 * Extiende BaseFinanzasService y añade funcionalidades específicas de garantías
 * Incluye gestión de estados, seguros, documentación y cálculos de cobertura
 */
class GarantiasService extends BaseFinanzasService {
    constructor() {
        super('/api/garantias');
    }

    // ==================== OPERACIONES DE ESTADO ====================

    /**
     * Aprobar garantía
     * @param {string} id - ID de la garantía
     * @param {object} datos - { valorTasacion, observaciones }
     */
    async aprobar(id, datos = {}) {
        try {
            return await this.ejecutarAccion(id, 'aprobar', datos);
        } catch (error) {
            console.error('Error aprobando garantía:', error);
            throw error;
        }
    }

    /**
     * Rechazar garantía
     * @param {string} id - ID de la garantía
     * @param {string} motivo - Motivo del rechazo
     */
    async rechazar(id, motivo = '') {
        try {
            return await this.ejecutarAccion(id, 'rechazar', { motivo });
        } catch (error) {
            console.error('Error rechazando garantía:', error);
            throw error;
        }
    }

    /**
     * Activar garantía (después de aprobada)
     * @param {string} id - ID de la garantía
     */
    async activar(id) {
        try {
            return await this.ejecutarAccion(id, 'activar');
        } catch (error) {
            console.error('Error activando garantía:', error);
            throw error;
        }
    }

    /**
     * Liberar garantía
     * @param {string} id - ID de la garantía
     * @param {string} motivo - Motivo de liberación
     */
    async liberar(id, motivo = '') {
        try {
            return await this.ejecutarAccion(id, 'liberar', { motivo });
        } catch (error) {
            console.error('Error liberando garantía:', error);
            throw error;
        }
    }

    /**
     * Ejecutar garantía
     * @param {string} id - ID de la garantía
     * @param {object} datosEjecucion - { motivo, valorObtenido, gastos, fechaRemate, observaciones }
     */
    async ejecutar(id, datosEjecucion) {
        try {
            return await this.ejecutarAccion(id, 'ejecutar', datosEjecucion);
        } catch (error) {
            console.error('Error ejecutando garantía:', error);
            throw error;
        }
    }

    // ==================== CONSULTAS ESPECIALIZADAS ====================

    /**
     * Obtener resumen de garantías del usuario
     */
    async obtenerResumen() {
        try {
            const response = await api.get(`${this.baseURL}/resumen`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo resumen de garantías:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de garantías
     */
    async obtenerEstadisticas() {
        try {
            const response = await api.get(`${this.baseURL}/estadisticas`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas de garantías:', error);
            throw error;
        }
    }

    /**
     * Obtener garantías próximas a vencer (seguros)
     * @param {number} dias - Días para considerar próximo a vencer
     */
    async obtenerProximasVencer(dias = 30) {
        try {
            const response = await api.get(`${this.baseURL}/proximas-vencer?dias=${dias}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo garantías próximas a vencer:', error);
            throw error;
        }
    }

    /**
     * Obtener garantías de un préstamo específico
     * @param {string} prestamoId - ID del préstamo
     */
    async obtenerPorPrestamo(prestamoId) {
        try {
            const response = await api.get(`${this.baseURL}/prestamo/${prestamoId}`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo garantías del préstamo:', error);
            throw error;
        }
    }

    // ==================== CÁLCULOS Y VALIDACIONES ====================

    /**
     * Calcular cobertura de garantía
     * @param {string} id - ID de la garantía
     * @param {number} montoCredito - Monto del crédito (opcional)
     */
    async calcularCobertura(id, montoCredito = null) {
        try {
            const params = montoCredito ? `?montoCredito=${montoCredito}` : '';
            const response = await api.get(`${this.baseURL}/${id}/cobertura${params}`);
            return response.data;
        } catch (error) {
            console.error('Error calculando cobertura:', error);
            throw error;
        }
    }

    /**
     * Validar documentación de garantía
     * @param {string} id - ID de la garantía
     */
    async validarDocumentacion(id) {
        try {
            const response = await api.get(`${this.baseURL}/${id}/documentacion`);
            return response.data;
        } catch (error) {
            console.error('Error validando documentación:', error);
            throw error;
        }
    }

    // ==================== GESTIÓN DE SEGUROS ====================

    /**
     * Verificar seguros de garantía
     * @param {string} id - ID de la garantía
     */
    async verificarSeguros(id) {
        try {
            const response = await api.get(`${this.baseURL}/${id}/seguros`);
            return response.data;
        } catch (error) {
            console.error('Error verificando seguros:', error);
            throw error;
        }
    }

    /**
     * Agregar seguro a garantía
     * @param {string} id - ID de la garantía
     * @param {object} datosSeguro - Datos del seguro
     */
    async agregarSeguro(id, datosSeguro) {
        try {
            const response = await api.post(`${this.baseURL}/${id}/seguros`, datosSeguro);
            return response.data;
        } catch (error) {
            console.error('Error agregando seguro:', error);
            throw error;
        }
    }

    // ==================== CONFIGURACIÓN Y OPCIONES ====================

    /**
     * Obtener tipos de garantía disponibles desde el servidor
     */
    async obtenerTiposServidor() {
        try {
            const response = await api.get(`${this.baseURL}/tipos`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo tipos de garantía:', error);
            // Retornar tipos por defecto si falla
            return { success: true, data: this.obtenerTiposGarantia() };
        }
    }

    /**
     * Obtener estados de garantía disponibles desde el servidor
     */
    async obtenerEstadosServidor() {
        try {
            const response = await api.get(`${this.baseURL}/estados`);
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estados de garantía:', error);
            // Retornar estados por defecto si falla
            return { success: true, data: this.obtenerEstadosGarantia() };
        }
    }

    /**
     * Obtener tipos de garantía disponibles (local)
     */
    obtenerTiposGarantia() {
        return [
            { value: 'hipotecaria', label: 'Hipotecaria', descripcion: 'Garantía sobre inmueble' },
            { value: 'vehicular', label: 'Vehicular', descripcion: 'Garantía sobre vehículo' },
            { value: 'fianza_personal', label: 'Fianza Personal', descripcion: 'Garantía personal de tercero' },
            { value: 'deposito_garantia', label: 'Depósito de Garantía', descripcion: 'Depósito en efectivo' },
            { value: 'aval_bancario', label: 'Aval Bancario', descripcion: 'Garantía bancaria' },
            { value: 'prenda', label: 'Prenda', descripcion: 'Garantía sobre bien mueble' },
            { value: 'warrant', label: 'Warrant', descripcion: 'Certificado de depósito' },
            { value: 'otra', label: 'Otra', descripcion: 'Otro tipo de garantía' }
        ];
    }

    /**
     * Obtener estados de garantía disponibles (local)
     */
    obtenerEstadosGarantia() {
        return [
            { value: 'pendiente_evaluacion', label: 'Pendiente de Evaluación', color: 'yellow' },
            { value: 'aprobada', label: 'Aprobada', color: 'blue' },
            { value: 'rechazada', label: 'Rechazada', color: 'red' },
            { value: 'activa', label: 'Activa', color: 'green' },
            { value: 'liberada', label: 'Liberada', color: 'gray' },
            { value: 'ejecutada', label: 'Ejecutada', color: 'purple' }
        ];
    }

    /**
     * Obtener tipos de documento del propietario
     */
    obtenerTiposDocumento() {
        return [
            { value: 'DNI', label: 'DNI' },
            { value: 'CE', label: 'Carnet de Extranjería' },
            { value: 'RUC', label: 'RUC' },
            { value: 'PASAPORTE', label: 'Pasaporte' }
        ];
    }

    /**
     * Obtener relaciones del propietario con el titular
     */
    obtenerRelacionesPropietario() {
        return [
            { value: 'titular', label: 'Titular' },
            { value: 'conyuge', label: 'Cónyuge' },
            { value: 'familiar', label: 'Familiar' },
            { value: 'tercero', label: 'Tercero' },
            { value: 'empresa', label: 'Empresa' }
        ];
    }

    /**
     * Obtener estados del bien
     */
    obtenerEstadosBien() {
        return [
            { value: 'nuevo', label: 'Nuevo' },
            { value: 'usado_excelente', label: 'Usado - Excelente' },
            { value: 'usado_bueno', label: 'Usado - Bueno' },
            { value: 'usado_regular', label: 'Usado - Regular' },
            { value: 'deteriorado', label: 'Deteriorado' }
        ];
    }

    /**
     * Obtener tipos de seguro
     */
    obtenerTiposSeguros() {
        return [
            { value: 'todo_riesgo', label: 'Todo Riesgo' },
            { value: 'incendio', label: 'Incendio' },
            { value: 'robo', label: 'Robo' },
            { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
            { value: 'vida', label: 'Vida' },
            { value: 'otro', label: 'Otro' }
        ];
    }

    /**
     * Obtener tipos de documento de garantía
     */
    obtenerTiposDocumentos() {
        return [
            { value: 'escritura', label: 'Escritura Pública' },
            { value: 'titulo', label: 'Título de Propiedad' },
            { value: 'tarjeta_propiedad', label: 'Tarjeta de Propiedad' },
            { value: 'certificado_registral', label: 'Certificado Registral' },
            { value: 'tasacion', label: 'Informe de Tasación' },
            { value: 'seguro', label: 'Póliza de Seguro' },
            { value: 'otro', label: 'Otro' }
        ];
    }

    /**
     * Obtener monedas disponibles
     */
    obtenerMonedas() {
        return [
            { value: 'PEN', label: 'Soles (S/)', simbolo: 'S/' },
            { value: 'USD', label: 'Dólares ($)', simbolo: '$' },
            { value: 'EUR', label: 'Euros (€)', simbolo: '€' }
        ];
    }

    // ==================== UTILIDADES Y FORMATEO ====================

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
            montoNum = monto.value || monto.amount || monto.comercial || 0;
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
     * Obtener color del estado
     */
    obtenerColorEstado(estado) {
        const colores = {
            'pendiente_evaluacion': 'yellow',
            'aprobada': 'blue',
            'rechazada': 'red',
            'activa': 'green',
            'liberada': 'gray',
            'ejecutada': 'purple'
        };
        return colores[estado] || 'gray';
    }

    /**
     * Obtener label del estado
     */
    obtenerLabelEstado(estado) {
        const estados = this.obtenerEstadosGarantia();
        const encontrado = estados.find(e => e.value === estado);
        return encontrado ? encontrado.label : estado;
    }

    /**
     * Obtener label del tipo
     */
    obtenerLabelTipo(tipo) {
        const tipos = this.obtenerTiposGarantia();
        const encontrado = tipos.find(t => t.value === tipo);
        return encontrado ? encontrado.label : tipo;
    }

    /**
     * Calcular totales de una lista de garantías
     */
    calcularTotales(garantias) {
        if (!Array.isArray(garantias) || garantias.length === 0) {
            return {
                total: 0,
                valorComercialTotal: 0,
                valorTasacionTotal: 0,
                valorRealizacionTotal: 0,
                activas: 0,
                pendientes: 0,
                ejecutadas: 0
            };
        }

        return garantias.reduce((totales, garantia) => {
            const valorComercial = parseFloat(garantia.valores?.comercial || 0);
            const valorTasacion = parseFloat(garantia.valores?.tasacion || 0);
            const valorRealizacion = parseFloat(garantia.valores?.realizacion || valorComercial * 0.8);

            return {
                total: totales.total + 1,
                valorComercialTotal: totales.valorComercialTotal + valorComercial,
                valorTasacionTotal: totales.valorTasacionTotal + valorTasacion,
                valorRealizacionTotal: totales.valorRealizacionTotal + valorRealizacion,
                activas: totales.activas + (garantia.estado === 'activa' ? 1 : 0),
                pendientes: totales.pendientes + (garantia.estado === 'pendiente_evaluacion' ? 1 : 0),
                ejecutadas: totales.ejecutadas + (garantia.estado === 'ejecutada' ? 1 : 0)
            };
        }, {
            total: 0,
            valorComercialTotal: 0,
            valorTasacionTotal: 0,
            valorRealizacionTotal: 0,
            activas: 0,
            pendientes: 0,
            ejecutadas: 0
        });
    }

    /**
     * Validar datos de garantía
     */
    validarDatosGarantia(datos) {
        const errores = [];

        // Validaciones requeridas
        if (!datos.prestamoId) {
            errores.push('Debe seleccionar un préstamo asociado');
        }

        if (!datos.tipo) {
            errores.push('Debe seleccionar un tipo de garantía');
        }

        if (!datos.descripcion || datos.descripcion.trim().length < 10) {
            errores.push('La descripción debe tener al menos 10 caracteres');
        }

        // Validaciones del bien
        if (!datos.bien?.nombre || datos.bien.nombre.trim().length < 3) {
            errores.push('El nombre del bien debe tener al menos 3 caracteres');
        }

        // Validaciones de valores
        if (!datos.valores?.comercial || datos.valores.comercial <= 0) {
            errores.push('El valor comercial debe ser mayor a 0');
        }

        // Validaciones del propietario
        if (!datos.propietario?.nombre || datos.propietario.nombre.trim().length < 3) {
            errores.push('El nombre del propietario debe tener al menos 3 caracteres');
        }

        if (!datos.propietario?.documento?.tipo) {
            errores.push('Debe seleccionar el tipo de documento del propietario');
        }

        if (!datos.propietario?.documento?.numero || datos.propietario.documento.numero.trim().length < 8) {
            errores.push('El número de documento debe tener al menos 8 caracteres');
        }

        return errores;
    }

    /**
     * Obtener acciones disponibles según el estado
     */
    obtenerAccionesDisponibles(estado) {
        const acciones = {
            'pendiente_evaluacion': ['aprobar', 'rechazar', 'editar', 'eliminar'],
            'aprobada': ['activar', 'rechazar', 'editar'],
            'rechazada': ['editar', 'eliminar'],
            'activa': ['liberar', 'ejecutar', 'agregarSeguro'],
            'liberada': ['ver'],
            'ejecutada': ['ver']
        };
        return acciones[estado] || ['ver'];
    }

    /**
     * Verificar si una acción está disponible
     */
    puedeEjecutarAccion(estado, accion) {
        const accionesDisponibles = this.obtenerAccionesDisponibles(estado);
        return accionesDisponibles.includes(accion);
    }
}

// Exportar instancia singleton
const garantiasService = new GarantiasService();
export default garantiasService;

// También exportar la clase para testing o herencia
export { GarantiasService };
