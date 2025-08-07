import React, { memo } from 'react';

/**
 * Componente memoizado para estado vacío de la tabla
 * Optimizado para máximo rendimiento
 */
const CuentasBancariasEmptyState = memo(() => {
    return (
        <div className="text-center text-gray-500 py-12">
            <div className="flex flex-col items-center">
                <div className="text-6xl mb-4" role="img" aria-label="Banco">
                    🏦
                </div>
                <div className="text-xl font-medium mb-2 text-gray-700">
                    No hay cuentas bancarias
                </div>
                <div className="text-sm text-gray-500 max-w-md">
                    Crea tu primera cuenta bancaria para comenzar a gestionar tus finanzas
                </div>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <i className="fas fa-plus mr-2"></i>
                    Crear primera cuenta
                </button>
            </div>
        </div>
    );
});

CuentasBancariasEmptyState.displayName = 'CuentasBancariasEmptyState';

export default CuentasBancariasEmptyState;
