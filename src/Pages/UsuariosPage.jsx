import React from 'react';
import MyProfileUnified from '../components/auth/MyProfileUnified';
import { ProfileManagement } from '../components/auth';
// Aquí puedes importar y usar el componente de usuarios que ya tengas, por ejemplo:
// import UsuariosList from '../components/usuarios/UsuariosList';

function UsuariosPage() {
  return (
    <div>
          <ProfileManagement userRole="super_admin" />

    </div>
  );
}

export default UsuariosPage;
