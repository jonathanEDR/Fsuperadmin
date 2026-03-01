import React, { memo, useCallback, useMemo } from 'react';
import { ArrowUp, ArrowDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Landmark } from 'lucide-react';
import CuentaBancariaRow from './CuentaBancariaRow';

/**
 * Componente optimizado para la tabla de cuentas bancarias
 * Memoizado para evitar renders innecesarios en listas grandes
 * Separado para mejor control de renders y performance
 */
const CuentasBancariasTable = memo(({ 
    cuentas, 
    selectedCuentas, 
    loading, 
    pagination, 
    sortConfig, 
    onToggleSelection, 
    onToggleAllSelection, 
    onSort, 
    onPageChange, 
    onEdit, 
    onDelete, 
    onViewDetails 
}) => {
    
    // Configuración de columnas memoizada
    const tableColumns = useMemo(() => [
        { 
            key: 'selection', 
            label: (
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedCuentas.length === cuentas.length && cuentas.length > 0}
                        onChange={onToggleAllSelection}
                        disabled={loading}
                    />
                </div>
            ), 
            sortable: false 
        },
        { key: 'nombre', label: 'Cuenta', sortable: true },
        { key: 'banco', label: 'Banco', sortable: true },
        { key: 'tipoCuenta', label: 'Tipo', sortable: true },
        { key: 'titular', label: 'Titular', sortable: true },
        { key: 'saldoActual', label: 'Saldo Actual', sortable: true },
        { key: 'activa', label: 'Estado', sortable: true },
        { key: 'fechaCreacion', label: 'Fecha Creación', sortable: true },
        { key: 'acciones', label: 'Acciones', sortable: false }
    ], [selectedCuentas.length, cuentas.length, onToggleAllSelection, loading]);
    
    // Manejar ordenamiento de columnas
    const handleSort = useCallback((field) => {
        const newDirection = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        onSort(field, newDirection);
    }, [sortConfig, onSort]);
    
    // Renderizar encabezado de tabla
    const renderTableHeader = useCallback(() => (
        <thead className="thead-light">
            <tr>
                {tableColumns.map(column => (
                    <th key={column.key} className="text-center align-middle">
                        {column.sortable ? (
                            <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none text-dark font-weight-bold"
                                onClick={() => handleSort(column.key)}
                                disabled={loading}
                            >
                                {column.label}
                                {sortConfig.field === column.key && (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                )}
                            </button>
                        ) : (
                            column.label
                        )}
                    </th>
                ))}
            </tr>
        </thead>
    ), [tableColumns, handleSort, loading, sortConfig]);
    
    // Renderizar paginación
    const renderPagination = useCallback(() => {
        if (pagination.totalPages <= 1) return null;
        
        const pages = [];
        const currentPage = pagination.page;
        const totalPages = pagination.totalPages;
        
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return (
            <nav aria-label="Paginación de cuentas bancarias">
                <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1 || loading}
                        >
                            <ChevronsLeft size={16} />
                        </button>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </li>
                    
                    {pages.map(page => (
                        <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => onPageChange(page)}
                                disabled={loading}
                            >
                                {page}
                            </button>
                        </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages || loading}
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </li>
                </ul>
            </nav>
        );
    }, [pagination, onPageChange, loading]);
    
    return (
        <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 className="m-0 font-weight-bold text-primary">
                    Lista de Cuentas Bancarias
                    {loading && <span className="spinner-border spinner-border-sm ml-2"></span>}
                </h6>
                <div className="text-sm text-gray-600">
                    {pagination.total > 0 && (
                        <>Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} cuentas</>
                    )}
                </div>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        {renderTableHeader()}
                        <tbody>
                            {loading && cuentas.length === 0 ? (
                                // Skeleton loading
                                [...Array(5)].map((_, index) => (
                                    <tr key={index}>
                                        {tableColumns.map((_, colIndex) => (
                                            <td key={colIndex} className="align-middle">
                                                <div className="placeholder-glow">
                                                    <span className="placeholder col-8"></span>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : cuentas.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length} className="text-center py-4">
                                        <div className="text-gray-500">
                                            <Landmark size={32} className="mb-3" />
                                            <p className="mb-0">No se encontraron cuentas bancarias</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                cuentas.map(cuenta => (
                                    <CuentaBancariaRow
                                        key={cuenta._id}
                                        cuenta={cuenta}
                                        isSelected={selectedCuentas.includes(cuenta._id)}
                                        onToggleSelection={onToggleSelection}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onViewDetails={onViewDetails}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Paginación */}
                {pagination.totalPages > 1 && (
                    <div className="card-footer bg-white border-0">
                        {renderPagination()}
                    </div>
                )}
            </div>
        </div>
    );
});

CuentasBancariasTable.displayName = 'CuentasBancariasTable';

export default CuentasBancariasTable;
