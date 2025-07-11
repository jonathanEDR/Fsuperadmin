import React from 'react';
import { Outlet } from 'react-router-dom';
import { RoleProtection } from '../../auth';
import AdminDashboardLayout from './AdminDashboardLayout';

function AdminDashboard() {
  return (
    <RoleProtection allowedRoles={['admin', 'super_admin']}>
      <AdminDashboardLayout>
        <Outlet />
      </AdminDashboardLayout>
    </RoleProtection>
  );
}

export default AdminDashboard;
