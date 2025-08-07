import React, { memo } from 'react';
import FinanzasLayout from '../../common/FinanzasLayout';
import FinanzasTablePagination from '../../common/FinanzasTablePagination';

/**
 * EJEMPLO: Cómo usar el layout unificado de finanzas en cualquier módulo
 * Este ejemplo muestra cómo implementar el módulo de Movimientos de Caja
 * con la navegación global y componentes reutilizables
 */
const MovimientosCajaConNavegacion = memo(() => {
    // Hook para datos de movimientos
    // const { movimientos, loading, paginacion, handlePageChange } = useMovimientosCaja();

    // Datos de ejemplo
    const movimientos = [];
    const loading = false;
    const paginacion = {
        paginaActual: 1,
        totalPaginas: 5,
        registrosPorPagina: 10,
        totalRegistros: 50
    };

    const handlePageChange = (newPage) => {
        console.log('Cambiar a página:', newPage);
    };

    // Acciones específicas del módulo
    const actions = (
        <>
            <button className="btn btn-primary">
                <i className="fas fa-plus mr-2"></i>
                Nuevo Movimiento
            </button>
            <button className="btn btn-secondary">
                <i className="fas fa-download mr-2"></i>
                Exportar
            </button>
        </>
    );

    return (
        <FinanzasLayout 
            currentModule="movimientos-caja"
            title="Movimientos de Caja"
            loading={loading}
            actions={actions}
        >
            {/* Contenido específico del módulo */}
            <div className="space-y-6">
                {/* Filtros */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Filtros</h3>
                    {/* Aquí irían los filtros específicos */}
                    <p className="text-gray-500">Filtros de movimientos de caja...</p>
                </div>

                {/* Tabla de movimientos */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">
                            💸 Movimientos de Caja ({movimientos.length})
                        </h3>
                    </div>
                    
                    <div className="p-6">
                        {movimientos.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">💸</div>
                                <h4 className="text-xl font-medium text-gray-700 mb-2">
                                    No hay movimientos registrados
                                </h4>
                                <p className="text-gray-500">
                                    Los movimientos aparecerán aquí cuando se registren
                                </p>
                            </div>
                        ) : (
                            <div>
                                {/* Aquí iría la tabla de movimientos */}
                                <p>Tabla de movimientos...</p>
                            </div>
                        )}
                    </div>

                    {/* Paginación usando el componente común */}
                    <FinanzasTablePagination
                        paginacion={paginacion}
                        onPaginaChange={handlePageChange}
                    />
                </div>
            </div>
        </FinanzasLayout>
    );
});

MovimientosCajaConNavegacion.displayName = 'MovimientosCajaConNavegacion';

export default MovimientosCajaConNavegacion;
