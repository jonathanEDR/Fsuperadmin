import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Calendar, User, ShoppingBag, RefreshCw } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import api, { getDevoluciones, createDevolucion, deleteDevolucion } from '../services/api';
import CreateNote from '../Pages/CreateNote';
import ProductoList from '../components/ProductoList';
import VentaList from '../components/VentaList';
import DevolucionList from '../components/DevolucionList';
import DevolucionModal from '../components/DevolucionModal';

import Sidebar from './Sidebar';
import { UserCircle } from 'lucide-react';

const UserDashboard = ({ session, initialNotes, onNotesUpdate }) => {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState(initialNotes || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('notes'); // 'notes' | 'profile' | 'ventas'
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
      setDevoluciones(data.devoluciones || []);
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
    } else if (currentView === 'devoluciones') {
      fetchDevoluciones();
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
      {/* Formulario para crear nueva nota */}
      <div className="bg-white shadow-xl rounded-2xl p-8 transform hover:scale-[1.01] transition-all duration-300 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Plus className="text-blue-600" size={24} />
          Crear Nueva Nota
        </h2>
        <CreateNote onNoteCreated={handleNoteCreated} userRole="user" />
      </div>

      {/* Lista de notas */}
      <div className="bg-white shadow-xl rounded-2xl p-8 transform hover:scale-[1.01] transition-all duration-300 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={28} />
          Mis Notas
        </h2>
        
        {notes.length === 0 ? (
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
              <div key={note._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white transform hover:scale-[1.02] hover:border-blue-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                        {note.title}
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
    <div className="bg-white shadow-xl rounded-2xl p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Mi Perfil</h2>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle className="w-16 h-16 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{session?.user?.firstName || 'Usuario'}</h3>
            <p className="text-gray-600">{session?.user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold mb-4">Información de la cuenta</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Nombre del Negocio</label>
              <p className="mt-1 text-gray-900">{session?.user?.firstName || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="mt-1 text-gray-900">{session?.user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Tipo de Usuario</label>
              <p className="mt-1 text-gray-900">Usuario Regular</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVentas = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 transform hover:scale-[1.01] transition-all duration-300 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <ShoppingBag className="text-blue-600" size={28} />
          Mis Ventas
        </h2>
        <VentaList 
          userRole="user" 
          showActions={true} 
          canComplete={true} 
          onVentaUpdated={fetchVentas}
        />
      </div>
    </div>
  );

  const renderDevoluciones = () => (
    <div className="space-y-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 transform hover:scale-[1.01] transition-all duration-300 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <RefreshCw className="text-blue-600" size={28} />
            Devoluciones
          </h2>
          <button
            onClick={() => {
              setShowDevolucionModal(true);
              resetDevolucionForm();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Devolución
          </button>
        </div>
        
        {devolucionesLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DevolucionList
            devoluciones={devoluciones}
            onDevolucionDeleted={handleDevolucionDeleted}
            formatearFechaHora={formatearFechaHora}
            devolucionesLimit={devolucionesLimit}
            onLoadMore={() => setDevolucionesLimit(prev => prev + 10)}
          />
        )}
      </div>

      <DevolucionModal
        isVisible={showDevolucionModal}
        ventas={ventasParaDevolucion}
        selectedVenta={selectedVenta}
        selectedProducto={selectedProducto}
        fechaDevolucion={fechaDevolucion}
        cantidadDevuelta={cantidadDevuelta}
        motivo={motivo}
        onClose={() => {
          setShowDevolucionModal(false);
          resetDevolucionForm();
        }}
        onVentaSelect={setSelectedVenta}
        onProductoSelect={setSelectedProducto}
        onFechaChange={setFechaDevolucion}
        onCantidadChange={setCantidadDevuelta}
        onMotivoChange={setMotivo}
        onSubmit={handleSubmitDevolucion}
        isSubmitting={isSubmitting}
      />
    </div>
  );

  return (
    <div className="flex">
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      <div className="ml-64 flex-1 p-8">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          currentView === 'notes' ? renderNotes() :
          currentView === 'ventas' ? renderVentas() :
          currentView === 'productos' ? <ProductoList userRole="user" /> :
          currentView === 'devoluciones' ? renderDevoluciones() :
          renderProfile()
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
