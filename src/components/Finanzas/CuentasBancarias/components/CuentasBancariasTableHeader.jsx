import React, { memo } from 'react';
import { ArrowUpDown } from 'lucide-react';

/**
 * Componente memoizado para el encabezado de la tabla
 * Optimizado para evitar re-renders innecesarios
 */
const CuentasBancariasTableHeader = memo(({
    columnas,
    seleccionMultiple,
    todasSeleccionadas,
    onSeleccionTodos,
    ordenamiento,
    onOrdenamiento,
    tieneAcciones
}) => {
    
    const renderSortIcon = (columna) => {
        if (!columna.sortable) return null;
        
        const isActive = ordenamiento.campo === columna.key;
        const direction = isActive ? ordenamiento.direccion : null;
        
        return (
            <span className="text-gray-400 ml-1">
                {isActive ? (
                    direction === 'asc' ? '↑' : '↓'
                ) : <ArrowUpDown size={14} />}
            </span>
        );
    };

    const handleColumnClick = (columna) => {
        if (columna.sortable) {
            onOrdenamiento(columna.key);
        }
    };

    return (
        <thead className="bg-gray-50">
            <tr>
                {/* Checkbox de selección múltiple */}
                {seleccionMultiple && (
                    <th className="px-6 py-3 text-left">
                        <input
                            type="checkbox"
                            checked={todasSeleccionadas}
                            onChange={onSeleccionTodos}
                            className="rounded border-gray-200 text-blue-600 focus:ring-blue-500"
                            aria-label="Seleccionar todas las cuentas"
                        />
                    </th>
                )}
                
                {/* Columnas de datos */}
                {columnas.map((columna) => (
                    <th 
                        key={columna.key}
                        className={`
                            px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                            ${columna.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
                            ${columna.width || ''}
                        `}
                        onClick={() => handleColumnClick(columna)}
                        role={columna.sortable ? 'button' : undefined}
                        tabIndex={columna.sortable ? 0 : undefined}
                        onKeyDown={columna.sortable ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleColumnClick(columna);
                            }
                        } : undefined}
                    >
                        <div className="flex items-center space-x-1">
                            <span>{columna.label}</span>
                            {renderSortIcon(columna)}
                        </div>
                    </th>
                ))}
                
                {/* Columna de acciones */}
                {tieneAcciones && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                    </th>
                )}
            </tr>
        </thead>
    );
});

CuentasBancariasTableHeader.displayName = 'CuentasBancariasTableHeader';

export default CuentasBancariasTableHeader;
