import React, { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Navegación unificada para el módulo de finanzas
 * Componente reutilizable que aparece en todos los submódulos
 */
const FinanzasNavigation = memo(({ currentModule = '', showStats = false, estadisticas = null }) => {
    const location = useLocation();
    
    // Configuración de módulos de finanzas
    const modulosFinanzas = useMemo(() => [
        {
            id: 'dashboard',
            label: 'Dashboard',
            to: '/finanzas',
            icon: '📊',
            color: 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 border-blue-200',
            description: 'Resumen financiero general',
            badge: estadisticas?.alertas?.dashboard || null
        },
        {
            id: 'movimientos-caja',
            label: 'Movimientos',
            to: '/finanzas/movimientos-caja',
            icon: '💸',
            color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 text-emerald-800 border-emerald-200',
            description: 'Ingresos y egresos',
            badge: estadisticas?.movimientos?.pendientes || null
        },
        {
            id: 'cuentas-bancarias',
            label: 'Cuentas',
            to: '/finanzas/cuentas-bancarias',
            icon: '🏦',
            color: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border-green-200',
            description: 'Cuentas bancarias',
            badge: estadisticas?.cuentas?.alertas || null
        },
        {
            id: 'prestamos',
            label: 'Préstamos',
            to: '/finanzas/prestamos',
            icon: '💰',
            color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-800 border-yellow-200',
            description: 'Gestión de préstamos',
            badge: estadisticas?.prestamos?.vencimientos || null
        },
        {
            id: 'garantias',
            label: 'Garantías',
            to: '/finanzas/garantias',
            icon: '🛡️',
            color: 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-800 border-purple-200',
            description: 'Gestión de garantías',
            badge: estadisticas?.garantias?.revision || null
        },
        {
            id: 'pagos-financiamiento',
            label: 'Pagos',
            to: '/finanzas/pagos-financiamiento',
            icon: '💳',
            color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-800 border-indigo-200',
            description: 'Pagos y financiamiento',
            badge: estadisticas?.pagos?.pendientes || null
        }
    ], [estadisticas]);

    // Determinar módulo activo
    const moduloActivo = useMemo(() => {
        const path = location.pathname;
        
        if (path.includes('movimientos-caja')) return 'movimientos-caja';
        if (path.includes('cuentas-bancarias')) return 'cuentas-bancarias';
        if (path.includes('prestamos')) return 'prestamos';
        if (path.includes('garantias')) return 'garantias';
        if (path.includes('pagos-financiamiento')) return 'pagos-financiamiento';
        if (path.endsWith('/finanzas')) return 'dashboard';
        
        return currentModule;
    }, [location.pathname, currentModule]);

    // Renderizar badge de notificación
    const renderBadge = (badge) => {
        if (!badge || badge === 0) return null;
        
        return (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {badge > 99 ? '99+' : badge}
            </span>
        );
    };

    // Determinar si un módulo está activo
    const isActive = (moduloId) => moduloActivo === moduloId;

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header de navegación */}
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            <i className="fas fa-chart-line mr-2 text-blue-600"></i>
                            Finanzas
                        </h1>
                        
                        {/* Breadcrumb del módulo actual */}
                        {moduloActivo !== 'dashboard' && (
                            <nav className="flex" aria-label="Breadcrumb">
                                <ol className="flex items-center space-x-2">
                                    <li>
                                        <Link 
                                            to="/finanzas" 
                                            className="text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li className="text-gray-500">
                                        <i className="fas fa-chevron-right"></i>
                                    </li>
                                    <li className="text-gray-900 font-medium">
                                        {modulosFinanzas.find(m => m.id === moduloActivo)?.label || 'Módulo'}
                                    </li>
                                </ol>
                            </nav>
                        )}
                    </div>

                    {/* Estadísticas rápidas (opcional) */}
                    {showStats && estadisticas && (
                        <div className="hidden md:flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-green-600">
                                <i className="fas fa-arrow-up mr-1"></i>
                                <span className="font-medium">
                                    {estadisticas.resumen?.ingresosMes || 0}
                                </span>
                            </div>
                            <div className="flex items-center text-red-600">
                                <i className="fas fa-arrow-down mr-1"></i>
                                <span className="font-medium">
                                    {estadisticas.resumen?.egresosMes || 0}
                                </span>
                            </div>
                            <div className={`flex items-center ${
                                (estadisticas.resumen?.balanceMes || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                <i className="fas fa-balance-scale mr-1"></i>
                                <span className="font-medium">
                                    {estadisticas.resumen?.balanceMes || 0}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navegación de módulos */}
                <div className="flex space-x-1 overflow-x-auto pb-4">
                    {modulosFinanzas.map((modulo) => {
                        const activo = isActive(modulo.id);
                        
                        return (
                            <Link
                                key={modulo.id}
                                to={modulo.to}
                                className={`
                                    relative flex-shrink-0 flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                    ${activo 
                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-md' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-2 border-transparent'
                                    }
                                `}
                                title={modulo.description}
                            >
                                {/* Badge de notificaciones */}
                                {renderBadge(modulo.badge)}
                                
                                {/* Icono */}
                                <span className="text-lg mr-2" role="img" aria-label={modulo.label}>
                                    {modulo.icon}
                                </span>
                                
                                {/* Label */}
                                <span className="whitespace-nowrap">
                                    {modulo.label}
                                </span>
                                
                                {/* Indicador de activo */}
                                {activo && (
                                    <span className="ml-2 h-2 w-2 bg-blue-500 rounded-full"></span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

FinanzasNavigation.displayName = 'FinanzasNavigation';

export default FinanzasNavigation;
