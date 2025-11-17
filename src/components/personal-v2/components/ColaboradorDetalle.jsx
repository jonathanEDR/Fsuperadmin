/**
 * Vista de detalle de un colaborador específico
 * Muestra estadísticas, información y permite gestionar registros
 */

import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Plus, UserCircle, Calendar, DollarSign } from 'lucide-react';
import EstadisticasCard from './EstadisticasCard';
import FiltrosFecha from './FiltrosFecha';
import RegistrosTable from './RegistrosTable';
import AsistenciaResumenCard from './AsistenciaResumenCard';
import useAsistencias from '../hooks/useAsistencias';

const ColaboradorDetalle = React.memo(({ 
  colaborador,
  registros,
  estadisticas,
  onVolver,
  onCrearRegistro,
  onEliminarRegistro,
  formatearMoneda,
  loading,
  onCambiarTabAsistencias // Nueva prop para cambiar al tab de asistencias
}) => {
  
  // Hook de asistencias para el colaborador
  const {
    state: asistenciaState,
    actions: asistenciaActions
  } = useAsistencias();
  
  // Estado de filtros
  const [filtroFecha, setFiltroFecha] = useState('historico');
  const [customRange, setCustomRange] = useState({
    start: '',
    end: ''
  });

  const handleCustomRangeChange = (field, value) => {
    setCustomRange(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Cargar asistencias del colaborador cuando se abre el detalle
  useEffect(() => {
    if (colaborador?.clerk_id) {
      const hoy = new Date();
      asistenciaActions.setFiltroColaborador(colaborador.clerk_id);
      asistenciaActions.setFiltroMes(hoy.getFullYear(), hoy.getMonth() + 1);
      asistenciaActions.cargarAsistencias();
      
      // Cargar estadísticas del mes actual
      asistenciaActions.cargarEstadisticas(
        colaborador.clerk_id,
        hoy.getFullYear(),
        hoy.getMonth() + 1
      );
    }
  }, [colaborador?.clerk_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calcular totales basados en estadísticas (incluyendo cobros automáticos)
  const totales = useMemo(() => ({
    adelantos: estadisticas?.totalAdelantos || 0,
    pagosDiarios: estadisticas?.totalPagosDiarios || 0,
    bonificaciones: estadisticas?.totalBonificaciones || 0,
    // ✅ Usar totales que incluyen faltantes/gastos de cobros automáticos
    faltantes: estadisticas?.totalFaltantesConCobros || estadisticas?.totalFaltantes || 0,
    gastos: estadisticas?.totalGastosConCobros || estadisticas?.totalGastos || 0,
    totalAPagar: estadisticas?.totalAPagarConCobros || estadisticas?.totalAPagar || 0,
    // Desglose de cobros automáticos
    cobrosAutomaticos: estadisticas?.cobrosAutomaticos || {
      faltantesPendientes: 0,
      gastosPendientes: 0,
      totalVentas: 0,
      totalCobros: 0
    }
  }), [estadisticas]);

  return (
    <div className="space-y-6">
      {/* Header con información del colaborador */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <button
          onClick={onVolver}
          className="flex items-center gap-2 mb-4 text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver a lista</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <UserCircle size={48} />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {colaborador?.nombre_negocio || colaborador?.nombre || 'Cargando...'}
              </h1>
              <p className="text-sm text-white/80 mb-2">
                {colaborador?.email}
              </p>
              <div className="flex flex-wrap gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span className="text-sm">
                    {registros?.length || 0} registros
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign size={16} />
                  <span className="text-sm">
                    Total: {formatearMoneda(totales.totalAPagar)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={onCrearRegistro}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nuevo Registro</span>
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <EstadisticasCard 
        totales={totales}
        formatearMoneda={formatearMoneda}
      />
      
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
      />
    </div>
  );
});

ColaboradorDetalle.displayName = 'ColaboradorDetalle';

export default ColaboradorDetalle;
