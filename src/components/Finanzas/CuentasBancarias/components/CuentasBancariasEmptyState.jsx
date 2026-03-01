import React, { memo } from 'react';
import { Landmark, Plus } from 'lucide-react';

/**
 * Componente memoizado para estado vacío de la tabla
 * Optimizado para máximo rendimiento
 */
const CuentasBancariasEmptyState = memo(() => {
    return (
        <div className="text-center text-gray-500 py-12">
            <div className="flex flex-col items-center">
                <div className="mb-4" role="img" aria-label="Banco">
                    <Landmark size={64} className="text-gray-400" />
                </div>
                <div className="text-xl font-medium mb-2 text-gray-700">
                    No hay cuentas bancarias
                </div>
                <div className="text-sm text-gray-500 max-w-md">
                    Crea tu primera cuenta bancaria para comenzar a gestionar tus finanzas
                </div>
                <button className="mt-4 px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors">
                    <Plus size={16} className="inline mr-2" />
                    Crear primera cuenta
                </button>
            </div>
        </div>
    );
});

CuentasBancariasEmptyState.displayName = 'CuentasBancariasEmptyState';

export default CuentasBancariasEmptyState;
