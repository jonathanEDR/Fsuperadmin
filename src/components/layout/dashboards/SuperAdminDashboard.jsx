import React from 'react';
import { Outlet } from 'react-router-dom';
import { RoleProtection } from '../../auth';
import SuperAdminDashboardLayout from './SuperAdminDashboardLayout';

function SuperAdminDashboard({ onLogout }) {
  return (
    <RoleProtection allowedRoles={['super_admin']}>
      <SuperAdminDashboardLayout onLogout={onLogout}>
        <Outlet />
      </SuperAdminDashboardLayout>
    </RoleProtection>
  );
}

export default SuperAdminDashboard;