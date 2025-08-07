import React, { memo, useMemo, useCallback } from 'react';
import { useCuentasBancariasTable } from '../hooks/useCuentasBancariasTable';
import CuentasBancariasResumen from './CuentasBancariasResumen';
import CuentasBancariasTableHeader from './CuentasBancariasTableHeader';
import CuentasBancariasTableRow from './CuentasBancariasTableRow';
import CuentasBancariasEmptyState from './CuentasBancariasEmptyState';
import CuentasBancariasTableSkeleton from './CuentasBancariasTableSkeleton';
import FinanzasTablePagination from '../../common/FinanzasTablePagination';

/**
 * Tabla optimizada de Cuentas Bancarias
 * Completamente refactorizada con hooks especializados y componentes memoizados
 * Aplicación de mejores prácticas React para máximo rendimiento
 */
const TablaCuentasBancariasOptimizada = memo(({ 
    cuentas = [], 
    resumenCuentas = null,
    loading = false,
    paginacion = null,
    onPaginaChange,
    acciones = [],
    seleccionMultiple = false,
    onSeleccionChange
}) => {
    
    // Hook especializado para lógica de tabla
    const {
        cuentasSeguras,
        filasSeleccionadas,
        ordenamiento,
        manejarSeleccionFila,
        manejarSeleccionTodos,
        manejarOrdenamiento,
        cuentasOrdenadas
    } = useCuentasBancariasTable({
        cuentas,
        onSeleccionChange
    });

    // Memoizar configuración de columnas
    const columnas = useMemo(() => [
        {
            key: 'codigo',
            label: 'Código',
            sortable: true,
            width: 'w-32'
        },
        {
            key: 'nombre',
            label: 'Nombre',
            sortable: true,
            width: 'w-48'
        },
        {
            key: 'banco',
            label: 'Banco',
            sortable: false,
            width: 'w-36'
        },
        {
            key: 'tipoCuenta',
            label: 'Tipo',
            sortable: false,
            width: 'w-32'
        },
        {
            key: 'numeroCuenta',
            label: 'Número',
            sortable: false,
            width: 'w-36'
        },
        {
            key: 'saldoActual',
            label: 'Saldo',
            sortable: true,
            width: 'w-32'
        },
        {
            key: 'moneda',
            label: 'Moneda',
            sortable: false,
            width: 'w-24'
        },
        {
            key: 'activa',
            label: 'Estado',
            sortable: true,
            width: 'w-24'
        }
    ], []);

    // Handlers memoizados
    const handleSeleccionTodos = useCallback(() => {
        manejarSeleccionTodos();
    }, [manejarSeleccionTodos]);

    const handleSeleccionFila = useCallback((id) => {
        manejarSeleccionFila(id);
    }, [manejarSeleccionFila]);

    const handleOrdenamiento = useCallback((campo) => {
        manejarOrdenamiento(campo);
    }, [manejarOrdenamiento]);

    const handlePaginaChange = useCallback((nuevaPagina) => {
        onPaginaChange?.(nuevaPagina);
    }, [onPaginaChange]);

    // Verificar si todas las filas están seleccionadas
    const todasSeleccionadas = useMemo(() => {
        return cuentasSeguras.length > 0 && filasSeleccionadas.size === cuentasSeguras.length;
    }, [cuentasSeguras.length, filasSeleccionadas.size]);

    // Renderizado condicional para estado de carga
    if (loading && !cuentasSeguras.length) {
        return (
            <div className="space-y-6">
                <CuentasBancariasResumen 
                    resumen={resumenCuentas}
                    loading={loading}
                />
                <CuentasBancariasTableSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tarjetas de resumen */}
            <CuentasBancariasResumen 
                resumen={resumenCuentas}
                loading={loading}
            />
            
            {/* Tabla de cuentas */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Encabezado de la tabla */}
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        🏦 Cuentas Bancarias ({cuentasSeguras.length})
                    </h3>
                </div>
                
                {/* Contenido de la tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* Encabezado */}
                        <CuentasBancariasTableHeader
                            columnas={columnas}
                            seleccionMultiple={seleccionMultiple}
                            todasSeleccionadas={todasSeleccionadas}
                            onSeleccionTodos={handleSeleccionTodos}
                            ordenamiento={ordenamiento}
                            onOrdenamiento={handleOrdenamiento}
                            tieneAcciones={acciones.length > 0}
                        />
                        
                        {/* Cuerpo de la tabla */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cuentasOrdenadas.length === 0 ? (
                                <tr>
                                    <td 
                                        colSpan={columnas.length + (seleccionMultiple ? 1 : 0) + (acciones.length > 0 ? 1 : 0)}
                                        className="px-6 py-12"
                                    >
                                        <CuentasBancariasEmptyState />
                                    </td>
                                </tr>
                            ) : (
                                cuentasOrdenadas.map((cuenta, index) => (
                                    <CuentasBancariasTableRow
                                        key={cuenta.id || cuenta._id || index}
                                        cuenta={cuenta}
                                        seleccionMultiple={seleccionMultiple}
                                        estaSeleccionada={filasSeleccionadas.has(cuenta.id || cuenta._id)}
                                        onSeleccion={handleSeleccionFila}
                                        acciones={acciones}
                                        columnas={columnas}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Paginación */}
                {paginacion && (
                    <FinanzasTablePagination
                        paginacion={paginacion}
                        onPaginaChange={handlePaginaChange}
                    />
                )}
            </div>
        </div>
    );
});

TablaCuentasBancariasOptimizada.displayName = 'TablaCuentasBancariasOptimizada';

export default TablaCuentasBancariasOptimizada;
