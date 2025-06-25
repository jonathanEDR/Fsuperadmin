import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Package, ShoppingBag, RefreshCw, Menu, User } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

import { CreateNote } from '../../../components/notas';
import MyProfile from '../../../Pages/MyProfile';
import { UserGestionPersonal } from '../../../components/personal';
import { Sidebar } from '../sidebars';
import { ProductoList } from '../../../components/productos';
import { VentaList } from '../../../components/ventas';
import { DevolucionList, DevolucionModal } from '../../../components/devoluciones';
import api from '../../../services/api';
import { 
  getDevoluciones, 
  createDevolucion, 
  deleteDevolucion 
} from '../../../services/devolucionService';

const UserDashboard = ({ session, initialNotes, onNotesUpdate }) => {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState(initialNotes || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('notes');
  const [ventas, setVentas] = useState([]);
  const [ventasLoading, setVentasLoading] = useState(false);
  const [devoluciones, setDevoluciones] = useState([]);
  const [devolucionesLoading, setDevolucionesLoading] = useState(false);
  const [devolucionesLimit, setDevolucionesLimit] = useState(10);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventasParaDevolucion, setVentasParaDevolucion] = useState([]);
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [cantidadDevuelta, setCantidadDevuelta] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

  useEffect(() => {
    setNotes(initialNotes || []);
  }, [initialNotes]);

  const fetchUserNotes = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar notas');
      
      const data = await response.json();
      const notesData = Array.isArray(data) ? data : data.notes || [];
      setNotes(notesData);
      onNotesUpdate?.(notesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Error al cargar las notas');
      setLoading(false);
    }
  };

  // Función para cargar las ventas del usuario
  const fetchVentas = async () => {
    try {
      setVentasLoading(true);
      const token = await getToken();
      const response = await fetch('/api/ventas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar ventas');

      const data = await response.json();
      setVentas(data.ventas || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las ventas');
    } finally {
      setVentasLoading(false);
    }
  };
  // Función para cargar las devoluciones
  const fetchDevoluciones = async () => {
    try {
      setDevolucionesLoading(true);
      const token = await getToken();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const data = await getDevoluciones();
      setDevoluciones(Array.isArray(data) ? data : data.devoluciones || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar las devoluciones');
    } finally {
      setDevolucionesLoading(false);
    }
  };

  const handleNoteCreated = async (newNote) => {
    await fetchUserNotes(); // Recargar notas después de crear una nueva
  };  const handleLogout = () => {
    // Implementar lógica de logout
  };
  const handleMarkAsCompleted = async (noteId) => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Encontrar la nota actual
      const currentNote = notes.find(note => note._id === noteId);
      
      const response = await fetch(`/api/notes/${noteId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isCompleted: true,
          completionStatus: 'pending', // Siempre volver a estado pendiente
          // Mantener otros campos relevantes
          title: currentNote?.title,
          content: currentNote?.content,
          fechadenota: currentNote?.fechadenota
        })
      });

      if (!response.ok) throw new Error('Error al marcar nota como finalizada');
      
      await fetchUserNotes(); // Recargar notas
      setSuccess('Nota enviada para revisión');
    } catch (error) {
      console.error('Error:', error);
      setError('Error al marcar la nota como finalizada');
    } finally {
      setLoading(false);
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
    fetchUserNotes();
  }, []);
  useEffect(() => {
    if (currentView === 'ventas') {
      fetchVentas();
      fetchDevoluciones(); // Cargar devoluciones al mismo tiempo
    }
  }, [currentView]);

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderNotes = () => (
    <div className="space-y-8">
      {/* Sección de Crear Nueva Nota */}
      <div className="bg-white shadow-xl rounded-2xl p-8 transform hover:scale-[1.01] transition-all duration-300 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Plus className="text-blue-600" size={24} />
          Crear Nueva Nota
        </h2>
        <CreateNote onNoteCreated={handleNoteCreated} userRole="user" />
      </div>

      {/* Sección de Listado de Notas */}
      <div className="bg-white shadow-xl rounded-2xl p-8 transform hover:scale-[1.01] transition-all duration-300 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={28} />
          Mis Notas
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <Plus size={48} className="text-gray-300 mx-auto mb-4" />
            </div>
            <p className="text-gray-500 text-xl font-medium mb-2">No hay notas disponibles</p>
            <p className="text-gray-400">¡Empieza creando tu primera nota!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notes
              .filter(note => !note.isCompleted || note.completionStatus !== 'approved')
              .map((note) => (
                <div 
                  key={note._id} 
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white transform hover:scale-[1.02] hover:border-blue-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                          {note.title || 'Sin título'}
                        </h3>
                        {note.isCompleted && (
                          <span className={`px-3 py-1 text-xs rounded-full ${
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
                          </span>
                        )}
                      </div>
                    </div>                  {(!note.isCompleted || note.completionStatus === 'rejected') && (
                      <button
                        onClick={() => handleMarkAsCompleted(note._id)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {note.completionStatus === 'rejected' ? 'Volver a Enviar' : 'Marcar como Finalizada'}
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">{note.content}</p>
                  <div className="text-sm text-gray-500 border-t pt-4 flex gap-4 flex-wrap">
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Creado: {new Date(note.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>                  {note.creatorId && (
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <User className="w-4 h-4" />
                        Creador: {note.creator_info?.nombre_negocio || 'Usuario desconocido'}
                        {note.creator_info?.role && (
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            note.creator_info.role === 'super_admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : note.creator_info.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {note.creator_info.role}
                          </span>
                        )}
                      </p>
                    )}
                    {note.fechadenota && (
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                        Fecha nota: {new Date(note.fechadenota).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}      </div>
    </div>
  );
  const renderProfile = () => (
    <MyProfile />
  );
  const renderVentas = () => {
    return (
      <div className="space-y-8">
        {/* Panel de Ventas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-blue-600" size={24} />
            Mis Ventas
          </h2>
          <VentaList 
            ventas={ventas}
            loading={ventasLoading}
            error={error}
            fetchVentas={fetchVentas}
          />
        </div>

        {/* Panel de Devoluciones */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <RefreshCw className="text-blue-600" size={24} />
              Historial de Devoluciones
            </h2>
            <button
              onClick={() => setShowDevolucionModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Devolución
            </button>
          </div>
          <DevolucionList
            devoluciones={devoluciones}
            onDevolucionDeleted={handleDevolucionDeleted}
            formatearFechaHora={formatearFechaHora}
            devolucionesLimit={devolucionesLimit}
            onLoadMore={() => setDevolucionesLimit(prev => prev + 10)}
          />
        </div>

        {/* Modal de Devolución */}
        {showDevolucionModal && (
          <DevolucionModal
            isOpen={showDevolucionModal}
            onClose={() => {
              setShowDevolucionModal(false);
              setSelectedProducto(null);
              setSelectedVenta(null);
            }}
            producto={selectedProducto}
            venta={selectedVenta}
            ventas={ventasParaDevolucion}
            fechaDevolucion={fechaDevolucion}
            cantidadDevuelta={cantidadDevuelta}
            motivo={motivo}
            setFechaDevolucion={setFechaDevolucion}
            setCantidadDevuelta={setCantidadDevuelta}
            setMotivo={setMotivo}
            onSubmit={handleSubmitDevolucion}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    );
  };
  const renderContent = () => {
    switch (currentView) {
      case 'notes':
        return renderNotes();
      case 'ventas':
        return renderVentas();
      case 'personal':
        return <UserGestionPersonal />;
      case 'profile':
        return <MyProfile />;
      default:
        return renderNotes();
    }
  };

  return (
    <div className={`flex ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(prev => !prev)} 
        currentView={currentView}
        onViewChange={setCurrentView}
      />      <div className="flex-1 p-8">
        {/* Contenido Principal */}
        {renderContent()}
      </div>
    </div>
  );
};

export default UserDashboard;
