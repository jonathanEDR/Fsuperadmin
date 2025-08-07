import React, { memo, useCallback } from 'react';
import FilterBadges from './FilterBadges';

/**
 * Componente optimizado para filtros y búsqueda de cuentas bancarias
 * Memoizado para evitar renders innecesarios
 * Separado para mejor modularidad y control de estado
 */
const CuentasBancariasFilters = memo(({ 
    filters, 
    onUpdateFilters, 
    onClearFilters, 
    loading,
    formOptions 
}) => {
    
    // Manejar cambios en los filtros de forma optimizada
    const handleFilterChange = useCallback((field, value) => {
        onUpdateFilters({ [field]: value });
    }, [onUpdateFilters]);
    
    // Manejar cambio en el campo de búsqueda con debounce implícito
    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        handleFilterChange('search', value);
    }, [handleFilterChange]);
    
    // Verificar si hay filtros activos
    const hasActiveFilters = Object.values(filters).some(value => 
        value !== '' && value !== null && value !== undefined
    );
    
    return (
        <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 className="m-0 font-weight-bold text-primary">
                    <i className="fas fa-filter mr-2"></i>
                    Filtros y Búsqueda
                </h6>
                {hasActiveFilters && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={onClearFilters}
                        disabled={loading}
                        title="Limpiar todos los filtros"
                    >
                        <i className="fas fa-times mr-1"></i>
                        Limpiar
                    </button>
                )}
            </div>
            <div className="card-body">
                <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
                    {/* Campo de búsqueda */}
                    <div className="col-md-6 col-lg-4">
                        <label htmlFor="search" className="form-label small font-weight-bold">
                            Búsqueda General
                        </label>
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="fas fa-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                id="search"
                                placeholder="Nombre, banco, titular..."
                                value={filters.search || ''}
                                onChange={handleSearchChange}
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    {/* Filtro por banco */}
                    <div className="col-md-6 col-lg-2">
                        <label htmlFor="banco" className="form-label small font-weight-bold">
                            Banco
                        </label>
                        <select
                            className="form-select"
                            id="banco"
                            value={filters.banco || ''}
                            onChange={(e) => handleFilterChange('banco', e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Todos los bancos</option>
                            {formOptions?.bancos?.map(banco => (
                                <option key={banco.value} value={banco.value}>
                                    {banco.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Filtro por moneda */}
                    <div className="col-md-4 col-lg-2">
                        <label htmlFor="moneda" className="form-label small font-weight-bold">
                            Moneda
                        </label>
                        <select
                            className="form-select"
                            id="moneda"
                            value={filters.moneda || ''}
                            onChange={(e) => handleFilterChange('moneda', e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Todas las monedas</option>
                            {formOptions?.monedas?.map(moneda => (
                                <option key={moneda.value} value={moneda.value}>
                                    {moneda.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Filtro por tipo de cuenta */}
                    <div className="col-md-4 col-lg-2">
                        <label htmlFor="tipoCuenta" className="form-label small font-weight-bold">
                            Tipo de Cuenta
                        </label>
                        <select
                            className="form-select"
                            id="tipoCuenta"
                            value={filters.tipoCuenta || ''}
                            onChange={(e) => handleFilterChange('tipoCuenta', e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Todos los tipos</option>
                            {formOptions?.tiposCuenta?.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>
                                    {tipo.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Filtro por estado */}
                    <div className="col-md-4 col-lg-2">
                        <label htmlFor="activa" className="form-label small font-weight-bold">
                            Estado
                        </label>
                        <select
                            className="form-select"
                            id="activa"
                            value={filters.activa === null ? '' : filters.activa.toString()}
                            onChange={(e) => {
                                const value = e.target.value;
                                handleFilterChange('activa', value === '' ? null : value === 'true');
                            }}
                            disabled={loading}
                        >
                            <option value="">Todos los estados</option>
                            <option value="true">Activas</option>
                            <option value="false">Inactivas</option>
                        </select>
                    </div>
                </form>
                
                {/* Badges de filtros activos */}
                {hasActiveFilters && (
                    <FilterBadges
                        filters={filters}
                        formOptions={formOptions}
                        onRemoveFilter={handleFilterChange}
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
});

CuentasBancariasFilters.displayName = 'CuentasBancariasFilters';

export default CuentasBancariasFilters;
