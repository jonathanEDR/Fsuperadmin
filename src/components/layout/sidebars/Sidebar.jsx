import React from 'react';
import { UserCircle, FileText, LogOut, ShoppingBag, ChevronLeft, ChevronRight, X } from 'lucide-react';

function Sidebar({ currentView, onViewChange, onLogout, isCollapsed, toggleSidebar, isMobileView }) {  const menuItems = [
    { id: 'notes', icon: FileText, label: 'Mis Notas' },
    { id: 'ventas', icon: ShoppingBag, label: 'Mis Ventas' },
    { id: 'profile', icon: UserCircle, label: 'Mi Perfil' },
  ];

  return (
    <>
      {/* Overlay para móviles */}
      {!isCollapsed && isMobileView && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}

      <div className={`
        fixed top-0 left-0 h-screen bg-white shadow-lg z-30
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-[280px]'}
        ${isMobileView && isCollapsed ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            {!isCollapsed && (
              <h2 className="text-xl font-bold text-gray-800">Panel de Usuario</h2>
            )}
            {/* Botón de toggle para móviles */}
            {isMobileView ? (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-blue-50 text-blue-600"
              >
                <X size={24} />
              </button>
            ) : (
              /* Botón de toggle para escritorio */
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
              </button>
            )}
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    if (isMobileView) toggleSidebar();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    hover:bg-blue-50 hover:text-blue-600
                    ${currentView === item.id
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-600'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : ""}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium whitespace-nowrap truncate">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-red-600 hover:bg-red-50 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? "Cerrar Sesión" : ""}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
