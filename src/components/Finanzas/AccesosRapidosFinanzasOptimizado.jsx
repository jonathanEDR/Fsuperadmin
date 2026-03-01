import React, { memo, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, AlertTriangle, CheckCircle, ListTodo, BarChart3, ArrowLeftRight, Landmark, Coins, Shield } from 'lucide-react';
import { useFinanzasDashboard } from './hooks/useFinanzasDashboard';
import DashboardStatsCards from './components/DashboardStatsCards';
import DashboardQuickAccess from './components/DashboardQuickAccess';
import FinanzasLayout from './common/FinanzasLayout';

/**
 * Dashboard principal optimizado para módulo de finanzas
 * Completamente refactorizado con hooks especializados y componentes memoizados
 * Aplicación de mejores prácticas para máximo rendimiento
 */
const AccesosRapidosFinanzasOptimizado = memo(() => {
    
    const location = useLocation();
    
    // Hook especializado para datos del dashboard
    const {
        estadisticas,
        loading,
        error,
        ultimaActualizacion,
        recargarDatos
    } = useFinanzasDashboard();
    
    // Configuración de accesos rápidos memoizada
    const accesosRapidos = useMemo(() => [
        {
            label: 'Dashboard Financiero',
            to: '',
            icon: BarChart3,
            color: 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 border-blue-200',
            description: 'Resumen financiero general',
            badge: estadisticas?.alertas?.dashboard || null
        },
        {
            label: 'Movimientos de Caja',
            to: 'movimientos-caja',
            icon: ArrowLeftRight,
            color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-800 border-emerald-200',
            description: 'Control de ingresos y egresos',
            badge: estadisticas?.movimientos?.pendientes || null
        },
        {
            label: 'Cuentas Bancarias',
            to: 'cuentas-bancarias',
            icon: Landmark,
            color: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border-green-200',
            description: 'Gestionar cuentas bancarias',
            badge: estadisticas?.cuentas?.alertas || null
        },
        {
            label: 'Gestión de Préstamos',
            to: 'prestamos',
            icon: Coins,
            color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-800 border-yellow-200',
            description: 'Administrar préstamos',
            badge: estadisticas?.prestamos?.vencimientos || null
        },
        {
            label: 'Garantías',
            to: 'garantias',
            icon: Shield,
            color: 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-800 border-purple-200',
            description: 'Gestionar garantías',
            badge: estadisticas?.garantias?.revision || null
        }
    ], [estadisticas]);
    
    // Función memoizada para recargar datos
    const handleRefresh = useCallback(() => {
        recargarDatos();
    }, [recargarDatos]);
    
    // Determinar si estamos en la ruta raíz del dashboard
    const isMainDashboard = location.pathname.endsWith('/finanzas') || location.pathname.endsWith('/finanzas/');
    
    if (loading && !estadisticas) {
        return (
            <div className="container-fluid">
                <div className="d-sm-flex align-items-center justify-content-between mb-4">
                    <h1 className="h3 mb-0 text-gray-800">
                        <TrendingUp size={16} className="mr-2 inline" />
                        Dashboard Finanzas
                    </h1>
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Cargando...</span>
                    </div>
                </div>
                
                {/* Skeleton cards */}
                <div className="row">
                    {[1, 2, 3, 4].map(index => (
                        <div key={index} className="col-xl-3 col-md-6 mb-4">
                            <div className="card border-left-primary shadow h-100 py-2">
                                <div className="card-body">
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-6"></span>
                                        <br />
                                        <span className="placeholder col-8"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <FinanzasLayout 
            currentModule="dashboard"
            showStats={true}
            loading={loading && !estadisticas}
        >
            {/* Mostrar errores si existen */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <AlertTriangle size={16} className="mr-2 inline" />
                    {error}
                    <button type="button" className="close" data-dismiss="alert">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            )}
            
            {/* Tarjetas de estadísticas principales */}
            {estadisticas && (
                <DashboardStatsCards 
                    estadisticas={estadisticas} 
                    loading={loading} 
                />
            )}
            
            {/* Accesos rápidos */}
            <DashboardQuickAccess 
                accesos={accesosRapidos}
                currentPath={location.pathname}
                loading={loading}
            />
            
            {/* Información adicional para el dashboard principal */}
            {estadisticas && (
                <div className="row mt-4">
                    <div className="col-lg-6">
                        <div className="card shadow mb-4">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <AlertTriangle size={16} className="mr-2 inline" />
                                    Alertas Importantes
                                </h6>
                            </div>
                            <div className="card-body">
                                {estadisticas.alertasImportantes?.length > 0 ? (
                                    <ul className="list-unstyled mb-0">
                                        {estadisticas.alertasImportantes.map((alerta, index) => (
                                            <li key={index} className={`mb-2 p-2 rounded alert-${alerta.tipo}`}>
                                                <i className={`fas fa-${alerta.icon} mr-2`}></i>
                                                {alerta.mensaje}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted mb-0">
                                        <CheckCircle size={16} className="text-green-500 mr-2 inline" />
                                        No hay alertas pendientes
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-lg-6">
                        <div className="card shadow mb-4">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <ListTodo size={16} className="mr-2 inline" />
                                    Tareas Pendientes
                                </h6>
                            </div>
                            <div className="card-body">
                                {estadisticas.tareasPendientes?.length > 0 ? (
                                    <ul className="list-unstyled mb-0">
                                        {estadisticas.tareasPendientes.map((tarea, index) => (
                                            <li key={index} className="mb-2 d-flex justify-content-between align-items-center">
                                                <span>
                                                    <i className={`fas fa-${tarea.icon} mr-2 text-${tarea.color}`}></i>
                                                    {tarea.titulo}
                                                </span>
                                                <span className={`badge badge-${tarea.prioridad}`}>
                                                    {tarea.cantidad}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted mb-0">
                                        <CheckCircle size={16} className="text-green-500 mr-2 inline" />
                                        Todas las tareas completadas
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </FinanzasLayout>
    );
});

AccesosRapidosFinanzasOptimizado.displayName = 'AccesosRapidosFinanzasOptimizado';

export default AccesosRapidosFinanzasOptimizado;
