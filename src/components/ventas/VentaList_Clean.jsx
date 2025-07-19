import React, { useState, useCallback, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { DollarSign, ShoppingCart, RotateCcw, Plus, Clock, Check, X, Search, Package, Grid3X3, TableProperties } from 'lucide-react';
import { api } from '../../services';
import { procesarPagoVenta } from '../../services/cobroService';
import { PaymentModal } from '../cobros';
import { QuickDevolucionModal } from '../devoluciones';
import { VentaCreationModal } from '.';
import VentasLineChart from '../Graphics/VentasLineChart';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useRole } from '../../context/RoleContext';
import ProductCard from './ProductCard';
import AddProductModal from './AddProductModal';
import { useVentaModification } from '../../hooks/useVentaModification';
import ToastContainer from '../common/ToastContainer';
import { useToast } from '../../hooks/useToast';
import VentaViews from './VentaViews';

function VentaList({ 
  showActions = true, 
  canComplete = false, 
  onVentaUpdated,
  showHeader = true, // Nuevo prop para controlar si se muestra el encabezado
  ventas: ventasProp = null, // Ventas pueden venir como prop
  currentUserId: currentUserIdProp,
  devoluciones = [] // <-- Asegura que devoluciones siempre esté definida
}) {
  const getFechaActualString = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const hora = String(hoy.getHours()).padStart(2, '0');
    const minutos = String(hoy.getMinutes()).padStart(2, '0');
    return `${año}-${mes}-${dia}T${hora}:${minutos}`;
  };

  // Auth hooks
  const { getToken } = useAuth();
  const { user } = useUser();
  // Fallback temporal para el rol
  const userRole = useRole() || 'user';
  const currentUserId = currentUserIdProp || user?.id;
  
  // DEBUG: Verificar que el rol se está recibiendo correctamente
  React.useEffect(() => {
    console.log('🎯 VentaList - userRole from context:', userRole);
  }, [userRole]);
  
  const [ventas, setVentas] = useState([]);
  
  // Usar ventas del prop si están disponibles, sino usar el estado local
  const ventasToRender = ventasProp || ventas;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ventasLimit, setVentasLimit] = useState(20);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedRange, setSelectedRange] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedVentaForPayment, setSelectedVentaForPayment] = useState(null);
  const [isDevolucionModalOpen, setIsDevolucionModalOpen] = useState(false);
  const [selectedVentaForDevolucion, setSelectedVentaForDevolucion] = useState(null);
  const [showVentaModal, setShowVentaModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    estadoPago: ''
  });
  const [ventaDetails, setVentaDetails] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  
  // Estados para el nuevo modal de agregar productos
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [selectedVentaForAddProduct, setSelectedVentaForAddProduct] = useState(null);
  
  // Hook para modificación de ventas
  const ventaModificationHook = useVentaModification();
  
  // Hook para toasts
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    if (user && !ventasProp) {
      loadVentas();
      loadProductos();
      loadUsuarios();
    } else if (ventasProp) {
      // Si se pasan ventas como prop, solo cargar productos y usuarios
      loadProductos();
      loadUsuarios();
      setLoading(false);
    }
  }, [user, ventasProp]);

  useEffect(() => {
    if (selectedRange) {
      loadVentas();
    }
  }, [selectedRange]);

  // Sincronizar ventas del prop con el estado local
  useEffect(() => {
    if (ventasProp) {
      console.log('📦 VentaList - Sincronizando ventas del prop:', ventasProp.length);
      setVentas(ventasProp);
    }
  }, [ventasProp]);

  // Data loading
  const loadProductos = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Error al cargar los productos');

      const data = await response.json();
      setProductos(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError(err.message);
    }
  };

  const loadVentas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Si se está usando ventas como prop, no cargar desde el backend
      if (ventasProp) {
        console.log('📦 VentaList - Usando ventas del prop, no cargando desde backend');
        if (onVentaUpdated) {
          onVentaUpdated(); // Llamar al callback del parent
        }
        return;
      }
      
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cargar las ventas');
      }

      const data = await response.json();
      
      if (data && data.ventas) {
        // Filtrar ventas según el rol del usuario y excluir las aprobadas
        const ventasActivas = data.ventas.filter(venta => {
          // Excluir ventas aprobadas
          if (venta.completionStatus === 'approved') {
            return false;
          }

          // Filtrar según el rol
          if (userRole === 'super_admin') {
            return true; // Super admin ve todas las ventas no aprobadas
          } else if (userRole === 'admin') {
            // Admin ve sus propias ventas y las de usuarios normales
            return venta.creatorInfo?.role !== 'super_admin';
          } else {
            // Usuario normal solo ve sus propias ventas
            return venta.userId === user?.id || venta.creatorId === user?.id;
          }
        });

        setVentas(ventasActivas);
      } else {
        console.warn('Estructura de respuesta inesperada:', data);
        setVentas([]);
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setError(error.message || 'Error al cargar las ventas');
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, user, userRole]);

  const loadUsuarios = async () => {
    if (!['admin', 'super_admin'].includes(userRole)) return;
    
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('No hay token de autenticación disponible');
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users-profiles`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar los usuarios');

      const data = await response.json();
      
      if (data.users) {
        // Filtrar usuarios según el rol del usuario actual
        const filteredUsers = data.users.filter(user => {
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
        
        setUsuarios(mappedUsers);
        setError('');
      } else {
        console.error('Formato de respuesta inesperado:', data);
        setError('Error al cargar la lista de usuarios');
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Error al cargar la lista de usuarios';
      setError(errorMessage);
    }
  };

  const handleDeleteVenta = async (ventaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la venta');
      }
      
      await loadVentas();
      alert('Venta eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la venta:', error);
      alert('Error al eliminar la venta: ' + (error.response?.data?.message || error.message));
    }
  };

  // Función para finalizar una venta (marcarla como completada)
  const handleFinalizarVenta = async (ventaId) => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completionStatus: 'pending',
          completionDate: new Date().toISOString(),
          completionNotes: 'Venta marcada para finalización'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.message || 'Error al marcar la venta como finalizada');
      }

      setSuccess('Venta marcada como finalizada y enviada para revisión');
      setTimeout(() => setSuccess(''), 3000);
      
      // Recargar los datos actualizados del servidor
      await loadVentas();

      // Notificar al componente padre si es necesario
      if (onVentaUpdated) {
        const responseData = await response.json();
        onVentaUpdated(responseData.venta || {});
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar o rechazar una venta
  const handleApproveReject = async (ventaId, action) => {
    if (!window.confirm(`¿Estás seguro de que deseas ${action === 'approved' ? 'aprobar' : 'rechazar'} esta venta?`)) {
      return;
    }

    try {
      let completionNotes = '';
      if (action === 'rejected') {
        completionNotes = prompt('Por favor, ingresa una razón para el rechazo:');
        if (!completionNotes) {
          return; // Si no hay notas para el rechazo, cancelar
        }
      } else {
        completionNotes = 'Venta aprobada';
      }

      setLoading(true);
      const token = await getToken();
      
      const requestData = {
        completionStatus: action,
        completionDate: new Date().toISOString(),
        completionNotes
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Error al ${action === 'approved' ? 'aprobar' : 'rechazar'} la venta`);
      }

      setSuccess(`Venta ${action === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Recargar los datos actualizados del servidor
      await loadVentas();

      // Notificar al componente padre si es necesario
      if (onVentaUpdated) {
        onVentaUpdated(responseData.venta);
      }
    } catch (error) {
      console.error('Error detallado:', error);
      setError(error.message || 'Error al procesar la venta');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (venta) => {
    setSelectedVentaForPayment(venta);
    setIsPaymentModalOpen(true);
  };

  const handleClosePayment = () => {
    setIsPaymentModalOpen(false);
    setSelectedVentaForPayment(null);
  };

  const handleProcessPayment = async (paymentData) => {
    try {
      setLoading(true);
      // Usar el servicio para procesar el pago
      const pagoCompleto = {
        yape: parseFloat(paymentData.yape) || 0,
        efectivo: parseFloat(paymentData.efectivo) || 0,
        gastosImprevistos: parseFloat(paymentData.gastosImprevistos) || 0,
        descripcion: paymentData.descripcion || '',
        fechaCobro: paymentData.fechaCobro || new Date().toISOString().split('T')[0] // Incluir fecha de cobro
      };

      console.log('Procesando pago con:', pagoCompleto);
      console.log('Datos recibidos del modal:', paymentData);
      
      await procesarPagoVenta(selectedVentaForPayment._id, pagoCompleto);
      
      setSuccess(userRole === 'user' ? 'Pago realizado exitosamente' : 'Pago procesado exitosamente');
      handleClosePayment();
      await loadVentas();
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setError(error.message || 'Error al procesar el pago. Por favor, verifica los datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDevolucion = (venta) => {
    setSelectedVentaForDevolucion(venta);
    setIsDevolucionModalOpen(true);
  };

  const handleCloseDevolucion = () => {
    setIsDevolucionModalOpen(false);
    setSelectedVentaForDevolucion(null);
  };

  const handleProcessDevolucion = async (devolucionData) => {
    try {
      setLoading(true);
      const token = await getToken();
      
      console.log('🔍 VentaList - Datos recibidos:', devolucionData);
      
      // Enviar devolución y recibir venta actualizada
      const response = await api.post('/api/devoluciones', devolucionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ VentaList - Respuesta del servidor:', response.data);

      // Si el backend devolvió la venta actualizada, usarla para actualizar el estado
      if (response.data.venta) {
        console.log('🔄 VentaList - Actualizando estado con venta del servidor');
        handleUpdateQuantity(response.data.venta);
      } else {
        // Fallback: recargar todas las ventas si no se devolvió la venta actualizada
        console.log('🔄 VentaList - Fallback: recargando todas las ventas');
        loadVentas();
      }

      showSuccess('Devolución procesada exitosamente');
      handleCloseDevolucion();
    } catch (error) {
      console.error('Error al procesar la devolución:', error);
      showError(error.response?.data?.message || 'Error al procesar la devolución');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar agregar productos
  const handleOpenAddProduct = (venta) => {
    setSelectedVentaForAddProduct(venta);
    setIsAddProductModalOpen(true);
  };

  const handleCloseAddProduct = () => {
    setIsAddProductModalOpen(false);
    setSelectedVentaForAddProduct(null);
  };

  const handleProductAdded = (ventaActualizada) => {
    // Actualizar la venta en el estado local
    setVentas(prevVentas => 
      prevVentas.map(venta => 
        venta._id === ventaActualizada._id ? ventaActualizada : venta
      )
    );
    showSuccess('Producto agregado exitosamente');
    handleCloseAddProduct();
  };

  const handleUpdateQuantity = async (ventaActualizada) => {
    try {
      console.log('🔍 VentaList - handleUpdateQuantity recibió:', ventaActualizada);
      
      if (ventaActualizada) {
        // Actualizar la venta en el estado local
        setVentas(prevVentas => {
          const ventasActualizadas = prevVentas.map(venta => {
            if (venta._id === ventaActualizada._id) {
              console.log('✅ VentaList - Actualizando venta en estado local:', {
                ventaId: venta._id,
                antes: venta,
                despues: ventaActualizada
              });
              return ventaActualizada;
            }
            return venta;
          });
          
          console.log('🔄 VentaList - Estado de ventas actualizado');
          return ventasActualizadas;
        });
        
        showSuccess('Cantidad actualizada exitosamente');
        
        // Notificar al componente padre si hay callback
        if (onVentaUpdated) {
          console.log('📡 VentaList - Notificando al componente padre');
          onVentaUpdated(ventaActualizada);
        }
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      showError(error.message || 'Error al actualizar cantidad');
    }
  };

  const handleRemoveProduct = async (ventaId, productoId) => {
    try {
      const ventaActualizada = await ventaModificationHook.removeProductFromVenta(ventaId, productoId);
      // Actualizar la venta en el estado local
      setVentas(prevVentas => 
        prevVentas.map(venta => 
          venta._id === ventaId ? ventaActualizada : venta
        )
      );
      showSuccess('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showError(error.message || 'Error al eliminar producto');
    }
  };

  // Utils
  const formatearFechaHora = (fecha) => {
    if (!fecha) return '';
    
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }

      return fechaObj.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en fecha';
    }
  };

  // Permission check
  const canEditDelete = (venta) => {
    // Los usuarios normales no pueden eliminar ventas
    if (userRole === 'user') {
      return false;
    }

    // Super Admin puede eliminar cualquier venta
    if (userRole === 'super_admin') {
      return true;
    }
    
    // Admin solo puede eliminar sus propias ventas y las de usuarios normales
    if (userRole === 'admin') {
      return venta.creatorInfo?.role !== 'super_admin';
    }
    
    return false;
  };

  const canCreateVenta = () => {
    return ['super_admin', 'admin', 'user'].includes(userRole);
  };

  // Status helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Sin estado';
    }
  };

  // Loading states
  if (loading) {
    return <div className="p-4 text-center">Cargando datos...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error: {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Lista de Ventas</h3>
              <p className="text-sm text-gray-600">
                Visualiza y gestiona las ventas
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Análisis de Ventas - Visible para todos los roles */}
      <div className="mb-8">
        <VentasLineChart userRole={userRole} />
      </div>

      {/* Selector de Vista */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Vista:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid3X3 size={16} />
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <TableProperties size={16} />
              Tabla
            </button>
          </div>
        </div>
      </div>

      {/* Mostrar mensajes de éxito/error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
          {success}
        </div>
      )}

      {/* Lista de ventas */}
      <VentaViews
        ventasToRender={ventasToRender.slice(0, ventasLimit)}
        viewMode={viewMode}
        userRole={userRole}
        currentUserId={currentUserId}
        loading={loading}
        devoluciones={devoluciones}
        formatearFechaHora={formatearFechaHora}
        canEditDelete={canEditDelete}
        handleOpenPayment={handleOpenPayment}
        handleOpenDevolucion={handleOpenDevolucion}
        handleFinalizarVenta={handleFinalizarVenta}
        handleApproveReject={handleApproveReject}
        handleDeleteVenta={handleDeleteVenta}
        handleOpenAddProduct={handleOpenAddProduct}
        handleUpdateQuantity={handleUpdateQuantity}
        handleRemoveProduct={handleRemoveProduct}
        ventaModificationHook={ventaModificationHook}
      />

      {ventasLimit < ventasToRender.length && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setVentasLimit(ventasLimit + 20)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Ver más
          </button>
        </div>
      )}

      <VentaCreationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadVentas(); // Cargar las ventas después de cerrar el modal
        }}
        productos={productos}
        usuarios={usuarios}
        userRole={userRole}
        onVentaCreated={() => {
          loadVentas(); // Cargar las ventas después de crear una nueva
        }}
      />

      {/* Modal de Pago */}
      {selectedVentaForPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePayment}
          onSubmit={handleProcessPayment}
          venta={selectedVentaForPayment}
        />
      )}

      {/* Modal de Devolución */}
      {selectedVentaForDevolucion && (
        <QuickDevolucionModal
          isOpen={isDevolucionModalOpen}
          onClose={handleCloseDevolucion}
          onSubmit={handleProcessDevolucion}
          venta={selectedVentaForDevolucion}
          isSubmitting={loading}
        />
      )}

      {/* Modal de Agregar Productos */}
      {selectedVentaForAddProduct && (
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={handleCloseAddProduct}
          ventaId={selectedVentaForAddProduct._id}
          onProductAdded={handleProductAdded}
          currentProducts={selectedVentaForAddProduct.productos || []}
        />
      )}

      {/* Contenedor de Toasts */}
      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={removeToast} 
      />
    </div>
  );
}

export default VentaList;
