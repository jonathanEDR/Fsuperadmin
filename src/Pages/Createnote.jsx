import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Plus, Loader, Calendar, Users, User } from 'lucide-react';

// Helper function for date formatting
const formatDate = (date) => {
  if (!date) return new Date().toISOString();
  const d = new Date(date);
  return d instanceof Date && !isNaN(d) ? d.toISOString() : new Date().toISOString();
};

function CreateNote({ onNoteCreated, userRole, disabled = false }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fechadenota, setFechadenota] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const { getToken } = useAuth();

  // Cargar lista de usuarios si es admin
  useEffect(() => {
    const fetchUsers = async () => {
      if (!['admin', 'super_admin'].includes(userRole)) return;
      
      setLoadingUsers(true);
      try {
        const token = await getToken();
        
        if (!token) {
          throw new Error('No hay token de autenticación disponible');
        }

        const response = await axios.get('http://localhost:5000/api/admin/users-profiles', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.users) {
          // Si es super_admin, mostrar todos los usuarios excepto otros super_admin
          // Si es admin, mostrar solo usuarios normales
          const filteredUsers = response.data.users.filter(user => {
            if (userRole === 'super_admin') {
              return user.role !== 'super_admin'; // Mostrar users y admins
            } else {
              return user.role === 'user'; // Solo mostrar users
            }
          });

          const mappedUsers = filteredUsers.map(user => ({
            id: user.clerk_id,
            name: user.nombre_negocio || user.email.split('@')[0] || 'Usuario sin nombre',
            email: user.email,
            role: user.role
          }));
          
          setUsers(mappedUsers);
          setError('');
        } else {
          console.error('Formato de respuesta inesperado:', response.data);
          setError('Error al cargar la lista de usuarios');
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Error al cargar la lista de usuarios';
        setError(errorMessage);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [userRole, getToken]);

  // Validar usuario seleccionado
  const validateSelectedUser = () => {
    if (!['admin', 'super_admin'].includes(userRole)) return true;
    if (!selectedUser) {
      setError('Debes seleccionar un usuario para crear la nota');
      return false;
    }
    const userExists = users.some(u => (u.id || u._id) === selectedUser);
    if (!userExists) {
      setError('El usuario seleccionado no es válido');
      return false;
    }
    return true;
  };
  const getUserDisplayName = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'Usuario seleccionado';
    
    const roleEmoji = user.role === 'admin' ? '👑' : '👤';
    const roleName = user.role === 'admin' ? 'Admin' : 'Usuario';
    return `${user.name} (${roleName}) - ${user.email}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('El título y el contenido son obligatorios');
      return;
    }

    if (!validateSelectedUser()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No hay token de autenticación disponible');
      }      const noteData = {
        title: title.trim(),
        content: content.trim(),
        fechadenota: formatDate(fechadenota),
        ...(selectedUser && { targetUserId: selectedUser })
      };const response = await axios.post(
        'http://localhost:5000/api/notes/create',
        noteData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Clear form
        setTitle('');
        setContent('');
        setFechadenota('');
        setSelectedUser('');
        setError('');

        // Notify parent component
        if (onNoteCreated) {
          onNoteCreated(response.data);
        }
      }
    } catch (error) {
      console.error('Error al crear la nota:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Error al crear la nota';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Título
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={disabled || loading}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Contenido
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={disabled || loading}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
          Fecha de la Nota
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="date"
            id="fecha"
            value={fechadenota}
            onChange={(e) => setFechadenota(e.target.value)}
            className="mt-1 block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={disabled || loading}
          />
        </div>
      </div>

      {['admin', 'super_admin'].includes(userRole) && (
        <div className="space-y-2">
          <label htmlFor="user" className="block text-sm font-medium text-gray-700">
            Usuario
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="mt-1 block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={disabled || loading || loadingUsers}
              required
            >
              <option value="">Seleccionar usuario</option>              <optgroup label="Usuarios">
                {users.filter(user => user.role === 'user').map((user) => (
                  <option key={user.id} value={user.id}>
                    👤 {getUserDisplayName(user.id)}
                  </option>
                ))}
              </optgroup>
              {userRole === 'super_admin' && users.some(user => user.role === 'admin') && (
                <optgroup label="Administradores">
                  {users.filter(user => user.role === 'admin').map((user) => (
                    <option key={user.id} value={user.id}>
                      👑 {getUserDisplayName(user.id)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <Loader className="animate-spin h-5 w-5" />
        ) : (
          <>
            <Plus className="h-5 w-5 mr-2" />
            Crear Nota
          </>
        )}
      </button>
    </form>
  );
}

export default CreateNote;