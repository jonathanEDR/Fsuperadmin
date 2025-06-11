import React, { useState, useEffect } from 'react';
import { Plus, Shield, FileText, Users, X, User, Trash2, Package } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import CreateNote from '../Pages/Createnote';
import ProfileManagement from '../Pages/ProfileManagement';
import NotesHistory from './NotesHistory';
import AdminSidebar from './AdminSidebar';
import ProductoList from '../components/ProductoList';
import CreateProduct from '../Pages/CreateProduct';

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

function AdminDashboard({ userRole, initialNotes, onNotesUpdate }) {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState(initialNotes || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productos, setProductos] = useState([]);

  // Efecto para sincronizar notas iniciales
  useEffect(() => {
    if (initialNotes) {
      setNotes(initialNotes);
    }
  }, [initialNotes]);

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

  useEffect(() => {
    fetchAdminData();
    fetchProductos();
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
  };
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
  };  const handleNoteCreated = async (newNote) => {
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
        },
        creator_info: {
          nombre_negocio: 'Cargando...',
          email: 'Cargando...',
          role: userRole
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
  };  const handleNoteReview = async (noteId, status) => {
    try {
      // Verificar si la nota existe
      const noteToReview = notes.find(note => note._id === noteId);
      
      if (!noteToReview) {
        throw new Error('Nota no encontrada');
      }

      // Verificar si el admin intenta revisar una nota de super_admin
      if (userRole === 'admin' && noteToReview.creator_info?.role === 'super_admin') {
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
        {/* Header */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Panel de Administración</h3>
                <p className="text-sm text-gray-600">
                  {userRole === 'super_admin' ? 'Super Administrador' : 'Administrador'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleModal}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              Nueva Nota
            </button>
          </div>
        </div>

        {/* Lista de notas */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              Notas Pendientes
            </h2>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">Total: {pendingNotes.length}</p>
            </div>
          </div>
          
          {pendingNotes.length === 0 ? (
  <div className="text-center py-8">
    <div className="mb-3">
      <Plus size={32} className="text-gray-300 mx-auto" />
    </div>
    <p className="text-gray-500">No hay notas pendientes</p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            )}            {/* Botones de aprobar/rechazar para admin y super_admin */}
            {note.isCompleted && note.completionStatus === 'pending' && ['admin', 'super_admin'].includes(userRole) && (
              userRole === 'admin' && note.creator_info?.role === 'super_admin' ? (
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
            {(userRole === 'admin' && (
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
                onClick={() => handleDeleteNote(note._id, userRole)}
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
    );
  };

  const renderUsers = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Gestión de Colaboradores</h3>
              <p className="text-sm text-gray-600">
                Administra los usuarios de tu organización
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <ProfileManagement userRole={userRole} />
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <NotesHistory />
  );

  const renderProducts = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Gestión de Productos</h3>
              <p className="text-sm text-gray-600">
                Administra los productos de tu organización
              </p>
            </div>
          </div>
          <button
            onClick={toggleProductModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Agregar Producto
          </button>
        </div>
        <div className="mt-6">
          <ProductoList productos={productos} userRole={userRole} onProductUpdate={fetchProductos} />
        </div>
      </div>

      {/* Modal de creación de productos */}
      <ProductCreationModal
        isOpen={isProductModalOpen}
        onClose={toggleProductModal}
        onProductCreated={handleProductCreated}
      />
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

  return (
    <>
      <div className="flex">
        <AdminSidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
          userRole={userRole}
        />
        <div className="ml-64 flex-1 p-8">
          {currentView === 'productos' && (userRole === 'admin' || userRole === 'super_admin') && (
            <div className="mb-6">
           
            </div>
          )}

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
          ) : (
            currentView === 'dashboard' ? renderDashboard() : 
            currentView === 'users' ? renderUsers() :
            currentView === 'productos' ? renderProducts() :
            renderHistory()
          )}
        </div>
      </div>

      <NoteCreationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onNoteCreated={handleNoteCreated} 
        userRole={userRole} 
      />

      <ProductCreationModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onProductCreated={handleProductCreated}
      />
    </>
  );
}

export default AdminDashboard;
