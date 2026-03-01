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
    
    // Determinar si es préstamo otorgado o recibido
    const esPrestamoOtorgado = useCallback((prestamo) => {
        const tipoPrestatario = prestamo.tipoPrestatario || 'particular';
        return ['trabajador', 'proveedor', 'cliente', 'particular', 'otro'].includes(tipoPrestatario);
    }, []);

    // Componente de fila memoizado
    const FilaPrestamo = React.memo(({ prestamo }) => {
        const esOtorgado = esPrestamoOtorgado(prestamo);

        return (
            <tr className="hover:bg-gray-50">
                {/* Tipo de préstamo + Entidad/Prestatario */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            esOtorgado
                                ? 'bg-green-100 text-green-800'
                                : 'bg-indigo-100 text-indigo-800'
                        }`}>
                            {esOtorgado ? '💸 Otorgado' : '💰 Recibido'}
                        </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                        {esOtorgado
                            ? prestamo.prestatario?.nombre || 'Sin nombre'
                            : prestamo.entidadFinanciera?.nombre || 'N/A'
                        }
                    </div>
                    <div className="text-xs text-gray-500">
                        {prestamo.tipoCredito || prestamo.tipo || 'N/A'}
                    </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                        {formatearMoneda(prestamo.montoAprobado || prestamo.montoSolicitado)}
                    </div>
                    {prestamo.montoAprobado && prestamo.montoAprobado !== prestamo.montoSolicitado && (
                        <div className="text-xs text-gray-500">
                            Solicitado: {formatearMoneda(prestamo.montoSolicitado)}
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
                    <div className="flex space-x-2 justify-end">
                        <button
                            onClick={() => handleVerDetalles(prestamo)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalles"
                        >
                            👁️
                        </button>

                        <button
                            onClick={() => handleVerAmortizacion(prestamo)}
                            className="text-green-600 hover:text-green-900"
                            title="Ver tabla de amortización"
                        >
                            📊
                        </button>

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
                                    title="Cancelar o Eliminar préstamo"
                                >
                                    ❌
                                </button>
                            </>
                        )}
                    </div>
                </td>
            </tr>
        );
    });
    
    FilaPrestamo.displayName = 'FilaPrestamo';
    
    // Loading state
    if (loading) {
        return (
            <div className="bg-white shadow rounded-xl">
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
            <div className="bg-white shadow rounded-xl p-4 sm:p-6">
                <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📋</div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                        No hay préstamos
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500">
                        No se encontraron préstamos con los filtros aplicados.
                    </p>
                </div>
            </div>
        );
    }

    // Renderizar tarjeta móvil para un préstamo
    const TarjetaPrestamoMovil = React.memo(({ prestamo }) => {
        const esOtorgado = esPrestamoOtorgado(prestamo);
        
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
                {/* Header con tipo y estado */}
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${
                            esOtorgado
                                ? 'bg-green-100 text-green-800'
                                : 'bg-indigo-100 text-indigo-800'
                        }`}>
                            {esOtorgado ? '💸 Otorgado' : '💰 Recibido'}
                        </span>
                        <p className="font-semibold text-gray-900 text-sm mt-1 truncate">
                            {esOtorgado
                                ? prestamo.prestatario?.nombre || 'Sin nombre'
                                : prestamo.entidadFinanciera?.nombre || 'N/A'
                            }
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {prestamo.tipoCredito || prestamo.tipo || 'N/A'}
                        </p>
                    </div>
                    <span className={`ml-2 px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full whitespace-nowrap ${obtenerClaseEstado(prestamo.estado)}`}>
                        {prestamo.estado?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </span>
                </div>

                {/* Info principal en grid */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                        <span className="text-gray-500">Monto:</span>
                        <span className="ml-1 font-semibold text-green-600">
                            {formatearMoneda(prestamo.montoAprobado || prestamo.montoSolicitado)}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-gray-500">Tasa:</span>
                        <span className="ml-1 font-medium text-gray-900">
                            {prestamo.tasaInteres?.porcentaje || prestamo.tasaInteres || 0}%
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500">Plazo:</span>
                        <span className="ml-1 text-gray-900">
                            {prestamo.plazo?.cantidad || prestamo.plazoMeses || 0} meses
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-gray-500">Fecha:</span>
                        <span className="ml-1 text-gray-900">
                            {formatearFecha(prestamo.fechaSolicitud || prestamo.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                        onClick={() => handleVerDetalles(prestamo)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Ver detalles"
                    >
                        👁️
                    </button>
                    <button
                        onClick={() => handleVerAmortizacion(prestamo)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Ver tabla de amortización"
                    >
                        📊
                    </button>
                    {!['completado', 'cancelado', 'rechazado'].includes(prestamo.estado) && (
                        <>
                            <button
                                onClick={() => handleEditar(prestamo)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Editar"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => handleCancelar(prestamo)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Cancelar"
                            >
                                ❌
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    });
    
    TarjetaPrestamoMovil.displayName = 'TarjetaPrestamoMovil';
    
    return (
        <>
            {/* Vista móvil: Tarjetas */}
            <div className="block lg:hidden space-y-2 sm:space-y-3">
                {prestamos.map((prestamo) => (
                    <TarjetaPrestamoMovil 
                        key={prestamo._id || prestamo.id} 
                        prestamo={prestamo} 
                    />
                ))}
            </div>

            {/* Vista desktop: Tabla */}
            <div className="hidden lg:block bg-white shadow rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo / Entidad o Prestatario
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
                
                {/* PAGINACIÓN Desktop */}
                {paginacion.totalPaginas > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-700">
                                {paginacion.mensaje}
                            </p>
                            <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                                <button
                                    onClick={() => onCambiarPagina(paginacion.paginaActual - 1)}
                                    disabled={!paginacion.hayAnterior}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    ←
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-200 bg-white text-sm font-medium text-gray-700">
                                    Página {paginacion.paginaActual} de {paginacion.totalPaginas}
                                </span>
                                <button
                                    onClick={() => onCambiarPagina(paginacion.paginaActual + 1)}
                                    disabled={!paginacion.haySiguiente}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    →
                                </button>
                            </nav>
                        </div>
                    </div>
                )}
            </div>

            {/* PAGINACIÓN Móvil - fuera de la tabla */}
            {paginacion.totalPaginas > 1 && (
                <div className="block lg:hidden bg-white rounded-xl shadow px-3 py-3 mt-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => onCambiarPagina(paginacion.paginaActual - 1)}
                            disabled={!paginacion.hayAnterior}
                            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Anterior
                        </button>
                        <span className="text-xs text-gray-600">
                            {paginacion.paginaActual} / {paginacion.totalPaginas}
                        </span>
                        <button
                            onClick={() => onCambiarPagina(paginacion.paginaActual + 1)}
                            disabled={!paginacion.haySiguiente}
                            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}
        </>
    );
});

PrestamosTable.displayName = 'PrestamosTable';

export { PrestamosTable };
