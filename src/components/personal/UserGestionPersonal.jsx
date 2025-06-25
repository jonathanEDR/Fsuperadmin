import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { gestionPersonalService } from '../../services';

function UserGestionPersonal() {
  const { user } = useUser();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrosMostrados, setRegistrosMostrados] = useState(10); // Estado para paginación

  useEffect(() => {
    if (user) {
      fetchMisRegistros();
    }
  }, [user]);

  const fetchMisRegistros = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gestionPersonalService.obtenerMisRegistros();
      setRegistros(data);
    } catch (error) {
      console.error('Error al obtener mis registros:', error);
      setError(error.message || 'Error al cargar mis registros');    } finally {
      setLoading(false);
    }
  };

  const cargarMasRegistros = () => {
    setRegistrosMostrados(prev => prev + 10);
  };
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(cantidad);
  };  const ordenarRegistros = () => {
    return [...registros].sort((a, b) => new Date(b.fechaDeGestion) - new Date(a.fechaDeGestion));
  };  const calcularTotales = () => {
    const registrosOrdenados = ordenarRegistros();
    const totales = {
      gastos: 0,
      pagosDiarios: 0,
      faltantes: 0,
      adelantos: 0
    };

    registrosOrdenados.forEach(registro => {
      totales.gastos += registro.monto || 0;
      totales.pagosDiarios += registro.pagodiario || 0;
      totales.faltantes += registro.faltante || 0;
      totales.adelantos += registro.adelanto || 0;
    });

    return totales;
  };  const registrosOrdenados = ordenarRegistros();
  const registrosPaginados = registrosOrdenados.slice(0, registrosMostrados);
  const totales = calcularTotales();
  const totalAPagar = totales.pagosDiarios - (totales.faltantes + totales.adelantos);
  const hayMasRegistros = registrosOrdenados.length > registrosMostrados;
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Historial Personal</h2>
          <p className="text-gray-600">Visualiza tu historial de pagos, gastos y adelantos</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}      {/* Resumen de totales */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="text-lg font-medium mb-3">Resumen Total</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div>
            <p className="text-sm text-gray-600">Gastos</p>
            <p className="text-lg font-bold text-red-600">{formatearMoneda(totales.gastos)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pagos Recibidos</p>
            <p className="text-lg font-bold text-green-600">{formatearMoneda(totales.pagosDiarios)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Faltantes</p>
            <p className="text-lg font-bold text-orange-600">{formatearMoneda(totales.faltantes)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Adelantos</p>
            <p className="text-lg font-bold text-blue-600">{formatearMoneda(totales.adelantos)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total a Pagar</p>
            <p className={`text-lg font-bold ${totalAPagar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatearMoneda(totalAPagar)}
            </p>
          </div>
        </div>
      </div>{/* Lista de registros */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-lg font-medium">
            Mis Registros ({registrosOrdenados.reduce((total, registro) => {
              let count = 0;
              if (registro.monto && registro.monto > 0) count++;
              if (registro.pagodiario && registro.pagodiario > 0) count++;
              if (registro.faltante && registro.faltante > 0) count++;
              if (registro.adelanto && registro.adelanto > 0) count++;
              return total + count;
            }, 0)} entradas) {registrosMostrados < registrosOrdenados.length && (
              <span className="text-sm font-normal text-gray-500">
                - Mostrando {registrosMostrados} de {registrosOrdenados.length}
              </span>
            )}
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando registros...</p>
          </div>
        ) : registrosPaginados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tienes registros en tu historial
          </div>
        ) : (
          <>            <div className="divide-y divide-gray-200">
              {registrosPaginados.map((registro) => (
                <div key={registro._id} className="p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-800 font-medium text-sm">{registro.descripcion || 'Sin descripción'}</p>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
                      {formatearFecha(registro.fechaDeGestion)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {registro.monto && registro.monto > 0 && (
                      <div>
                        <span className="text-gray-600">Gasto:</span>
                        <span className="block text-red-600 font-bold">
                          {formatearMoneda(registro.monto)}
                        </span>
                      </div>
                    )}
                    {registro.pagodiario && registro.pagodiario > 0 && (
                      <div>
                        <span className="text-gray-600">Pago Diario:</span>
                        <span className="block text-green-600 font-bold">
                          {formatearMoneda(registro.pagodiario)}
                        </span>
                      </div>
                    )}
                    {registro.faltante && registro.faltante > 0 && (
                      <div>
                        <span className="text-gray-600">Faltante:</span>
                        <span className="block text-orange-600 font-bold">
                          {formatearMoneda(registro.faltante)}
                        </span>
                      </div>
                    )}
                    {registro.adelanto && registro.adelanto > 0 && (
                      <div>
                        <span className="text-gray-600">Adelanto:</span>
                        <span className="block text-blue-600 font-bold">
                          {formatearMoneda(registro.adelanto)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Botón Ver más */}
            {hayMasRegistros && (
              <div className="px-4 py-3 bg-gray-50 border-t text-center">
                <button
                  onClick={cargarMasRegistros}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Ver más registros
                  <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Mostrando {registrosMostrados} de {registrosOrdenados.length} registros
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UserGestionPersonal;
