import { useState, useEffect, useCallback, useMemo } from 'react';
import { prestamosService } from '../../../../services/finanzas';
import { limpiarDatosPrestamos } from '../../../../utils/prestamosUtils';

/**
 * Hook optimizado para gestión de datos de préstamos
 * Maneja carga, filtrado, paginación y operaciones CRUD
 * Separado de la lógica de UI para mejor modularidad
 */
export const usePrestamosData = () => {
    
    // Estados principales
    const [prestamos, setPrestamos] = useState([]);
    const [resumenPrestamos, setResumenPrestamos] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Estados de filtros y paginación
    const [filtros, setFiltros] = useState({
        estado: '',
        entidadFinanciera: '',
        tipoCredito: '',
        fechaDesde: '',
        fechaHasta: '',
        montoMinimo: '',
        montoMaximo: '',
        busqueda: ''
    });
    
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        limite: 10,
        total: 0,
        totalPaginas: 0
    });
    
    // Función memoizada para cargar préstamos
    const cargarPrestamos = useCallback(async (filtrosCustom = null) => {
        try {
            setLoading(true);
            setError(null);
            
            const parametros = {
                ...(filtrosCustom || filtros),
                page: paginacion.paginaActual,
                limit: paginacion.limite
            };
            
            const response = await prestamosService.obtenerTodos(parametros);
            
            // Manejar diferentes formatos de respuesta
            const prestamosData = response.data?.data || response.data?.prestamos || response.data || [];
            const prestamosArray = Array.isArray(prestamosData) ? prestamosData : [];
            
            // Limpiar y normalizar datos
            const prestamosLimpios = limpiarDatosPrestamos(prestamosArray);
            
            setPrestamos(prestamosLimpios);
            
            // Actualizar paginación si está disponible
            if (response.data?.paginacion) {
                setPaginacion(prev => ({
                    ...prev,
                    total: response.data.paginacion.total,
                    totalPaginas: response.data.paginacion.totalPaginas
                }));
            }
            
        } catch (err) {
            console.error('Error cargando préstamos:', err);
            setError(err.message || 'Error al cargar préstamos');
            setPrestamos([]);
        } finally {
            setLoading(false);
        }
    }, [filtros, paginacion.paginaActual, paginacion.limite]);
    
    // Función memoizada para cargar resumen
    const cargarResumen = useCallback(async () => {
        try {
            // Calcular resumen básico desde los datos cargados
            const resumenBasico = {
                totalPrestamos: prestamos.length,
                prestamosActivos: prestamos.filter(p => ['vigente', 'desembolsado'].includes(p.estado)).length,
                prestamosVencidos: prestamos.filter(p => p.estado === 'vencido').length,
                prestamosCompletados: prestamos.filter(p => p.estado === 'completado').length,
                prestamosRechazados: prestamos.filter(p => p.estado === 'rechazado').length,
                montoTotal: prestamos.reduce((sum, p) => sum + (parseFloat(p.montoAprobado || p.montoSolicitado || 0)), 0),
                montoActivo: prestamos.filter(p => ['vigente', 'desembolsado'].includes(p.estado))
                                    .reduce((sum, p) => sum + (parseFloat(p.montoAprobado || p.montoSolicitado || 0)), 0)
            };
            
            setResumenPrestamos(resumenBasico);
            
        } catch (err) {
            console.error('Error calculando resumen:', err);
            setResumenPrestamos({
                totalPrestamos: 0,
                prestamosActivos: 0,
                prestamosVencidos: 0,
                prestamosCompletados: 0,
                prestamosRechazados: 0,
                montoTotal: 0,
                montoActivo: 0
            });
        }
    }, [prestamos]);
    
    // Operaciones CRUD memoizadas
    const crearPrestamo = useCallback(async (datosPrestamo) => {
        try {
            setLoading(true);
            await prestamosService.crear(datosPrestamo);
            await cargarPrestamos();
            return { success: true };
        } catch (err) {
            console.error('Error creando préstamo:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [cargarPrestamos]);
    
    const actualizarPrestamo = useCallback(async (id, datosPrestamo) => {
        try {
            setLoading(true);
            await prestamosService.actualizar(id, datosPrestamo);
            await cargarPrestamos();
            return { success: true };
        } catch (err) {
            console.error('Error actualizando préstamo:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [cargarPrestamos]);
    
    const cancelarPrestamo = useCallback(async (prestamo) => {
        try {
            setLoading(true);
            
            const datosActualizacion = {
                ...prestamo,
                estado: 'cancelado',
                observaciones: (prestamo.observaciones || '') + 
                             `\nCancelado el ${new Date().toLocaleDateString()}`
            };
            
            await prestamosService.actualizar(prestamo._id, datosActualizacion);
            await cargarPrestamos();
            return { success: true };
        } catch (err) {
            console.error('Error cancelando préstamo:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [cargarPrestamos]);
    
    // Funciones de filtros memoizadas
    const actualizarFiltros = useCallback((nuevosFiltros) => {
        setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
    }, []);
    
    const limpiarFiltros = useCallback(() => {
        setFiltros({
            estado: '',
            entidadFinanciera: '',
            tipoCredito: '',
            fechaDesde: '',
            fechaHasta: '',
            montoMinimo: '',
            montoMaximo: '',
            busqueda: ''
        });
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
    }, []);
    
    const cambiarPagina = useCallback((nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    }, []);
    
    // Datos filtrados y procesados memoizados
    const prestamosData = useMemo(() => {
        return {
            prestamos,
            loading,
            error,
            total: prestamos.length,
            isEmpty: prestamos.length === 0 && !loading
        };
    }, [prestamos, loading, error]);
    
    // Información de paginación memoizada
    const paginacionInfo = useMemo(() => {
        const inicio = (paginacion.paginaActual - 1) * paginacion.limite + 1;
        const fin = Math.min(paginacion.paginaActual * paginacion.limite, paginacion.total);
        
        return {
            ...paginacion,
            inicio,
            fin,
            hayAnterior: paginacion.paginaActual > 1,
            haySiguiente: paginacion.paginaActual < paginacion.totalPaginas,
            mensaje: `Mostrando ${inicio}-${fin} de ${paginacion.total} préstamos`
        };
    }, [paginacion]);
    
    // Efecto para cargar datos iniciales
    useEffect(() => {
        cargarPrestamos();
    }, [cargarPrestamos]);
    
    // Efecto para calcular resumen cuando cambian los datos
    useEffect(() => {
        if (prestamos.length > 0) {
            cargarResumen();
        }
    }, [cargarResumen]);
    
    return {
        // Datos principales
        prestamosData,
        resumenPrestamos,
        
        // Estados de filtros y paginación
        filtros,
        paginacionInfo,
        
        // Operaciones CRUD
        crearPrestamo,
        actualizarPrestamo,
        cancelarPrestamo,
        
        // Funciones de filtros
        actualizarFiltros,
        limpiarFiltros,
        cambiarPagina,
        
        // Funciones de carga
        cargarPrestamos,
        cargarResumen,
        
        // Estados de control
        loading,
        error
    };
};
