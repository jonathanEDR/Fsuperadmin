import React from 'react';
import PagosRealizados from '../components/personal/PagosRealizados';
import useGestionPersonalData from '../components/personal/useGestionPersonalData';

function PagosRealizadosPage() {
  // Hook centralizado para compartir datos y funciones
  const {
    pagos,
    colaboradores,
    registros,
    loading,
    error,
    fetchPagos,
    agregarPago,
    eliminarPago,
    setError
  } = useGestionPersonalData();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <PagosRealizados
        pagos={pagos}
        colaboradores={colaboradores}
        registros={registros}
        loading={loading}
        error={error}
        fetchPagos={fetchPagos}
        agregarPago={agregarPago}
        eliminarPago={eliminarPago}
        setError={setError}
      />
    </div>
  );
}

export default PagosRealizadosPage;
