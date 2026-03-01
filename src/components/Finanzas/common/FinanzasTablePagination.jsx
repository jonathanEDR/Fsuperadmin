import React, { memo, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Componente de paginación genérico y reutilizable
 * Optimizado para máximo rendimiento y reutilización en todo el módulo de finanzas
 */
const FinanzasTablePagination = memo(({ 
    paginacion, 
    onPaginaChange,
    showInfo = true,
    showPageNumbers = true,
    maxPageNumbers = 5,
    size = 'normal' // 'small', 'normal', 'large'
}) => {
    
    // Calcular información de paginación
    const infoPaginacion = useMemo(() => {
        if (!paginacion) return null;
        
        const inicio = ((paginacion.paginaActual - 1) * paginacion.registrosPorPagina) + 1;
        const fin = Math.min(paginacion.paginaActual * paginacion.registrosPorPagina, paginacion.totalRegistros);
        
        return {
            inicio,
            fin,
            total: paginacion.totalRegistros,
            paginaActual: paginacion.paginaActual,
            totalPaginas: paginacion.totalPaginas
        };
    }, [paginacion]);

    // Generar números de página para mostrar
    const numerosPagina = useMemo(() => {
        if (!infoPaginacion) return [];
        
        const { paginaActual, totalPaginas } = infoPaginacion;
        const paginas = [];
        
        // Mostrar máximo número de páginas configurado
        let inicio = Math.max(1, paginaActual - Math.floor(maxPageNumbers / 2));
        let fin = Math.min(totalPaginas, inicio + maxPageNumbers - 1);
        
        // Ajustar si estamos al final
        if (fin - inicio < maxPageNumbers - 1) {
            inicio = Math.max(1, fin - maxPageNumbers + 1);
        }
        
        for (let i = inicio; i <= fin; i++) {
            paginas.push(i);
        }
        
        return paginas;
    }, [infoPaginacion, maxPageNumbers]);

    // Handlers memoizados
    const handlePaginaAnterior = useCallback(() => {
        if (infoPaginacion && infoPaginacion.paginaActual > 1) {
            onPaginaChange(infoPaginacion.paginaActual - 1);
        }
    }, [infoPaginacion, onPaginaChange]);

    const handlePaginaSiguiente = useCallback(() => {
        if (infoPaginacion && infoPaginacion.paginaActual < infoPaginacion.totalPaginas) {
            onPaginaChange(infoPaginacion.paginaActual + 1);
        }
    }, [infoPaginacion, onPaginaChange]);

    const handlePaginaEspecifica = useCallback((numeroPagina) => {
        onPaginaChange(numeroPagina);
    }, [onPaginaChange]);

    // Clases CSS basadas en el tamaño
    const sizeClasses = useMemo(() => {
        switch (size) {
            case 'small':
                return {
                    container: 'px-4 py-2',
                    button: 'px-2 py-1 text-xs',
                    text: 'text-xs'
                };
            case 'large':
                return {
                    container: 'px-8 py-6',
                    button: 'px-4 py-2 text-base',
                    text: 'text-base'
                };
            default:
                return {
                    container: 'px-6 py-4',
                    button: 'px-3 py-1 text-sm',
                    text: 'text-sm'
                };
        }
    }, [size]);

    // Si no hay información de paginación, no renderizar
    if (!infoPaginacion) return null;

    return (
        <div className={`border-t bg-gray-50 ${sizeClasses.container}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Información de registros */}
                {showInfo && (
                    <div className={`text-gray-500 ${sizeClasses.text}`}>
                        Mostrando <span className="font-medium">{infoPaginacion.inicio}</span> a{' '}
                        <span className="font-medium">{infoPaginacion.fin}</span> de{' '}
                        <span className="font-medium">{infoPaginacion.total}</span> registros
                    </div>
                )}
                
                {/* Controles de paginación */}
                <div className="flex items-center space-x-2">
                    {/* Botón primera página (solo si hay muchas páginas) */}
                    {infoPaginacion.totalPaginas > maxPageNumbers && infoPaginacion.paginaActual > Math.ceil(maxPageNumbers / 2) && (
                        <>
                            <button
                                onClick={() => handlePaginaEspecifica(1)}
                                className={`rounded border bg-white text-gray-700 hover:bg-gray-50 transition-colors ${sizeClasses.button}`}
                                aria-label="Primera página"
                            >
                                1
                            </button>
                            {infoPaginacion.paginaActual > Math.ceil(maxPageNumbers / 2) + 1 && (
                                <span className="text-gray-500">...</span>
                            )}
                        </>
                    )}

                    {/* Botón anterior */}
                    <button
                        onClick={handlePaginaAnterior}
                        disabled={infoPaginacion.paginaActual <= 1}
                        className={`rounded border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${sizeClasses.button}`}
                        aria-label="Página anterior"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    
                    {/* Números de página */}
                    {showPageNumbers && numerosPagina.map(numeroPagina => (
                        <button
                            key={numeroPagina}
                            onClick={() => handlePaginaEspecifica(numeroPagina)}
                            className={`rounded transition-colors ${sizeClasses.button} ${
                                numeroPagina === infoPaginacion.paginaActual
                                    ? 'bg-blue-600 text-white'
                                    : 'border bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                            aria-label={`Página ${numeroPagina}`}
                            aria-current={numeroPagina === infoPaginacion.paginaActual ? 'page' : undefined}
                        >
                            {numeroPagina}
                        </button>
                    ))}
                    
                    {/* Botón siguiente */}
                    <button
                        onClick={handlePaginaSiguiente}
                        disabled={infoPaginacion.paginaActual >= infoPaginacion.totalPaginas}
                        className={`rounded border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${sizeClasses.button}`}
                        aria-label="Página siguiente"
                    >
                        <ChevronRight size={14} />
                    </button>

                    {/* Botón última página (solo si hay muchas páginas) */}
                    {infoPaginacion.totalPaginas > maxPageNumbers && infoPaginacion.paginaActual < infoPaginacion.totalPaginas - Math.floor(maxPageNumbers / 2) && (
                        <>
                            {infoPaginacion.paginaActual < infoPaginacion.totalPaginas - Math.floor(maxPageNumbers / 2) - 1 && (
                                <span className="text-gray-500">...</span>
                            )}
                            <button
                                onClick={() => handlePaginaEspecifica(infoPaginacion.totalPaginas)}
                                className={`rounded border bg-white text-gray-700 hover:bg-gray-50 transition-colors ${sizeClasses.button}`}
                                aria-label="Última página"
                            >
                                {infoPaginacion.totalPaginas}
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Información adicional para pantallas pequeñas */}
            <div className="sm:hidden mt-2 text-center">
                <span className={`text-gray-500 ${sizeClasses.text}`}>
                    Página {infoPaginacion.paginaActual} de {infoPaginacion.totalPaginas}
                </span>
            </div>
        </div>
    );
});

FinanzasTablePagination.displayName = 'FinanzasTablePagination';

export default FinanzasTablePagination;
