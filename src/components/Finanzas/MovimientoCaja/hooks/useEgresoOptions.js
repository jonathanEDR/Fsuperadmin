import { useState, useEffect, useCallback, useMemo } from 'react';
import { movimientosCajaService } from '../../../../services/movimientosCajaService';

/**
 * Hook optimizado para cargar y gestionar opciones del modal de egreso
 * Implementa memoización y carga eficiente de datos
 */
export const useEgresoOptions = (isOpen) => {
    const [categorias, setCategorias] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [cuentasBancarias, setCuentasBancarias] = useState([]);
    const [loading, setLoading] = useState(false);

    // Memoizar opciones por defecto
    const defaultOptions = useMemo(() => ({
        metodosPago: [
            { value: 'efectivo', label: 'Efectivo', icon: '💵' },
            { value: 'yape', label: 'Yape', icon: '📱' },
            { value: 'plin', label: 'Plin', icon: '💳' },
            { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
            { value: 'tarjeta', label: 'Tarjeta', icon: '💳' }
        ],
        categorias: {
            egresos: [
                { value: 'gasto_operativo', label: 'Gasto Operativo' },
                { value: 'compra_inventario', label: 'Compra de Inventario' },
                { value: 'pago_proveedor', label: 'Pago a Proveedor' },
                { value: 'gastos_servicios', label: 'Gastos de Servicios' },
                { value: 'gastos_personal', label: 'Gastos de Personal' },
                { value: 'prestamo_otorgado', label: 'Préstamo Otorgado' },
                { value: 'otros_egresos', label: 'Otros Egresos' }
            ]
        }
    }), []);

    // Función optimizada para cargar opciones
    const cargarOpciones = useCallback(async () => {
        if (!isOpen) return;
        
        try {
            setLoading(true);
            console.log('🔍 [useEgresoOptions] Iniciando carga de opciones...');
            
            // Establecer opciones por defecto primero
            setMetodosPago(defaultOptions.metodosPago);
            setCategorias(defaultOptions.categorias);
            
            // Cargar datos del servidor en paralelo
            console.log('🔍 [useEgresoOptions] Cargando datos del servidor...');
            const [categoriasRes, metodosRes, cuentasRes] = await Promise.all([
                movimientosCajaService.obtenerCategorias(),
                movimientosCajaService.obtenerMetodosPago(),
                movimientosCajaService.obtenerCuentasDisponibles()
            ]);
            
            console.log('📊 [useEgresoOptions] Respuesta cuentas bancarias:', cuentasRes);
            
            // Actualizar con datos del servidor si están disponibles
            if (categoriasRes.success && categoriasRes.data) {
                setCategorias(movimientosCajaService.constructor.formatearCategorias(categoriasRes.data));
            }
            
            if (metodosRes.success && metodosRes.data) {
                setMetodosPago(movimientosCajaService.constructor.formatearMetodosPago());
            }

            if (cuentasRes.success && cuentasRes.data) {
                console.log('✅ [useEgresoOptions] Estableciendo cuentas bancarias:', cuentasRes.data);
                const cuentasArray = Array.isArray(cuentasRes.data) ? cuentasRes.data : [];
                setCuentasBancarias(cuentasArray);
                console.log('📊 [useEgresoOptions] Cuentas establecidas:', cuentasArray);
            } else {
                console.log('❌ [useEgresoOptions] Error en respuesta de cuentas:', cuentasRes);
                setCuentasBancarias([]);
            }
        } catch (error) {
            console.error('❌ [useEgresoOptions] Error cargando opciones:', error);
            // Mantener opciones por defecto si hay error
        } finally {
            setLoading(false);
        }
    }, [isOpen, defaultOptions]);

    // Cargar opciones cuando se abre el modal
    useEffect(() => {
        cargarOpciones();
    }, [cargarOpciones]);

    // Memoizar categorías formateadas para egresos
    const categoriasEgresos = useMemo(() => {
        return categorias.egresos || defaultOptions.categorias.egresos;
    }, [categorias, defaultOptions.categorias.egresos]);

    // Memoizar si hay cuentas bancarias disponibles
    const tieneCuentasBancarias = useMemo(() => {
        return Array.isArray(cuentasBancarias) && cuentasBancarias.length > 0;
    }, [cuentasBancarias]);

    return {
        categorias: categoriasEgresos,
        metodosPago,
        cuentasBancarias,
        loading,
        tieneCuentasBancarias,
        recargarOpciones: cargarOpciones
    };
};
