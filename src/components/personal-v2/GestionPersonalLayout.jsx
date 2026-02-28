/**
 * Layout wrapper para Gestión de Personal V2
 * Usa React Router para navegación por URL en lugar de estado local
 * Permite historial de navegador y URLs compartibles
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Users, Wallet, CalendarCheck, Building2, Target, MapPin } from 'lucide-react';
import { useUserRole } from '../../hooks/useUserRole';
import ConfiguracionTardanzaModal from './components/ConfiguracionTardanzaModal';

// Contexto para compartir datos entre páginas del módulo
export const PersonalContext = React.createContext(null);

function GestionPersonalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🆕 Usar el hook centralizado para obtener el rol
  const { userRole, isLoading: roleLoading } = useUserRole();
  
  // Estado para modal de configuración de tardanzas
  const [modalConfigTardanza, setModalConfigTardanza] = useState(false);

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
      icon: Users,
      path: `${basePath}`,
      exact: true
    },
    { 
      id: 'pagos', 
      label: 'Pagos Realizados', 
      icon: Wallet,
      path: `${basePath}/pagos-realizados`
    },
    { 
      id: 'asistencias', 
      label: 'Control de Asistencias', 
      icon: CalendarCheck,
      path: `${basePath}/asistencias`
    },
    { 
      id: 'colaboradores', 
      label: 'Colaboradores', 
      icon: Building2,
      path: `${basePath}/perfiles`
    },
    { 
      id: 'metas', 
      label: 'Metas y Bonificaciones', 
      icon: Target,
      path: `${basePath}/metas`
    },
    { 
      id: 'mapa', 
      label: 'Mapa Ubicaciones', 
      icon: MapPin,
      path: `${basePath}/mapa`
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users size={22} className="text-blue-600" />
                Gestion de Personal
              </h2>
            </div>
          </div>
          
          {/* Tabs Navigation - Scroll horizontal en móvil */}
          <div className="relative flex items-end gap-1.5">
            <div className="flex-1 min-w-0 flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-px border-b border-gray-200">
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
                  {tab.icon && <tab.icon size={15} className="sm:hidden" />}
                  <span className="hidden sm:inline">{tab.label}</span>
                </NavLink>
              ))}
            </div>
            
            {/* Botón de configuración */}
            <div className="flex-shrink-0 pb-px">
              <button
                onClick={() => setModalConfigTardanza(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 font-medium text-sm transition-all whitespace-nowrap bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-300 shadow-sm"
                title="Configurar descuentos por tardanza"
              >
                <Settings size={15} strokeWidth={2} />
                <span className="hidden sm:inline text-xs">Configuración</span>
              </button>
            </div>
          </div>
        </div>

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
