/**
 * Pagina de Detalle de Colaborador
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useUserRole } from '../../../hooks/useUserRole';
import useGestionPersonal from '../hooks/useGestionPersonal';
import ColaboradorDetalle from '../components/ColaboradorDetalle';
import RegistroModal from '../components/RegistroModal';
import { ArrowLeft, AlertCircle, Loader2, X } from 'lucide-react';

function ColaboradorDetallePage() {
  const { colaboradorId } = useParams();
  const navigate = useNavigate();
  const { basePath } = useOutletContext();
  const { userRole } = useUserRole();

  const { state, actions, selectors } = useGestionPersonal();
  const { colaboradores, registros, modalState, error } = state;
  const { crearRegistro, abrirModal, cerrarModal, abrirConfirmacion, cerrarConfirmacion, confirmarEliminar, formatearMoneda } = actions;

  const [colaboradorActual, setColaboradorActual] = useState(null);

  useEffect(() => {
    if (colaboradores.length > 0 && colaboradorId) {
      setColaboradorActual(colaboradores.find(c => c.clerk_id === colaboradorId) || null);
    }
  }, [colaboradores, colaboradorId]);

  const handleVolver = () => navigate(basePath);
  const handleCambiarTabAsistencias = () => navigate(`${basePath}/asistencias?colaborador=${colaboradorId}`);

  if (selectors.isLoading && !colaboradorActual) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!colaboradorActual && !selectors.isLoading) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-gray-500 mb-4">Colaborador no encontrado</p>
        <button onClick={handleVolver}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all">
          <ArrowLeft size={14} /> Volver a Colaboradores
        </button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-600 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

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

      <RegistroModal
        isOpen={modalState.isOpen}
        onClose={cerrarModal}
        onSubmit={crearRegistro}
        colaborador={modalState.selectedColaborador}
        loading={selectors.isLoading}
      />

      {modalState.isConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-red-500 to-rose-600">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle size={18} /> Confirmar Eliminacion
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-5">
                Esta seguro de que desea eliminar este registro? Esta accion no se puede deshacer.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={cerrarConfirmacion} disabled={selectors.isLoading}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmarEliminar} disabled={selectors.isLoading}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm">
                  {selectors.isLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ColaboradorDetallePage;