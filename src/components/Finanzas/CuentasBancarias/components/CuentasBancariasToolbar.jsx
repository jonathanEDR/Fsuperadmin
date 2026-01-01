import React, { memo } from 'react';

/**
 * Componente optimizado para la barra de herramientas de cuentas bancarias
 * Memoizado para evitar renders innecesarios
 * Separado para mejor modularidad y control de estado
 * Responsive: En móvil solo muestra iconos, en desktop texto completo
 */
const CuentasBancariasToolbar = memo(({ 
    computedData, 
    loading, 
    onCreateNew, 
    onDeleteSelected, 
    onClearSelection 
}) => {
    
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <i className="fas fa-university"></i>
                <span className="hidden xs:inline">Cuentas Bancarias</span>
                <span className="xs:hidden">Cuentas</span>
            </h1>
            <div className="flex gap-2">
                <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    onClick={onCreateNew}
                    disabled={loading}
                    title="Crear nueva cuenta bancaria"
                >
                    <i className="fas fa-plus"></i>
                    <span className="hidden sm:inline">Nueva Cuenta</span>
                </button>
                {computedData.hasSelection && (
                    <>
                        <button
                            type="button"
                            className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            onClick={onDeleteSelected}
                            disabled={loading}
                            title={`Eliminar ${computedData.selectedCount} cuenta(s) seleccionada(s)`}
                        >
                            <i className="fas fa-trash"></i>
                            <span className="hidden sm:inline">Eliminar</span>
                            <span className="text-xs">({computedData.selectedCount})</span>
                        </button>
                        <button
                            type="button"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            onClick={onClearSelection}
                            disabled={loading}
                            title="Limpiar selección"
                        >
                            <i className="fas fa-times"></i>
                            <span className="hidden sm:inline">Limpiar</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
});

CuentasBancariasToolbar.displayName = 'CuentasBancariasToolbar';

export default CuentasBancariasToolbar;
