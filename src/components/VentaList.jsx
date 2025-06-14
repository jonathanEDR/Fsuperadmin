import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { updateVentaCompletion } from '../services/ventas';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Calendar, DollarSign, ShoppingCart, RotateCcw, Plus, Clock, ShoppingBag, Check, X} from 'lucide-react';
import VentaCreationModal from './VentaCreationModal';
import PaymentModal from './PaymentModal';


function VentaList({ userRole = 'user', showActions = true, canComplete = false, onVentaUpdated }) {
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [ventas, setVentas] = useState([]);
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

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
      loadVentas();
      loadProductos();
      loadUsuarios();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRange) {
      loadVentas();
    }
  }, [selectedRange]);

  // Data loading
  const loadProductos = async () => {
    try {
      const token = await getToken();      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Error al cargar los productos');

      const data = await response.json();
      setProductos(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError(err.message);
    }
  };  const loadVentas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
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

        console.log('Ventas filtradas:', ventasActivas);
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
      }      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}`, {
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
      
      // Log para debugging
      const requestData = {
        completionStatus: action,
        completionDate: new Date().toISOString(),
        completionNotes
      };
      console.log('Datos a enviar:', requestData);
      console.log('URL:', `${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/completion`);
      console.log('Token presente:', !!token);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaId}/completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Log para debugging de la respuesta
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

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
      console.error('Stack trace:', error.stack);
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
      const token = await getToken();
      
      // Obtener la información del usuario actual
      const creatorName = user?.firstName || user?.username || 'Usuario';
      const creatorEmail = user?.emailAddresses?.[0]?.emailAddress || '';
      
      const cobroData = {
        ventas: [{
          ventaId: selectedVentaForPayment._id,
          montoPagado: selectedVentaForPayment.montoTotal
        }],
        userId: selectedVentaForPayment.userId,
        creatorId: user?.id,
        creatorName,
        creatorEmail,
        yape: parseFloat(paymentData.yape) || 0,
        efectivo: parseFloat(paymentData.efectivo) || 0,
        gastosImprevistos: userRole === 'user' ? 0 : (parseFloat(paymentData.gastosImprevistos) || 0),
        descripcion: paymentData.descripcion || '',
        montoTotal: selectedVentaForPayment.montoTotal,
        distribucionPagos: [{
          ventaId: selectedVentaForPayment._id,
          montoPagado: selectedVentaForPayment.montoTotal,
          montoOriginal: selectedVentaForPayment.montoTotal,
          montoPendiente: 0
        }]
      };

      console.log('Enviando datos de cobro:', cobroData);

      const response = await api.post('/api/cobros', cobroData);
      console.log('Respuesta del servidor:', response.data);

      if (response.data.success) {
        setSuccess(userRole === 'user' ? 'Pago realizado exitosamente' : 'Pago procesado exitosamente');
        handleClosePayment();
        await loadVentas();
      } else {
        throw new Error(response.data.message || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      console.error('Detalles del error:', error.response?.data);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Error al procesar el pago. Por favor, verifica los datos e intenta nuevamente.'
      );
    } finally {
      setLoading(false);
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
  };  // Permission check
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
      // No puede eliminar ventas creadas por super_admin
      if (venta.creatorInfo?.role === 'super_admin') {
        return false;
      }
      // Puede eliminar ventas propias o de usuarios normales
      return true;
    }
    
    return false;
  };

  const canCreateVenta = () => {
    return ['super_admin', 'admin'].includes(userRole);
  };

  // Status helpers
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pagado':
        return 'bg-green-100 text-green-800';
      case 'Parcial':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pendiente':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Finalizada';
      case 'rejected':
        return 'Rechazada';
      case 'pending':
        return 'Pendiente de revisión';
      case 'Pagado':
        return 'Pagado';
      case 'Parcial':
        return 'Pago Parcial';
      case 'Pendiente':
        return 'Pago Pendiente';
      default:
        return status || 'Desconocido';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <ShoppingCart className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gestión de Ventas</h2>
            <p className="text-sm text-gray-600">
              Administra las ventas del sistema
            </p>
          </div>
        </div>
        {(['super_admin', 'admin'].includes(userRole)) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Venta
          </button>
        )}
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
      {ventas.map(venta => (
        <div key={venta._id} className="bg-white rounded-lg shadow p-6 mb-4">
          {/* Cabecera de la venta */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Venta #{venta._id}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(venta.fechadeVenta).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Estados de la venta */}
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 text-sm rounded-full ${
                venta.estadoPago === 'Pagado' 
                  ? 'bg-green-100 text-green-800'
                  : venta.estadoPago === 'Parcial'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {venta.estadoPago}
              </span>
              {venta.isCompleted && (
                <span className={`px-3 py-1 text-sm rounded-full ${
                  venta.completionStatus === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : venta.completionStatus === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {venta.completionStatus === 'approved'
                    ? 'Aprobada'
                    : venta.completionStatus === 'rejected'
                    ? 'Rechazada'
                    : 'Pendiente de revisión'}
                </span>
              )}
            </div>
          </div>

          {/* Información del creador y propietario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 mb-4 text-sm">
            {venta.creatorInfo && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">Creado por:</p>
                <p className="text-gray-900">{venta.creatorInfo.nombre_negocio || 'No especificado'}</p>
                <p className="text-gray-500 text-xs">{venta.creatorInfo.email}</p>
                <p className="text-gray-500 text-xs italic">Rol: {venta.creatorInfo.role}</p>
              </div>
            )}
            
            {venta.userInfo && venta.userInfo.id !== venta.creatorInfo?.id && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-700">Asignado a:</p>
                <p className="text-gray-900">{venta.userInfo.nombre_negocio || 'No especificado'}</p>
                <p className="text-gray-500 text-xs">{venta.userInfo.email}</p>
                <p className="text-gray-500 text-xs italic">Rol: {venta.userInfo.role}</p>
              </div>
            )}
          </div>

          {/* Detalles de productos y montos */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalles del Cliente</h4>
              <p className="text-gray-600">
                <span className="font-medium">Nombre:</span> {venta.user_info?.nombre_negocio || 'N/A'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {venta.user_info?.email || 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalles de la Venta</h4>
              <p className="text-gray-600">
                <span className="font-medium">Fecha:</span> {formatearFechaHora(venta.fechadeVenta)}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Monto Total:</span> S/ {venta.montoTotal.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Productos de la venta */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Productos</h4>
            <ul className="list-disc list-inside">
              {venta.productos?.map((prod, idx) => (
                <li key={idx} className="text-gray-600">
                  {prod.productoId?.nombre} - {prod.cantidad} unidad(es)
                </li>
              ))}
            </ul>
          </div>          {/* Botones de acción */}
          <div className="mt-4 flex gap-2">            {/* Botón de pago */}
            {venta.estadoPago !== 'Pagado' && (
              <button
                onClick={() => handleOpenPayment(venta)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
                title={userRole === 'user' ? 'Realizar pago de venta' : 'Procesar pago'}
              >
                <DollarSign className="w-4 h-4" />
                {userRole === 'user' ? 'Pagar Venta' : 'Procesar Pago'}
              </button>
            )}
            
            {/* Estado de finalización o botón para finalizar */}
            {venta.userId === currentUserId && (userRole === 'user' || userRole === 'admin') && (
              <>
                {(!venta.completionStatus || venta.completionStatus === 'rejected') && (
                  <button
                    onClick={() => handleFinalizarVenta(venta._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={loading}
                  >
                    <Clock className="w-4 h-4" />
                    {venta.completionStatus === 'rejected' ? 'Reenviar Venta' : 'Marcar como Finalizada'}
                  </button>
                )}
                {venta.completionStatus === 'pending' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                    <Clock className="w-4 h-4" />
                    Pendiente de aprobación
                  </div>
                )}
                {venta.completionStatus === 'approved' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <Check className="w-4 h-4" />
                    Finalizada
                  </div>
                )}
              </>
            )}            
            {/* Botones de aprobar/rechazar (solo para admin/super_admin) */}
            {venta.completionStatus === 'pending' && 
              ['admin', 'super_admin'].includes(userRole) && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApproveReject(venta._id, 'approved')}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={loading}
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleApproveReject(venta._id, 'rejected')}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={loading}
                  >
                    Rechazar
                  </button>
                </div>
            )}          {/* Botón de eliminar (solo para admin y super_admin con permisos) */}
            {canEditDelete(venta) && userRole !== 'user' && (
              <button
                onClick={() => handleDeleteVenta(venta._id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            )}
          </div>
        </div>
      ))}

      {ventasLimit < ventas.length && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setVentasLimit(ventasLimit + 20)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Ver más
          </button>
        </div>      )}      <VentaCreationModal
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
    </div>
  );
}

export default VentaList;