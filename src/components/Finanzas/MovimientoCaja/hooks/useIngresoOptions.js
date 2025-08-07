import { useState, useEffect, useCallback, useMemo } from 'react';
import { movimientosCajaService } from '../../../../services/movimientosCajaService';

/**
 * Hook optimizado para cargar y gestionar opciones del modal de ingreso
 * Implementa memoización y carga eficiente de datos específicos para ingresos
 */
export const useIngresoOptions = (isOpen) => {
    const [categorias, setCategorias] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [cuentasBancarias, setCuentasBancarias] = useState([]);
    const [loading, setLoading] = useState(false);

    // Memoizar opciones por defecto específicas para ingresos
    const defaultOptions = useMemo(() => ({
        metodosPago: [
            { value: 'efectivo', label: 'Efectivo', icon: '💵' },
            { value: 'yape', label: 'Yape', icon: '📱' },
            { value: 'plin', label: 'Plin', icon: '📲' },
            { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
            { value: 'tarjeta', label: 'Tarjeta', icon: '💳' }
        ],
        categorias: {
            ingresos: [
                { value: 'venta_producto', label: 'Venta de Productos' },
                { value: 'venta_servicio', label: 'Venta de Servicios' },
                { value: 'cobro_cliente', label: 'Cobro a Cliente' },
                { value: 'prestamo_recibido', label: 'Préstamo Recibido' },
                { value: 'devolucion', label: 'Devolución' },
                { value: 'otros_ingresos', label: 'Otros Ingresos' }
            ]
        }
    }), []);

    // Función helper para formatear labels de categorías
    const formatearLabelCategoria = useCallback((categoria) => {
        const labels = {
            'venta_producto': 'Venta de Productos',
            'venta_servicio': 'Venta de Servicios',
            'cobro_cliente': 'Cobro a Cliente',
            'prestamo_recibido': 'Préstamo Recibido',
            'devolucion': 'Devolución',
            'otros_ingresos': 'Otros Ingresos'
        };
        return labels[categoria] || categoria;
    }, []);

    // Función optimizada para cargar opciones
    const cargarOpciones = useCallback(async () => {
        if (!isOpen) return;
        
        try {
            setLoading(true);
            console.log('🔍 [useIngresoOptions] Iniciando carga de opciones...');
            
            // Establecer opciones por defecto primero
            setMetodosPago(defaultOptions.metodosPago);
            setCategorias(defaultOptions.categorias.ingresos);
            
            // Cargar datos del servidor en paralelo
            console.log('🔍 [useIngresoOptions] Cargando datos del servidor...');
            const [categoriasRes, metodosRes, cuentasRes] = await Promise.all([
                movimientosCajaService.obtenerCategorias(),
                movimientosCajaService.obtenerMetodosPago(),
                movimientosCajaService.obtenerCuentasDisponibles()
            ]);
            
            console.log('📊 [useIngresoOptions] Respuesta categorías:', categoriasRes);
            console.log('📊 [useIngresoOptions] Respuesta cuentas bancarias:', cuentasRes);
            
            // Actualizar categorías si están disponibles del servidor
            if (categoriasRes.success && categoriasRes.data && categoriasRes.data.ingresos) {
                const categoriasFormateadas = categoriasRes.data.ingresos.map(cat => ({
                    value: cat,
                    label: formatearLabelCategoria(cat)
                }));
                setCategorias(categoriasFormateadas);
                console.log('✅ [useIngresoOptions] Categorías actualizadas desde servidor');
            }
            
            // Actualizar métodos de pago si están disponibles
            if (metodosRes.success && metodosRes.data && Array.isArray(metodosRes.data)) {
                const metodosFormateados = metodosRes.data.map(metodo => ({
                    value: metodo.value || metodo.tipo,
                    label: metodo.label || metodo.nombre,
                    icon: metodo.icon || '💳'
                }));
                setMetodosPago(metodosFormateados);
                console.log('✅ [useIngresoOptions] Métodos de pago actualizados desde servidor');
            }

            // Actualizar cuentas bancarias
            if (cuentasRes.success && cuentasRes.data) {
                console.log('✅ [useIngresoOptions] Estableciendo cuentas bancarias:', cuentasRes.data);
                const cuentasArray = Array.isArray(cuentasRes.data) ? cuentasRes.data : [];
                setCuentasBancarias(cuentasArray);
                console.log('📊 [useIngresoOptions] Cuentas establecidas:', cuentasArray);
            } else {
                console.log('❌ [useIngresoOptions] Error en respuesta de cuentas:', cuentasRes);
                setCuentasBancarias([]);
            }
        } catch (error) {
            console.error('❌ [useIngresoOptions] Error cargando opciones:', error);
            // Mantener opciones por defecto si hay error
        } finally {
            setLoading(false);
        }
    }, [isOpen, defaultOptions, formatearLabelCategoria]);

    // Cargar opciones cuando se abre el modal
    useEffect(() => {
        cargarOpciones();
    }, [cargarOpciones]);

    // Memoizar si hay cuentas bancarias disponibles
    const tieneCuentasBancarias = useMemo(() => {
        return Array.isArray(cuentasBancarias) && cuentasBancarias.length > 0;
    }, [cuentasBancarias]);

    // Memoizar tipos de documento específicos para ingresos
    const tiposDocumento = useMemo(() => [
        { value: 'boleta', label: 'Boleta de Venta' },
        { value: 'factura', label: 'Factura' },
        { value: 'recibo', label: 'Recibo' },
        { value: 'nota_venta', label: 'Nota de Venta' },
        { value: 'otro', label: 'Otro' }
    ], []);

    return {
        categorias,
        metodosPago,
        cuentasBancarias,
        tiposDocumento,
        loading,
        tieneCuentasBancarias,
        recargarOpciones: cargarOpciones,
        formatearLabelCategoria
    };
};
