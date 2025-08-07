import React, { memo } from 'react';

/**
 * Componente optimizado para la barra de herramientas de cuentas bancarias
 * Memoizado para evitar renders innecesarios
 * Separado para mejor modularidad y control de estado
 */
const CuentasBancariasToolbar = memo(({ 
    computedData, 
    loading, 
    onCreateNew, 
    onDeleteSelected, 
    onClearSelection 
}) => {
    
    return (
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">
                <i className="fas fa-university mr-2"></i>
                Cuentas Bancarias
            </h1>
            <div className="d-flex gap-2">
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onCreateNew}
                    disabled={loading}
                >
                    <i className="fas fa-plus mr-2"></i>
                    Nueva Cuenta
                </button>
                {computedData.hasSelection && (
                    <>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={onDeleteSelected}
                            disabled={loading}
                        >
                            <i className="fas fa-trash mr-2"></i>
                            Eliminar ({computedData.selectedCount})
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onClearSelection}
                            disabled={loading}
                        >
                            <i className="fas fa-times mr-2"></i>
                            Limpiar Selección
                        </button>
                    </>
                )}
            </div>
        </div>
    );
});

CuentasBancariasToolbar.displayName = 'CuentasBancariasToolbar';

export default CuentasBancariasToolbar;
