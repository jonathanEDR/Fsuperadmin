/**
 * Página de Gestión de Perfiles de Colaboradores
 * Permite gestionar perfiles de usuarios/colaboradores
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ProfileManagement from '../../../Pages/ProfileManagement';

function PerfilesPage() {
  const { userRole } = useOutletContext();

  return (
    <ProfileManagement userRole={userRole || "super_admin"} />
  );
}

export default PerfilesPage;
