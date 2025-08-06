import { useState, useEffect, useCallback } from 'react';
import { useFormulario } from '../CampoFormulario';
import PrestamosService from '../../../services/prestamosService';
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
    const [prestamoEditando, setPrestamoEditando] = useState(null);
    
    // ========== ESTADOS ESPECÍFICOS ==========
    const [tablaAmortizacion, setTablaAmortizacion] = useState([]);
    const [calculoCuota, setCalculoCuota] = useState(null);
    
    // ========== ESTADOS DE FILTROS Y PAGINACIÓN ==========
    const [filtros, setFiltros] = useState(filtrosIniciales);
    const [paginacion, setPaginacion] = useState(paginacionInicial);
    
    // ========== FORMULARIOS ==========
    const formularioPrestamo = useFormulario(formularioInicialPrestamo, validacionesPrestamo);
    const formularioCalculadora = useFormulario(formularioInicialCalculadora, validacionesCalculadora);
    
    // Debug temporal - formularios mejorado
    console.log('🔧 PrestamosCore Debug MEJORADO:', {
        formularioPrestamo: {
            valores: JSON.stringify(formularioPrestamo.valores),
            manejarCambio: typeof formularioPrestamo.manejarCambio,
            errores: JSON.stringify(formularioPrestamo.errores)
        },
        formularioCalculadora: {
            valores: JSON.stringify(formularioCalculadora.valores),
            manejarCambio: typeof formularioCalculadora.manejarCambio
        }
    });
    
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
            
            console.log('🔍 Debug préstamos data MEJORADO:', {
                responseData: response.data,
                prestamosData,
                prestamosArray,
                count: prestamosArray.length,
                primerPrestamo: prestamosArray.length > 0 ? prestamosArray[0] : null,
                camposPrimerPrestamo: prestamosArray.length > 0 ? Object.keys(prestamosArray[0]) : [],
                muestraDatos: prestamosArray.length > 0 ? prestamosArray.slice(0, 2) : []
            });
            
            setPrestamos(prestamosArray);
            
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
        formularioPrestamo.setValores(prestamo);
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
    
    // ========== FUNCIONES DE CRUD ==========
    
    // Función para transformar datos del frontend al formato del backend
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
        
        // Asignar valores por defecto para prestatario (será llenado por el backend con datos del usuario)
        datos.prestatario = {
            nombre: 'Usuario del Sistema', // Placeholder, será reemplazado por el backend
            documento: {
                tipo: 'DNI',
                numero: '00000000' // Placeholder, será reemplazado por el backend
            },
            telefono: '',
            email: ''
        };
        
        // Asignar tipo de crédito como tipo de préstamo
        if (datos.tipoCredito) {
            datos.tipo = datos.tipoCredito;
        }
        
        console.log('🔄 Datos transformados:', {
            original: datosFormulario,
            transformado: datos
        });
        
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
                console.log('✅', mensajes.exito.actualizar);
            } else {
                await PrestamosService.crear(datosPrestamo);
                console.log('✅', mensajes.exito.crear);
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
            console.log('🔄 Cancelando préstamo:', prestamo._id);
            
            // Actualizar el estado a cancelado
            const datosActualizacion = {
                ...prestamo,
                estado: 'cancelado',
                observaciones: (prestamo.observaciones || '') + `\nCancelado el ${new Date().toLocaleDateString()}`
            };
            
            await PrestamosService.actualizar(prestamo._id, datosActualizacion);
            console.log('✅', mensajes.exito.cancelar);
            await cargarPrestamos();
        } catch (error) {
            console.error('Error cancelando préstamo:', error);
            console.log('❌', mensajes.error.cancelar);
        } finally {
            setLoading(false);
        }
    };    // ========== FUNCIONES ESPECÍFICAS ==========
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
    
    // ========== RETURN DEL HOOK ==========
    return {
        // Estados principales
        prestamos,
        resumenPrestamos,
        loading,
        
        // Estados de modales
        modalAbierto,
        modalCalculadora,
        modalTablaAmortizacion,
        prestamoEditando,
        
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
        
        // Funciones de CRUD
        manejarSubmitPrestamo,
        cancelarPrestamo, // ✅ Nueva función para cancelar
        
        // Funciones específicas
        calcularCuota,
        verTablaAmortizacion,
        
        // Funciones de filtros
        actualizarFiltros,
        limpiarFiltros,
        cambiarPagina,
        
        // Funciones de carga
        cargarPrestamos,
        cargarResumen
    };
};
