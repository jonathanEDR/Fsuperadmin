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
    departamento: 'ventas',
    sueldo: 0
  });

  // Opciones de departamento
  const departamentoOptions = [
    { value: 'ventas', label: 'Ventas' },
    { value: 'administracion', label: 'Administración' },
    { value: 'produccion', label: 'Producción' },
    { value: 'finanzas', label: 'Finanzas' }
  ];

  // Función para verificar si el usuario puede editar a otro usuario
  const canEditUser = (targetUser) => {
    console.log('ProfileManagement - userRole:', userRole, 'targetUser.role:', targetUser?.role);
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin') {
      return targetUser.role === 'user';
    }
    return false;
  };

  // Función para verificar si el usuario puede ver/editar sueldos
  const canEditSueldo = (targetUser) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin' && targetUser.role === 'user') return true;
    return false;
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };  // Función para validar el formulario
  const validateForm = () => {
    const errors = [];
    
    if (!editForm.email || !editForm.email.includes('@')) {
      errors.push('Email válido es requerido');
    }
    
    if (!editForm.nombre_negocio || editForm.nombre_negocio.trim().length < 2) {
      errors.push('Nombre del negocio debe tener al menos 2 caracteres');
    }
    
    // Validar sueldo
    if (editForm.sueldo && editForm.sueldo.trim() !== '') {
      const sueldoNumerico = parseFloat(editForm.sueldo);
      if (isNaN(sueldoNumerico) || sueldoNumerico < 0) {
        errors.push('El sueldo debe ser un número válido y no puede ser negativo');
      }
    }
    
    return errors;
  };

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const url = `${backendUrl}/api/admin/users-profiles${searchTerm ? `?search=${searchTerm}` : ''}`;
      
      const response = await fetch(url, {
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
    if (!canEditUser(user)) {
      setError('No tienes permisos para editar este usuario');
      return;
    }

    setEditingUser(user);    setEditForm({
      nombre_negocio: user.nombre_negocio || '',
      email: user.email,
      departamento: user.departamento || 'ventas',
      sueldo: user.sueldo ? user.sueldo.toString() : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);    setEditForm({
      nombre_negocio: '',
      email: '',
      departamento: 'ventas',
      sueldo: ''
    });
  };

  const handleSaveProfile = async (userId) => {
    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      const token = await getToken();
      
      const dataToSend = {
        nombre_negocio: editForm.nombre_negocio.trim(),
        email: editForm.email.trim(),
        departamento: editForm.departamento
      };      const targetUser = users.find(u => u._id === userId);
      if (canEditSueldo(targetUser)) {
        const sueldoValue = editForm.sueldo === '' || editForm.sueldo === null || editForm.sueldo === undefined 
          ? 0 
          : parseFloat(editForm.sueldo) || 0;
        dataToSend.sueldo = sueldoValue;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/update-profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        setEditingUser(null);
        fetchUsers();
        setError('success:' + result.message);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      setError('Error al actualizar el perfil: ' + error.message);
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres promover este usuario a administrador?')) return;
    
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mx-2">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Perfiles</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
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
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors w-full sm:w-auto"
            >
              <RefreshCw size={20} />
              <span className="hidden sm:inline">Actualizar</span>
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
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Negocio
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Departamento
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sueldo
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className={!canEditUser(user) ? 'bg-gray-50' : ''}>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap max-w-[160px] truncate">{editingUser?._id === user._id ? (
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
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap max-w-[160px] truncate">{editingUser?._id === user._id ? (
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
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">{editingUser?._id === user._id ? (
                      <select
                        className="border border-gray-300 rounded px-3 py-1 text-sm w-full"
                        value={editForm.departamento}
                        onChange={(e) => setEditForm({ ...editForm, departamento: e.target.value })}
                      >
                        {departamentoOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.departamento === 'ventas' ? 'bg-green-100 text-green-800' :
                          user.departamento === 'administracion' ? 'bg-blue-100 text-blue-800' :
                          user.departamento === 'produccion' ? 'bg-orange-100 text-orange-800' :
                          user.departamento === 'finanzas' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.departamento ? 
                            (departamentoOptions.find(d => d.value === user.departamento)?.label || user.departamento) : 
                            'No asignado'
                          }
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap">{editingUser?._id === user._id ? (
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">$</span>
                          <input
                            type="text"
                            className="border border-gray-300 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={editForm.sueldo}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Solo permitir números, punto decimal y valores vacíos
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setEditForm({ 
                                  ...editForm, 
                                  sueldo: value
                                });
                              }
                            }}
                            placeholder="0.00"
                            autoComplete="off"
                          />
                        </div>
                        {editForm.sueldo && editForm.sueldo.trim() !== '' && !isNaN(parseFloat(editForm.sueldo)) && (
                          <div className="text-xs text-gray-400 mt-1 ml-6">
                            {formatCurrency(parseFloat(editForm.sueldo))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900 font-medium">
                        {canEditSueldo(user) ? 
                          formatCurrency(user.sueldo) :
                          '****'
                        }
                      </div>
                    )}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingUser?._id === user._id ? (
                      <div className="flex flex-wrap gap-2">
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
                      <div className="flex flex-wrap justify-end gap-2">
                        {(userRole === 'super_admin' || (userRole === 'admin' && user.role === 'user')) && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar usuario"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        
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

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron usuarios
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileManagement;
