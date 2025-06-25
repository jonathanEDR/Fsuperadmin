import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Mail, Shield, CheckCircle } from 'lucide-react';
import UserGestionPersonal from '../personal/UserGestionPersonal';

function MyProfileUnified() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Obtener información del usuario
  const userInfo = {
    email: user.emailAddresses?.[0]?.emailAddress || 'No disponible',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario',
    businessName: user.unsafeMetadata?.nombre_negocio || 'No especificado',
    role: user.unsafeMetadata?.role || 'user',
    isActive: user.unsafeMetadata?.is_active !== false
  };

  // Función para obtener el color del rol
  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // Función para obtener el nombre del rol
  const getRoleName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrador';
      case 'admin':
        return 'Administrador';
      default:
        return 'Usuario';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-100 rounded-full">
          <User className="text-blue-600" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Información personal y gestión financiera</p>
        </div>
      </div>

      {/* Información del Usuario */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Personal</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="text-gray-500" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre Completo</p>
                <p className="text-gray-900">{userInfo.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="text-gray-500" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-600">Correo Electrónico</p>
                <p className="text-gray-900">{userInfo.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-1 bg-gray-100 rounded">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre del Negocio</p>
                <p className="text-gray-900">{userInfo.businessName}</p>
              </div>
            </div>
          </div>

          {/* Estado y Rol */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="text-gray-500" size={20} />
              <div>
                <p className="text-sm font-medium text-gray-600">Rol</p>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(userInfo.role)}`}>
                  {getRoleName(userInfo.role)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className={`${userInfo.isActive ? 'text-green-500' : 'text-red-500'}`} size={20} />
              <div>
                <p className="text-sm font-medium text-gray-600">Estado de la cuenta</p>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  userInfo.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userInfo.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gestión Personal Financiera */}
      <div className="bg-white rounded-lg shadow-lg">
        <UserGestionPersonal />
      </div>
    </div>
  );
}

export default MyProfileUnified;
