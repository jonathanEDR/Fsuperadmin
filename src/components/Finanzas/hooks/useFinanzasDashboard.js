import { useState, useEffect, useCallback, useMemo } from 'react';
import FinanzasService from '../../../services/finanzasService';

/**
 * Hook especializado para el dashboard de finanzas
 * Gestiona estadísticas, alertas y estado del dashboard principal
 */
export const useFinanzasDashboard = () => {
    const [estadisticas, setEstadisticas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

    // Cargar estadísticas del dashboard
    const cargarEstadisticas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Cargar datos en paralelo para mejor rendimiento
            const [
                resumenGeneral,
                alertas,
                kpis
            ] = await Promise.all([
                FinanzasService.obtenerResumen(),
                FinanzasService.obtenerAlertas(),
                FinanzasService.obtenerKPIs()
            ]);

            // Combinar todos los datos en un objeto unificado
            const estadisticasCompletas = {
                resumen: resumenGeneral,
                alertas: alertas,
                alertasImportantes: alertas?.importantes || [],
                tareasPendientes: [], // Será implementado cuando esté disponible
                kpis: kpis,
                // Datos adicionales basados en KPIs
                movimientos: {
                    pendientes: kpis?.movimientosPendientes || 0
                },
                cuentas: {
                    alertas: kpis?.alertasCuentas || 0
                },
                prestamos: {
                    vencimientos: kpis?.prestamosVencimientos || 0,
                    garantiasRevision: kpis?.garantiasRevision || 0
                },
                garantias: {
                    revision: kpis?.garantiasRevision || 0
                },
                pagos: {
                    pendientes: kpis?.pagosPendientes || 0
                }
            };

            setEstadisticas(estadisticasCompletas);
            setUltimaActualizacion(new Date());
            
        } catch (err) {
            console.error('Error cargando estadísticas del dashboard:', err);
            setError('Error al cargar las estadísticas del dashboard');
            
            // Datos de fallback para evitar crashes
            setEstadisticas({
                resumen: {
                    ingresosMes: 0,
                    egresosMes: 0,
                    balanceMes: 0,
                    totalCuentas: 0
                },
                alertas: {
                    dashboard: 0,
                    importantes: []
                },
                tareasPendientes: [],
                movimientos: { pendientes: 0 },
                cuentas: { alertas: 0 },
                prestamos: { vencimientos: 0 },
                garantias: { revision: 0 },
                pagos: { pendientes: 0 }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Recargar datos manualmente
    const recargarDatos = useCallback(() => {
        cargarEstadisticas();
    }, [cargarEstadisticas]);

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarEstadisticas();
    }, [cargarEstadisticas]);

    // Auto-refresh cada 5 minutos
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading) {
                cargarEstadisticas();
            }
        }, 5 * 60 * 1000); // 5 minutos

        return () => clearInterval(interval);
    }, [cargarEstadisticas, loading]);

    // Estadísticas procesadas para las cards
    const estadisticasProcesadas = useMemo(() => {
        if (!estadisticas?.resumen) return null;

        const { resumen } = estadisticas;
        
        return [
            {
                title: 'Ingresos del Mes',
                value: resumen.ingresosMes || 0,
                format: 'currency',
                icon: 'fa-arrow-up',
                color: 'success',
                trend: resumen.tendenciaIngresos,
                description: 'Total de ingresos registrados'
            },
            {
                title: 'Egresos del Mes',
                value: resumen.egresosMes || 0,
                format: 'currency',
                icon: 'fa-arrow-down',
                color: 'danger',
                trend: resumen.tendenciaEgresos,
                description: 'Total de egresos registrados'
            },
            {
                title: 'Balance del Mes',
                value: resumen.balanceMes || 0,
                format: 'currency',
                icon: 'fa-balance-scale',
                color: (resumen.balanceMes || 0) >= 0 ? 'success' : 'danger',
                trend: resumen.tendenciaBalance,
                description: 'Diferencia entre ingresos y egresos'
            },
            {
                title: 'Cuentas Bancarias',
                value: resumen.totalCuentas || 0,
                format: 'number',
                icon: 'fa-university',
                color: 'info',
                description: 'Total de cuentas bancarias activas'
            }
        ];
    }, [estadisticas]);

    return {
        estadisticas,
        estadisticasProcesadas,
        loading,
        error,
        ultimaActualizacion,
        recargarDatos
    };
};
