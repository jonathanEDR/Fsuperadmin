import React, { useEffect, useState } from 'react';
import { gestionPersonalService } from '../../services';
import GestionPersonalModal from './GestionPersonalModal';
import GestionPersonalList from './GestionPersonalList';

function GestionPersonal() {
  const [registros, setRegistros] = useState([]); // Todos los registros
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [registroAEliminar, setRegistroAEliminar] = useState(null);
  const [vistaActual, setVistaActual] = useState('colaboradores');
  const [colaboradorDetalle, setColaboradorDetalle] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState('historico');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Estados para paginación VISUAL en vista de detalle (solo frontend)
  const [registrosMostrados, setRegistrosMostrados] = useState(10); // Inicialmente mostrar 10

  useEffect(() => {
    cargarDatos();
  }, []);  

  const cargarDatos = async () => {
    await Promise.all([fetchRegistros(), fetchColaboradores()]);
  };

  // Obtener todos los registros (sin paginación backend)
  const fetchRegistros = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await gestionPersonalService.obtenerRegistros();
      setRegistros(data || []);
    } catch (error) {
      console.error('Error al obtener registros:', error);
      setError(error.message || 'Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  // Obtener registros con paginación para la vista de detalle
  const fetchRegistrosDetalle = async (colaboradorId, pagina = 1, resetear = false) => {
    try {
      const loadingState = pagina === 1 || resetear ? setLoading : setLoadingMore;
      loadingState(true);
      setError(null);
      
      const data = await gestionPersonalService.obtenerRegistros(pagina, 10);
      
      // Filtrar registros del colaborador específico
      const registrosColaborador = data.registros?.filter(registro => 
        registro.colaboradorUserId === colaboradorId
      ) || [];
      
      // Si es la primera página o resetear, reemplazar registros
      // Si no, agregar a los existentes (para "Ver más")
      if (pagina === 1 || resetear) {
        setRegistrosDetalle(registrosColaborador);
        setPaginaActualDetalle(1);
      } else {
        setRegistrosDetalle(prev => [...prev, ...registrosColaborador]);
        setPaginaActualDetalle(pagina);
      }
      
      // Actualizar metadata de paginación (aproximada para el colaborador)
      const totalRegistrosColaborador = todosLosRegistros.filter(r => 
        r.colaboradorUserId === colaboradorId
      ).length;
      
      setHayMasRegistrosDetalle(registrosDetalle.length + registrosColaborador.length < totalRegistrosColaborador);
      setTotalRegistrosDetalle(totalRegistrosColaborador);
      
    } catch (error) {
      console.error('Error al obtener registros de detalle:', error);
      setError(error.message || 'Error al cargar los registros');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  const fetchColaboradores = async () => {
    try {      
      const data = await gestionPersonalService.obtenerColaboradores();
      setColaboradores(data);
    } catch (error) {
      console.error('Error al obtener colaboradores:', error);
      setError(error.message || 'Error al cargar colaboradores');
    }
  };  

  const handleCrearRegistro = async (datosRegistro) => {
    try {
      setLoading(true);
      setError(null);
      
      const nuevoRegistro = await gestionPersonalService.crearRegistro(datosRegistro);
      
      if (nuevoRegistro) {
        await fetchRegistros(); // Recargar todos los registros
        setIsModalOpen(false);
        setColaboradorSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al crear registro:', error);
      setError(error.message || 'Error al crear el registro');
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminarRegistro = (id) => {
    setRegistroAEliminar(id);
    setIsConfirmModalOpen(true);
  };  

  const handleEliminarRegistro = async () => {
    if (!registroAEliminar) return;

    try {
      setLoading(true);
      await gestionPersonalService.eliminarRegistro(registroAEliminar);
      
      await fetchRegistros(); // Recargar todos los registros
      
      setIsConfirmModalOpen(false);
      setRegistroAEliminar(null);
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      setError(error.message || 'Error al eliminar el registro');
    } finally {
      setLoading(false);
    }
  };
  const abrirModalParaColaborador = (colaborador) => {
    setColaboradorSeleccionado(colaborador);
    setIsModalOpen(true);
  };

  const mostrarDetalleColaborador = (colaborador) => {
    setColaboradorDetalle(colaborador);
    setVistaActual('detalle');
    setRegistrosMostrados(10); // Resetear a 10 registros iniciales
  };

  const volverAColaboradores = () => {
    setColaboradorDetalle(null);
    setVistaActual('colaboradores');
    setRegistrosMostrados(10); // Resetear paginación
  };  

  const obtenerRegistrosDeColaborador = (colaboradorId) => {
    return registros.filter(registro => 
      registro.colaboradorUserId === colaboradorId
    );
  };

  const calcularTotales = (colaboradorId) => {
    const registrosColaborador = obtenerRegistrosDeColaborador(colaboradorId);
    return registrosColaborador.reduce((totales, registro) => ({
      gastos: totales.gastos + (registro.monto || 0),
      faltantes: totales.faltantes + (registro.faltante || 0),
      adelantos: totales.adelantos + (registro.adelanto || 0),
      pagosDiarios: totales.pagosDiarios + (registro.pagodiario || 0)
    }), { gastos: 0, faltantes: 0, adelantos: 0, pagosDiarios: 0 });
  };

  // Función para manejar "Ver más registros" (paginación visual)
  const verMasRegistros = () => {
    setRegistrosMostrados(prev => prev + 10);
  };
  const formatearMoneda = (cantidad) => {
    if (cantidad === null || cantidad === undefined) return 'S/0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(cantidad);
  };

  const handleCustomDateRangeChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Gestión de Personal</h2>
          {vistaActual === 'detalle' && colaboradorDetalle && (
            <span className="text-lg text-gray-600">- {colaboradorDetalle.nombre_negocio}</span>
          )}
        </div>
        
        {vistaActual === 'detalle' && (
          <button
            onClick={volverAColaboradores}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ← Volver a Colaboradores
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {vistaActual === 'colaboradores' ? (
        <div className="space-y-6">
          {/* Lista de colaboradores */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-medium">Colaboradores</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando colaboradores...</p>
              </div>
            ) : colaboradores.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay colaboradores disponibles
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {colaboradores.map((colaborador) => {
                  const totales = calcularTotales(colaborador.clerk_id);
                  const totalAPagar = totales.pagosDiarios - (totales.faltantes + totales.adelantos);
                  
                  return (
                    <div key={colaborador._id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {colaborador.nombre_negocio}
                          </h4>
                          <p className="text-sm text-gray-600">{colaborador.email}</p>
                          <p className="text-sm text-gray-600 capitalize">{colaborador.role}</p>
                          
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Total Gastos:</span>
                              <span className="block text-red-600 font-bold">
                                {formatearMoneda(totales.gastos)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Faltantes:</span>
                              <span className="block text-orange-600 font-bold">
                                {formatearMoneda(totales.faltantes)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Adelantos:</span>
                              <span className="block text-blue-600 font-bold">
                                {formatearMoneda(totales.adelantos)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Pagos Diarios:</span>
                              <span className="block text-green-600 font-bold">
                                {formatearMoneda(totales.pagosDiarios)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Total a Pagar:</span>
                              <span className={`block font-bold ${totalAPagar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatearMoneda(totalAPagar)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => abrirModalParaColaborador(colaborador)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Nuevo Registro
                          </button>
                          <button
                            onClick={() => mostrarDetalleColaborador(colaborador)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Ver Detalle
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}              </div>
            )}
          </div>
        </div>      ) : (
        /* Vista de detalle del colaborador con paginación visual */
        <div className="space-y-6">
          {(() => {
            const todosLosRegistrosColaborador = obtenerRegistrosDeColaborador(colaboradorDetalle?.clerk_id);
            const registrosMostrar = todosLosRegistrosColaborador.slice(0, registrosMostrados);
            const hayMasRegistros = registrosMostrados < todosLosRegistrosColaborador.length;
            
            return (
              <>
                <GestionPersonalList
                  registros={registrosMostrar}
                  todosLosRegistros={todosLosRegistrosColaborador} // Pasar TODOS los registros para cálculos
                  onEliminar={confirmarEliminarRegistro}
                  loading={loading}
                  filtroFecha={filtroFecha}
                  onFiltroChange={setFiltroFecha}
                  customDateRange={customDateRange}
                  onCustomDateRangeChange={handleCustomDateRangeChange}
                />
                
                {/* Botón "Ver más" cuando hay más registros para mostrar */}
                {hayMasRegistros && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {registrosMostrar.length} de {todosLosRegistrosColaborador.length} registros
                      </div>
                      
                      <button
                        onClick={verMasRegistros}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      >
                        Ver más registros
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Modal para crear registro */}
      <GestionPersonalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setColaboradorSeleccionado(null);
        }}
        onSubmit={handleCrearRegistro}
        colaboradorSeleccionado={colaboradorSeleccionado}
        loading={loading}
        error={error}
      />

      {/* Modal de confirmación para eliminar */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setRegistroAEliminar(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarRegistro}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionPersonal;
