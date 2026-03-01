import React, { memo } from 'react';

/**
 * Componente memoizado para skeleton de tabla
 * Optimizado para mostrar estado de carga
 */
const CuentasBancariasTableSkeleton = memo(() => {
    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Encabezado skeleton */}
            <div className="px-6 py-4 border-b">
                <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
            
            {/* Tabla skeleton */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* Encabezado de tabla skeleton */}
                    <thead className="bg-gray-50">
                        <tr>
                            {Array.from({ length: 8 }).map((_, index) => (
                                <th key={index} className="px-6 py-3">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    
                    {/* Filas skeleton */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({ length: 5 }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {Array.from({ length: 8 }).map((_, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                                        <div className="animate-pulse">
                                            {colIndex === 0 ? (
                                                <div className="h-6 bg-gray-200 rounded w-16"></div>
                                            ) : colIndex === 1 ? (
                                                <div className="h-5 bg-gray-200 rounded w-24"></div>
                                            ) : colIndex === 5 ? (
                                                <div className="h-5 bg-gray-200 rounded w-20"></div>
                                            ) : colIndex === 6 ? (
                                                <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                                            ) : colIndex === 7 ? (
                                                <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                                            ) : (
                                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Paginación skeleton */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
});

CuentasBancariasTableSkeleton.displayName = 'CuentasBancariasTableSkeleton';

export default CuentasBancariasTableSkeleton;
