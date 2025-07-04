import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  Plus, Menu, FileText, History, DollarSign, Package,
  ShoppingCart, Users, User, Clock, Check, ChevronLeft, ChevronRight,
  Search, UserPlus, Trash2, RotateCcw, UserCheck
} from 'lucide-react';
import VentasManager from '../../ventas/VentasManager';
import { VentaList, VentasFinalizadas } from '../../ventas';
import { ProductoList, ProductCreationModal } from '../../productos';
import { CobroList } from '../../cobros';
import { DevolucionList } from '../../devoluciones';
import { notas as Notas, NotesHistory, NoteCreationModal, CreateNote } from '../../notas';
import { GestionPersonal } from '../../personal';
import MyProfileUnified from '../../auth/MyProfileUnified';
import ProfileManagement from '../../../Pages/ProfileManagement';
import { SuperAdminSidebar } from '../sidebars';
import PagosRealizadosPage from '../../../Pages/PagosRealizadosPage';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { RoleContext } from '../../../context/RoleContext';
import { RoleProtection } from '../../auth';

function SuperAdminDashboard() {
  const { getToken } = useAuth();
  const notesRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  // Estados para el modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Estados para ventas
  const [ventas, setVentas] = useState([]);
  const [ventasLoading, setVentasLoading] = useState(false);
  const [ventasError, setVentasError] = useState(null);
  const [ventasPagina, setVentasPagina] = useState(1);
  const [totalVentasPaginas, setTotalVentasPaginas] = useState(1);
  const [ventasFiltro, setVentasFiltro] = useState({
    colaborador: '',
    producto: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const location = useLocation();

  // Detectar si hay ruta hija activa (por ejemplo, /super-admin/pagos-realizados)
  const isChildRoute = matchPath('/super-admin/:child', location.pathname);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(
        `${backendUrl}/api/admin/users?page=${currentPage}&search=${searchTerm}&role=${roleFilter}`, {
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
  };  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const handlePromoteToAdmin = async (userId, currentRole) => {
    try {
      const token = await getToken();
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}/role`, {
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

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleteLoading(true);
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al eliminar usuario');
      
      await fetchUsers();
      setSuccess(data.message || 'Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Error al eliminar usuario');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleteLoading(false);
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
                      onClick={() => handleDeleteUser(user)}
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
      if (notesRef.current?.fetchNotes) {
        await notesRef.current.fetchNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Error al crear la nota');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleProductCreated = async (product) => {
    try {
      setSuccess('Producto creado exitosamente');
      // Actualizar la lista de productos
      if (currentView === 'productos') {
        // Forzar recarga del componente ProductoList
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al procesar producto creado:', error);
      setError('Error al procesar el producto creado');
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/productos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar productos');
      
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error fetching productos:', error);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Función para cargar ventas
  const fetchVentas = async () => {
    setVentasLoading(true);
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/ventas?page=${ventasPagina}&colaborador=${ventasFiltro.colaborador}&producto=${ventasFiltro.producto}&fechaInicio=${ventasFiltro.fechaInicio}&fechaFin=${ventasFiltro.fechaFin}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar las ventas');
      const data = await response.json();
      setVentas(data.ventas || []);
      setTotalVentasPaginas(data.totalPages || 1);
      setVentasError(null);
    } catch (error) {
      console.error('Error fetching ventas:', error);
      setVentasError(error.message || 'Error al cargar las ventas');
    } finally {
      setVentasLoading(false);
    }
  };

  const handleVentasFiltroChange = (e) => {
    const { name, value } = e.target;
    setVentasFiltro(prev => ({
      ...prev,
      [name]: value
    }));
    setVentasPagina(1); // Reset to first page when filter changes
  };

  const handleDeleteVenta = async (ventaId) => {
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/ventas/${ventaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al eliminar la venta');
      setSuccess('Venta eliminada exitosamente');
      fetchVentas(); // Refresh list
    } catch (error) {
      setVentasError(error.message);
    }
  };

  const renderVentasTable = () => {
    if (ventasLoading) return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
    
    if (ventasError) return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {ventasError}
      </div>
    );
    
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                name="fechaInicio"
                value={ventasFiltro.fechaInicio}
                onChange={handleVentasFiltroChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                name="fechaFin"
                value={ventasFiltro.fechaFin}
                onChange={handleVentasFiltroChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colaborador</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                name="colaborador"
                value={ventasFiltro.colaborador}
                onChange={handleVentasFiltroChange}
                placeholder="Buscar por colaborador"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                name="producto"
                value={ventasFiltro.producto}
                onChange={handleVentasFiltroChange}
                placeholder="Buscar por producto"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(venta.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.colaborador}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.producto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.cantidad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${venta.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                        venta.estado === 'completada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {venta.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteVenta(venta._id)}
                        className="text-red-600 hover:text-red-900 mr-2"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => {/* Implementar edición */}}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Mostrando página {ventasPagina} de {totalVentasPaginas}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setVentasPagina(p => Math.max(1, p - 1))}
                disabled={ventasPagina === 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <button
                onClick={() => setVentasPagina(p => Math.min(totalVentasPaginas, p + 1))}
                disabled={ventasPagina === totalVentasPaginas}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderCobros = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Gestión de Cobros</h3>
              <p className="text-sm text-gray-600">
                Administra los pagos y cobros del sistema
              </p>
            </div>
          </div>
        </div>
        <CobroList userRole="super_admin" />
      </div>
    </div>
  );

  const renderPersonal = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserCheck className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Gestión de Personal</h3>
              <p className="text-sm text-gray-600">
                Administra los registros y pagos del personal
              </p>
            </div>
          </div>
        </div>
        <GestionPersonal />
      </div>
    </div>
  );

  const renderColaboradores = () => {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="text-purple-600" />
            Gestión de Colaboradores
          </h2>
          <ProfileManagement userRole="super_admin" />
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        {renderUsersTable()}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Gestión de Productos</h3>
              <p className="text-sm text-gray-600">
                Administra los productos del sistema
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Agregar Producto
          </button>
        </div>
        <ProductoList productos={productos} userRole="super_admin" onProductUpdate={fetchProductos} />
      </div>
    </div>
  );  
  
  const renderVentas = () => (
    <div className="space-y-8">
      <VentasManager userRole="super_admin" />
      
  
      
      {/* Historial de Devoluciones */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <RotateCcw className="text-orange-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Historial de Devoluciones</h3>
              <p className="text-sm text-gray-600">
                Administra las devoluciones del sistema
              </p>
            </div>
          </div>
        </div>
        <DevolucionList userRole="super_admin" />
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-8">
      {/* Panel principal de notas */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Gestión de Notas</h3>
              <p className="text-sm text-gray-600">
                Administra las notas del sistema
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Nota
          </button>
        </div>
        <SuperAdminNotes ref={notesRef} />
      </div>

      {/* Panel de historial */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <History className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Historial de Notas</h3>
              <p className="text-sm text-gray-600">
                Historial completo de notas del sistema
              </p>
            </div>
          </div>
        </div>
        <NotesHistory />
      </div>
    </div>
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <RoleProtection allowedRoles={['super_admin']}>
      <RoleContext.Provider value="super_admin">
        <div className="min-h-screen bg-gray-50">
          {/* Botón de menú fijo solo para móviles */}
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-lg hover:bg-purple-50 text-purple-600"
            aria-label="Toggle Menu"
          >
            <Menu size={24} />
          </button>

        <SuperAdminSidebar 
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          isMobileView={isMobileView}
        />
        <div
          className={`transition-all duration-300 ease-in-out pt-16 lg:pt-0
            ${isMobileView ? '' : isSidebarCollapsed ? 'ml-20' : 'ml-[280px]'}
            flex justify-center min-h-screen
          `}
        >
          <div className="w-full max-w-4xl p-4 lg:p-8">
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
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
        <NoteCreationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onNoteCreated={handleNoteCreated}
        />
        <ProductCreationModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSuccess={handleProductCreated}
        />
        
        {/* Modal de confirmación para eliminar usuario */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
              {/* Header del modal */}
              <div className="flex items-center gap-3 bg-red-50 p-6 border-b border-red-200">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    Eliminar Usuario
                  </h3>
                  <p className="text-sm text-red-700">
                    Esta acción eliminará permanentemente la cuenta
                  </p>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 mb-3">
                    ¿Estás seguro de que quieres eliminar al usuario{' '}
                    <span className="font-semibold text-gray-900">
                      {userToDelete?.email}
                    </span>
                    ?
                  </p>
                  
                  {/* Información sobre qué se conserva */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                          Datos que se conservarán intactos:
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Todas las ventas y transacciones realizadas</li>
                          <li>• Notas y registros creados</li>
                          <li>• Movimientos de caja e ingresos/egresos</li>
                          <li>• Cobros y pagos realizados</li>
                          <li>• Gastos registrados</li>
                          <li>• Productos creados o modificados</li>
                          <li>• Gestión de personal y sueldos</li>
                          <li>• Devoluciones procesadas</li>
                          <li>• Todo el historial de actividades</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Advertencia */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-900 mb-1">
                          Esta acción es irreversible
                        </h4>
                        <p className="text-xs text-red-800">
                          Solo se elimina el acceso del usuario. Todos sus datos y registros permanecen intactos para mantener la integridad del historial del sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 p-6 bg-gray-50 border-t">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar Usuario
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleContext.Provider>
    </RoleProtection>
  );
}

export default SuperAdminDashboard;