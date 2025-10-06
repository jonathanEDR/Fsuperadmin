import React from 'react';
import { Home, FileText, UserCog, LogOut, Shield, Package, ShoppingCart, UserCheck, X, ChevronLeft, ChevronRight, CreditCard, Factory, Grid3X3, RotateCcw, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

function SuperAdminSidebar({ isCollapsed, toggleSidebar, isMobileView, isSidebarOpen, onLogout }) {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
    if (onLogout) onLogout();
  };
  // Organización por grupos lógicos
  const menuGroups = [
    {
      title: "Gestión de Usuarios",
      items: [
        { id: 'dashboard', icon: Home, label: 'Gestión de Usuarios', route: '/super-admin/usuarios' },
        { id: 'personal', icon: UserCheck, label: 'Gestión de Personal', route: '/super-admin/personal' },
      ]
    },
    {
      title: "Inventario y Ventas",
      items: [
        { id: 'productos', icon: Package, label: 'Gestión de Productos', route: '/super-admin/productos' },
        { id: 'catalogo', icon: Grid3X3, label: 'Catálogo de Productos', route: '/super-admin/catalogo' },
        { id: 'ventas', icon: ShoppingCart, label: 'Gestión de Ventas', route: '/super-admin/ventas' },
        { id: 'cobros', icon: DollarSign, label: 'Gestión de Cobros', route: '/super-admin/cobros' },
        { id: 'devoluciones', icon: RotateCcw, label: 'Gestión de Devoluciones', route: '/super-admin/devoluciones' },
      ]
    },
    {
      title: "Operaciones",
      items: [
        { id: 'produccion', icon: Factory, label: 'Gestión de Producción', route: '/super-admin/produccion' },
        { id: 'caja', icon: CreditCard, label: 'Gestión de Caja', route: '/super-admin/caja' },
        { id: 'finanzas', icon: CreditCard, label: 'Finanzas', route: '/super-admin/finanzas' },
      ]
    },
    {
      title: "Herramientas",
      items: [
        { id: 'notes', icon: FileText, label: 'Gestión de Notas', route: '/super-admin/notas' },
        { id: 'profile', icon: UserCog, label: 'Mi Perfil', route: '/super-admin/perfil' },
      ]
    }
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
            {!isCollapsed && (
              <button
                onClick={() => {
                  navigate('/super-admin/dashboard');
                  if (isMobileView) toggleSidebar();
                }}
                className="text-xl font-bold text-gray-800 flex items-center gap-2 hover:text-purple-600 transition-colors cursor-pointer"
                title="Ir al Dashboard Principal"
              >
                <Shield className="text-purple-600" size={24} />
                <span className="transition-opacity duration-200">Panel Super Admin</span>
              </button>
            )}
            {/* Botón de toggle para móviles */}
            {isMobileView ? (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-purple-50 text-purple-600"
                aria-label="Cerrar menú"
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
          
          <nav className="space-y-1">
            {menuGroups.map((group, groupIndex) => (
              <div key={group.title}>
                {/* Título del grupo - solo visible cuando no está colapsado */}
                {!isCollapsed && (
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.title}
                  </div>
                )}
                
                {/* Items del grupo */}
                <div className="space-y-1">
                  {group.items.map((item) => {
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
                </div>
                
                {/* Separador entre grupos - excepto en el último grupo y cuando está colapsado */}
                {!isCollapsed && groupIndex < menuGroups.length - 1 && (
                  <div className="my-3 border-t border-gray-200"></div>
                )}
              </div>
            ))}
          </nav>
        </div>
        
        {/* Botón de cerrar sesión eliminado, ahora está en MyProfileUnified */}
        </div>
      )}
    </>
  );
}

export default SuperAdminSidebar;
