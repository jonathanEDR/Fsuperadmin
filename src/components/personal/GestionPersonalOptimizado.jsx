import React, { useEffect, useState } from 'react';
import { gestionPersonalService } from '../../services';
import { getPagosRealizados } from '../../services/api';
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
  const [pagosRealizados, setPagosRealizados] = useState([]);
  const [estadisticasMejoradas, setEstadisticasMejoradas] = useState({}); // Nuevo estado para estadísticas con cobros
  const [datosCobrosColaborador, setDatosCobrosColaborador] = useState(null); // Datos de cobros para el colaborador en detalle

  // Definir la función antes del useEffect
  const fetchPagosRealizados = async () => {
    try {
      const pagos = await getPagosRealizados();
      setPagosRealizados(pagos || []);
    } catch (error) {
      console.error('Error al obtener pagos realizados:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
    fetchPagosRealizados();
  }, []);  

  const cargarDatos = async () => {
    await Promise.all([fetchRegistros(), fetchColaboradores()]);
    // Cargar estadísticas mejoradas DESPUÉS de tener los colaboradores
    await cargarEstadisticasMejoradas();
  };

  // NUEVA FUNCIÓN: Cargar estadísticas mejoradas para todos los colaboradores
  const cargarEstadisticasMejoradas = async () => {
    try {
      console.log('🔍 Cargando estadísticas mejoradas para colaboradores...');
      
      // Obtener colaboradores actuales si no están en estado
      let colaboradoresParaProcesar = colaboradores;
      if (colaboradoresParaProcesar.length === 0) {
        try {
          colaboradoresParaProcesar = await gestionPersonalService.obtenerColaboradores();
        } catch (error) {
          console.error('Error al obtener colaboradores para estadísticas:', error);
          return;
        }
      }
      
      const estadisticasMap = {};
      
      console.log(`📊 Procesando ${colaboradoresParaProcesar.length} colaboradores para estadísticas mejoradas`);
      
      // Obtener estadísticas mejoradas para cada colaborador
      for (const colaborador of colaboradoresParaProcesar) {
        try {
          console.log(`🔍 Obteniendo estadísticas mejoradas para: ${colaborador.nombre_negocio}`);
          const estadisticas = await gestionPersonalService.obtenerEstadisticasMejoradas(colaborador.clerk_id);
          estadisticasMap[colaborador.clerk_id] = estadisticas.estadisticas;
          console.log(`✅ Estadísticas obtenidas para ${colaborador.nombre_negocio}:`, estadisticas.estadisticas);
        } catch (error) {
          console.warn(`⚠️ No se pudieron obtener estadísticas mejoradas para ${colaborador.nombre_negocio}:`, error.message);
          // Usar estadísticas básicas como fallback
          try {
            const estadisticasBasicas = await gestionPersonalService.obtenerEstadisticasColaborador(colaborador.clerk_id);
            estadisticasMap[colaborador.clerk_id] = estadisticasBasicas;
            console.log(`📋 Usando estadísticas básicas para ${colaborador.nombre_negocio}:`, estadisticasBasicas);
          } catch (basicError) {
            console.error(`❌ Error al obtener estadísticas básicas para ${colaborador.nombre_negocio}:`, basicError.message);
          }
        }
      }
      
      console.log('📊 Estadísticas cargadas:', estadisticasMap);
      setEstadisticasMejoradas(estadisticasMap);
    } catch (error) {
      console.error('❌ Error al cargar estadísticas mejoradas:', error);
    }
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
      
      console.log('Creando registro con datos automáticos:', datosRegistro);
      
      // Siempre usar el servicio básico, ya que el backend maneja automáticamente 
      // la inclusión de datos de cobros según el flag incluirDatosCobros
      const nuevoRegistro = await gestionPersonalService.crearRegistro(datosRegistro);
      
      if (nuevoRegistro) {
        await fetchRegistros(); // Recargar todos los registros
        setIsModalOpen(false);
        setColaboradorSeleccionado(null);
        
        console.log('✅ Registro creado exitosamente con datos automáticos incluidos');
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

  const mostrarDetalleColaborador = async (colaborador) => {
    setColaboradorDetalle(colaborador);
    setVistaActual('detalle');
    setRegistrosMostrados(10); // Resetear a 10 registros iniciales
    
    // Cargar datos de cobros para el colaborador
    try {
      console.log('🔍 Cargando datos de cobros para:', colaborador.nombre_negocio);
      const datosCobros = await gestionPersonalService.obtenerResumenCobros(
        colaborador.clerk_id, 
        null, 
        null, 
        'corregido'
      );
      console.log('📊 Datos de cobros cargados:', datosCobros);
      setDatosCobrosColaborador(datosCobros);
    } catch (error) {
      console.warn('⚠️ Error al cargar datos de cobros:', error.message);
      setDatosCobrosColaborador(null);
    }
  };

  const volverAColaboradores = () => {
    setColaboradorDetalle(null);
    setVistaActual('colaboradores');
    setRegistrosMostrados(10); // Resetear paginación
    setDatosCobrosColaborador(null); // Limpiar datos de cobros
  };  

  const obtenerRegistrosDeColaborador = (colaboradorId) => {
    return registros.filter(registro => 
      registro.colaboradorUserId === colaboradorId
    );
  };

  const calcularTotales = (colaboradorId) => {
    // Primero intentar usar estadísticas mejoradas
    const estadisticas = estadisticasMejoradas[colaboradorId];
    if (estadisticas) {
      return {
        gastos: estadisticas.totalGastos || 0,
        faltantes: estadisticas.totalFaltantes || 0,
        adelantos: estadisticas.totalAdelantos || 0,
        pagosDiarios: estadisticas.totalPagosDiarios || 0,
        // Datos adicionales de cobros automáticos
        faltantesPendientes: estadisticas.cobrosAutomaticos?.faltantesPendientes || 0,
        gastosPendientes: estadisticas.cobrosAutomaticos?.gastosPendientes || 0,
        ventasRelacionadas: estadisticas.cobrosAutomaticos?.totalVentas || 0,
        cobrosRelacionados: estadisticas.cobrosAutomaticos?.totalCobros || 0,
        totalFaltantesConCobros: estadisticas.totalFaltantesConCobros || estadisticas.totalFaltantes || 0,
        totalGastosConCobros: estadisticas.totalGastosConCobros || estadisticas.totalGastos || 0,
        totalAPagarConCobros: estadisticas.totalAPagarConCobros || estadisticas.totalAPagar || 0
      };
    }
    
    // Fallback: calcular manualmente desde registros
    const registrosColaborador = obtenerRegistrosDeColaborador(colaboradorId);
    return registrosColaborador.reduce((totales, registro) => ({
      gastos: totales.gastos + (registro.monto || 0),
      faltantes: totales.faltantes + (registro.faltante || 0),
      adelantos: totales.adelantos + (registro.adelanto || 0),
      pagosDiarios: totales.pagosDiarios + (registro.pagodiario || 0)
    }), { gastos: 0, faltantes: 0, adelantos: 0, pagosDiarios: 0 });
  };

  // Calcular pagos realizados por colaborador para el resumen (usando historial de pagos)
  const calcularPagosRealizados = (colaboradorId) => {
    return pagosRealizados
      .filter(p => p.colaboradorUserId === colaboradorId)
      .reduce((total, p) => total + (p.montoTotal || p.monto || 0), 0);
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold truncate">Gestión de Personal</h2>
          {vistaActual === 'detalle' && colaboradorDetalle && (
            <span className="text-base sm:text-lg text-gray-600 truncate">- {colaboradorDetalle.nombre_negocio}</span>
          )}
        </div>
        {vistaActual === 'detalle' && (
          <button
            onClick={volverAColaboradores}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm sm:text-base"
          >
            ← Volver a Colaboradores
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {vistaActual === 'colaboradores' ? (
        <div className="space-y-6">
          {/* Lista de colaboradores */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-base sm:text-lg font-medium">Colaboradores</h3>
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
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Colaborador
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Pendientes de Cobros
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Adelantos
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Pagos Diarios
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Total a Pagar
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {colaboradores.map((colaborador) => {
                      const totales = calcularTotales(colaborador.clerk_id);
                      const pagosRealizadosColab = calcularPagosRealizados(colaborador.clerk_id);
                      
                      // FÓRMULA CORRECTA: pagos diarios - faltantes - adelantos (sin gastos)
                      const totalAPagarBasico = totales.pagosDiarios - (totales.faltantes + totales.adelantos);
                      const totalAPagarConCobros = totales.totalAPagarConCobros !== undefined ? 
                        totales.totalAPagarConCobros : totalAPagarBasico;
                      
                      // El total final debe restar los pagos ya realizados
                      const totalFinalAPagar = totalAPagarConCobros - pagosRealizadosColab;
                      
                      return (
                        <tr key={colaborador._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 border-r">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {colaborador.nombre_negocio}
                              </div>
                              <div className="hidden sm:block text-xs text-gray-500">
                                {colaborador.email}
                              </div>
                              <div className="text-xs text-gray-400 capitalize">
                                {colaborador.role}
                              </div>
                              {/* Mostrar pendientes en móvil como parte del colaborador */}
                              <div className="sm:hidden mt-2">
                                {(totales.faltantesPendientes > 0 || totales.gastosPendientes > 0) ? (
                                  <div className="text-xs">
                                    <span className="text-orange-700">Pendientes: </span>
                                    <span className="font-medium text-purple-600">
                                      {formatearMoneda(totales.faltantesPendientes + totales.gastosPendientes)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Sin pendientes</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-4 text-right border-r">
                            <div className="flex flex-col">
                              {(totales.faltantesPendientes > 0 || totales.gastosPendientes > 0) ? (
                                <>
                                  {totales.faltantesPendientes > 0 && (
                                    <span className="text-xs text-orange-700">
                                      Faltantes: {formatearMoneda(totales.faltantesPendientes)}
                                    </span>
                                  )}
                                  {totales.gastosPendientes > 0 && (
                                    <span className="text-xs text-red-700">
                                      Gastos: {formatearMoneda(totales.gastosPendientes)}
                                    </span>
                                  )}
                                  <span className="text-sm font-bold text-purple-600 mt-1 pt-1 border-t border-gray-200">
                                    Total: {formatearMoneda(totales.faltantesPendientes + totales.gastosPendientes)}
                                  </span>
                                  {totales.ventasRelacionadas > 0 && (
                                    <span className="text-xs text-blue-600 mt-1">
                                      {totales.ventasRelacionadas} ventas → {totales.cobrosRelacionados} cobros
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-500">Sin pendientes</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right border-r">
                            <span className="text-sm font-bold text-blue-600">
                              {formatearMoneda(totales.adelantos)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right border-r">
                            <span className="text-sm font-bold text-green-600">
                              {formatearMoneda(totales.pagosDiarios)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right border-r">
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${totalFinalAPagar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatearMoneda(totalFinalAPagar)}
                              </span>                          
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <button
                                onClick={() => abrirModalParaColaborador(colaborador)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                Nuevo Registro
                              </button>
                              <button
                                onClick={() => mostrarDetalleColaborador(colaborador)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                Ver Detalle
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
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
                  todosLosRegistros={todosLosRegistrosColaborador}
                  onEliminar={confirmarEliminarRegistro}
                  loading={loading}
                  filtroFecha={filtroFecha}
                  onFiltroChange={setFiltroFecha}
                  customDateRange={customDateRange}
                  onCustomDateRangeChange={handleCustomDateRangeChange}
                  datosCobros={datosCobrosColaborador}
                  colaboradorId={colaboradorDetalle?.clerk_id}
                />
                {hayMasRegistros && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs sm:text-sm text-gray-600">
                        Mostrando {registrosMostrar.length} de {todosLosRegistrosColaborador.length} registros
                      </div>
                      <button
                        onClick={verMasRegistros}
                        className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-xs sm:text-sm"
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
