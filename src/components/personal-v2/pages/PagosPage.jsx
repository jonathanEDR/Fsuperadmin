/**
 * Página de Pagos Realizados
 * Gestión de pagos a colaboradores
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import useGestionPersonal from '../hooks/useGestionPersonal';
import PagosRealizados from '../components/PagosRealizados';

function PagosPage() {
  const { basePath } = useOutletContext();
  
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
    error
  } = state;

  const {
    crearPago,
    eliminarPago,
    formatearMoneda
  } = actions;

  return (
    <>
      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Componente de Pagos Realizados */}
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
    </>
  );
}

export default PagosPage;
