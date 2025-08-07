import React, { useCallback, useMemo } from 'react';

/**
 * Componente memoizado para la tabla de préstamos
 * Optimizado para performance con memoización y callbacks
 */
const PrestamosTable = React.memo(({
    prestamosData,
    paginacion,
    onEditarPrestamo,
    onCancelarPrestamo,
    onVerDetalles,
    onVerTablaAmortizacion,
    onCambiarPagina,
    loading
}) => {
    
    const { prestamos, isEmpty } = prestamosData;
    
    // Funciones de acción memoizadas
    const handleEditar = useCallback((prestamo) => {
        onEditarPrestamo(prestamo);
    }, [onEditarPrestamo]);
    
    const handleCancelar = useCallback((prestamo) => {
        onCancelarPrestamo(prestamo);
    }, [onCancelarPrestamo]);
    
    const handleVerDetalles = useCallback((prestamo) => {
        onVerDetalles(prestamo);
    }, [onVerDetalles]);
    
    const handleVerAmortizacion = useCallback((prestamo) => {
        onVerTablaAmortizacion(prestamo);
    }, [onVerTablaAmortizacion]);
    
    // Obtener clase de estado memoizada
    const obtenerClaseEstado = useMemo(() => {
        const clases = {
            'solicitado': 'bg-blue-100 text-blue-800',
            'en_evaluacion': 'bg-yellow-100 text-yellow-800',
            'aprobado': 'bg-green-100 text-green-800',
            'rechazado': 'bg-red-100 text-red-800',
            'desembolsado': 'bg-indigo-100 text-indigo-800',
            'vigente': 'bg-green-100 text-green-800',
            'vencido': 'bg-red-100 text-red-800',
            'completado': 'bg-gray-100 text-gray-800',
            'cancelado': 'bg-gray-100 text-gray-800'
        };
        
        return (estado) => clases[estado] || 'bg-gray-100 text-gray-800';
    }, []);
    
    // Formatear moneda memoizado
    const formatearMoneda = useCallback((monto) => {
        return `S/ ${parseFloat(monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    }, []);
    
    // Formatear fecha memoizado
    const formatearFecha = useCallback((fecha) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-PE');
    }, []);
    
    // Componente de fila memoizado
    const FilaPrestamo = React.memo(({ prestamo }) => (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {prestamo.entidadFinanciera?.nombre || 'N/A'}
                </div>
                <div className="text-sm text-gray-500">
                    {prestamo.tipoCredito || prestamo.tipo || 'N/A'}
                </div>
            </td>
            
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {formatearMoneda(prestamo.montoSolicitado)}
                </div>
                {prestamo.montoAprobado && prestamo.montoAprobado !== prestamo.montoSolicitado && (
                    <div className="text-sm text-green-600">
                        Aprobado: {formatearMoneda(prestamo.montoAprobado)}
                    </div>
                )}
            </td>
            
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                    {prestamo.tasaInteres?.porcentaje || prestamo.tasaInteres || 0}%
                </div>
                <div className="text-sm text-gray-500">
                    {prestamo.plazo?.cantidad || prestamo.plazoMeses || 0} meses
                </div>
            </td>
            
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerClaseEstado(prestamo.estado)}`}>
                    {prestamo.estado?.replace('_', ' ').toUpperCase() || 'N/A'}
                </span>
            </td>
            
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatearFecha(prestamo.fechaSolicitud || prestamo.createdAt)}
            </td>
            
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleVerDetalles(prestamo)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                    >
                        👁️
                    </button>
                    
                    {['vigente', 'desembolsado'].includes(prestamo.estado) && (
                        <button
                            onClick={() => handleVerAmortizacion(prestamo)}
                            className="text-green-600 hover:text-green-900"
                            title="Ver tabla de amortización"
                        >
                            📊
                        </button>
                    )}
                    
                    {!['completado', 'cancelado', 'rechazado'].includes(prestamo.estado) && (
                        <>
                            <button
                                onClick={() => handleEditar(prestamo)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Editar"
                            >
                                ✏️
                            </button>
                            
                            <button
                                onClick={() => handleCancelar(prestamo)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancelar"
                            >
                                ❌
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    ));
    
    FilaPrestamo.displayName = 'FilaPrestamo';
    
    // Loading state
    if (loading) {
        return (
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-4 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // Empty state
    if (isEmpty) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay préstamos
                    </h3>
                    <p className="text-gray-500">
                        No se encontraron préstamos con los filtros aplicados.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Entidad / Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tasa / Plazo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {prestamos.map((prestamo) => (
                            <FilaPrestamo 
                                key={prestamo._id || prestamo.id} 
                                prestamo={prestamo} 
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* PAGINACIÓN */}
            {paginacion.totalPaginas > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => onCambiarPagina(paginacion.paginaActual - 1)}
                                disabled={!paginacion.hayAnterior}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => onCambiarPagina(paginacion.paginaActual + 1)}
                                disabled={!paginacion.haySiguiente}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                        
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-700">
                                {paginacion.mensaje}
                            </p>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => onCambiarPagina(paginacion.paginaActual - 1)}
                                    disabled={!paginacion.hayAnterior}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    ←
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    Página {paginacion.paginaActual} de {paginacion.totalPaginas}
                                </span>
                                <button
                                    onClick={() => onCambiarPagina(paginacion.paginaActual + 1)}
                                    disabled={!paginacion.haySiguiente}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    →
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

PrestamosTable.displayName = 'PrestamosTable';

export { PrestamosTable };
