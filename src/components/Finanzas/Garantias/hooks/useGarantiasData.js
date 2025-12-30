import { useState, useEffect, useCallback, useMemo } from 'react';
import garantiasService from '../../../../services/finanzas/garantiasService';
import { filtrosIniciales, paginacionInicial } from '../garantiasConfig';

/**
 * Hook optimizado para gestión de datos de garantías
 * Maneja carga, filtrado, paginación y operaciones CRUD
 */
export const useGarantiasData = () => {
    // Estados principales
    const [garantias, setGarantias] = useState([]);
    const [resumenGarantias, setResumenGarantias] = useState(null);
    const [estadisticas, setEstadisticas] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados de filtros y paginación
    const [filtros, setFiltros] = useState(filtrosIniciales);
    const [paginacion, setPaginacion] = useState({
        ...paginacionInicial,
        total: 0,
        totalPaginas: 0
    });

    // ==================== FUNCIONES DE CARGA ====================

    /**
     * Cargar garantías con filtros y paginación
     */
    const cargarGarantias = useCallback(async (filtrosCustom = null) => {
        try {
            setLoading(true);
            setError(null);

            const parametros = {
                ...(filtrosCustom || filtros),
                page: paginacion.paginaActual,
                limit: paginacion.limite
            };

            // Limpiar parámetros vacíos
            Object.keys(parametros).forEach(key => {
                if (parametros[key] === '' || parametros[key] === null || parametros[key] === undefined) {
                    delete parametros[key];
                }
            });

            const response = await garantiasService.obtenerTodos(parametros);

            // Manejar diferentes formatos de respuesta
            const garantiasData = response.data?.garantias || response.data?.data || response.data || [];
            const garantiasArray = Array.isArray(garantiasData) ? garantiasData : [];

            setGarantias(garantiasArray);

            // Actualizar paginación si está disponible
            if (response.data?.paginacion) {
                setPaginacion(prev => ({
                    ...prev,
                    total: response.data.paginacion.totalRegistros || response.data.paginacion.total || 0,
                    totalPaginas: response.data.paginacion.totalPaginas || 1
                }));
            }

        } catch (err) {
            console.error('Error cargando garantías:', err);
            setError(err.message || 'Error al cargar garantías');
            setGarantias([]);
        } finally {
            setLoading(false);
        }
    }, [filtros, paginacion.paginaActual, paginacion.limite]);

    /**
     * Cargar resumen de garantías
     */
    const cargarResumen = useCallback(async () => {
        try {
            const response = await garantiasService.obtenerResumen();
            setResumenGarantias(response.data || response);
        } catch (err) {
            console.error('Error cargando resumen de garantías:', err);
            // Calcular resumen desde datos locales como fallback
            const resumenLocal = calcularResumenLocal(garantias);
            setResumenGarantias(resumenLocal);
        }
    }, [garantias]);

    /**
     * Cargar estadísticas de garantías
     */
    const cargarEstadisticas = useCallback(async () => {
        try {
            const response = await garantiasService.obtenerEstadisticas();
            setEstadisticas(response.data || response);
        } catch (err) {
            console.error('Error cargando estadísticas de garantías:', err);
        }
    }, []);

    /**
     * Calcular resumen desde datos locales
     */
    const calcularResumenLocal = (garantiasData) => {
        if (!Array.isArray(garantiasData) || garantiasData.length === 0) {
            return {
                totalGarantias: 0,
                garantiasActivas: 0,
                garantiasPendientes: 0,
                garantiasEjecutadas: 0,
                valorComercialTotal: 0,
                valorTasacionTotal: 0
            };
        }

        return garantiasData.reduce((acc, g) => ({
            totalGarantias: acc.totalGarantias + 1,
            garantiasActivas: acc.garantiasActivas + (g.estado === 'activa' ? 1 : 0),
            garantiasPendientes: acc.garantiasPendientes + (g.estado === 'pendiente_evaluacion' ? 1 : 0),
            garantiasEjecutadas: acc.garantiasEjecutadas + (g.estado === 'ejecutada' ? 1 : 0),
            valorComercialTotal: acc.valorComercialTotal + parseFloat(g.valores?.comercial || 0),
            valorTasacionTotal: acc.valorTasacionTotal + parseFloat(g.valores?.tasacion || 0)
        }), {
            totalGarantias: 0,
            garantiasActivas: 0,
            garantiasPendientes: 0,
            garantiasEjecutadas: 0,
            valorComercialTotal: 0,
            valorTasacionTotal: 0
        });
    };

    // ==================== OPERACIONES CRUD ====================

    /**
     * Crear nueva garantía
     */
    const crearGarantia = useCallback(async (datosGarantia) => {
        try {
            setLoading(true);
            const response = await garantiasService.crear(datosGarantia);
            await cargarGarantias();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error creando garantía:', err);
            return { success: false, error: err.message || 'Error al crear garantía' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    /**
     * Actualizar garantía existente
     */
    const actualizarGarantia = useCallback(async (id, datosGarantia) => {
        try {
            setLoading(true);
            const response = await garantiasService.actualizar(id, datosGarantia);
            await cargarGarantias();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error actualizando garantía:', err);
            return { success: false, error: err.message || 'Error al actualizar garantía' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    /**
     * Eliminar garantía
     */
    const eliminarGarantia = useCallback(async (id) => {
        try {
            setLoading(true);
            await garantiasService.eliminar(id);
            await cargarGarantias();
            return { success: true };
        } catch (err) {
            console.error('Error eliminando garantía:', err);
            return { success: false, error: err.message || 'Error al eliminar garantía' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    // ==================== OPERACIONES DE ESTADO ====================

    /**
     * Aprobar garantía
     */
    const aprobarGarantia = useCallback(async (id, datos = {}) => {
        try {
            setLoading(true);
            const response = await garantiasService.aprobar(id, datos);
            await cargarGarantias();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error aprobando garantía:', err);
            return { success: false, error: err.message || 'Error al aprobar garantía' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    /**
     * Rechazar garantía
     */
    const rechazarGarantia = useCallback(async (id, motivo = '') => {
        try {
            setLoading(true);
            const response = await garantiasService.rechazar(id, motivo);
            await cargarGarantias();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error rechazando garantía:', err);
            return { success: false, error: err.message || 'Error al rechazar garantía' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    /**
     * Activar garantía
     */
    const activarGarantia = useCallback(async (id) => {
        try {
            setLoading(true);
            const response = await garantiasService.activar(id);
            await cargarGarantias();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error activando garantía:', err);
            return { success: false, error: err.message || 'Error al activar garantía' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    /**
     * Liberar garantía
     */
    const liberarGarantia = useCallback(async (id, motivo = '') => {
        try {
            setLoading(true);
            const response = await garantiasService.liberar(id, motivo);
            await cargarGarantias();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error liberando garantía:', err);
            return { success: false, error: err.message || 'Error al liberar garantía' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    /**
     * Ejecutar garantía
     */
    const ejecutarGarantia = useCallback(async (id, datosEjecucion) => {
        try {
            setLoading(true);
            const response = await garantiasService.ejecutar(id, datosEjecucion);
            await cargarGarantias();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error ejecutando garantía:', err);
            return { success: false, error: err.message || 'Error al ejecutar garantía' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    // ==================== OPERACIONES DE SEGUROS ====================

    /**
     * Agregar seguro a garantía
     */
    const agregarSeguro = useCallback(async (garantiaId, datosSeguro) => {
        try {
            setLoading(true);
            const response = await garantiasService.agregarSeguro(garantiaId, datosSeguro);
            await cargarGarantias();
            return { success: true, data: response.data };
        } catch (err) {
            console.error('Error agregando seguro:', err);
            return { success: false, error: err.message || 'Error al agregar seguro' };
        } finally {
            setLoading(false);
        }
    }, [cargarGarantias]);

    // ==================== FUNCIONES DE FILTROS ====================

    /**
     * Actualizar filtros
     */
    const actualizarFiltros = useCallback((nuevosFiltros) => {
        setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
    }, []);

    /**
     * Limpiar filtros
     */
    const limpiarFiltros = useCallback(() => {
        setFiltros(filtrosIniciales);
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
    }, []);

    /**
     * Cambiar página
     */
    const cambiarPagina = useCallback((nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    }, []);

    /**
     * Cambiar límite por página
     */
    const cambiarLimite = useCallback((nuevoLimite) => {
        setPaginacion(prev => ({
            ...prev,
            limite: nuevoLimite,
            paginaActual: 1
        }));
    }, []);

    // ==================== DATOS MEMOIZADOS ====================

    /**
     * Datos de garantías procesados
     */
    const garantiasData = useMemo(() => ({
        garantias,
        loading,
        error,
        total: garantias.length,
        isEmpty: garantias.length === 0 && !loading
    }), [garantias, loading, error]);

    /**
     * Información de paginación
     */
    const paginacionInfo = useMemo(() => {
        const inicio = garantias.length > 0
            ? (paginacion.paginaActual - 1) * paginacion.limite + 1
            : 0;
        const fin = Math.min(
            paginacion.paginaActual * paginacion.limite,
            paginacion.total || garantias.length
        );

        return {
            ...paginacion,
            inicio,
            fin,
            hayAnterior: paginacion.paginaActual > 1,
            haySiguiente: paginacion.paginaActual < paginacion.totalPaginas,
            mensaje: garantias.length > 0
                ? `Mostrando ${inicio}-${fin} de ${paginacion.total || garantias.length} garantías`
                : 'No hay garantías para mostrar'
        };
    }, [paginacion, garantias.length]);

    /**
     * Resumen calculado desde garantías locales
     */
    const resumenCalculado = useMemo(() => {
        return calcularResumenLocal(garantias);
    }, [garantias]);

    // ==================== EFECTOS ====================

    // Cargar datos iniciales
    useEffect(() => {
        cargarGarantias();
    }, [cargarGarantias]);

    // Cargar resumen cuando cambian las garantías
    useEffect(() => {
        if (garantias.length > 0) {
            cargarResumen();
        }
    }, [garantias.length, cargarResumen]);

    // ==================== RETURN ====================

    return {
        // Datos principales
        garantiasData,
        garantias,
        resumenGarantias: resumenGarantias || resumenCalculado,
        estadisticas,

        // Estados
        loading,
        error,

        // Filtros y paginación
        filtros,
        paginacionInfo,

        // Operaciones CRUD
        crearGarantia,
        actualizarGarantia,
        eliminarGarantia,

        // Operaciones de estado
        aprobarGarantia,
        rechazarGarantia,
        activarGarantia,
        liberarGarantia,
        ejecutarGarantia,

        // Operaciones de seguros
        agregarSeguro,

        // Funciones de filtros
        actualizarFiltros,
        limpiarFiltros,
        cambiarPagina,
        cambiarLimite,

        // Funciones de carga
        cargarGarantias,
        cargarResumen,
        cargarEstadisticas,

        // Utilidades
        calcularResumenLocal
    };
};

export default useGarantiasData;
