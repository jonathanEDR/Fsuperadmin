/**
 * Layout wrapper para Gestión de Personal V2
 * Usa React Router para navegación por URL en lugar de estado local
 * Permite historial de navegador y URLs compartibles
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';
import ConfiguracionTardanzaModal from './components/ConfiguracionTardanzaModal';
import api from '../../services/api';

// Contexto para compartir datos entre páginas del módulo
export const PersonalContext = React.createContext(null);

function GestionPersonalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🆕 Usar el hook centralizado para obtener el rol
  const { userRole, isLoading: roleLoading } = useUserRole();
  
  // Estado para modal de configuración de tardanzas
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
        const response = await api.get('/api/debug/cobros/sincronizacion');
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
        const response = await api.post('/api/debug/cobros/sincronizacion', { 
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

  // Determinar la ruta base según el pathname actual
  const getBasePath = () => {
    if (location.pathname.includes('/super-admin/')) {
      return '/super-admin/personal-v2';
    } else if (location.pathname.includes('/admin/')) {
      return '/admin/personal-v2';
    }
    return '/personal-v2';
  };
  
  const basePath = getBasePath();

  // Definición de tabs con sus rutas
  const tabs = [
    { 
      id: 'personal', 
      label: 'Personal', 
      mobileIcon: '👥',
      path: `${basePath}`,
      exact: true // Solo match exacto para esta ruta
    },
    { 
      id: 'pagos', 
      label: 'Pagos Realizados', 
      mobileIcon: '💰',
      path: `${basePath}/pagos-realizados`
    },
    { 
      id: 'asistencias', 
      label: 'Control de Asistencias', 
      mobileIcon: '📅',
      path: `${basePath}/asistencias`
    },
    { 
      id: 'colaboradores', 
      label: 'Colaboradores', 
      mobileIcon: '🏢',
      path: `${basePath}/perfiles`
    },
    { 
      id: 'metas', 
      label: 'Metas y Bonificaciones', 
      mobileIcon: '🎯',
      path: `${basePath}/metas`
    }
  ];

  // Función helper para determinar si un tab está activo
  const isTabActive = (tab) => {
    const currentPath = location.pathname;
    
    if (tab.exact) {
      // Para la ruta base, verificar que sea exactamente igual o que termine en /colaborador/
      return currentPath === tab.path || 
             currentPath === `${tab.path}/` ||
             currentPath.startsWith(`${basePath}/colaborador/`);
    }
    
    return currentPath.startsWith(tab.path);
  };

  // Contexto value para compartir con las páginas hijas
  const contextValue = {
    userRole,
    basePath,
    navigate
  };

  return (
    <PersonalContext.Provider value={contextValue}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header con Tabs */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Gestión de Personal V2
              </h2>
            </div>
          </div>
          
          {/* Tabs Navigation - Scroll horizontal en móvil */}
          <div className="relative flex items-end gap-2">
            <div className="flex-1 flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-px border-b border-gray-200">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  end={tab.exact}
                  className={({ isActive }) => {
                    // Usar nuestra función personalizada para determinar si está activo
                    const active = isTabActive(tab);
                    return `snap-start flex-shrink-0 px-3 sm:px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      active
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 rounded-t-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg'
                    }`;
                  }}
                >
                  <span className="sm:hidden">{tab.mobileIcon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </NavLink>
              ))}
            </div>
            
            {/* Botón de sincronización y configuración */}
            <div className="flex gap-2 flex-shrink-0">
              {/* Botón de sincronización de cobros */}
              <button
                onClick={() => ejecutarSincronizacion(true)}
                disabled={sincronizacion.loading}
                className="px-3 py-2 font-medium text-sm transition-colors whitespace-nowrap bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg flex items-center gap-1 border border-purple-300 disabled:opacity-50"
                title="Sincronizar faltantes de cobros históricos"
              >
                {sincronizacion.loading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <span>🔄</span>
                )}
                <span className="hidden sm:inline">Sincronizar</span>
              </button>
              
              {/* Botón de configuración de tardanzas */}
              <button
                onClick={() => setModalConfigTardanza(true)}
                className="px-3 py-2 font-medium text-sm transition-colors whitespace-nowrap bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg flex items-center gap-1 border border-amber-300"
                title="Configurar descuentos por tardanza"
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">Configuración</span>
              </button>
            </div>
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

        {/* Contenido de la ruta activa */}
        <Outlet context={contextValue} />
        
        {/* Modal de configuración de tardanzas */}
        <ConfiguracionTardanzaModal
          isOpen={modalConfigTardanza}
          onClose={() => setModalConfigTardanza(false)}
          onSave={(config) => {
            console.log('✅ Configuración de tardanzas guardada:', config);
          }}
        />
      </div>
    </PersonalContext.Provider>
  );
}

export default GestionPersonalLayout;
