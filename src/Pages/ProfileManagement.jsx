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
  // Función para verificar si el usuario puede editar a otro usuario
  const canEditUser = (targetUser) => {
    // Si el usuario actual es super_admin, puede editar cualquier usuario
    if (userRole === 'super_admin') return true;
    
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
      const response = await fetch(`http://localhost:5000/api/admin/users-profiles${searchTerm ? `?search=${searchTerm}` : ''}`, {
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
      const token = await getToken();      const response = await fetch(`http://localhost:5000/api/auth/update-profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });      if (response.ok) {
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
      const response = await fetch(`http://localhost:5000/api/admin/promote/${userId}`, {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
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
                <tr key={user._id} className={!canEditUser(user) ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.clerk_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser?._id === user._id ? (
                      <input
                        type="email"
                        className="border border-gray-300 rounded px-3 py-1 text-sm w-full"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{user.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser?._id === user._id ? (
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-3 py-1 text-sm w-full"
                        value={editForm.nombre_negocio}
                        onChange={(e) => setEditForm({ ...editForm, nombre_negocio: e.target.value })}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{user.nombre_negocio || '-'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">                    {editingUser?._id === user._id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveProfile(user._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {/* Mostrar botón de editar si el usuario actual puede editar al usuario */}
                        {(userRole === 'super_admin' || (userRole === 'admin' && user.role === 'user')) && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar usuario"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        
                        {/* Mostrar botón de promover solo si el usuario actual es super_admin y el usuario objetivo no es super_admin */}
                        {userRole === 'super_admin' && user.role !== 'super_admin' && (
                          <button
                            onClick={() => handlePromoteToAdmin(user._id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Promover a administrador"
                          >
                            <UserPlus size={18} />
                          </button>
                        )}
                      </div>
                    )}
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
