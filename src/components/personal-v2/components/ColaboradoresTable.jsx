/**
 * Tabla de colaboradores optimizada
 * Componente memoizado para evitar re-renders innecesarios
 * Max 250 líneas - Enfoque en responsabilidad única
 */

import React, { useMemo } from 'react';

const ColaboradoresTable = React.memo(({ 
  colaboradores,
  estadisticasBulk,
  pagosRealizados,
  onAbrirModal,
  onMostrarDetalle,
  formatearMoneda,
  loading
}) => {
  
  // Calcular totales por colaborador (memoizado)
  const datosColaboradores = useMemo(() => {
    return colaboradores.map(colaborador => {
      const clerkId = colaborador.clerk_id;
      const estadisticas = estadisticasBulk[clerkId] || {};
      
      // Calcular total de pagos realizados
      const totalPagos = pagosRealizados
        .filter(p => p.colaboradorUserId === clerkId)
        .reduce((sum, p) => sum + (p.montoTotal || p.monto || 0), 0);
      
      // Obtener totales de estadísticas
      const adelantos = estadisticas.totalAdelantos || 0;
      const pagosDiarios = estadisticas.totalPagosDiarios || 0;
      const faltantesPendientes = estadisticas.cobrosAutomaticos?.faltantesPendientes || 0;
      const gastosPendientes = estadisticas.cobrosAutomaticos?.gastosPendientes || 0;
      const totalAPagar = estadisticas.totalAPagarConCobros !== undefined 
        ? estadisticas.totalAPagarConCobros 
        : (pagosDiarios - (estadisticas.totalFaltantes || 0) - adelantos);
      
      // Total final descontando pagos realizados
      const totalFinal = totalAPagar - totalPagos;
      
      return {
        ...colaborador,
        adelantos,
        pagosDiarios,
        faltantesPendientes,
        gastosPendientes,
        pendientesTotal: faltantesPendientes + gastosPendientes,
        totalAPagar: totalFinal,
        ventasRelacionadas: estadisticas.cobrosAutomaticos?.totalVentas || 0,
        cobrosRelacionados: estadisticas.cobrosAutomaticos?.totalCobros || 0
      };
    });
  }, [colaboradores, estadisticasBulk, pagosRealizados]);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-base sm:text-lg font-medium">Colaboradores</h3>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando colaboradores...</p>
        </div>
      </div>
    );
  }
  
  if (datosColaboradores.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-base sm:text-lg font-medium">Colaboradores</h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          No hay colaboradores disponibles
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-base sm:text-lg font-medium">Colaboradores</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Colaborador
              </th>
              <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pendientes Cobros
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adelantos
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pagos Diarios
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total a Pagar
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {datosColaboradores.map((colaborador) => (
              <tr key={colaborador._id} className="hover:bg-gray-50 transition-colors">
                {/* Columna: Colaborador */}
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {colaborador.nombre_negocio}
                    </div>
                    <div className="hidden sm:block text-xs text-gray-500">
                      {colaborador.email}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {colaborador.role}
                    </div>
                    
                    {/* Mostrar pendientes en móvil */}
                    <div className="sm:hidden mt-2">
                      {colaborador.pendientesTotal > 0 ? (
                        <div className="text-xs">
                          <span className="text-orange-700">Pendientes: </span>
                          <span className="font-medium text-purple-600">
                            {formatearMoneda(colaborador.pendientesTotal)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Sin pendientes</span>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* Columna: Pendientes de Cobros (solo desktop) */}
                <td className="hidden sm:table-cell px-4 py-4 text-right">
                  {colaborador.pendientesTotal > 0 ? (
                    <div className="flex flex-col items-end">
                      {colaborador.faltantesPendientes > 0 && (
                        <span className="text-xs text-orange-700">
                          Faltantes: {formatearMoneda(colaborador.faltantesPendientes)}
                        </span>
                      )}
                      {colaborador.gastosPendientes > 0 && (
                        <span className="text-xs text-red-700">
                          Gastos: {formatearMoneda(colaborador.gastosPendientes)}
                        </span>
                      )}
                      <span className="text-sm font-bold text-purple-600 mt-1 pt-1 border-t border-gray-200">
                        Total: {formatearMoneda(colaborador.pendientesTotal)}
                      </span>
                      {(colaborador.ventasRelacionadas > 0 || colaborador.cobrosRelacionados > 0) && (
                        <span className="text-xs text-blue-600 mt-1">
                          {colaborador.ventasRelacionadas} ventas → {colaborador.cobrosRelacionados} cobros
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Sin pendientes</span>
                  )}
                </td>
                
                {/* Columna: Adelantos */}
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-bold text-blue-600">
                    {formatearMoneda(colaborador.adelantos)}
                  </span>
                </td>
                
                {/* Columna: Pagos Diarios */}
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-bold text-green-600">
                    {formatearMoneda(colaborador.pagosDiarios)}
                  </span>
                </td>
                
                {/* Columna: Total a Pagar */}
                <td className="px-4 py-4 text-right">
                  <span className={`text-sm font-bold ${
                    colaborador.totalAPagar >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatearMoneda(colaborador.totalAPagar)}
                  </span>
                </td>
                
                {/* Columna: Acciones */}
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => onAbrirModal(colaborador)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Nuevo Registro
                    </button>
                    <button
                      onClick={() => onMostrarDetalle(colaborador)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    >
                      Ver Detalle
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.colaboradores === nextProps.colaboradores &&
    prevProps.estadisticasBulk === nextProps.estadisticasBulk &&
    prevProps.pagosRealizados === nextProps.pagosRealizados &&
    prevProps.loading === nextProps.loading
  );
});

ColaboradoresTable.displayName = 'ColaboradoresTable';

export default ColaboradoresTable;
