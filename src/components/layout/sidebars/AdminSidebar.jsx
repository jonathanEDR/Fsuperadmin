import React from 'react';
import { Home, UserCog, LogOut, Shield, Users, Package, ShoppingCart, Menu, X, ChevronLeft, ChevronRight, UserCheck, Factory, Wallet, DollarSign, ScanLine, ArrowRightLeft, Image, ListTodo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { NotificationBell } from '../../../components/notifications';

function AdminSidebar({ currentView, onViewChange, userRole, isCollapsed, toggleSidebar, isMobileView, isSidebarOpen }) {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };
  // Menu simplificado para Admin:
  // - Catálogo de Productos removido (ya está dentro de Gestión de Ventas)
  // - Gestión de Devoluciones removido (accesible desde Ventas, tema de auditoría)
  // - Código QR Asistencias removido (responsabilidad de super_admin)
  const menuItems = [
    { id: 'tareas', icon: ListTodo, label: 'Gestión de Tareas', route: '/admin/tareas' },
    { id: 'productos', icon: Package, label: 'Gestión de Productos', route: '/admin/productos' },
    { id: 'caja', icon: Wallet, label: 'Gestión de Caja', route: '/admin/caja' },
    { id: 'ventas', icon: ShoppingCart, label: 'Gestión de Ventas', route: '/admin/ventas' },
    { id: 'cobros', icon: DollarSign, label: 'Gestión de Cobros', route: '/admin/cobros' },
    { id: 'movimientos-produccion', icon: ArrowRightLeft, label: 'Movimientos Producción', route: '/admin/produccion/movimientos', badge: 'NUEVO', badgeColor: 'bg-purple-500' },
    { id: 'personal', icon: UserCheck, label: 'Gestión de Personal', route: '/admin/personal-v2' },
    { id: 'escaner-qr', icon: ScanLine, label: 'Marcar Asistencia', route: '/admin/escaner-qr', badge: 'NUEVO', badgeColor: 'bg-green-500' },
    { id: 'imagenes', icon: Image, label: 'Gestión de Imágenes', route: '/admin/imagenes' },
    { id: 'perfil', icon: UserCog, label: 'Mi Perfil', route: '/admin/perfil' }
  ];

  return (
    <>
      {/* Overlay y sidebar: overlay con z-30, sidebar con z-40 para asegurar orden correcto */}
      {isMobileView && isSidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={toggleSidebar}
          />
        </div>
      )}

      {(!isMobileView || isSidebarOpen) && (
        <div
          className={`
            fixed top-0 left-0 h-screen bg-white shadow-lg z-40
            transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-20' : 'w-[280px]'}
            ${isMobileView
              ? isSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full'
              : 'translate-x-0'}
          `}
          style={{ willChange: 'transform' }}
        >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            {!isCollapsed ? (
              <div className="w-36 h-12 flex items-center justify-start">
                <img
                  src="/roxi3.png"
                  alt="Roxi Pizzas"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-10 flex items-center justify-center mx-auto">
                <img
                  src="/roxi3.png"
                  alt="Roxi Pizzas"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            {/* Área de acciones: notificaciones y toggle */}
            <div className="flex items-center gap-2">
              {/* Campana de notificaciones */}
              {!isCollapsed && <NotificationBell />}
              
              {/* Botón de toggle para móviles */}
              {isMobileView ? (
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                  aria-label="Cerrar menú"
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
          </div>

          <nav className="space-y-0.5">
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
                    w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm
                    hover:bg-blue-50 hover:text-blue-600 text-gray-600
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                  title={isCollapsed ? item.label : ""}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 gap-1">
                      <span className="font-medium whitespace-nowrap truncate text-sm">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={`${item.badgeColor || 'bg-blue-500'} text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold`}>
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
      )}
    </>
  );
}

export default AdminSidebar;
