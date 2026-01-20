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
  onAbrirModalBonificacion,
  onAbrirModalDescuento, // 🆕 Nuevo prop para descuentos/faltantes
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
      const bonificaciones = estadisticas.totalBonificaciones || 0; // 🆕 Bonificaciones
      const faltantesPendientes = estadisticas.cobrosAutomaticos?.faltantesPendientes || 0;
      const gastosPendientes = estadisticas.cobrosAutomaticos?.gastosPendientes || 0;
      const totalAPagar = estadisticas.totalAPagarConCobros !== undefined 
        ? estadisticas.totalAPagarConCobros 
        : (pagosDiarios + bonificaciones - (estadisticas.totalFaltantes || 0) - adelantos);
      
      // Total final descontando pagos realizados
      const totalFinal = totalAPagar - totalPagos;
      
      return {
        ...colaborador,
        adelantos,
        pagosDiarios,
        bonificaciones, // 🆕
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Colaboradores</h3>
      </div>
      
      {/* Vista Móvil: Tarjetas */}
      <div className="md:hidden p-3 space-y-3">
        {datosColaboradores.map((colaborador) => (
          <div 
            key={colaborador._id} 
            className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-gray-100 shadow-sm"
          >
            {/* Header: Avatar + Nombre + Total */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                  {colaborador.nombre_negocio?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">
                    {colaborador.nombre_negocio}
                  </h4>
                  <span className="text-xs text-gray-400 capitalize">{colaborador.role}</span>
                </div>
              </div>
              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                colaborador.totalAPagar >= 0 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                {formatearMoneda(colaborador.totalAPagar)}
              </span>
            </div>
            
            {/* Stats Grid 2x2 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-amber-50 rounded-lg px-3 py-2">
                <span className="text-xs text-amber-600 block">Bonificación</span>
                <span className={`text-sm font-semibold ${
                  colaborador.bonificaciones > 0 ? 'text-amber-600' : 'text-gray-300'
                }`}>
                  {formatearMoneda(colaborador.bonificaciones)}
                </span>
              </div>
              <div className="bg-orange-50 rounded-lg px-3 py-2">
                <span className="text-xs text-orange-600 block">Adelantos</span>
                <span className={`text-sm font-semibold ${
                  colaborador.adelantos > 0 ? 'text-orange-600' : 'text-gray-300'
                }`}>
                  {formatearMoneda(colaborador.adelantos)}
                </span>
              </div>
              <div className="bg-emerald-50 rounded-lg px-3 py-2">
                <span className="text-xs text-emerald-600 block">Pagos Diarios</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatearMoneda(colaborador.pagosDiarios)}
                </span>
              </div>
              <div className="bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-xs text-blue-600 block">Total a Pagar</span>
                <span className={`text-sm font-semibold ${
                  colaborador.totalAPagar >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {formatearMoneda(colaborador.totalAPagar)}
                </span>
              </div>
            </div>
            
            {/* Botones de Acción - Solo iconos en móvil */}
            <div className="flex gap-2">
              <button
                onClick={() => onAbrirModal && onAbrirModal(colaborador)}
                className="flex-1 px-2 sm:px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1"
                title="Registrar pago diario"
              >
                <span className="text-base">💵</span>
                <span className="hidden sm:inline">Pago Diario</span>
              </button>
              <button
                onClick={() => onAbrirModalBonificacion && onAbrirModalBonificacion(colaborador)}
                className="flex-1 px-2 sm:px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm flex items-center justify-center gap-1"
                title="Bonificación especial o adelanto (metas son automáticas)"
              >
                <span className="text-base">🎁</span>
                <span className="hidden sm:inline">Bono</span>
              </button>
              <button
                onClick={() => onAbrirModalDescuento && onAbrirModalDescuento(colaborador)}
                className="flex-1 px-2 sm:px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1"
                title="Registrar descuento o faltante"
              >
                <span className="text-base">🔻</span>
                <span className="hidden sm:inline">Descuento</span>
              </button>
              <button
                onClick={() => onMostrarDetalle(colaborador)}
                className="flex-1 px-2 sm:px-3 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-1"
                title="Ver detalle"
              >
                <span className="text-base">📋</span>
                <span className="hidden sm:inline">Detalle</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Vista Desktop: Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Colaborador
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Bonificación
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Adelantos
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pagos Diarios
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total a Pagar
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-50">
            {datosColaboradores.map((colaborador) => (
              <tr key={colaborador._id} className="hover:bg-slate-50/50 transition-colors">
                {/* Columna: Colaborador */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                      {colaborador.nombre_negocio?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-800">
                        {colaborador.nombre_negocio}
                      </div>
                      <div className="hidden sm:block text-xs text-gray-400">
                        {colaborador.email}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {colaborador.role}
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* Columna: Bonificación */}
                <td className="px-4 py-4 text-right">
                  <span className={`text-sm font-semibold ${
                    colaborador.bonificaciones > 0 ? 'text-amber-500' : 'text-gray-300'
                  }`}>
                    {formatearMoneda(colaborador.bonificaciones)}
                  </span>
                </td>
                
                {/* Columna: Adelantos */}
                <td className="px-4 py-4 text-right">
                  <span className={`text-sm font-semibold ${
                    colaborador.adelantos > 0 ? 'text-orange-500' : 'text-gray-300'
                  }`}>
                    {formatearMoneda(colaborador.adelantos)}
                  </span>
                </td>
                
                {/* Columna: Pagos Diarios */}
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-semibold text-emerald-500">
                    {formatearMoneda(colaborador.pagosDiarios)}
                  </span>
                </td>
                
                {/* Columna: Total a Pagar */}
                <td className="px-4 py-4 text-right">
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                    colaborador.totalAPagar >= 0 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {formatearMoneda(colaborador.totalAPagar)}
                  </span>
                </td>
                
                {/* Columna: Acciones */}
                <td className="px-4 py-4">
                  <div className="flex flex-col sm:flex-row gap-1.5 justify-center">
                    {/* Botón Pago Diario Manual */}
                    <button
                      onClick={() => onAbrirModal && onAbrirModal(colaborador)}
                      className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                      title="Registrar pago diario manual"
                    >
                      💵 Pago Diario
                    </button>
                    {/* Botón Bonificación Especial/Adelanto */}
                    <button
                      onClick={() => onAbrirModalBonificacion && onAbrirModalBonificacion(colaborador)}
                      className="px-2.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors shadow-sm"
                      title="Bonificación especial o adelanto"
                    >
                      🎁 Bono
                    </button>
                    {/* Botón Descuento/Faltante */}
                    <button
                      onClick={() => onAbrirModalDescuento && onAbrirModalDescuento(colaborador)}
                      className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors shadow-sm"
                      title="Registrar descuento o faltante"
                    >
                      🔻 Descuento
                    </button>
                    {/* Botón Ver Detalle */}
                    <button
                      onClick={() => onMostrarDetalle(colaborador)}
                      className="px-2.5 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      📋 Detalle
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
