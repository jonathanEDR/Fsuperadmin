import React, { memo } from 'react';
import { Landmark, Plus, Trash2, X } from 'lucide-react';

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
                <Landmark size={18} />
                <span className="hidden xs:inline">Cuentas Bancarias</span>
                <span className="xs:hidden">Cuentas</span>
            </h1>
            <div className="flex gap-2">
                <button
                    type="button"
                    className="text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                    onClick={onCreateNew}
                    disabled={loading}
                    title="Crear nueva cuenta bancaria"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Nueva Cuenta</span>
                </button>
                {computedData.hasSelection && (
                    <>
                        <button
                            type="button"
                            className="text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                            onClick={onDeleteSelected}
                            disabled={loading}
                            title={`Eliminar ${computedData.selectedCount} cuenta(s) seleccionada(s)`}
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Eliminar</span>
                            <span className="text-xs">({computedData.selectedCount})</span>
                        </button>
                        <button
                            type="button"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                            onClick={onClearSelection}
                            disabled={loading}
                            title="Limpiar selección"
                        >
                            <X size={16} />
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
