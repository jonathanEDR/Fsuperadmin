import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Calendar, User, Users, ShoppingBag, RefreshCw, Menu, History, FileText, DollarSign, Package, X, Trash2, UserCheck } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateNote, NotesHistory } from '../../../components/notas';
import MyProfileUnified from '../../../components/auth/MyProfileUnified';
import ProfileManagement from '../../../Pages/ProfileManagement';
import { AdminSidebar } from '../sidebars';
import { ProductoList, CreateProduct } from '../../../components/productos';
import { VentaList, VentaCreationModal, VentasFinalizadas } from '../../../components/ventas';
import VentasManager from '../../../components/ventas/VentasManager';
import { CobroList } from '../../../components/cobros';
import { DevolucionList, DevolucionModal } from '../../../components/devoluciones';
import { GestionPersonal } from '../../../components/personal';

// Componente Modal para crear notas
const NoteCreationModal = ({ isOpen, onClose, onNoteCreated, userRole }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNoteCreation = async (note) => {
    setIsSubmitting(true);
    try {
      await onNoteCreated(note);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}>
        <div className="h-full flex items-center justify-center">
          <div 
            className={`bg-white rounded-lg p-6 w-full max-w-2xl mx-4 relative transform transition-all duration-300 ${
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Plus className="text-blue-600" size={24} />
              Crear Nueva Nota
            </h2>
            {isSubmitting && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            <CreateNote 
              onNoteCreated={handleNoteCreation} 
              userRole={userRole} 
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Modal para crear productos
const ProductCreationModal = ({ isOpen, onClose, onProductCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleProductCreation = async (product) => {
    setIsSubmitting(true);
    try {
      await onProductCreated(product);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}>
        <div className="h-full flex items-center justify-center">
          <div 
            className={`bg-white rounded-lg p-6 w-full max-w-2xl mx-4 relative transform transition-all duration-300 ${
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Plus className="text-blue-600" size={24} />
              Crear Nuevo Producto
            </h2>
            {isSubmitting && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            <CreateProduct 
              onProductCreated={handleProductCreation} 
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ initialNotes, onNotesUpdate }) {
  const { getToken, user } = useAuth();
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [notes, setNotes] = useState(initialNotes || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  
  // Estados para devoluciones
  const [devoluciones, setDevoluciones] = useState([]);
  const [devolucionesLimit, setDevolucionesLimit] = useState(5);
  const [devolucionesLoading, setDevolucionesLoading] = useState(false);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [cantidadDevuelta, setCantidadDevuelta] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ventasParaDevolucion, setVentasParaDevolucion] = useState([]);  const [activeTab, setActiveTab] = useState('ventas');

  // Efecto para sincronizar notas iniciales
  useEffect(() => {
    if (initialNotes) {
      setNotes(initialNotes);
    }
  }, [initialNotes]);
  // Efecto para manejar el rol del usuario
  useEffect(() => {
    const role = user?.publicMetadata?.role;
    console.log('User role from metadata:', role);
    // Para AdminDashboard, asumimos que el usuario es admin
    // Si necesitas verificación adicional, usa la API del backend
    setCurrentUserRole('admin');
  }, [user]);

  // Función memoizada para obtener datos
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();const notesResponse = await fetch('/api/admin/notes/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!notesResponse.ok) {
        const errorData = await notesResponse.json();
        throw new Error(errorData.message || 'Error al cargar notas');
      }
        const notesData = await notesResponse.json();
      // Asegurarse de que estamos usando el array de notas de la respuesta
      const notesArray = notesData.notes || [];
      setNotes(notesArray);
      
      if (onNotesUpdate) {
        onNotesUpdate(notesArray);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch('http://localhost:5000/api/productos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };
  // La funcionalidad de fetchVentas se ha movido a VentasManager

  // Función para cargar las devoluciones
  const fetchDevoluciones = async () => {
    try {
      setDevolucionesLoading(true);
      const token = await getToken();
      const response = await fetch('http://localhost:5000/api/devoluciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar devoluciones');
      }

      const data = await response.json();
      setDevoluciones(data.devoluciones);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar devoluciones');
    } finally {
      setDevolucionesLoading(false);
    }
  };

    // Función para registrar una devolución
    const handleSubmitDevolucion = async (productosADevolver) => {
      try {
        setIsSubmitting(true);
        
        // Validate products
        if (!productosADevolver || productosADevolver.length === 0) {
          throw new Error('Debe seleccionar al menos un producto para devolver');
        }
  
        // Validate amounts
        const invalidProducts = productosADevolver.filter(item => 
          !item.cantidad || item.cantidad <= 0 || item.cantidad > item.producto.cantidad
        );
        
        if (invalidProducts.length > 0) {
          throw new Error('Las cantidades especificadas no son válidas');
        }
  
        // Validate motivo
        if (!motivo || motivo.length < 10) {
          throw new Error('El motivo debe tener al menos 10 caracteres');
        }
  
        // Create devolution
        await createDevolucion({
          ventaId: selectedVenta._id,
          productos: productosADevolver,
          motivo,
          fechaDevolucion
        });
  
        // Show success message
        alert('Devolución registrada exitosamente');
        
        // Reset form and refresh list
        resetDevolucionForm();
        setShowDevolucionModal(false);
        fetchDevoluciones();
      } catch (error) {
        console.error('Error al crear devolución:', error);
        alert(error.message || 'Error al crear la devolución');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    const handleDevolucionDeleted = async (devolucionId) => {
      try {
        const token = await getToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await deleteDevolucion(devolucionId);
        await fetchDevoluciones();
      } catch (error) {
        console.error('Error:', error);
        setError('Error al eliminar la devolución');
      }
    };
  
    const fetchVentasParaDevolucion = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/ventas', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (!response.ok) throw new Error('Error al cargar ventas');
  
        const data = await response.json();
        // Filtrar solo ventas no finalizadas y con productos
        const ventasValidas = (data.ventas || []).filter(venta => 
          !venta.isFinalized && 
          venta.productos && 
          venta.productos.length > 0
        );
        setVentasParaDevolucion(ventasValidas);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar las ventas para devolución');
      }
    };
  
    useEffect(() => {
      if (showDevolucionModal) {
        fetchVentasParaDevolucion();
      }
    }, [showDevolucionModal]);
  
    const resetDevolucionForm = () => {
      setSelectedVenta(null);
      setSelectedProducto(null);
      setFechaDevolucion('');
      setCantidadDevuelta('');
      setMotivo('');
    };
  useEffect(() => {
    fetchAdminData();
    fetchProductos();
    // fetchVentas se ha movido al componente VentasManager
  }, []);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };
  const toggleProductModal = () => {
    setIsProductModalOpen(!isProductModalOpen);
    if (!isProductModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };  // toggleVentaModal se ha movido al componente VentasManager
  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError(null);
      setTimeout(() => setSuccess(''), 5000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 5000);
    }
  };  
  
  const handleNoteCreated = async (newNote) => {
    try {
      setLoading(true);
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const optimisticNote = {
        ...newNote,
        _id: tempId,
        createdAt: new Date().toISOString(),
        user_info: {
          nombre_negocio: newNote.user_info?.nombre_negocio || 'Cargando...',
          email: newNote.user_info?.email || 'Cargando...',
          role: newNote.user_info?.role || 'user'
        },          creator_info: {
          nombre_negocio: 'Cargando...',
          email: 'Cargando...',
          role: currentUserRole
        }
      };
      
      setNotes(prevNotes => [optimisticNote, ...prevNotes]);
      showMessage('Nota creada exitosamente');
      
      // Update parent component if needed
      if (onNotesUpdate) {
        onNotesUpdate([optimisticNote, ...notes]);
      }

      // Refresh the notes list to get the actual data
      await fetchAdminData();
    } catch (error) {
      console.error('Error al crear la nota:', error);
      showMessage('Error al crear la nota. Por favor, inténtalo de nuevo.', 'error');
      setNotes(prevNotes => prevNotes.filter(note => note.id !== newNote.id));
    } finally {
      setLoading(false);
    }
  };

  const handleProductCreated = async (product) => {
    try {
      setLoading(true);
      const token = await getToken();
      await fetch('http://localhost:5000/api/productos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });

      setSuccess('Producto creado exitosamente');
      toggleProductModal();
      // Actualizar la lista de productos
      fetchProductos();
    } catch (error) {
      console.error('Error al crear producto:', error);
      setError('Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };
  // La funcionalidad de crear ventas se ha movido a VentasManager

  const handleDeleteNote = async (noteId, userRole) => {
    try {
      // Encontrar la nota que se va a eliminar
      const noteToDelete = notes.find(note => note._id === noteId);
      
      if (!noteToDelete) {
        setError('Nota no encontrada');
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Verificar permisos de manera más robusta
      const canDeleteNote = userRole === 'super_admin' || (
        userRole === 'admin' && 
        noteToDelete?.user_info?.role !== 'super_admin' && 
        noteToDelete?.creator_info?.role !== 'super_admin'
      );

      if (!canDeleteNote) {
        setError('No tienes permisos para eliminar notas creadas o pertenecientes a un Super Admin');
        setTimeout(() => setError(null), 3000);
        return;
      }

      if (!window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;
      
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`/api/notes/delete/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la nota');
      }
      
      // Actualización optimista del estado
      setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
      setSuccess('Nota eliminada exitosamente');
      
      // Recargar datos en segundo plano para asegurar sincronización
      await fetchAdminData();
    } catch (error) {
      console.error('Error deleting note:', error);
      setError(error.message || 'Error al eliminar la nota');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess('');
        setError(null);
      }, 3000);
    }
  }; 
  
  const handleNoteReview = async (noteId, status) => {
    try {
      // Verificar si la nota existe
      const noteToReview = notes.find(note => note._id === noteId);
      
      if (!noteToReview) {
        throw new Error('Nota no encontrada');
      }

      // Verificar si el admin intenta revisar una nota de super_admin
      if (currentUserRole === 'admin' && noteToReview.creator_info?.role === 'super_admin') {
        throw new Error('No tienes permisos para revisar notas creadas por un Super Administrador');
      }const token = await getToken();
      const response = await fetch(`/api/notes/${noteId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el estado de la nota');
      }

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (!data.note) {
        throw new Error('La respuesta del servidor no incluye la nota actualizada');
      }

      // Actualizar el estado con los datos del servidor
      setNotes(prevNotes => prevNotes
        .map(note => note._id === noteId ? data.note : note)
        .filter(note => note._id !== noteId)  // Remover la nota después de aprobar/rechazar
      );
      
      // Mostrar mensaje de éxito
      showMessage(`Nota ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      
      // Recargar notas para asegurar sincronización
      await fetchAdminData();
      
      setSuccess(`Nota ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al actualizar el estado de la nota');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleLogout = () => {
    // Handle logout logic
  };  const renderDashboard = () => {
    // Filtrar las notas que no están aprobadas
    const pendingNotes = notes.filter(note => !note.isCompleted || note.completionStatus !== 'approved');

    return (
      <div className="space-y-8">
        {/* Panel principal de notas */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Gestión de Notas</h3>
                <p className="text-sm text-gray-600">
                  Administra las notas del sistema
                </p>
              </div>
            </div>
            <button
              onClick={toggleModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Nota
            </button>
          </div>

          {/* Lista de notas pendientes */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Notas Pendientes</h4>
            {pendingNotes.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="mb-3">
                  <Plus size={32} className="text-gray-300 mx-auto" />
                </div>
                <p className="text-gray-500">No hay notas pendientes</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {pendingNotes.map((note) => (
                  <div key={note._id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all bg-white">
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800 line-clamp-1">
                          {note.title}
                        </h3>
                        {note.isCompleted && (
                          <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${
                            note.completionStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : note.completionStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {note.completionStatus === 'approved'
                              ? 'Aprobada'
                              : note.completionStatus === 'rejected'
                              ? 'Rechazada'
                              : 'Pendiente'}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{note.content}</p>
                      
                      <div className="space-y-2 mt-auto">
                        {/* Botón para marcar notas como finalizadas */}
                        {!note.isCompleted && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMarkAsCompleted(note._id)}
                              className="flex-1 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Marcar como Finalizada
                            </button>
                          </div>
                        )}            {/* Botones de aprobar/rechazar para admin y super_admin */}                        {note.isCompleted && note.completionStatus === 'pending' && ['admin', 'super_admin'].includes(currentUserRole) && (
                          currentUserRole === 'admin' && note.creator_info?.role === 'super_admin' ? (
                            <div className="text-center p-2 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-500">No puedes revisar notas creadas por un Super Admin</p>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleNoteReview(note._id, 'approved')}
                                className="flex-1 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleNoteReview(note._id, 'rejected')}
                                className="flex-1 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Rechazar
                              </button>
                            </div>
                          )
                        )}

                        {/* Estado de la nota */}
                        {note.isCompleted && (
                          <div className={`text-xs px-3 py-1 rounded-full inline-block ${
                            note.completionStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : note.completionStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {note.completionStatus === 'approved'
                              ? 'Aprobada'
                              : note.completionStatus === 'rejected'
                              ? 'Rechazada'
                              : 'Pendiente de Revisión'}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-xs">
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span className="font-medium">Propietario:</span>
                            <span className="truncate max-w-[120px]">{note.user_info?.nombre_negocio || note.user_info?.email || 'Usuario'}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full ${
                            note.user_info?.role === 'super_admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : note.user_info?.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {note.user_info?.role || 'user'}
                          </span>
                        </div>
                        
                        <div className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                          note.creator_info?.role === 'super_admin'
                            ? 'bg-purple-50'
                            : note.creator_info?.role === 'admin'
                            ? 'bg-blue-50'
                            : 'bg-green-50'
                        }`}>
                          <div className="flex items-center gap-1">
                            <User size={12} className={
                              note.creator_info?.role === 'super_admin'
                                ? 'text-purple-500'
                                : note.creator_info?.role === 'admin'
                                ? 'text-blue-500'
                                : 'text-green-500'
                            } />
                            <span className="font-medium">Creado por:</span>
                            <span className="truncate max-w-[120px]">{note.creator_info?.nombre_negocio || note.creator_info?.email || 'Usuario'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                        {note.fechadenota && (
                          <span className="text-xs text-gray-500">
                            {new Date(note.fechadenota).toLocaleDateString('es-ES')}
                          </span>
                        )}
                        {(currentUserRole === 'admin' && (
                          note.user_info?.role === 'super_admin' || 
                          note.creator_info?.role === 'super_admin'
                        )) ? (
                          <button
                            disabled
                            className="text-gray-400 p-1 rounded cursor-not-allowed"
                            title={`No puedes eliminar notas ${
                              note.creator_info?.role === 'super_admin' 
                                ? 'creadas por un Super Admin' 
                                : 'de un Super Admin'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteNote(note._id)}
                            className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50"
                            title="Eliminar nota"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de historial */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <History className="text-blue-600" size={24} />
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
  };
  const renderProfile = () => {
    return (
      <div className="w-full">
        <MyProfileUnified />
      </div>
    );
  };const renderUsers = () => {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="text-blue-600" />
            Gestión de Colaboradores
          </h2>
          <ProfileManagement userRole={currentUserRole} />
        </div>
      </div>
    );
  };

  const renderProducts = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">        <ProductoList 
          productos={productos} 
          userRole={currentUserRole} 
          onProductUpdate={fetchProductos}
        />
      </div>
    </div>
  );  const renderSales = () => (
    <div className="space-y-8">      <VentasManager 
        userRole="admin"
        onVentaCreated={() => fetchDevoluciones()} // Para actualizar las devoluciones cuando se crea una venta
      />

      {/* Panel de Devoluciones */}
      {devoluciones && (
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <RefreshCw className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Historial de Devoluciones</h3>
                <p className="text-sm text-gray-600">
                  Administra las devoluciones
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDevolucionModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Devolución
            </button>
          </div>
          <DevolucionList
            devoluciones={devoluciones}
            onDevolucionDeleted={handleDevolucionDeleted}
            formatearFechaHora={formatearFechaHora}
            devolucionesLimit={devolucionesLimit}            onLoadMore={() => setDevolucionesLimit(prev => prev + 10)}
            userRole={currentUserRole}
          />
        </div>
      )}
    </div>
  );

  const renderCobros = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Gestión de Cobros</h3>
              <p className="text-sm text-gray-600">
                Administra los pagos y cobros del sistema
              </p>
            </div>
          </div>
        </div>
        <CobroList userRole="admin" />
      </div>
    </div>
  );

  const handleMarkAsCompleted = async (noteId) => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`/api/notes/${noteId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isCompleted: true,
          completionStatus: 'pending'
        })
      });

      if (!response.ok) throw new Error('Error al marcar nota como finalizada');
      
      // Actualización optimista
      setNotes(prevNotes => prevNotes.map(note => 
        note._id === noteId 
          ? { ...note, isCompleted: true, completionStatus: 'pending' }
          : note
      ));
      
      showMessage('Nota marcada como finalizada y enviada para revisión');
      
      // Recargar datos en segundo plano
      await fetchAdminData();
    } catch (error) {
      console.error('Error:', error);
      showMessage('Error al marcar la nota como finalizada', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Función para formatear fechas
  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  const renderPersonal = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="text-green-600" size={24} />
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

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Botón de menú fijo para móviles */}
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-lg shadow-lg hover:bg-blue-50 text-blue-600"
          aria-label="Toggle Menu"
        >
          <Menu size={24} />
        </button>

        <div className="flex">          <AdminSidebar 
            currentView={currentView}
            onViewChange={setCurrentView}
            onLogout={handleLogout}
            userRole={currentUserRole}
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={toggleSidebar}
            isMobileView={isMobileView}
          />
          <div className={`
            transition-all duration-300 ease-in-out pt-16 lg:pt-0
            ${isSidebarCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-[280px]'}
            flex-1
          `}>
            <div className="p-4 lg:p-8">
              {error && (
                <div className="mb-8 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-8 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>        
              ) : (                <div className="space-y-6">
                  {                  currentView === 'dashboard' ? renderDashboard() : 
                  currentView === 'users' ? renderUsers() :
                  currentView === 'productos' ? renderProducts() :
                  currentView === 'ventas' ? renderSales() :
                  currentView === 'cobros' ? renderCobros() :
                  currentView === 'personal' ? renderPersonal() :
                  currentView === 'profile' ? renderProfile() :
                  renderDashboard()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>      <NoteCreationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onNoteCreated={handleNoteCreated} 
        userRole={currentUserRole} 
      />

      <ProductCreationModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductCreated={handleProductCreated}
      />      {/* El modal de ventas ahora se maneja en el componente VentasManager */}
    </>
  );
}

export default AdminDashboard;
