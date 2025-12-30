import { useState, useEffect, useCallback } from 'react';
import { useFormularioPrestamos } from './useFormularioPrestamos';
import PrestamosService from '../../../services/prestamosService';
import { limpiarDatosPrestamos } from '../../../utils/prestamosUtils';
import {
    validacionesPrestamo,
    validacionesCalculadora,
    formularioInicialPrestamo,
    formularioInicialCalculadora,
    filtrosIniciales,
    paginacionInicial,
    mensajes
} from './prestamosConfig.jsx';

export const usePrestamos = () => {
    // ========== ESTADOS PRINCIPALES ==========
    const [prestamos, setPrestamos] = useState([]);
    const [resumenPrestamos, setResumenPrestamos] = useState(null);
    const [loading, setLoading] = useState(true);

    // ========== ESTADOS DE MODALES ==========
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalCalculadora, setModalCalculadora] = useState(false);
    const [modalTablaAmortizacion, setModalTablaAmortizacion] = useState(false);
    const [modalDetallesPrestamo, setModalDetallesPrestamo] = useState(false);
    const [prestamoEditando, setPrestamoEditando] = useState(null);
    const [prestamoViendoDetalles, setPrestamoViendoDetalles] = useState(null);

    // ========== ESTADOS ESPECÍFICOS ==========
    const [tablaAmortizacion, setTablaAmortizacion] = useState([]);
    const [calculoCuota, setCalculoCuota] = useState(null);

    // ========== ESTADOS PARA TRABAJADORES/EXTERNOS ==========
    const [trabajadores, setTrabajadores] = useState([]);
    const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
    const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
    
    // ========== ESTADOS DE FILTROS Y PAGINACIÓN ==========
    const [filtros, setFiltros] = useState(filtrosIniciales);
    const [paginacion, setPaginacion] = useState(paginacionInicial);
    
    // ========== FORMULARIOS ==========
    const formularioPrestamo = useFormularioPrestamos(formularioInicialPrestamo, validacionesPrestamo);
    const formularioCalculadora = useFormularioPrestamos(formularioInicialCalculadora, validacionesCalculadora);
    
    // ========== FUNCIONES DE CARGA DE DATOS ==========
    const cargarPrestamos = useCallback(async () => {
        try {
            setLoading(true);
            
            const response = await PrestamosService.obtenerTodos({
                ...filtros,
                page: paginacion.paginaActual,
                limit: paginacion.limite
            });
            
            // Manejar diferentes formatos de respuesta
            const prestamosData = response.data.data || response.data.prestamos || response.data || [];
            const prestamosArray = Array.isArray(prestamosData) ? prestamosData : [];
            
            // 🔧 LIMPIAR Y NORMALIZAR DATOS
            const prestamosLimpios = limpiarDatosPrestamos(prestamosArray);
            
            const isDev = process.env.NODE_ENV === 'development';
            if (isDev && prestamosLimpios.length > 0) {
                console.log('� Préstamos cargados:', prestamosLimpios.length);
            }
            
            setPrestamos(prestamosLimpios);
            
            // Actualizar paginación si está disponible
            if (response.data.paginacion) {
                setPaginacion(prev => ({
                    ...prev,
                    total: response.data.paginacion.total,
                    totalPaginas: response.data.paginacion.totalPaginas
                }));
            }
            
        } catch (error) {
            console.error('Error cargando préstamos:', error);
            setPrestamos([]);
        } finally {
            setLoading(false);
        }
    }, [filtros, paginacion.paginaActual, paginacion.limite]);
    
    const cargarResumen = useCallback(async () => {
        try {
            // TODO: Implementar endpoint de resumen de préstamos
            // const response = await prestamosService.obtenerResumen();
            // setResumenPrestamos(response.data);
            
            // Por ahora, calcular resumen básico desde los datos cargados
            const resumenBasico = {
                totalPrestamos: prestamos.length,
                prestamosActivos: prestamos.filter(p => ['vigente', 'desembolsado'].includes(p.estado)).length,
                prestamosVencidos: prestamos.filter(p => p.estado === 'vencido').length,
                montoTotal: prestamos.reduce((sum, p) => sum + (parseFloat(p.montoAprobado || p.montoSolicitado || 0)), 0)
            };
            
            setResumenPrestamos(resumenBasico);
            
        } catch (error) {
            console.error('Error cargando resumen de préstamos:', error);
            setResumenPrestamos({
                totalPrestamos: 0,
                prestamosActivos: 0,
                prestamosVencidos: 0,
                montoTotal: 0
            });
        }
    }, [prestamos]);
    
    // ========== EFECTOS ==========
    useEffect(() => {
        cargarPrestamos();
    }, [cargarPrestamos]);
    
    useEffect(() => {
        cargarResumen();
    }, [cargarResumen]);
    
    // ========== FUNCIONES DE MODALES ==========
    const abrirModalNuevoPrestamo = () => {
        formularioPrestamo.resetear();
        setPrestamoEditando(null);
        setModalAbierto(true);
    };
    
    const abrirModalEditarPrestamo = (prestamo) => {
        // Transformar datos del backend al formato del formulario
        const datosFormulario = transformarDatosParaFormulario(prestamo);
        formularioPrestamo.setValores(datosFormulario);
        setPrestamoEditando(prestamo);
        setModalAbierto(true);
    };
    
    const cerrarModal = () => {
        setModalAbierto(false);
        setPrestamoEditando(null);
        formularioPrestamo.resetear();
    };
    
    const abrirModalCalculadora = () => {
        formularioCalculadora.resetear();
        setCalculoCuota(null);
        setModalCalculadora(true);
    };
    
    const cerrarModalCalculadora = () => {
        setModalCalculadora(false);
        formularioCalculadora.resetear();
        setCalculoCuota(null);
    };
    
    const cerrarModalTablaAmortizacion = () => {
        setModalTablaAmortizacion(false);
        setTablaAmortizacion([]);
    };
    
    const abrirModalDetallesPrestamo = (prestamo) => {
        setPrestamoViendoDetalles(prestamo);
        setModalDetallesPrestamo(true);
    };
    
    const cerrarModalDetallesPrestamo = () => {
        setModalDetallesPrestamo(false);
        setPrestamoViendoDetalles(null);
    };
    
    // ========== FUNCIONES DE CRUD ==========
    
    // Función para transformar datos del frontend al formato del backend
    // ========== FUNCIONES DE TRANSFORMACIÓN DE DATOS ==========
    const transformarDatosParaFormulario = (prestamo) => {
        // Transformar de estructura del backend a estructura del formulario
        const datosFormulario = {
            entidadFinanciera: {
                nombre: prestamo.entidadFinanciera?.nombre || '',
                codigo: prestamo.entidadFinanciera?.codigo || '',
                tipo: prestamo.entidadFinanciera?.tipo || 'banco'
            },
            tipoCredito: prestamo.tipo || prestamo.tipoCredito || '',
            montoSolicitado: prestamo.montoSolicitado || '',
            tasaInteres: {
                porcentaje: prestamo.tasaInteres || '',
                tipo: prestamo.tipoTasa || 'fija',
                periodo: 'anual'
            },
            plazo: {
                cantidad: prestamo.plazoMeses || '',
                unidad: 'meses'
            },
            proposito: prestamo.proposito || prestamo.descripcion || '',
            observaciones: prestamo.observaciones || ''
        };
        
        console.log('🔄 Transformando datos para formulario:', {
            original: prestamo,
            transformado: datosFormulario
        });
        
        return datosFormulario;
    };

    const transformarDatosParaBackend = (datosFormulario) => {
        const datos = { ...datosFormulario };

        // Transformar estructura de tasa de interés
        if (datos.tasaInteres && typeof datos.tasaInteres === 'object') {
            datos.tasaInteres = parseFloat(datos.tasaInteres.porcentaje) || 0;
            datos.tipoTasa = datos.tasaInteres.tipo || 'fija';
        }

        // Transformar plazo a plazoMeses
        if (datos.plazo && typeof datos.plazo === 'object') {
            const cantidad = parseInt(datos.plazo.cantidad) || 0;
            const unidad = datos.plazo.unidad || 'meses';

            // Convertir todo a meses
            switch (unidad) {
                case 'años':
                    datos.plazoMeses = cantidad * 12;
                    break;
                case 'semanas':
                    datos.plazoMeses = Math.round(cantidad / 4.33); // Aproximado
                    break;
                case 'dias':
                    datos.plazoMeses = Math.round(cantidad / 30); // Aproximado
                    break;
                default: // meses
                    datos.plazoMeses = cantidad;
                    break;
            }

            // Eliminar el campo plazo original
            delete datos.plazo;
        }

        // Asignar tipo de crédito como tipo de préstamo
        if (datos.tipoCredito) {
            datos.tipo = datos.tipoCredito;
            delete datos.tipoCredito; // Eliminar campo original
        }

        // Transformar montoSolicitado a número
        if (datos.montoSolicitado) {
            datos.montoSolicitado = parseFloat(datos.montoSolicitado) || 0;
        }

        // ==================== CAMPOS PARA PRÉSTAMOS A TRABAJADORES/EXTERNOS ====================
        // Asegurar que tipoPrestatario se envíe (por defecto 'particular')
        datos.tipoPrestatario = datos.tipoPrestatario || 'particular';

        // Mantener prestatarioRef si existe (referencia al trabajador)
        if (datos.prestatarioRef) {
            datos.prestatarioRef = datos.prestatarioRef;
        }

        // Limpiar prestatarioInfo ya que solo es para mostrar en el form
        delete datos.prestatarioInfo;

        // Mantener descuentoNomina si está habilitado
        if (datos.descuentoNomina) {
            datos.descuentoNomina = {
                aplicable: datos.descuentoNomina.aplicable || false,
                tipoDescuento: datos.descuentoNomina.tipoDescuento || 'cuota_completa',
                porcentaje: parseFloat(datos.descuentoNomina.porcentaje) || 0,
                montoFijo: parseFloat(datos.descuentoNomina.montoFijo) || 0,
                periodoDescuento: datos.descuentoNomina.periodoDescuento || 'mensual'
            };
        }

        // Limpiar campos vacíos o inválidos
        Object.keys(datos).forEach(key => {
            if (key === '' || key === null || key === undefined) {
                delete datos[key];
            }
        });

        // Preservar la estructura de entidadFinanciera
        // No necesitamos transformar este campo ya que el backend lo espera tal como está

        // Log solo en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Datos transformados para backend:', datos);
        }

        return datos;
    };
    
    const manejarSubmitPrestamo = async (e) => {
        e.preventDefault();
        
        if (!formularioPrestamo.validarFormulario()) {
            return;
        }
        
        try {
            setLoading(true);
            
            const datosFormulario = formularioPrestamo.obtenerDatos();
            const datosPrestamo = transformarDatosParaBackend(datosFormulario);
            
            if (prestamoEditando) {
                await PrestamosService.actualizar(prestamoEditando._id, datosPrestamo);
            } else {
                await PrestamosService.crear(datosPrestamo);
            }
            
            await cargarPrestamos();
            cerrarModal();
            
        } catch (error) {
            console.error('Error guardando préstamo:', error);
            console.log('❌', prestamoEditando ? mensajes.error.actualizar : mensajes.error.crear);
        } finally {
            setLoading(false);
        }
    };
    
    const cancelarPrestamo = async (prestamo) => {
        if (!window.confirm(mensajes.confirmaciones.cancelar)) {
            return;
        }
        
        try {
            setLoading(true);
            
            // Actualizar el estado a cancelado
            const datosActualizacion = {
                ...prestamo,
                estado: 'cancelado',
                observaciones: (prestamo.observaciones || '') + `\nCancelado el ${new Date().toLocaleDateString()}`
            };
            
            await PrestamosService.actualizar(prestamo._id, datosActualizacion);
            await cargarPrestamos();
        } catch (error) {
            console.error('Error cancelando préstamo:', error);
        } finally {
            setLoading(false);
        }
    };

    const eliminarPrestamo = async (prestamo) => {
        const mensaje = `¿Estás seguro de que deseas eliminar el préstamo ${prestamo.codigo}?\n\n` +
                       `⚠️ ADVERTENCIA: Esta acción también eliminará:\n` +
                       `• El movimiento de caja asociado\n` +
                       `• Las garantías asociadas\n` +
                       `• Todos los registros relacionados\n\n` +
                       `Esta acción NO se puede deshacer.`;
        
        if (!window.confirm(mensaje)) {
            return;
        }
        
        try {
            setLoading(true);
            
            const response = await PrestamosService.eliminar(prestamo._id);
            
            // Mostrar mensaje de éxito
            alert(`✅ Préstamo ${prestamo.codigo} eliminado exitosamente.\n\nSe han eliminado todas las referencias asociadas.`);
            
            // Recargar la lista de préstamos
            await cargarPrestamos();
            
        } catch (error) {
            console.error('Error eliminando préstamo:', error);
            
            // Mostrar mensaje de error específico
            const mensajeError = error.response?.data?.message || error.message || 'Error desconocido';
            alert(`❌ Error al eliminar el préstamo:\n\n${mensajeError}`);
            
        } finally {
            setLoading(false);
        }
    };
    
    // ========== FUNCIONES ESPECÍFICAS ==========
    const calcularCuota = async () => {
        if (!formularioCalculadora.validarFormulario()) {
            return;
        }
        
        try {
            const datos = formularioCalculadora.obtenerDatos();
            
            // TODO: Implementar endpoint de cálculo de cuota
            const response = await PrestamosService.calcularCuota(datos);
            
            // Cálculo básico mientras tanto
            const monto = parseFloat(datos.monto);
            const tasaMensual = parseFloat(datos.tasaInteres) / 100 / 12;
            const numPagos = parseInt(datos.plazoMeses);
            
            const cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, numPagos)) / 
                               (Math.pow(1 + tasaMensual, numPagos) - 1);
            
            setCalculoCuota({
                cuotaMensual: cuotaMensual,
                montoTotal: cuotaMensual * numPagos,
                totalIntereses: (cuotaMensual * numPagos) - monto
            });
            
        } catch (error) {
            console.error('Error calculando cuota:', error);
            console.log('❌', mensajes.error.calcular);
        }
    };
    
    const verTablaAmortizacion = async (prestamo) => {
        try {
            setLoading(true);
            
            // TODO: Implementar endpoint de tabla de amortización
            const response = await PrestamosService.obtenerTablaAmortizacion(prestamo._id);
            // setTablaAmortizacion(response.data);
            
            // Generar tabla básica mientras tanto
            const monto = parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado);
            const tasaMensual = parseFloat(prestamo.tasaInteres.porcentaje) / 100 / 12;
            const numPagos = parseInt(prestamo.plazo.cantidad);
            
            const cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, numPagos)) / 
                               (Math.pow(1 + tasaMensual, numPagos) - 1);
            
            const tabla = [];
            let saldoPendiente = monto;
            
            for (let i = 1; i <= numPagos; i++) {
                const interes = saldoPendiente * tasaMensual;
                const capital = cuotaMensual - interes;
                saldoPendiente -= capital;
                
                tabla.push({
                    cuota: i,
                    fechaPago: new Date(Date.now() + (i * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
                    capital: capital,
                    interes: interes,
                    cuotaMensual: cuotaMensual,
                    saldoPendiente: Math.max(0, saldoPendiente)
                });
            }
            
            setTablaAmortizacion(tabla);
            setModalTablaAmortizacion(true);
            
        } catch (error) {
            console.error('Error obteniendo tabla de amortización:', error);
            console.log('❌', mensajes.error.amortizacion);
        } finally {
            setLoading(false);
        }
    };
    
    // ========== FUNCIONES DE FILTROS ==========
    const actualizarFiltros = (nuevosFiltros) => {
        setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
    };
    
    const limpiarFiltros = () => {
        setFiltros(filtrosIniciales);
        setPaginacion(paginacionInicial);
    };
    
    const cambiarPagina = (nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    };

    // ========== FUNCIONES PARA TRABAJADORES/EXTERNOS ==========

    /**
     * Buscar trabajadores disponibles para préstamos
     */
    const buscarTrabajadores = useCallback(async (busqueda = '') => {
        try {
            setLoadingTrabajadores(true);
            const response = await PrestamosService.obtenerTrabajadoresDisponibles({
                buscar: busqueda,
                estado: 'activo'
            });

            if (response.success) {
                setTrabajadores(response.data || []);
            } else {
                setTrabajadores([]);
            }
        } catch (err) {
            console.error('Error buscando trabajadores:', err);
            setTrabajadores([]);
        } finally {
            setLoadingTrabajadores(false);
        }
    }, []);

    /**
     * Manejar selección de trabajador
     */
    const manejarSeleccionTrabajador = useCallback((trabajador) => {
        setTrabajadorSeleccionado(trabajador);
    }, []);

    /**
     * Limpiar selección de trabajador al cerrar modal
     */
    const limpiarTrabajadorSeleccionado = useCallback(() => {
        setTrabajadorSeleccionado(null);
        setTrabajadores([]);
    }, []);

    // ========== RETURN DEL HOOK ==========
    return {
        // Estados principales
        prestamos,
        resumenPrestamos,
        loading,
        
        // Estados de modales
        // Estados de modales
        modalAbierto,
        modalCalculadora,
        modalTablaAmortizacion,
        modalDetallesPrestamo,
        prestamoEditando,
        prestamoViendoDetalles,
        
        // Estados específicos
        tablaAmortizacion,
        calculoCuota,
        
        // Estados de filtros y paginación
        filtros,
        paginacion,
        
        // Formularios
        formularioPrestamo,
        formularioCalculadora,
        
        // Funciones de modales
        abrirModalNuevoPrestamo,
        abrirModalEditarPrestamo,
        cerrarModal,
        abrirModalCalculadora,
        cerrarModalCalculadora,
        cerrarModalTablaAmortizacion,
        abrirModalDetallesPrestamo,
        cerrarModalDetallesPrestamo,
        
        // Funciones de CRUD
        manejarSubmitPrestamo,
        cancelarPrestamo, // ✅ Nueva función para cancelar
        eliminarPrestamo, // ✅ Nueva función para eliminar
        
        // Funciones específicas
        calcularCuota,
        verTablaAmortizacion,
        
        // Funciones de filtros
        actualizarFiltros,
        limpiarFiltros,
        cambiarPagina,

        // Funciones de carga
        cargarPrestamos,
        cargarResumen,

        // ========== TRABAJADORES/EXTERNOS ==========
        // Estados
        trabajadores,
        loadingTrabajadores,
        trabajadorSeleccionado,

        // Funciones
        buscarTrabajadores,
        manejarSeleccionTrabajador,
        limpiarTrabajadorSeleccionado
    };
};
