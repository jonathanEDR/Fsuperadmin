import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Edit2, Save, X, Search, RefreshCw, UserPlus } from 'lucide-react';

const ProfileManagement = ({ userRole }) => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editForm, setEditForm] = useState({
    nombre_negocio: '',
    email: '',
  });
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // URL base del backend
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Función para verificar si el usuario puede editar a otro usuario
  const canEditUser = (targetUser) => {
    // Si el usuario actual es super_admin, puede editar cualquier usuario excepto a sí mismo si es super_admin
    if (userRole === 'super_admin') {
      // Verificar si el usuario objetivo es el mismo usuario actual (usando correo electrónico para identificar)
      const isSelfEditing = targetUser.email === profileData?.user?.email;
      if (isSelfEditing && targetUser.role === 'super_admin') {
        return false; // No permitir que un super_admin se edite a sí mismo
      }
      return true;
    }
    
    // Si el usuario actual es admin, solo puede editar usuarios normales
    if (userRole === 'admin') {
      return targetUser.role === 'user';
    }
    
    // Los usuarios normales no pueden editar a nadie
    return false;
  };

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${backendUrl}/api/admin/users-profiles${searchTerm ? `?search=${searchTerm}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setError('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar los usuarios');
      }
    } catch (error) {
      setError('Error al cargar los usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el perfil del usuario actual
  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${backendUrl}/api/auth/user-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener el perfil de usuario');
      }

      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleEdit = (user) => {
    // Verificar permisos antes de permitir la edición
    if (!canEditUser(user)) {
      setError('No tienes permisos para editar este usuario');
      return;
    }

    setEditingUser(user);
    setEditForm({
      nombre_negocio: user.nombre_negocio || '',
      email: user.email
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      nombre_negocio: '',
      email: ''
    });
  };

  const handleSaveProfile = async (userId) => {
    try {
      const token = await getToken();
      const response = await fetch(`${backendUrl}/api/auth/update-profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const result = await response.json();
        setEditingUser(null);
        fetchUsers(); // Recargar la lista de usuarios
        // Mostrar mensaje de éxito
        setError('success:' + result.message);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      setError('Error al actualizar el perfil: ' + error.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handlePromoteToAdmin = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres promover este usuario a administrador?')) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`${backendUrl}/api/admin/promote/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchUsers();
        setError('success:Usuario promovido exitosamente');
      } else {
        throw new Error('Error al promover usuario');
      }
    } catch (error) {
      setError('Error al promover usuario: ' + error.message);
    }
  };

  // Función para dar de baja a un usuario
  const handleDarDeBaja = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres dar de baja a este usuario?')) return;
    
    // Verificación adicional para asegurar que el super_admin no se de de baja a sí mismo
    const userToBan = users.find(user => user._id === userId);
    if (userToBan && userToBan.email === profileData?.user?.email) {
      setError('Error: No puedes dar de baja a tu propia cuenta');
      return;
    }
    
    try {
      const token = await getToken();
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'de_baja' })
      });
      if (response.ok) {
        fetchUsers();
        setError('success:Usuario dado de baja exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al dar de baja al usuario');
      }
    } catch (error) {
      setError('Error al dar de baja al usuario: ' + error.message);
    }
  };

  // Función para restaurar a un usuario que está de baja
  const handleRestaurarUsuario = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres restaurar a este usuario?')) return;
    try {
      const token = await getToken();
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'user' }) // Restauramos como usuario normal
      });
      if (response.ok) {
        fetchUsers();
        setError('success:Usuario restaurado exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al restaurar al usuario');
      }
    } catch (error) {
      setError('Error al restaurar al usuario: ' + error.message);
    }
  };

  // Función para promover admin a super_admin
  const handlePromoteToSuperAdmin = async (userId) => {
    const confirmMessage = '¿Estás ABSOLUTAMENTE seguro de que quieres promover este usuario a SUPER ADMINISTRADOR?\n\nEsto le dará permisos completos del sistema.\n\nEscribe "CONFIRMAR" para continuar:';
    const userConfirmation = prompt(confirmMessage);
    
    if (userConfirmation !== 'CONFIRMAR') {
      setError('Promoción cancelada. Se requiere confirmación exacta.');
      return;
    }
    
    try {
      const token = await getToken();
      const response = await fetch(`${backendUrl}/api/admin/promote-super/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmation: 'PROMOTE_TO_SUPER_ADMIN' })
      });

      if (response.ok) {
        fetchUsers();
        setError('success:Usuario promovido a super administrador exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al promover usuario');
      }
    } catch (error) {
      setError('Error al promover usuario: ' + error.message);
    }
  };

  // Función para degradar admin a user
  const handleDemoteToUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres degradar este administrador a usuario normal?')) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`${backendUrl}/api/admin/demote/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchUsers();
        setError('success:Usuario degradado a usuario normal exitosamente');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al degradar usuario');
      }
    } catch (error) {
      setError('Error al degradar usuario: ' + error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserProfile(); // Obtener el perfil del usuario actual al cargar el componente
  }, []);

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Perfiles</h2>
          <div className="flex gap-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search size={20} />
              </button>
            </form>
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={20} />
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className={`px-4 py-3 rounded mb-4 ${
            error.startsWith('success:')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {error.startsWith('success:') ? error.replace('success:', '') : error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Negocio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={editForm.nombre_negocio}
                        onChange={(e) => setEditForm({ ...editForm, nombre_negocio: e.target.value })}
                      />
                    ) : (
                      user.nombre_negocio || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      user.role === 'super_admin' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : user.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : user.role === 'de_baja'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {user.role === 'de_baja' ? 'DE BAJA' : user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {editingUser?._id === user._id ? (
                        <>
                          <button
                            onClick={() => handleSaveProfile(user._id)}
                            className="p-1 text-green-600 hover:text-green-900"
                          >
                            <Save size={20} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:text-red-900"
                          >
                            <X size={20} />
                          </button>
                        </>
                      ) : (
                        <>
                          {canEditUser(user) && (
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1 text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 size={20} />
                            </button>
                          )}
                          {/* Botón para dar de baja, solo visible para super_admin y usuarios que no sean super_admin, no sean el propio usuario, ni de_baja */}
                          {userRole === 'super_admin' && 
                            user.role !== 'super_admin' && 
                            user.role !== 'de_baja' && 
                            user.email !== profileData?.user?.email && (
                            <button
                              onClick={() => handleDarDeBaja(user._id)}
                              className="p-1 text-red-600 hover:text-red-900"
                              title="Dar de baja"
                            >
                              <X size={20} />
                            </button>
                          )}
                          
                          {/* Botón para restaurar a un usuario que está de baja */}
                          {userRole === 'super_admin' && user.role === 'de_baja' && (
                            <button
                              onClick={() => handleRestaurarUsuario(user._id)}
                              className="p-1 text-green-600 hover:text-green-900"
                              title="Restaurar usuario"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                      {userRole === 'super_admin' && user.role === 'user' && (
                        <button
                          onClick={() => handlePromoteToAdmin(user._id)}
                          className="p-1 text-purple-600 hover:text-purple-900"
                          title="Promover a administrador"
                        >
                          <UserPlus size={20} />
                        </button>
                      )}
                      {/* Botón para promover admin a super_admin, solo visible para super_admin y usuarios que sean admin */}
                      {userRole === 'super_admin' && user.role === 'admin' && (
                        <button
                          onClick={() => handlePromoteToSuperAdmin(user._id)}
                          className="p-1 text-orange-600 hover:text-orange-900"
                          title="Promover a super administrador"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 4v16m8-8H4"></path>
                          </svg>
                        </button>
                      )}
                      {/* Botón para degradar a admin, solo visible para super_admin y admins (excepto él mismo) */}
                      {userRole === 'super_admin' && 
                        (user.role === 'admin' || (user.role === 'super_admin' && user.email !== profileData?.user?.email)) && (
                        <button
                          onClick={() => handleDemoteToUser(user._id)}
                          className="p-1 text-red-600 hover:text-red-900"
                          title="Degradar a usuario normal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 4v16m8-8H4"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
