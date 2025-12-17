import React from 'react';
import { Home, FileText, UserCog, LogOut, Shield, Package, ShoppingCart, UserCheck, X, ChevronLeft, ChevronRight, CreditCard, Factory, Grid3X3, RotateCcw, DollarSign, QrCode, Wallet, ScanLine } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

function SuperAdminSidebar({ isCollapsed, toggleSidebar, isMobileView, isSidebarOpen, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
    if (onLogout) onLogout();
  };

  // Función para verificar si una ruta está activa
  const isActiveRoute = (route) => location.pathname === route;

  // Organización por grupos lógicos
  const menuGroups = [
    {
      title: "Usuarios",
      items: [
        { id: 'usuarios', icon: Home, label: 'Usuarios', route: '/super-admin/usuarios' },
        { id: 'personal', icon: UserCheck, label: 'Personal', route: '/super-admin/personal-v2' },
        { id: 'qr-asistencias', icon: QrCode, label: 'QR Asistencias', route: '/super-admin/qr-asistencias' },
        { id: 'escaner-qr', icon: ScanLine, label: 'Marcar Asistencia', route: '/super-admin/escaner-qr', badge: 'NEW' },
      ]
    },
    {
      title: "Ventas",
      items: [
        { id: 'productos', icon: Package, label: 'Productos', route: '/super-admin/productos' },
        { id: 'catalogo', icon: Grid3X3, label: 'Catálogo', route: '/super-admin/catalogo' },
        { id: 'ventas', icon: ShoppingCart, label: 'Ventas', route: '/super-admin/ventas' },
        { id: 'cobros', icon: DollarSign, label: 'Cobros', route: '/super-admin/cobros' },
        { id: 'devoluciones', icon: RotateCcw, label: 'Devoluciones', route: '/super-admin/devoluciones' },
      ]
    },
    {
      title: "Operaciones",
      items: [
        { id: 'produccion', icon: Factory, label: 'Producción', route: '/super-admin/produccion' },
        { id: 'caja', icon: Wallet, label: 'Caja', route: '/super-admin/caja' },
        { id: 'finanzas', icon: CreditCard, label: 'Finanzas', route: '/super-admin/finanzas' },
      ]
    },
    {
      title: "Sistema",
      items: [
        { id: 'notes', icon: FileText, label: 'Notas', route: '/super-admin/notas' },
        { id: 'profile', icon: UserCog, label: 'Perfil', route: '/super-admin/perfil' },
      ]
    }
  ];

  return (
    <>
      {/* Overlay para móviles */}
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
            transition-all duration-300 ease-in-out flex flex-col
            ${isCollapsed ? 'w-16' : 'w-56'}
            ${isMobileView
              ? isSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full'
              : 'translate-x-0'}
          `}
          style={{ willChange: 'transform' }}
        >
          {/* Header fijo */}
          <div className="flex-shrink-0 p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <button
                  onClick={() => {
                    navigate('/super-admin/dashboard');
                    if (isMobileView) toggleSidebar();
                  }}
                  className="text-sm font-bold text-gray-800 flex items-center gap-2 hover:text-purple-600 transition-colors cursor-pointer"
                  title="Ir al Dashboard Principal"
                >
                  <Shield className="text-purple-600 flex-shrink-0" size={20} />
                  <span className="truncate">Super Admin</span>
                </button>
              )}
              {isCollapsed && (
                <Shield className="text-purple-600 mx-auto" size={20} />
              )}
              {/* Botón de toggle */}
              {isMobileView ? (
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600"
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
              ) : (
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex p-1.5 rounded-lg hover:bg-purple-50 text-purple-600"
                  title={isCollapsed ? "Expandir" : "Colapsar"}
                >
                  {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
              )}
            </div>
          </div>
          
          {/* Navegación con scroll */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
            {menuGroups.map((group, groupIndex) => (
              <div key={group.title}>
                {/* Título del grupo */}
                {!isCollapsed && (
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {group.title}
                  </div>
                )}
                
                {/* Items del grupo */}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.route);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(item.route);
                          if (isMobileView) toggleSidebar();
                        }}
                        className={`
                          w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-sm
                          ${isActive 
                            ? 'bg-purple-100 text-purple-700 font-medium' 
                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'}
                          ${isCollapsed ? 'justify-center px-2' : ''}
                        `}
                        title={isCollapsed ? item.label : ""}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex items-center justify-between flex-1 min-w-0 gap-1">
                            <span className="truncate text-sm">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Separador */}
                {!isCollapsed && groupIndex < menuGroups.length - 1 && (
                  <div className="my-2 border-t border-gray-100"></div>
                )}
                {isCollapsed && groupIndex < menuGroups.length - 1 && (
                  <div className="my-1 mx-2 border-t border-gray-100"></div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

export default SuperAdminSidebar;
