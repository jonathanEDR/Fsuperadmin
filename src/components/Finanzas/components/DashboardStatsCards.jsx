import React, { memo } from 'react';

/**
 * Componente memoizado para las tarjetas de estadísticas
 * Optimizado para máximo rendimiento con React.memo
 */
const DashboardStatsCards = memo(({ estadisticas, loading }) => {
    
    // Configuración de las tarjetas de estadísticas
    const stats = [
        {
            title: 'Ingresos del Mes',
            value: estadisticas?.resumen?.ingresosMes || 0,
            format: 'currency',
            icon: 'fa-arrow-up',
            color: 'success',
            borderColor: 'border-left-success',
            trend: estadisticas?.resumen?.tendenciaIngresos
        },
        {
            title: 'Egresos del Mes',
            value: estadisticas?.resumen?.egresosMes || 0,
            format: 'currency',
            icon: 'fa-arrow-down',
            color: 'danger',
            borderColor: 'border-left-danger',
            trend: estadisticas?.resumen?.tendenciaEgresos
        },
        {
            title: 'Balance del Mes',
            value: estadisticas?.resumen?.balanceMes || 0,
            format: 'currency',
            icon: 'fa-balance-scale',
            color: (estadisticas?.resumen?.balanceMes || 0) >= 0 ? 'success' : 'danger',
            borderColor: (estadisticas?.resumen?.balanceMes || 0) >= 0 ? 'border-left-success' : 'border-left-danger',
            trend: estadisticas?.resumen?.tendenciaBalance
        },
        {
            title: 'Cuentas Bancarias',
            value: estadisticas?.resumen?.totalCuentas || 0,
            format: 'number',
            icon: 'fa-university',
            color: 'info',
            borderColor: 'border-left-info'
        }
    ];

    const formatValue = (value, format) => {
        if (format === 'currency') {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
            }).format(value);
        }
        if (format === 'number') {
            return new Intl.NumberFormat('es-ES').format(value);
        }
        return value;
    };

    const renderTrend = (trend) => {
        if (!trend) return null;
        
        const { percentage, direction } = trend;
        const isPositive = direction === 'up';
        
        return (
            <div className={`text-xs font-weight-bold ${isPositive ? 'text-success' : 'text-danger'} text-uppercase mb-1`}>
                <i className={`fas fa-${isPositive ? 'arrow-up' : 'arrow-down'} mr-1`}></i>
                {Math.abs(percentage)}% {isPositive ? 'incremento' : 'decremento'}
            </div>
        );
    };

    return (
        <div className="row">
            {stats.map((stat, index) => (
                <div key={index} className="col-xl-3 col-md-6 mb-4">
                    <div className={`card ${stat.borderColor} shadow h-100 py-2`}>
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className={`text-xs font-weight-bold text-${stat.color} text-uppercase mb-1`}>
                                        {stat.title}
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {loading ? (
                                            <div className="placeholder-glow">
                                                <span className="placeholder col-8"></span>
                                            </div>
                                        ) : (
                                            formatValue(stat.value, stat.format)
                                        )}
                                    </div>
                                    {renderTrend(stat.trend)}
                                </div>
                                <div className="col-auto">
                                    <i className={`fas ${stat.icon} fa-2x text-gray-300`}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
});

DashboardStatsCards.displayName = 'DashboardStatsCards';

export default DashboardStatsCards;
