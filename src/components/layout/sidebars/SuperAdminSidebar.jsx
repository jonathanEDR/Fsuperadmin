import React from 'react';
import { Home, FileText, UserCog, LogOut, Shield, Package, ShoppingCart, UserCheck, X, ChevronLeft, ChevronRight, CreditCard, Factory } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

function SuperAdminSidebar({ isCollapsed, toggleSidebar, isMobileView }) {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Gestión de Usuarios', route: '/super-admin/usuarios' },
    { id: 'notes', icon: FileText, label: 'Gestión de Notas', route: '/super-admin/notas' },
    { id: 'productos', icon: Package, label: 'Gestión de Productos', route: '/super-admin/productos' },
    { id: 'produccion', icon: Factory, label: 'Gestión de Producción', route: '/super-admin/produccion' },
    { id: 'ventas', icon: ShoppingCart, label: 'Gestión de Ventas', route: '/super-admin/ventas' },
    { id: 'caja', icon: CreditCard, label: 'Gestión de Caja', route: '/super-admin/caja' },
    { id: 'personal', icon: UserCheck, label: 'Gestión de Personal', route: '/super-admin/personal' },
    { id: 'profile', icon: UserCog, label: 'Mi Perfil', route: '/super-admin/perfil' },
  ];

  return (
    <>
      {/* Overlay solo para móviles */}
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
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="text-purple-600" size={24} />
                <span className="transition-opacity duration-200">Panel Super Admin</span>
              </h2>
            )}
            {/* Botón de toggle para móviles */}
            {isMobileView ? (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-purple-50 text-purple-600"
              >
                <X size={24} />
              </button>
            ) : (
              /* Botón de toggle para escritorio */
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex p-2 rounded-lg hover:bg-purple-50 text-purple-600"
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
                    hover:bg-purple-50 hover:text-purple-600
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
            onClick={handleLogout}
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

export default SuperAdminSidebar;
