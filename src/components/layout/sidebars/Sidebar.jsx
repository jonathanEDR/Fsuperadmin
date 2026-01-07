import React from 'react';
import { UserCircle, FileText, LogOut, ShoppingBag, ChevronLeft, ChevronRight, X, QrCode, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

function Sidebar({ isCollapsed, toggleSidebar, isMobileView, isSidebarOpen }) {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };
  
  // Menu simplificado para usuarios:
  // - Catálogo de Productos removido (ya está dentro de Ventas)
  // - Gráficos Producción removido (accesible desde Movimientos Producción)
  const menuItems = [
    { id: 'notes', icon: FileText, label: 'Mis Notas', route: '/user/notas' },
    { id: 'ventas', icon: ShoppingBag, label: 'Mis Ventas', route: '/user/ventas' },
    { id: 'movimientos-produccion', icon: RefreshCw, label: 'Movimientos Producción', route: '/user/produccion/movimientos', badge: 'NUEVO', badgeColor: 'bg-blue-500' },
    { id: 'escaner-qr', icon: QrCode, label: 'Registro de Asistencia', route: '/user/escaner-qr', badge: 'NUEVO', badgeColor: 'bg-green-500' },
    { id: 'profile', icon: UserCircle, label: 'Mi Perfil', route: '/user/perfil' },
  ];

  // Sidebar visible solo si:
  // - Desktop: siempre
  // - Mobile: solo si isSidebarOpen
  const sidebarVisible = !isMobileView || isSidebarOpen;

  return (
    <>
      <div
        className={`
          fixed top-0 left-0 h-screen bg-white shadow-lg z-30
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-[280px]'}
          ${isMobileView
            ? isSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'translate-x-0'}
          ${isMobileView ? 'lg:hidden' : ''}
        `}
        style={{ pointerEvents: sidebarVisible ? 'auto' : 'none' }}
      >
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
                    navigate(item.route);
                    if (isMobileView) toggleSidebar();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    hover:bg-blue-50 hover:text-blue-600
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : ""}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 gap-2">
                      <span className="font-medium whitespace-nowrap truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`${item.badgeColor || 'bg-blue-500'} text-white text-xs px-2 py-0.5 rounded-full font-semibold`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        {/* Botón de cerrar sesión eliminado, ahora está en MyProfileUnified */}
      </div>
    </>
  );
}

export default Sidebar;
