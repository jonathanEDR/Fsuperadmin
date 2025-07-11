
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebars/Sidebar';
import { RoleProtection } from '../../auth';
import { Menu } from 'lucide-react';


function UserDashboardLayout() {
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

  return (
    <RoleProtection allowedRoles={['user', 'admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50 flex relative">
        {/* Botón de menú hamburguesa solo en móvil */}
        {isMobileView && (
          <button
            className="fixed top-4 left-4 z-40 bg-white rounded-full p-2 shadow-lg lg:hidden"
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

        <Sidebar
          isCollapsed={isMobileView ? false : isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          isMobileView={isMobileView}
          isSidebarOpen={isSidebarOpen}
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
          <Outlet />
        </main>
      </div>
    </RoleProtection>
  );
}

export default UserDashboardLayout;
