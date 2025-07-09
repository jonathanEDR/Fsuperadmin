import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  Users, 
  Package, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  Filter,
  Plus,
  Minus,
  ShoppingCart
} from 'lucide-react';

const ReservasList = ({ userRole = 'user' }) => {
  const { getToken } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    estado: '',
    nombreColaborador: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showIncrementModal, setShowIncrementModal] = useState(null);
  const [showDecrementModal, setShowDecrementModal] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(null);
  const [incrementAmount, setIncrementAmount] = useState('');
  const [decrementAmount, setDecrementAmount] = useState('');
  const [productos, setProductos] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState('');
  const [isSubmittingIncrement, setIsSubmittingIncrement] = useState(false);
  const [isSubmittingDecrement, setIsSubmittingDecrement] = useState(false);
  const [isSubmittingAddProduct, setIsSubmittingAddProduct] = useState(false);

  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';

  const fetchReservas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.nombreColaborador) params.append('nombreColaborador', filtros.nombreColaborador);
      
      // Solo mostrar reservas activas y canceladas (no completadas)
      if (!filtros.estado) {
        params.append('estado', 'activa');
      }

      const response = await fetch(`${backendUrl}/api/reservas?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las reservas');
      }

      const data = await response.json();
      setReservas(data);
    } catch (error) {
      console.error('Error fetching reservas:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, filtros]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  const handleIncrementarCantidad = async (reservaId, productoId) => {
    if (!incrementAmount || parseInt(incrementAmount) <= 0) {
      alert('Por favor ingrese una cantidad válida');
      return;
    }

    // Prevenir múltiples envíos
    if (isSubmittingIncrement) {
      return;
    }

    setIsSubmittingIncrement(true);

    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/reservas/${reservaId}/incrementar-producto`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          productoId: productoId,
          cantidadAdicional: parseInt(incrementAmount)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al incrementar cantidad');
      }

      // Cerrar modal y limpiar
      setShowIncrementModal(null);
      setIncrementAmount('');
      
      // Recargar reservas
      await fetchReservas();
    } catch (error) {
      console.error('Error incrementing cantidad:', error);
      alert('Error al incrementar cantidad: ' + error.message);
    } finally {
      setIsSubmittingIncrement(false);
    }
  };

  const handleDecrementarCantidad = async (reservaId, productoId) => {
    if (!decrementAmount || parseInt(decrementAmount) <= 0) {
      alert('Por favor ingrese una cantidad válida');
      return;
    }

    // Prevenir múltiples envíos
    if (isSubmittingDecrement) {
      return;
    }

    setIsSubmittingDecrement(true);

    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/reservas/${reservaId}/decrementar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          productoId: productoId,
          cantidadReducir: parseInt(decrementAmount)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al decrementar cantidad');
      }

      // Cerrar modal y limpiar
      setShowDecrementModal(null);
      setDecrementAmount('');
      
      // Recargar reservas
      await fetchReservas();
    } catch (error) {
      console.error('Error decrementing cantidad:', error);
      alert('Error al decrementar cantidad: ' + error.message);
    } finally {
      setIsSubmittingDecrement(false);
    }
  };

  // Función para agregar un nuevo producto a una reserva existente
  const handleAgregarProducto = async (reservaId) => {
    if (!selectedProduct || !newProductQuantity || parseInt(newProductQuantity) <= 0) {
      alert('Por favor seleccione un producto y una cantidad válida');
      return;
    }

    // Prevenir múltiples envíos
    if (isSubmittingAddProduct) {
      return;
    }

    setIsSubmittingAddProduct(true);

    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/reservas/${reservaId}/agregar-producto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          productoId: selectedProduct,
          cantidad: parseInt(newProductQuantity)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar producto');
      }

      // Cerrar modal y limpiar
      setShowAddProductModal(null);
      setSelectedProduct('');
      setNewProductQuantity('');
      
      // Recargar reservas
      await fetchReservas();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar producto: ' + error.message);
    } finally {
      setIsSubmittingAddProduct(false);
    }
  };

  // Función para generar la fórmula de cálculo
  const generarFormulaCantidad = (producto) => {
    if (!producto.cantidadInicial && !producto.incrementos && !producto.decrementos) {
      return `${producto.cantidad}`;
    }

    let formula = `${producto.cantidadInicial || producto.cantidad}`;
    
    // Agregar incrementos
    if (producto.incrementos && producto.incrementos.length > 0) {
      producto.incrementos.forEach(inc => {
        formula += ` + ${inc.cantidad}`;
      });
    }

    // Agregar decrementos
    if (producto.decrementos && producto.decrementos.length > 0) {
      producto.decrementos.forEach(dec => {
        formula += ` - ${dec.cantidad}`;
      });
    }

    formula += ` = ${producto.cantidad}`;
    return formula;
  };

  const handleUpdateEstado = async (reservaId, nuevoEstado) => {
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/reservas/${reservaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la reserva');
      }

      fetchReservas();
    } catch (error) {
      console.error('Error updating reserva:', error);
      alert('Error al actualizar la reserva: ' + error.message);
    }
  };

  const handleDeleteReserva = async (reservaId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta reserva?')) {
      return;
    }

    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/reservas/${reservaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la reserva');
      }

      fetchReservas();
    } catch (error) {
      console.error('Error deleting reserva:', error);
      alert('Error al eliminar la reserva: ' + error.message);
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'activa':
        return <Clock className="w-4 h-4 text-green-500" />;
      case 'completada':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800';
      case 'completada':
        return 'bg-blue-100 text-blue-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderCantidadConHistorial = (producto, reservaId) => {
    const cantidadInicial = producto.cantidadInicial || producto.cantidad;
    const incrementos = producto.incrementos || [];
    const decrementos = producto.decrementos || [];
    
    // Si no hay historial, mostrar solo la cantidad simple
    if (incrementos.length === 0 && decrementos.length === 0) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <span className="font-medium text-sm sm:text-base">{producto.cantidad}</span>
          {isAdminUser && (
            <div className="flex space-x-1">
              <button
                onClick={() => setShowIncrementModal({ reservaId, productoId: producto.productoId._id || producto.productoId })}
                className="p-1.5 sm:p-1 text-green-600 hover:bg-green-100 rounded transition-colors touch-manipulation"
                title="Agregar cantidad"
              >
                <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
              </button>
              <button
                onClick={() => setShowDecrementModal({ reservaId, productoId: producto.productoId._id || producto.productoId })}
                className="p-1.5 sm:p-1 text-red-600 hover:bg-red-100 rounded transition-colors touch-manipulation"
                title="Reducir cantidad"
                disabled={producto.cantidad <= 1}
              >
                <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Mostrar fórmula completa con historial
    return (
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="text-xs sm:text-sm">
          <span className="font-medium">{cantidadInicial}</span>
          {incrementos.length > 0 && (
            <span className="text-green-600 mx-1">
              {incrementos.map(inc => ` + ${inc.cantidad}`).join('')}
            </span>
          )}
          {decrementos.length > 0 && (
            <span className="text-red-600 mx-1">
              {decrementos.map(dec => ` - ${dec.cantidad}`).join('')}
            </span>
          )}
          <span className="font-medium text-blue-600"> = {producto.cantidad}</span>
        </div>
        {isAdminUser && (
          <div className="flex space-x-1">
            <button
              onClick={() => setShowIncrementModal({ reservaId, productoId: producto.productoId._id || producto.productoId })}
              className="p-1.5 sm:p-1 text-green-600 hover:bg-green-100 rounded transition-colors touch-manipulation"
              title="Agregar cantidad"
            >
              <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
            </button>
            <button
              onClick={() => setShowDecrementModal({ reservaId, productoId: producto.productoId._id || producto.productoId })}
              className="p-1.5 sm:p-1 text-red-600 hover:bg-red-100 rounded transition-colors touch-manipulation"
              title="Reducir cantidad"
              disabled={producto.cantidad <= 1}
            >
              <Minus className="w-4 h-4 sm:w-3 sm:h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Cargar productos disponibles para el modal de agregar producto
  const fetchProductos = useCallback(async () => {
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/productos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error fetching productos:', error);
    }
  }, [getToken]);

  useEffect(() => {
    if (showAddProductModal) {
      fetchProductos();
    }
  }, [showAddProductModal, fetchProductos]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="text-center text-red-600">
          <XCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" />
          <p className="text-sm sm:text-base">Error al cargar las reservas: {error}</p>
          <button 
            onClick={fetchReservas}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 touch-manipulation"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header con responsive design */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Reservas de Colaboradores</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Gestión de productos reservados para el personal
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                title="Filtros"
              >
                <Filter className="w-5 h-5" />
              </button>
              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                {reservas.length} reserva{reservas.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Filtros responsive */}
          {showFilters && (
            <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                  >
                    <option value="">Solo activas</option>
                    <option value="activa">Activa</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Colaborador
                  </label>
                  <input
                    type="text"
                    value={filtros.nombreColaborador}
                    onChange={(e) => setFiltros(prev => ({ ...prev, nombreColaborador: e.target.value }))}
                    placeholder="Buscar por nombre..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal responsive */}
        <div className="p-4 sm:p-6">
          {reservas.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-gray-500 mb-2">No hay reservas registradas</p>
              <p className="text-xs sm:text-sm text-gray-400">
                Las reservas aparecerán aquí cuando se creen
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {reservas.map((reserva) => (
                <div
                  key={reserva._id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-4">
                    {/* Header de la reserva - Stack en móvil, inline en desktop */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3 sm:mb-4">
                          <span className="font-medium text-gray-800 text-sm sm:text-base truncate">
                            {reserva.nombreColaborador}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(reserva.estado)} self-start`}>
                            {getEstadoIcon(reserva.estado)}
                            <span className="ml-1 capitalize">{reserva.estado}</span>
                          </span>
                        </div>

                        {/* Productos */}
                        <div className="mb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-3">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600 font-medium text-sm sm:text-base">Productos:</span>
                            </div>
                            {isAdminUser && reserva.estado === 'activa' && (
                              <button
                                onClick={() => setShowAddProductModal(reserva._id)}
                                className="flex items-center space-x-1 px-2 py-1 text-xs sm:text-sm text-blue-600 hover:bg-blue-100 rounded transition-colors touch-manipulation"
                                title="Agregar nuevo producto"
                              >
                                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Agregar Producto</span>
                                <span className="sm:hidden">Agregar</span>
                              </button>
                            )}
                          </div>
                          <div className="space-y-3">
                            {reserva.productos?.map((producto, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                                    <span className="font-medium text-gray-800 text-sm sm:text-base">
                                      {producto.productoNombre}
                                    </span>
                                    <span className="text-sm font-medium text-gray-600 self-start sm:self-center">
                                      S/ {(producto.subtotal || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs sm:text-sm text-gray-600">Cantidad:</span>
                                      {renderCantidadConHistorial(producto, reserva._id)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )) || (
                              // Fallback para reservas antiguas sin estructura de productos
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                                    <span className="font-medium text-gray-800 text-sm sm:text-base">
                                      {reserva.productoNombre}
                                    </span>
                                    <span className="text-sm font-medium text-gray-600 self-start sm:self-center">
                                      S/ {(reserva.montoTotal || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs sm:text-sm text-gray-600">Cantidad:</span>
                                    <span className="font-medium text-sm sm:text-base">{reserva.cantidad}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Total General */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-700">Total General:</span>
                            <span className="text-base sm:text-lg font-bold text-blue-700">
                              S/ {(reserva.montoTotal || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Reservado: {formatearFecha(reserva.fechaReserva)}</span>
                          </div>
                          {reserva.notas && (
                            <p className="text-gray-600">
                              <span className="font-medium">Notas:</span> {reserva.notas}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Acciones - Stack en móvil, inline en desktop */}
                      {isAdminUser && (
                        <div className="flex flex-row sm:flex-col items-center justify-center space-x-2 sm:space-x-0 sm:space-y-2 sm:ml-4">
                          {reserva.estado === 'activa' && (
                            <>
                              <button
                                onClick={() => handleUpdateEstado(reserva._id, 'completada')}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors touch-manipulation"
                                title="Marcar como completada"
                              >
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                onClick={() => handleUpdateEstado(reserva._id, 'cancelada')}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                                title="Cancelar reserva"
                              >
                                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteReserva(reserva._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                            title="Eliminar reserva"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para incrementar cantidad - Responsivo */}
      {showIncrementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm sm:max-w-md w-full mx-4 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Agregar Cantidad
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad a agregar:
              </label>
              <input
                type="number"
                value={incrementAmount}
                onChange={(e) => setIncrementAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                placeholder="Ingrese la cantidad"
                min="1"
                autoFocus
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowIncrementModal(null);
                  setIncrementAmount('');
                  setIsSubmittingIncrement(false);
                }}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleIncrementarCantidad(showIncrementModal.reservaId, showIncrementModal.productoId)}
                disabled={isSubmittingIncrement}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                {isSubmittingIncrement ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de decremento - Responsivo */}
      {showDecrementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm sm:max-w-md w-full mx-4 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Reducir Cantidad
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad a reducir:
              </label>
              <input
                type="number"
                value={decrementAmount}
                onChange={(e) => setDecrementAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 touch-manipulation"
                placeholder="Ingrese la cantidad"
                min="1"
                autoFocus
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowDecrementModal(null);
                  setDecrementAmount('');
                  setIsSubmittingDecrement(false);
                }}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDecrementarCantidad(showDecrementModal.reservaId, showDecrementModal.productoId)}
                disabled={isSubmittingDecrement}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                {isSubmittingDecrement ? 'Reduciendo...' : 'Reducir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar nuevo producto - Responsivo */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm sm:max-w-md w-full mx-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Agregar Nuevo Producto
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Producto:
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                >
                  <option value="">Seleccione un producto</option>
                  {productos.map((producto) => {
                    const stockDisponible = producto.cantidad - (producto.cantidadVendida || 0);
                    return (
                      <option 
                        key={producto._id} 
                        value={producto._id}
                        disabled={stockDisponible <= 0}
                      >
                        {producto.nombre} - S/ {producto.precio.toFixed(2)} 
                        {stockDisponible > 0 ? ` (Stock: ${stockDisponible})` : ' (Sin stock)'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad:
                </label>
                <input
                  type="number"
                  value={newProductQuantity}
                  onChange={(e) => setNewProductQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                  placeholder="Ingrese la cantidad"
                  min="1"
                />
              </div>
              {selectedProduct && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700">
                    {(() => {
                      const producto = productos.find(p => p._id === selectedProduct);
                      const cantidad = parseInt(newProductQuantity) || 0;
                      if (producto && cantidad > 0) {
                        return `Total: S/ ${(producto.precio * cantidad).toFixed(2)}`;
                      }
                      return 'Seleccione cantidad para ver el total';
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddProductModal(null);
                  setSelectedProduct('');
                  setNewProductQuantity('');
                  setIsSubmittingAddProduct(false);
                }}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAgregarProducto(showAddProductModal)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                disabled={!selectedProduct || !newProductQuantity || parseInt(newProductQuantity) <= 0 || isSubmittingAddProduct}
              >
                {isSubmittingAddProduct ? 'Agregando...' : 'Agregar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReservasList;
