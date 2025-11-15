/**
 * Componente principal del módulo Gestión de Personal V2
 * Arquitectura limpia, optimizada y mantenible
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import useGestionPersonal from './hooks/useGestionPersonal';
import ColaboradoresTable from './components/ColaboradoresTable';
import ColaboradorDetalle from './components/ColaboradorDetalle';
import PagosRealizados from './components/PagosRealizados';
import ProfileManagement from '../../Pages/ProfileManagement';
import RegistroModal from './components/RegistroModal';
import api from '../../services/api';

function GestionPersonalV2() {
  const {
    state,
    actions,
    selectors
  } = useGestionPersonal();

  const {
    colaboradores,
    registros,
    estadisticasBulk,
    pagosRealizados,
    modalState,
    vista,
    detalleColaborador,
    error
  } = state;

  const {
    crearRegistro,
    crearPago,
    eliminarPago,
    abrirModal,
    cerrarModal,
    abrirConfirmacion,
    cerrarConfirmacion,
    confirmarEliminar,
    mostrarDetalle,
    volverAColaboradores,
    formatearMoneda
  } = actions;
  
  // Estado para tabs
  const [tabActual, setTabActual] = useState('personal');
  
  // Estado para rol del usuario
  const [userRole, setUserRole] = useState(null);
  
  // Obtener rol del usuario
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await api.get('/api/auth/my-profile');
        const role = res.data.role?.trim().toLowerCase() || null;
        setUserRole(role);
      } catch (err) {
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header con Tabs */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <h2 className="text-xl sm:text-2xl font-bold">
              Gestión de Personal V2
            </h2>
            {vista === 'detalle' && detalleColaborador && (
              <span className="text-base sm:text-lg text-gray-600">
                - {detalleColaborador.nombre_negocio}
              </span>
            )}
          </div>
          {vista === 'detalle' && (
            <button
              onClick={volverAColaboradores}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm sm:text-base"
            >
              ← Volver a Colaboradores
            </button>
          )}
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setTabActual('personal')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              tabActual === 'personal'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setTabActual('pagos')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              tabActual === 'pagos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Pagos Realizados
          </button>
          <button
            onClick={() => setTabActual('colaboradores')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              tabActual === 'colaboradores'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Colaboradores
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Contenido según tab activo */}
      {tabActual === 'personal' && (
        <>
          {/* Vista de Colaboradores o Detalle */}
          {vista === 'colaboradores' ? (
            <ColaboradoresTable
              colaboradores={colaboradores}
              estadisticasBulk={estadisticasBulk}
              pagosRealizados={pagosRealizados}
              onAbrirModal={abrirModal}
              onMostrarDetalle={mostrarDetalle}
              formatearMoneda={formatearMoneda}
              loading={selectors.isLoading}
            />
          ) : vista === 'detalle' && detalleColaborador ? (
            <ColaboradorDetalle
              colaborador={detalleColaborador}
              registros={selectors.getRegistrosColaborador(detalleColaborador.clerk_id)}
              estadisticas={selectors.getEstadisticasColaborador(detalleColaborador.clerk_id)}
              onVolver={volverAColaboradores}
              onCrearRegistro={() => abrirModal(detalleColaborador)}
              onEliminarRegistro={abrirConfirmacion}
              formatearMoneda={formatearMoneda}
              loading={selectors.isLoading}
            />
          ) : null}
        </>
      )}
      
      {tabActual === 'pagos' && (
        <PagosRealizados
          colaboradores={colaboradores}
          pagosRealizados={pagosRealizados}
          registros={registros}
          estadisticasBulk={estadisticasBulk}
          onCrearPago={crearPago}
          onEliminarPago={eliminarPago}
          formatearMoneda={formatearMoneda}
          loading={selectors.isLoading}
        />
      )}
      
      {tabActual === 'colaboradores' && (
        <ProfileManagement userRole={userRole || "super_admin"} />
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
    </div>
  );
}

export default GestionPersonalV2;
