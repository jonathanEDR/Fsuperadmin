import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente memoizado para accesos rápidos del dashboard
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
const DashboardQuickAccess = memo(({ accesos, currentPath, loading }) => {
    
    // Determinar si un acceso está activo
    const isActiveAccess = useMemo(() => (accessTo) => {
        if (!accessTo) return currentPath.endsWith('/finanzas') || currentPath.endsWith('/finanzas/');
        return currentPath.includes(accessTo);
    }, [currentPath]);

    // Renderizar badge si existe
    const renderBadge = (badge) => {
        if (!badge || badge === 0) return null;
        
        return (
            <span className="badge badge-danger badge-pill position-absolute" 
                  style={{ top: '10px', right: '10px', fontSize: '0.75rem' }}>
                {badge > 99 ? '99+' : badge}
            </span>
        );
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card shadow mb-4">
                    <div className="card-header py-3">
                        <h6 className="m-0 font-weight-bold text-primary">
                            <i className="fas fa-tachometer-alt mr-2"></i>
                            Accesos Rápidos
                        </h6>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {accesos.map((acceso, index) => {
                                const isActive = isActiveAccess(acceso.to);
                                const baseClasses = `card border-0 shadow-sm h-100 transition-all duration-200 position-relative ${acceso.color}`;
                                const activeClasses = isActive ? 'ring-2 ring-blue-500 transform scale-105' : 'hover:transform hover:scale-105';
                                
                                return (
                                    <div key={index} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 mb-3">
                                        <Link 
                                            to={`/finanzas/${acceso.to}`} 
                                            className="text-decoration-none"
                                            style={{ position: 'relative' }}
                                        >
                                            <div className={`${baseClasses} ${activeClasses}`}>
                                                <div className="card-body text-center p-3">
                                                    {/* Badge de notificaciones */}
                                                    {renderBadge(acceso.badge)}
                                                    
                                                    {/* Icono */}
                                                    <div className="mb-3">
                                                        <span 
                                                            className="d-inline-block" 
                                                            style={{ fontSize: '2.5rem' }}
                                                            role="img" 
                                                            aria-label={acceso.label}
                                                        >
                                                            {loading ? (
                                                                <div className="spinner-border text-primary" role="status">
                                                                    <span className="sr-only">Cargando...</span>
                                                                </div>
                                                            ) : (
                                                                acceso.icon
                                                            )}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Título */}
                                                    <h6 className="card-title mb-2 font-weight-bold" style={{ fontSize: '0.9rem' }}>
                                                        {acceso.label}
                                                    </h6>
                                                    
                                                    {/* Descripción */}
                                                    <p className="card-text text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                                                        {acceso.description}
                                                    </p>
                                                    
                                                    {/* Indicador de estado activo */}
                                                    {isActive && (
                                                        <div className="mt-2">
                                                            <span className="badge badge-primary badge-pill">
                                                                <i className="fas fa-check mr-1"></i>
                                                                Activo
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Información adicional */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="alert alert-info mb-0" role="alert">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    <strong>Tip:</strong> Utiliza estos accesos rápidos para navegar eficientemente por las diferentes secciones del módulo de finanzas.
                                    {accesos.some(a => a.badge > 0) && (
                                        <span className="ml-2">
                                            Los números rojos indican elementos que requieren atención.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

DashboardQuickAccess.displayName = 'DashboardQuickAccess';

export default DashboardQuickAccess;
