import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Edit2, Save, X, Search, RefreshCw, UserPlus, ChevronDown, Shield, User, Crown } from 'lucide-react';

const ProfileManagement = ({ userRole }) => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para modal de cambio de rol
  const [roleModal, setRoleModal] = useState({
    isOpen: false,
    user: null,
    newRole: ''
  });

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
  
  // Opciones de roles
  const roleOptions = [
    { value: 'user', label: 'Usuario', icon: User, color: 'bg-gray-100 text-gray-800', description: 'Acceso básico al sistema' },
    { value: 'admin', label: 'Administrador', icon: Shield, color: 'bg-blue-100 text-blue-800', description: 'Gestión de usuarios y ventas' },
    { value: 'super_admin', label: 'Super Admin', icon: Crown, color: 'bg-purple-100 text-purple-800', description: 'Acceso total al sistema' }
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
  
  // Abrir modal para cambiar rol
  const openRoleModal = (user) => {
    setRoleModal({
      isOpen: true,
      user: user,
      newRole: user.role
    });
  };
  
  // Cerrar modal de rol
  const closeRoleModal = () => {
    setRoleModal({
      isOpen: false,
      user: null,
      newRole: ''
    });
  };
  
  // Cambiar rol del usuario
  const handleChangeRole = async () => {
    if (!roleModal.user || !roleModal.newRole) return;
    if (roleModal.newRole === roleModal.user.role) {
      closeRoleModal();
      return;
    }
    
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/admin/users/${roleModal.user._id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: roleModal.newRole })
      });

      if (response.ok) {
        fetchUsers();
        setError(`success:Rol cambiado a ${roleOptions.find(r => r.value === roleModal.newRole)?.label || roleModal.newRole}`);
        closeRoleModal();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar rol');
      }
    } catch (error) {
      setError('Error al cambiar rol: ' + error.message);
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

        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Negocio
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap">{editingUser?._id === user._id ? (
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
                    <button
                      onClick={() => userRole === 'super_admin' && user.role !== 'super_admin' ? openRoleModal(user) : null}
                      disabled={userRole !== 'super_admin' || user.role === 'super_admin'}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full transition-all ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-800 cursor-default' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      } ${userRole === 'super_admin' && user.role !== 'super_admin' ? 'hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 cursor-pointer' : ''}`}
                      title={userRole === 'super_admin' && user.role !== 'super_admin' ? 'Click para cambiar rol' : ''}
                    >
                      {user.role}
                      {userRole === 'super_admin' && user.role !== 'super_admin' && (
                        <ChevronDown size={12} />
                      )}
                    </button>
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
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Vista de Tarjetas para Móvil */}
        <div className="md:hidden space-y-3">
          {users.map((user) => (
            <div 
              key={user._id} 
              className={`bg-white rounded-xl border-2 ${!canEditUser(user) ? 'border-gray-200 bg-gray-50' : 'border-gray-100'} p-4 shadow-sm`}
            >
              {editingUser?._id === user._id ? (
                /* Modo Edición - Tarjeta */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Negocio</label>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                      value={editForm.nombre_negocio}
                      onChange={(e) => setEditForm({ ...editForm, nombre_negocio: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Departamento</label>
                      <select
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                        value={editForm.departamento}
                        onChange={(e) => setEditForm({ ...editForm, departamento: e.target.value })}
                      >
                        {departamentoOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Sueldo</label>
                      <input
                        type="text"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                        value={editForm.sueldo}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setEditForm({ ...editForm, sueldo: value });
                          }
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleSaveProfile(user._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <Save size={16} />
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      <X size={16} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo Vista - Tarjeta */
                <>
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {(user.nombre_negocio || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {user.nombre_negocio || 'Sin nombre'}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    {/* Badge de Rol - Clickeable para super_admin */}
                    <button
                      onClick={() => userRole === 'super_admin' && user.role !== 'super_admin' ? openRoleModal(user) : null}
                      disabled={userRole !== 'super_admin' || user.role === 'super_admin'}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 transition-all ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-800 cursor-default' :
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      } ${userRole === 'super_admin' && user.role !== 'super_admin' ? 'hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 cursor-pointer' : ''}`}
                    >
                      {user.role}
                      {userRole === 'super_admin' && user.role !== 'super_admin' && (
                        <ChevronDown size={10} />
                      )}
                    </button>
                  </div>
                  
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-xs text-gray-500 block">Departamento</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
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
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-xs text-gray-500 block">Sueldo</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {canEditSueldo(user) ? formatCurrency(user.sueldo) : '****'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {(userRole === 'super_admin' || (userRole === 'admin' && user.role === 'user')) && (
                      <button
                        onClick={() => handleEdit(user)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                    )}
                    
                    {userRole === 'super_admin' && user.role !== 'super_admin' && (
                      <button
                        onClick={() => openRoleModal(user)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm font-medium"
                      >
                        <Shield size={16} />
                        Cambiar Rol
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron usuarios
          </div>
        )}
      </div>
      
      {/* Modal para Cambiar Rol */}
      {roleModal.isOpen && roleModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Cambiar Rol de Usuario</h3>
              <p className="text-purple-100 text-sm">{roleModal.user.nombre_negocio || roleModal.user.email}</p>
            </div>
            
            {/* Contenido */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Selecciona el nuevo rol para este usuario:
              </p>
              
              {/* Opciones de Rol */}
              <div className="space-y-2">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  const isSelected = roleModal.newRole === role.value;
                  const isCurrent = roleModal.user.role === role.value;
                  
                  return (
                    <button
                      key={role.value}
                      onClick={() => setRoleModal(prev => ({ ...prev, newRole: role.value }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{role.label}</span>
                          {isCurrent && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              Actual
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{role.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Advertencia si cambia de admin a user */}
              {roleModal.user.role === 'admin' && roleModal.newRole === 'user' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Atención:</strong> Este usuario perderá sus privilegios de administrador.
                  </p>
                </div>
              )}
              
              {/* Advertencia si promueve a super_admin */}
              {roleModal.newRole === 'super_admin' && roleModal.user.role !== 'super_admin' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ <strong>Cuidado:</strong> Este usuario tendrá acceso total al sistema. No podrás modificar su rol después.
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={closeRoleModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangeRole}
                disabled={roleModal.newRole === roleModal.user.role}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;
