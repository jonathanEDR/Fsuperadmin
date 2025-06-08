import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  UserPlus, Trash2, Search, Plus,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import NotesHistory from '../components/NotesHistory';
import NoteCreationModal from '../components/NoteCreationModal';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import SuperAdminNotes from '../components/SuperAdminNotes';
import MyProfile from './MyProfile';

function SuperAdminDashboard() {
  const { getToken } = useAuth();
  const notesRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `/api/admin/users?page=${currentPage}&search=${searchTerm}&role=${roleFilter}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Error al cargar usuarios');
      
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.total_pages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);const handlePromoteToAdmin = async (userId, currentRole) => {
    try {
      const token = await getToken();
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      const data = await response.json();
        if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar rol de usuario');
      }
      
      await fetchUsers();
      setSuccess(data.message || `Usuario ${newRole === 'admin' ? 'promovido a administrador' : 'degradado a usuario'} exitosamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error.message || 'Error al actualizar rol de usuario');
      setTimeout(() => setError(null), 3000);
      
      // Si es un error específico de permisos, mostrar por más tiempo
      if (error.message.includes('No puedes')) {
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
        if (!response.ok) throw new Error('Error al eliminar usuario');
      
      await fetchUsers();
      setSuccess('Usuario eliminado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error al eliminar usuario');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleLogout = () => {
    // Handle logout logic
  };
  const renderUsersTable = () => (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Search size={20} />
              </button>
            </form>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos los roles</option>
              <option value="user">Usuarios</option>
              <option value="admin">Administradores</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>
        </div>
      </div>      {/* Status Messages */}
      {(error || success) && (
        <div className={`p-4 mb-4 ${error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {error || success}
        </div>
      )}
      
      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negocio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.clerk_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : user.role === 'super_admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.nombre_negocio || 'No especificado'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">                  {user.role !== 'super_admin' && (
                    <button
                      onClick={() => handlePromoteToAdmin(user._id, user.role)}
                      className={`mr-4 ${
                        user.role === 'admin' 
                          ? 'text-yellow-600 hover:text-yellow-900' 
                          : 'text-blue-600 hover:text-blue-900'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <UserPlus size={16} />
                        {user.role === 'admin' ? 'Degradar a Usuario' : 'Promover a Admin'}
                      </div>
                    </button>
                  )}
                  {user.role !== 'super_admin' && (
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <div className="flex items-center gap-1">
                        <Trash2 size={16} />
                        Eliminar
                      </div>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-6 border-t flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const handleNoteCreated = async (note) => {
    try {
      setSuccess('Nota creada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      
      // Si estamos en la vista de notas, forzar una actualización
      if (currentView === 'notes' && notesRef.current?.fetchNotes) {
        await notesRef.current.fetchNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Error al crear la nota');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={() => {/* handle logout */}}
      />
      
      <div className="ml-64 flex-1 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Botón de Nueva Nota */}
        {(currentView === 'dashboard' || currentView === 'notes') && (
          <div className="mb-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              Nueva Nota
            </button>
          </div>
        )}

        <div className="space-y-6">          {currentView === 'dashboard' && renderUsersTable()}
          {currentView === 'users' && renderUsersTable()}
          {currentView === 'notes' && <SuperAdminNotes ref={notesRef} />}
          {currentView === 'history' && <NotesHistory />}
          {currentView === 'profile' && <MyProfile />}
        </div>
      </div>

      <NoteCreationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNoteCreated={handleNoteCreated}
        userRole="super_admin"
      />
    </div>
  );
}

export default SuperAdminDashboard;