import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebars/Sidebar';
import { RoleProtection } from '../../auth';

function UserDashboardLayout() {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  return (
    <RoleProtection allowedRoles={['user', 'admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
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
    </RoleProtection>
  );
}

export default UserDashboardLayout;
