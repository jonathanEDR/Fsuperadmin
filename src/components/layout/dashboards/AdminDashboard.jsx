import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../sidebars/AdminSidebar';
import { RoleContext } from '../../../context/RoleContext';
import { RoleProtection } from '../../auth';

function AdminDashboard() {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  // Aquí deberías obtener el rol real del usuario admin
  // Por ahora, lo dejamos fijo como 'admin'.
  const userRole = 'admin';

  return (
    <RoleProtection allowedRoles={['admin', 'super_admin']}>
      <RoleContext.Provider value={userRole}>
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            isMobileView={isMobileView}
          />
          <main
            className={`flex-1 p-4 lg:p-8 transition-all duration-300 ${
              isSidebarCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-[280px]'
            }`}
          >
            <Outlet />
          </main>
        </div>
      </RoleContext.Provider>
    </RoleProtection>
  );
}

export default AdminDashboard;
