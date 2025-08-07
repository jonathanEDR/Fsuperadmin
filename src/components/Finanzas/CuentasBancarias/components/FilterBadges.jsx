import React, { memo } from 'react';

/**
 * Componente para mostrar badges de filtros activos
 * Separado para mejor modularidad y reutilización
 */
const FilterBadges = memo(({ filters, formOptions, onRemoveFilter, loading }) => {
    
    return (
        <div className="mt-3">
            <div className="d-flex flex-wrap gap-2">
                <span className="small text-muted me-2">Filtros activos:</span>
                
                {filters.search && (
                    <span className="badge bg-primary">
                        Búsqueda: "{filters.search}"
                        <button
                            type="button"
                            className="btn-close btn-close-white ms-1"
                            style={{ fontSize: '0.65em' }}
                            onClick={() => onRemoveFilter('search', '')}
                            disabled={loading}
                        ></button>
                    </span>
                )}
                
                {filters.banco && (
                    <span className="badge bg-info">
                        Banco: {formOptions?.bancos?.find(b => b.value === filters.banco)?.label || filters.banco}
                        <button
                            type="button"
                            className="btn-close btn-close-white ms-1"
                            style={{ fontSize: '0.65em' }}
                            onClick={() => onRemoveFilter('banco', '')}
                            disabled={loading}
                        ></button>
                    </span>
                )}
                
                {filters.moneda && (
                    <span className="badge bg-success">
                        Moneda: {formOptions?.monedas?.find(m => m.value === filters.moneda)?.label || filters.moneda}
                        <button
                            type="button"
                            className="btn-close btn-close-white ms-1"
                            style={{ fontSize: '0.65em' }}
                            onClick={() => onRemoveFilter('moneda', '')}
                            disabled={loading}
                        ></button>
                    </span>
                )}
                
                {filters.tipoCuenta && (
                    <span className="badge bg-warning">
                        Tipo: {formOptions?.tiposCuenta?.find(t => t.value === filters.tipoCuenta)?.label || filters.tipoCuenta}
                        <button
                            type="button"
                            className="btn-close btn-close-white ms-1"
                            style={{ fontSize: '0.65em' }}
                            onClick={() => onRemoveFilter('tipoCuenta', '')}
                            disabled={loading}
                        ></button>
                    </span>
                )}
                
                {filters.activa !== null && (
                    <span className="badge bg-secondary">
                        Estado: {filters.activa ? 'Activas' : 'Inactivas'}
                        <button
                            type="button"
                            className="btn-close btn-close-white ms-1"
                            style={{ fontSize: '0.65em' }}
                            onClick={() => onRemoveFilter('activa', null)}
                            disabled={loading}
                        ></button>
                    </span>
                )}
            </div>
        </div>
    );
});

FilterBadges.displayName = 'FilterBadges';

export default FilterBadges;
