
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../sidebars/AdminSidebar';
import { Menu } from 'lucide-react';
import { RoleContext } from '../../../context/RoleContext';
import { useUserRole } from '../../../hooks/useUserRole';

function AdminDashboardLayout({ children, onLogout }) {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) setIsSidebarOpen(false); // Cierra el sidebar en desktop
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobileView) {
      setIsSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  // DEBUG: Verificar el rol en AdminDashboard
  React.useEffect(() => {
    console.log('🔧 AdminDashboard - RoleContext.Provider value:', userRole);
  }, [userRole]);

  // Mostrar loading mientras se obtiene el rol
  if (roleLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <RoleContext.Provider value={userRole || 'user'}>
      <div className="min-h-screen bg-gray-50 flex relative">
      {/* Botón de menú hamburguesa solo en móvil */}
      {isMobileView && (
        <button
          className="fixed top-4 left-4 z-45 bg-white rounded-full p-2 shadow-lg lg:hidden"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu size={28} />
        </button>
      )}

      {/* Overlay para móvil */}
      {isMobileView && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <AdminSidebar
        userRole={userRole}
        isCollapsed={isMobileView ? false : isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        isMobileView={isMobileView}
        isSidebarOpen={isSidebarOpen}
        onLogout={onLogout}
      />

      <main
        className={`flex-1 p-4 lg:p-8 transition-all duration-300 ${
          isMobileView
            ? ''
            : isSidebarCollapsed
              ? 'ml-0 lg:ml-20'
              : 'ml-0 lg:ml-[280px]'
        }`}
      >
        {children ? children : <Outlet />}
      </main>
    </div>
    </RoleContext.Provider>
  );
}

export default AdminDashboardLayout;
