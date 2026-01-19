/**
 * Página de Control de Asistencias
 * Gestión completa de asistencias con diferentes vistas
 */

import React, { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import useGestionPersonal from '../hooks/useGestionPersonal';
import useAsistencias from '../hooks/useAsistencias';
import CalendarioAsistencias from '../components/CalendarioAsistencias';
import ListaAsistencias from '../components/ListaAsistencias';
import ReporteAsistencias from '../components/ReporteAsistencias';
import ModalAsistencia from '../components/ModalAsistencia';
import FiltrosAsistencia from '../components/FiltrosAsistencia';

function AsistenciasPage() {
  const { basePath } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Hook de gestión personal para obtener colaboradores
  const {
    state: personalState
  } = useGestionPersonal();

  const { colaboradores } = personalState;
  
  // Hook de asistencias
  const {
    state: asistenciaState,
    actions: asistenciaActions
  } = useAsistencias();
  
  // Cargar asistencias al montar y cuando cambien los parámetros de URL
  useEffect(() => {
    // Si hay un colaborador en la URL, establecer el filtro
    const colaboradorParam = searchParams.get('colaborador');
    if (colaboradorParam) {
      asistenciaActions.setFiltroColaborador(colaboradorParam);
    }
    
    asistenciaActions.cargarAsistencias();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Actualizar URL cuando cambia el colaborador filtrado
  const handleFiltrosChange = (nuevosFiltros) => {
    asistenciaActions.setFiltrosAsistencia(nuevosFiltros);
    
    // Actualizar query params de la URL
    const newParams = new URLSearchParams(searchParams);
    if (nuevosFiltros.colaboradorId) {
      newParams.set('colaborador', nuevosFiltros.colaboradorId);
    } else {
      newParams.delete('colaborador');
    }
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Filtros de asistencias */}
      <FiltrosAsistencia
        filtros={asistenciaState.filtrosAsistencia}
        colaboradores={colaboradores}
        onFiltrosChange={handleFiltrosChange}
        onVistaChange={asistenciaActions.setVistaAsistencia}
        vistaActual={asistenciaState.vistaAsistencia}
        onNuevaAsistencia={() => asistenciaActions.abrirModalAsistencia('crear')}
        onResetFiltros={asistenciaActions.resetFiltros}
      />
      
      {/* Contenido según vista seleccionada */}
      {asistenciaState.vistaAsistencia === 'calendario' && (
        <CalendarioAsistencias
          asistencias={asistenciaState.asistencias}
          filtros={asistenciaState.filtrosAsistencia}
          onDiaClick={(modo, asistencia) => asistenciaActions.abrirModalAsistencia(modo, asistencia)}
          onCargarDatos={(filtros) => {
            asistenciaActions.setFiltrosAsistencia(filtros);
            asistenciaActions.cargarAsistencias(filtros);
          }}
          onNuevaAsistencia={(fecha) => {
            asistenciaActions.abrirModalAsistencia('crear', null, null);
          }}
          loading={asistenciaState.loading}
        />
      )}
      
      {asistenciaState.vistaAsistencia === 'lista' && (
        <ListaAsistencias
          asistencias={asistenciaState.asistencias}
          onEditar={(asistencia) => asistenciaActions.abrirModalAsistencia('editar', asistencia)}
          onEliminar={asistenciaActions.eliminarAsistencia}
          loading={asistenciaState.loading}
        />
      )}
      
      {asistenciaState.vistaAsistencia === 'reporte' && (
        <ReporteAsistencias
          asistencias={asistenciaState.asistencias}
          filtros={asistenciaState.filtrosAsistencia}
          loading={asistenciaState.loading}
        />
      )}
      
      {/* Modal de asistencia */}
      <ModalAsistencia
        isOpen={asistenciaState.modalAsistencia.isOpen}
        modo={asistenciaState.modalAsistencia.modo}
        asistencia={asistenciaState.modalAsistencia.asistencia}
        colaboradores={colaboradores}
        colaboradorPreseleccionado={asistenciaState.modalAsistencia.colaboradorPreseleccionado}
        onClose={asistenciaActions.cerrarModalAsistencia}
        onSubmit={asistenciaActions.registrarAsistencia}
        onUpdate={asistenciaActions.actualizarAsistencia}
      />
    </div>
  );
}

export default AsistenciasPage;
