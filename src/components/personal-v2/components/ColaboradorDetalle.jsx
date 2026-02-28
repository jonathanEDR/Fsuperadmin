/**
 * Vista de detalle de un colaborador especifico
 */

import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, DollarSign, Loader2 } from 'lucide-react';
import EstadisticasCard from './EstadisticasCard';
import FiltrosFecha from './FiltrosFecha';
import RegistrosTable from './RegistrosTable';
import AsistenciaResumenCard from './AsistenciaResumenCard';
import useAsistencias from '../hooks/useAsistencias';

// ---- Avatar reutilizable ----
const AvatarColab = ({ nombre, avatar, avatarUrl, size = 'md' }) => {
  const src = avatarUrl || (avatar ? (typeof avatar === 'string' ? avatar : avatar?.url) : null);
  const [err, setErr] = React.useState(false);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' };
  const sz = sizes[size] || sizes.md;
  if (src && !err) {
    return <img src={src} alt={nombre} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`} onError={() => setErr(true)} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}>
      {(nombre || '?').charAt(0).toUpperCase()}
    </div>
  );
};

const ColaboradorDetalle = React.memo(({
  colaborador,
  registros,
  estadisticas,
  onVolver,
  onCrearRegistro,
  onEliminarRegistro,
  formatearMoneda,
  loading,
  onCambiarTabAsistencias,
  userRole
}) => {

  const { state: asistenciaState, actions: asistenciaActions } = useAsistencias();

  const [filtroFecha, setFiltroFecha] = useState('historico');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const handleCustomRangeChange = (field, value) => setCustomRange(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (colaborador?.clerk_id) {
      const hoy = new Date();
      asistenciaActions.setFiltroColaborador(colaborador.clerk_id);
      asistenciaActions.setFiltroMes(hoy.getFullYear(), hoy.getMonth() + 1);
      asistenciaActions.cargarAsistencias();
      asistenciaActions.cargarEstadisticas(colaborador.clerk_id, hoy.getFullYear(), hoy.getMonth() + 1);
    }
  }, [colaborador?.clerk_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const totales = useMemo(() => ({
    adelantos: estadisticas?.totalAdelantos || 0,
    pagosDiarios: estadisticas?.totalPagosDiarios || 0,
    bonificaciones: estadisticas?.totalBonificaciones || 0,
    faltantes: estadisticas?.totalFaltantesConCobros || estadisticas?.totalFaltantes || 0,
    gastos: estadisticas?.totalGastosConCobros || estadisticas?.totalGastos || 0,
    totalAPagar: estadisticas?.totalAPagarConCobros || estadisticas?.totalAPagar || 0,
    cobrosAutomaticos: estadisticas?.cobrosAutomaticos || {
      faltantesPendientes: 0, gastosPendientes: 0, totalVentas: 0, totalCobros: 0
    }
  }), [estadisticas]);

  return (
    <div className="space-y-4">
      {/* Header del colaborador */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
          <button onClick={onVolver}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mb-3 transition-colors">
            <ArrowLeft size={14} /> Volver a Colaboradores
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AvatarColab
                nombre={colaborador?.nombre_negocio || colaborador?.nombre}
                avatar={colaborador?.avatar}
                avatarUrl={colaborador?.avatar_url}
                size="lg"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {colaborador?.nombre_negocio || colaborador?.nombre || 'Cargando...'}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">{colaborador?.email}</p>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Calendar size={12} /> {registros?.length || 0} registros
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <DollarSign size={12} /> Total: {formatearMoneda(totales.totalAPagar)}
                  </span>
                </div>
              </div>
            </div>

            <button onClick={onCrearRegistro}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all">
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Nuevo Registro</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadisticas generales */}
      <EstadisticasCard totales={totales} formatearMoneda={formatearMoneda} />

      {/* Resumen de asistencias del mes */}
      <AsistenciaResumenCard
        estadisticasAsistencia={asistenciaState.estadisticasAsistencia}
        onVerDetalle={onCambiarTabAsistencias}
      />

      {/* Filtros de fecha */}
      <FiltrosFecha
        filtroActual={filtroFecha}
        onFiltroChange={setFiltroFecha}
        customRange={customRange}
        onCustomRangeChange={handleCustomRangeChange}
      />

      {/* Tabla de registros */}
      <RegistrosTable
        registros={registros}
        onEliminar={onEliminarRegistro}
        formatearMoneda={formatearMoneda}
        loading={loading}
        filtroFecha={filtroFecha}
        customRange={customRange}
        userRole={userRole}
      />
    </div>
  );
});

ColaboradorDetalle.displayName = 'ColaboradorDetalle';

export default ColaboradorDetalle;