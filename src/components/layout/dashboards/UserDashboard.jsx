import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Package, ShoppingBag, RefreshCw, Menu, User } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';

import MyProfile from '../../../Pages/MyProfile';
import { UserGestionPersonal } from '../../../components/personal';
import { Sidebar } from '../sidebars';
import { ProductoList } from '../../../components/productos';
import { VentaList, VentaCreationModal } from '../../../components/ventas';
// Solo importar componentes de devolución si es necesario
import { DevolucionList, DevolucionModal } from '../../../components/devoluciones';
import api from '../../../services/api';
import { 
  getDevoluciones, 
  createDevolucion, 
  deleteDevolucion 
} from '../../../services/devolucionService';
import { convertLocalDateTimeToISO, getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { RoleContext } from '../../../context/RoleContext';
import { useUserRole } from '../../../hooks/useUserRole';
import Notas from '../../../components/notas/notas';

const UserDashboard = ({ session, initialNotes, onNotesUpdate }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { userRole, isLoading: roleLoading } = useUserRole(); // Usar el hook correcto
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
  const [showVentaModal, setShowVentaModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventasParaDevolucion, setVentasParaDevolucion] = useState([]);
  const [fechaDevolucion, setFechaDevolucion] = useState(getLocalDateTimeString());
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
  // Función para cargar las devoluciones (solo para admin y super_admin)
  const fetchDevoluciones = async () => {
    // Solo ejecutar si el usuario tiene permisos
    if (!['admin', 'super_admin'].includes(userRole)) {
      return;
    }
    
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
  // Función para registrar una devolución (para todos los usuarios)
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
        fechaDevolucion: convertLocalDateTimeToISO(fechaDevolucion)
      });

      // Show success message
      alert('Devolución registrada exitosamente');
      
      // Reset form and refresh list
      resetDevolucionForm();
      setShowDevolucionModal(false);
      // Solo recargar devoluciones si es admin o super_admin
      if (['admin', 'super_admin'].includes(userRole)) {
        fetchDevoluciones();
      }
    } catch (error) {
      console.error('Error al crear devolución:', error);
      alert(error.message || 'Error al crear la devolución');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDevolucionDeleted = async (devolucionId) => {
    // Verificar permisos antes de procesar
    if (!['admin', 'super_admin'].includes(userRole)) {
      alert('No tienes permisos para eliminar devoluciones');
      return;
    }
    
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
    setFechaDevolucion(getLocalDateTimeString());
    setCantidadDevuelta('');
    setMotivo('');
  };

  useEffect(() => {
    fetchUserNotes();
  }, []);
  useEffect(() => {
    if (currentView === 'ventas') {
      fetchVentas();
      // Solo cargar devoluciones si el usuario es admin o super_admin
      if (['admin', 'super_admin'].includes(userRole)) {
        fetchDevoluciones();
      }
    }
  }, [currentView, userRole]);

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
    <Notas />
  );
  const renderProfile = () => (
    <MyProfile />
  );
  const renderVentas = () => {
    return (
      <div className="space-y-8">
        {/* Panel de Ventas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="text-blue-600" size={24} />
              Mis Ventas
            </h2>
            <button
              onClick={() => setShowVentaModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Venta
            </button>
          </div>
          <VentaList 
            ventas={ventas}
            loading={ventasLoading}
            error={error}
            fetchVentas={fetchVentas}
            userRole={userRole || "user"} // Usar el rol real del usuario
            currentUserId={user?.id}
            devoluciones={['admin', 'super_admin'].includes(userRole) ? devoluciones : []} // Solo pasar devoluciones si tiene permisos
          />
        </div>


        {/* Modal de Devolución - Para todos los usuarios */}
        {showDevolucionModal && (
          <DevolucionModal
            isVisible={showDevolucionModal}
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
            onFechaChange={setFechaDevolucion}
            onMotivoChange={setMotivo}
            onSubmit={handleSubmitDevolucion}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Modal de Crear Venta */}
        {showVentaModal && (
          <VentaCreationModal
            isOpen={showVentaModal}
            onClose={() => setShowVentaModal(false)}
            userRole={userRole}
            onVentaCreated={() => {
              setShowVentaModal(false);
              fetchVentas(); // Recargar ventas después de crear una nueva
            }}
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

  // DEBUG: Verifica el contexto justo antes del render
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('UserDashboard: RoleContext.Provider value =', userRole);
  }, [userRole]);

  // Mostrar loading mientras se obtiene el rol
  if (roleLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <RoleContext.Provider value={userRole || 'user'}>
      <div className={`flex ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(prev => !prev)} 
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        <div className="flex-1 p-8">
          {/* Contenido Principal */}
          {renderContent()}
        </div>
      </div>
    </RoleContext.Provider>
  );
};

export default UserDashboard;
