/**
 * Página de Detalle de Colaborador
 * Muestra información detallada de un colaborador específico
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useUserRole } from '../../../hooks/useUserRole';
import useGestionPersonal from '../hooks/useGestionPersonal';
import useAsistencias from '../hooks/useAsistencias';
import ColaboradorDetalle from '../components/ColaboradorDetalle';
import RegistroModal from '../components/RegistroModal';

function ColaboradorDetallePage() {
  const { colaboradorId } = useParams();
  const navigate = useNavigate();
  const { basePath } = useOutletContext();
  const { userRole } = useUserRole();
  
  const {
    state,
    actions,
    selectors
  } = useGestionPersonal();

  const {
    colaboradores,
    registros,
    modalState,
    error
  } = state;

  const {
    crearRegistro,
    abrirModal,
    cerrarModal,
    abrirConfirmacion,
    cerrarConfirmacion,
    confirmarEliminar,
    formatearMoneda
  } = actions;

  // Buscar el colaborador actual
  const [colaboradorActual, setColaboradorActual] = useState(null);

  useEffect(() => {
    if (colaboradores.length > 0 && colaboradorId) {
      const found = colaboradores.find(c => c.clerk_id === colaboradorId);
      setColaboradorActual(found || null);
    }
  }, [colaboradores, colaboradorId]);
  
  // Volver a la lista de colaboradores
  const handleVolver = () => {
    navigate(basePath);
  };
  
  // Cambiar al tab de asistencias con filtro de colaborador
  const handleCambiarTabAsistencias = () => {
    navigate(`${basePath}/asistencias?colaborador=${colaboradorId}`);
  };

  // Loading si no hay colaborador
  if (selectors.isLoading && !colaboradorActual) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando colaborador...</span>
      </div>
    );
  }

  // Si no se encuentra el colaborador
  if (!colaboradorActual && !selectors.isLoading) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">Colaborador no encontrado</p>
        <button
          onClick={handleVolver}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Volver a Colaboradores
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header con botón de volver */}
      <div className="mb-4">
        <button
          onClick={handleVolver}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm sm:text-base"
        >
          ← Volver a Colaboradores
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Detalle del colaborador */}
      {colaboradorActual && (
        <ColaboradorDetalle
          colaborador={colaboradorActual}
          registros={selectors.getRegistrosColaborador(colaboradorActual.clerk_id)}
          estadisticas={selectors.getEstadisticasColaborador(colaboradorActual.clerk_id)}
          onVolver={handleVolver}
          onCrearRegistro={() => abrirModal(colaboradorActual)}
          onEliminarRegistro={abrirConfirmacion}
          formatearMoneda={formatearMoneda}
          loading={selectors.isLoading}
          onCambiarTabAsistencias={handleCambiarTabAsistencias}
          userRole={userRole}
        />
      )}

      {/* Modal para crear registro */}
      <RegistroModal
        isOpen={modalState.isOpen}
        onClose={cerrarModal}
        onSubmit={crearRegistro}
        colaborador={modalState.selectedColaborador}
        loading={selectors.isLoading}
      />

      {/* Modal de confirmación para eliminar */}
      {modalState.isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cerrarConfirmacion}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={selectors.isLoading}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={selectors.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {selectors.isLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ColaboradorDetallePage;
