import { useState, useCallback, useMemo } from 'react';
import { prestamosService } from '../../../../services/finanzas';

/**
 * Hook optimizado para gestión de modales de préstamos
 * Maneja estado de modales, calculadora y tabla de amortización
 * Separado para mejor organización y performance
 */
export const usePrestamosModals = () => {
    
    // Estados de modales
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalCalculadora, setModalCalculadora] = useState(false);
    const [modalTablaAmortizacion, setModalTablaAmortizacion] = useState(false);
    const [modalDetallesPrestamo, setModalDetallesPrestamo] = useState(false);
    
    // Estados de contenido de modales
    const [prestamoEditando, setPrestamoEditando] = useState(null);
    const [prestamoViendoDetalles, setPrestamoViendoDetalles] = useState(null);
    const [tablaAmortizacion, setTablaAmortizacion] = useState([]);
    const [calculoCuota, setCalculoCuota] = useState(null);
    const [loadingCalculos, setLoadingCalculos] = useState(false);
    
    // Funciones de modal de préstamo principal
    const abrirModalNuevo = useCallback(() => {
        setPrestamoEditando(null);
        setModalAbierto(true);
    }, []);
    
    const abrirModalEditar = useCallback((prestamo) => {
        setPrestamoEditando(prestamo);
        setModalAbierto(true);
    }, []);
    
    const cerrarModal = useCallback(() => {
        setModalAbierto(false);
        setPrestamoEditando(null);
    }, []);
    
    // Funciones de modal calculadora
    const abrirModalCalculadora = useCallback(() => {
        setCalculoCuota(null);
        setModalCalculadora(true);
    }, []);
    
    const cerrarModalCalculadora = useCallback(() => {
        setModalCalculadora(false);
        setCalculoCuota(null);
    }, []);
    
    // Función para calcular cuota
    const calcularCuota = useCallback(async (datosCalculo) => {
        try {
            setLoadingCalculos(true);
            
            const monto = parseFloat(datosCalculo.monto || datosCalculo.montoSolicitado);
            const tasaAnual = parseFloat(datosCalculo.tasaInteres || datosCalculo.tasaInteres?.porcentaje);
            const plazoMeses = parseInt(datosCalculo.plazoMeses || datosCalculo.plazo?.cantidad);
            
            // Validar datos
            if (!monto || !tasaAnual || !plazoMeses) {
                throw new Error('Datos incompletos para el cálculo');
            }
            
            // Calcular usando fórmula de cuota francesa
            const tasaMensual = tasaAnual / 100 / 12;
            const cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                               (Math.pow(1 + tasaMensual, plazoMeses) - 1);
            
            const montoTotal = cuotaMensual * plazoMeses;
            const totalIntereses = montoTotal - monto;
            
            const resultado = {
                cuotaMensual: Math.round(cuotaMensual * 100) / 100,
                montoTotal: Math.round(montoTotal * 100) / 100,
                totalIntereses: Math.round(totalIntereses * 100) / 100,
                tasaEfectiva: tasaAnual,
                plazoMeses,
                montoSolicitado: monto
            };
            
            setCalculoCuota(resultado);
            return { success: true, data: resultado };
            
        } catch (error) {
            console.error('Error calculando cuota:', error);
            return { success: false, error: error.message };
        } finally {
            setLoadingCalculos(false);
        }
    }, []);
    
    // Funciones de modal tabla de amortización
    const abrirModalTablaAmortizacion = useCallback(async (prestamo) => {
        try {
            setLoadingCalculos(true);
            
            const monto = parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado);
            const tasaAnual = parseFloat(prestamo.tasaInteres?.porcentaje || prestamo.tasaInteres);
            const plazoMeses = parseInt(prestamo.plazo?.cantidad || prestamo.plazoMeses);
            
            if (!monto || !tasaAnual || !plazoMeses) {
                throw new Error('Datos del préstamo incompletos');
            }
            
            // Generar tabla de amortización
            const tasaMensual = tasaAnual / 100 / 12;
            const cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                               (Math.pow(1 + tasaMensual, plazoMeses) - 1);
            
            const tabla = [];
            let saldoPendiente = monto;
            const fechaInicio = new Date(prestamo.fechaDesembolso || Date.now());
            
            for (let i = 1; i <= plazoMeses; i++) {
                const interes = saldoPendiente * tasaMensual;
                const capital = cuotaMensual - interes;
                saldoPendiente = Math.max(0, saldoPendiente - capital);
                
                // Calcular fecha de pago
                const fechaPago = new Date(fechaInicio);
                fechaPago.setMonth(fechaPago.getMonth() + i);
                
                tabla.push({
                    cuota: i,
                    fechaPago: fechaPago.toISOString().split('T')[0],
                    capital: Math.round(capital * 100) / 100,
                    interes: Math.round(interes * 100) / 100,
                    cuotaMensual: Math.round(cuotaMensual * 100) / 100,
                    saldoPendiente: Math.round(saldoPendiente * 100) / 100,
                    estado: 'pendiente' // Se podría actualizar según pagos reales
                });
            }
            
            setTablaAmortizacion(tabla);
            setModalTablaAmortizacion(true);
            
        } catch (error) {
            console.error('Error generando tabla de amortización:', error);
        } finally {
            setLoadingCalculos(false);
        }
    }, []);
    
    const cerrarModalTablaAmortizacion = useCallback(() => {
        setModalTablaAmortizacion(false);
        setTablaAmortizacion([]);
    }, []);
    
    // Funciones de modal de detalles
    const abrirModalDetalles = useCallback((prestamo) => {
        setPrestamoViendoDetalles(prestamo);
        setModalDetallesPrestamo(true);
    }, []);
    
    const cerrarModalDetalles = useCallback(() => {
        setModalDetallesPrestamo(false);
        setPrestamoViendoDetalles(null);
    }, []);
    
    // Estado agregado de modales para optimización
    const estadoModales = useMemo(() => ({
        algunModalAbierto: modalAbierto || modalCalculadora || modalTablaAmortizacion || modalDetallesPrestamo,
        totalModalesAbiertos: [modalAbierto, modalCalculadora, modalTablaAmortizacion, modalDetallesPrestamo]
                              .filter(Boolean).length
    }), [modalAbierto, modalCalculadora, modalTablaAmortizacion, modalDetallesPrestamo]);
    
    // Datos de calculadora procesados
    const datosCalculadora = useMemo(() => {
        if (!calculoCuota) return null;
        
        return {
            ...calculoCuota,
            porcentajeInteres: ((calculoCuota.totalIntereses / calculoCuota.montoSolicitado) * 100).toFixed(2)
        };
    }, [calculoCuota]);
    
    return {
        // Estados de modales
        modalAbierto,
        modalCalculadora,
        modalTablaAmortizacion,
        modalDetallesPrestamo,
        
        // Contenido de modales
        prestamoEditando,
        prestamoViendoDetalles,
        tablaAmortizacion,
        calculoCuota: datosCalculadora,
        
        // Estados de control
        loadingCalculos,
        estadoModales,
        
        // Funciones de modal principal
        abrirModalNuevo,
        abrirModalEditar,
        cerrarModal,
        
        // Funciones de calculadora
        abrirModalCalculadora,
        cerrarModalCalculadora,
        calcularCuota,
        
        // Funciones de tabla de amortización
        abrirModalTablaAmortizacion,
        cerrarModalTablaAmortizacion,
        
        // Funciones de detalles
        abrirModalDetalles,
        cerrarModalDetalles
    };
};
