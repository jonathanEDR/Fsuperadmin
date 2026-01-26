/**
 * Componente principal del módulo Gestión de Personal V2
 * Arquitectura limpia, optimizada y mantenible
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useUserRole } from '../../hooks/useUserRole';
import useGestionPersonal from './hooks/useGestionPersonal';
import useAsistencias from './hooks/useAsistencias';
import ColaboradoresTable from './components/ColaboradoresTable';
import ColaboradorDetalle from './components/ColaboradorDetalle';
import PagosRealizados from './components/PagosRealizados';
import ProfileManagement from '../../Pages/ProfileManagement';
import RegistroModal from './components/RegistroModal';
import BonificacionAdelantoModal from './components/BonificacionAdelantoModal';
import ConfiguracionTardanzaModal from './components/ConfiguracionTardanzaModal';
import CalendarioAsistencias from './components/CalendarioAsistencias';
import ListaAsistencias from './components/ListaAsistencias';
import ReporteAsistencias from './components/ReporteAsistencias';
import ModalAsistencia from './components/ModalAsistencia';
import FiltrosAsistencia from './components/FiltrosAsistencia';
import MetasSucursal from './components/MetasSucursal';
import api from '../../services/api';

function GestionPersonalV2() {
  const { userRole } = useUserRole();
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
  
  // Hook de asistencias
  const {
    state: asistenciaState,
    actions: asistenciaActions
  } = useAsistencias();
  
  // Estado para tabs
  const [tabActual, setTabActual] = useState('personal');
  
  // 🆕 Estado para modal de bonificación/adelanto
  const [modalBonificacion, setModalBonificacion] = useState({
    isOpen: false,
    colaborador: null
  });
  
  // 🆕 Estado para modal de configuración de tardanzas
  const [modalConfigTardanza, setModalConfigTardanza] = useState(false);
  
  // 🆕 Estado para sincronización de cobros históricos
  const [sincronizacion, setSincronizacion] = useState({
    loading: false,
    resultado: null,
    mostrarModal: false
  });
  
  // 🆕 Función para ejecutar sincronización de cobros históricos
  const ejecutarSincronizacion = async (soloVerificar = false) => {
    try {
      setSincronizacion(prev => ({ ...prev, loading: true, resultado: null }));
      
      if (soloVerificar) {
        // Solo diagnóstico
        const response = await api.get('/debug/cobros/sincronizacion');
        setSincronizacion({
          loading: false,
          resultado: {
            tipo: 'diagnostico',
            ...response.data
          },
          mostrarModal: true
        });
      } else {
        // Ejecutar sincronización
        const response = await api.post('/debug/cobros/sincronizacion', { 
          ejecutar: true 
        });
        setSincronizacion({
          loading: false,
          resultado: {
            tipo: 'ejecutado',
            ...response.data
          },
          mostrarModal: true
        });
        // Recargar datos después de sincronizar
        if (response.data.resultados?.faltantesCreados > 0 || response.data.resultados?.gastosCreados > 0) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      setSincronizacion({
        loading: false,
        resultado: {
          tipo: 'error',
          error: error.response?.data?.error || error.message
        },
        mostrarModal: true
      });
    }
  };
  
  // 🆕 Handlers para modal de bonificación/adelanto
  const abrirModalBonificacion = (colaborador) => {
    setModalBonificacion({ isOpen: true, colaborador });
  };
  
  const cerrarModalBonificacion = () => {
    setModalBonificacion({ isOpen: false, colaborador: null });
  };
  
  const crearBonificacionAdelanto = async (data) => {
    try {
      // Usar el servicio existente para crear registro
      // 🆕 incluirPagoDiario: false para que NO se agregue el pago diario calculado
      await crearRegistro({
        colaboradorUserId: data.colaboradorUserId,
        fechaDeGestion: data.fechaDeGestion,
        descripcion: data.descripcion,
        adelanto: data.tipo === 'adelanto' ? data.monto : 0,
        bonificacion: data.tipo === 'bonificacion' ? data.monto : 0,
        descripcionBonificacion: data.tipo === 'bonificacion' ? data.descripcion : '',
        incluirDatosCobros: false, // No incluir cobros automáticos para este tipo de registro
        incluirPagoDiario: false // 🆕 NO incluir el pago diario calculado (solo bonificación/adelanto)
      });
      cerrarModalBonificacion();
    } catch (error) {
      console.error('Error al crear bonificación/adelanto:', error);
    }
  };
  
  // Cargar asistencias cuando se selecciona el tab
  useEffect(() => {
    if (tabActual === 'asistencias') {
      asistenciaActions.cargarAsistencias();
    }
  }, [tabActual]); // eslint-disable-line react-hooks/exhaustive-deps

  // Log para verificar que el componente carga correctamente
  console.log('🔄 GestionPersonalV2 - Botón sincronización disponible:', {
    sincronizacionState: sincronizacion,
    userRole
  });

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
          
          {/* Botones de acciones en el header */}
          <div className="flex gap-2 items-center">
            {/* Botón de sincronización de cobros históricos */}
            <button
              onClick={() => ejecutarSincronizacion(true)}
              disabled={sincronizacion.loading}
              className="px-3 py-2 font-medium text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg flex items-center gap-1 border border-purple-300 disabled:opacity-50"
              title="Sincronizar faltantes de cobros históricos"
            >
              {sincronizacion.loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <span>🔄</span>
              )}
              <span className="hidden sm:inline">Sincronizar Cobros</span>
            </button>
            
            {/* Botón de configuración */}
            <button
              onClick={() => setModalConfigTardanza(true)}
              className="px-3 py-2 font-medium text-sm bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg flex items-center gap-1 border border-amber-300"
              title="Configurar descuentos por tardanza"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Configuración</span>
            </button>
            
            {vista === 'detalle' && (
              <button
                onClick={volverAColaboradores}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm sm:text-base"
              >
                ← Volver
              </button>
            )}
          </div>
        </div>
        
        {/* Tabs Navigation - Scroll horizontal en móvil */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-px border-b border-gray-200">
            <button
              onClick={() => setTabActual('personal')}
              className={`snap-start flex-shrink-0 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tabActual === 'personal'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <span className="sm:hidden">👥</span>
              <span className="hidden sm:inline">Personal</span>
            </button>
            <button
              onClick={() => setTabActual('pagos')}
              className={`snap-start flex-shrink-0 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tabActual === 'pagos'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <span className="sm:hidden">💰</span>
              <span className="hidden sm:inline">Pagos Realizados</span>
            </button>
            <button
              onClick={() => setTabActual('asistencias')}
              className={`snap-start flex-shrink-0 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tabActual === 'asistencias'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <span className="sm:hidden">📅</span>
              <span className="hidden sm:inline">Control de Asistencias</span>
            </button>
            <button
              onClick={() => setTabActual('colaboradores')}
              className={`snap-start flex-shrink-0 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tabActual === 'colaboradores'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <span className="sm:hidden">🏢</span>
              <span className="hidden sm:inline">Colaboradores</span>
            </button>
            <button
              onClick={() => setTabActual('metas')}
              className={`snap-start flex-shrink-0 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tabActual === 'metas'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <span className="sm:hidden">🎯</span>
              <span className="hidden sm:inline">Metas y Bonificaciones</span>
            </button>
        </div>
      </div>

      {/* Modal de resultado de sincronización */}
      {sincronizacion.mostrarModal && sincronizacion.resultado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">
                  {sincronizacion.resultado.tipo === 'diagnostico' ? '📊 Diagnóstico de Sincronización' : 
                   sincronizacion.resultado.tipo === 'ejecutado' ? '✅ Sincronización Completada' : 
                   '❌ Error en Sincronización'}
                </h3>
                <button
                  onClick={() => setSincronizacion(prev => ({ ...prev, mostrarModal: false }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {sincronizacion.resultado.tipo === 'error' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {sincronizacion.resultado.error}
                </div>
              ) : sincronizacion.resultado.tipo === 'diagnostico' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {sincronizacion.resultado.stats?.cobrosAnalizados || 0}
                      </div>
                      <div className="text-sm text-blue-700">Cobros analizados</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {sincronizacion.resultado.stats?.faltantesYaExisten || 0}
                      </div>
                      <div className="text-sm text-green-700">Ya sincronizados</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {sincronizacion.resultado.stats?.pendientesFaltantes || 0}
                      </div>
                      <div className="text-sm text-yellow-700">Faltantes pendientes</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {sincronizacion.resultado.stats?.pendientesGastos || 0}
                      </div>
                      <div className="text-sm text-orange-700">Gastos pendientes</div>
                    </div>
                  </div>
                  
                  {(sincronizacion.resultado.stats?.pendientesFaltantes > 0 || 
                    sincronizacion.resultado.stats?.pendientesGastos > 0) && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-3">
                        Se encontraron registros pendientes de sincronizar.
                      </p>
                      <button
                        onClick={() => ejecutarSincronizacion(false)}
                        disabled={sincronizacion.loading}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {sincronizacion.loading ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            🚀 Ejecutar Sincronización
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {sincronizacion.resultado.stats?.pendientesFaltantes === 0 && 
                   sincronizacion.resultado.stats?.pendientesGastos === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                      ✅ Todos los cobros están sincronizados correctamente.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-700 font-medium mb-2">Registros creados:</div>
                    <ul className="text-sm text-green-600 space-y-1">
                      <li>• Faltantes: {sincronizacion.resultado.resultados?.faltantesCreados || 0}</li>
                      <li>• Gastos: {sincronizacion.resultado.resultados?.gastosCreados || 0}</li>
                    </ul>
                    {sincronizacion.resultado.resultados?.errores?.length > 0 && (
                      <div className="mt-2 text-red-600 text-sm">
                        Errores: {sincronizacion.resultado.resultados.errores.length}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setSincronizacion(prev => ({ ...prev, mostrarModal: false }))}
                className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
              onAbrirModalBonificacion={abrirModalBonificacion}
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
              onCambiarTabAsistencias={() => {
                asistenciaActions.setFiltroColaborador(detalleColaborador.clerk_id);
                setTabActual('asistencias');
              }}
              userRole={userRole}
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
      
      {tabActual === 'asistencias' && (
        <div className="space-y-6">
          {/* Filtros de asistencias */}
          <FiltrosAsistencia
            filtros={asistenciaState.filtrosAsistencia}
            colaboradores={colaboradores}
            onFiltrosChange={asistenciaActions.setFiltrosAsistencia}
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
      )}
      
      {tabActual === 'colaboradores' && (
        <ProfileManagement userRole={userRole || "super_admin"} />
      )}

      {tabActual === 'metas' && (
        <MetasSucursal />
      )}

      {/* Modal para crear registro */}
      <RegistroModal
        isOpen={modalState.isOpen}
        onClose={cerrarModal}
        onSubmit={crearRegistro}
        colaborador={modalState.selectedColaborador}
        loading={selectors.isLoading}
      />

      {/* 🆕 Modal para bonificación/adelanto */}
      <BonificacionAdelantoModal
        isOpen={modalBonificacion.isOpen}
        onClose={cerrarModalBonificacion}
        onSubmit={crearBonificacionAdelanto}
        colaborador={modalBonificacion.colaborador}
        loading={selectors.isLoading}
      />

      {/* 🆕 Modal de configuración de tardanzas */}
      <ConfiguracionTardanzaModal
        isOpen={modalConfigTardanza}
        onClose={() => setModalConfigTardanza(false)}
        onSave={(config) => {
          console.log('✅ Configuración de tardanzas guardada:', config);
        }}
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
