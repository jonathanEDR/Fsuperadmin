import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../sidebars/AdminSidebar';

function AdminDashboardLayout({ onLogout }) {
  // Aquí puedes agregar lógica de colapso de sidebar, mobile, etc.
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar onLogout={onLogout} />
      <main className="flex-1 p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminDashboardLayout;
