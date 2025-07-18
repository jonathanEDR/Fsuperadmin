import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';

// Función auxiliar para filtrar usuarios según el rol
const filterUsersByRole = (users, currentRole, currentUserId) => {
  if (!users || !currentRole) {
    return [];
  }

  const filteredUsers = users.filter(user => {
    const isSelf = user.id === currentUserId;
    switch (currentRole) {
      case 'super_admin':
        return user.role !== 'super_admin' || isSelf;
      case 'admin':
       return user.role !== 'super_admin';  
      case 'user':
        return isSelf;
      default:
        return false;
    }
  });

  return filteredUsers;
};

const VentaCreationModal = ({ isOpen, onClose, onVentaCreated, userRole: initialUserRole }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [currentUserRole, setCurrentUserRole] = useState(initialUserRole || 'user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [productoActual, setProductoActual] = useState({
    productoId: '',
    cantidad: 1
  });

// Función para obtener la fecha/hora local en formato compatible con input datetime-local
const getLocalDateTimeString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const [formData, setFormData] = useState({
  fechadeVenta: getLocalDateTimeString(),
  estadoPago: 'Pendiente',
  cantidadPagada: 0,
  targetUserId: ''
});

  // Efecto para establecer el rol del usuario
  useEffect(() => {
    const role = initialUserRole || user?.publicMetadata?.role || 'user';
    setCurrentUserRole(role);
  }, [initialUserRole, user]);

  // Efecto para cargar productos
  useEffect(() => {
    const loadProductos = async () => {
      try {
        const token = await getToken();
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/productos`, {
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
        setError('Error al cargar la lista de productos');
      }
    };

    loadProductos();
  }, [getToken]);
  // Efecto para cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      // Solo cargar usuarios si el rol permite crear ventas para otros
      if (!['admin', 'super_admin'].includes(currentUserRole)) {
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        // Verificar la estructura de datos
        const users = Array.isArray(data) ? data : data.users;
        if (!users) throw new Error('Formato de respuesta inválido');
        // Mapear usuarios
        const mappedUsers = users.map(u => ({
          id: u.clerk_id || u._id,
          name: u.nombre_negocio || u.email || 'Usuario sin nombre',
          email: u.email,
          role: u.role
        }));
        // Usar SIEMPRE filterUsersByRole
        let filteredUsers = filterUsersByRole(mappedUsers, currentUserRole, user?.clerk_id || user?.id);
        // Si el filtro deja vacío y el usuario actual existe, agrégalo manualmente
        if (filteredUsers.length === 0 && user) {
          const currentUserObj = {
            id: user.clerk_id || user.id,
            name: user.fullName || user.email || 'Tú',
            email: user.email,
            role: currentUserRole
          };
          filteredUsers = [currentUserObj];
        }
        setUsuarios(filteredUsers);
        // Actualizar usuario seleccionado si es necesario
        if (!formData.targetUserId && filteredUsers.length > 0) {
          setFormData(prev => ({
            ...prev,
            targetUserId: filteredUsers[0].id
          }));
        }
      } catch (error) {
        setError('Error al cargar la lista de usuarios: ' + error.message);
      }
    };
    loadUsers();
    // eslint-disable-next-line
  }, [currentUserRole, user?.clerk_id, getToken]);

  // Filtrar productos con stock
  const productosDisponibles = useMemo(() => {
    return productos.filter(producto => producto.cantidadRestante > 0);
  }, [productos]);

  // Calcular el total de la venta
  const montoTotal = useMemo(() => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  }, [carrito]);

  // Agregar producto al carrito
  const agregarProducto = () => {
    if (!productoActual.productoId) {
      setError('Selecciona un producto');
      return;
    }

    const producto = productos.find(p => p._id === productoActual.productoId);
    if (!producto) {
      setError('Producto no encontrado');
      return;
    }

    if (productoActual.cantidad > producto.cantidadRestante) {
      setError(`Solo hay ${producto.cantidadRestante} unidades disponibles`);
      return;
    }

    const subtotal = producto.precio * productoActual.cantidad;
    
    setCarrito(prevCarrito => [...prevCarrito, {
      productoId: productoActual.productoId,
      nombre: producto.nombre,
      cantidad: productoActual.cantidad,
      precioUnitario: producto.precio,
      subtotal
    }]);

    setProductoActual({
      productoId: '',
      cantidad: 1
    });
    
    setError('');
  };

  // Eliminar producto del carrito
  const eliminarDelCarrito = (index) => {
    setCarrito(prevCarrito => prevCarrito.filter((_, i) => i !== index));
  };  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      if (carrito.length === 0) {
        throw new Error('Agrega al menos un producto');
      }

      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productos: carrito.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal
          })),
          fechadeVenta: formData.fechadeVenta,
          montoTotal,
          estadoPago: formData.estadoPago,
          cantidadPagada: Number(formData.cantidadPagada) || 0,
          targetUserId: formData.targetUserId || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la venta');
      }

      const data = await response.json();

      // Actualizar el estado local de productos
      setProductos(prevProductos => 
        prevProductos.map(producto => {
          const itemEnCarrito = carrito.find(item => item.productoId === producto._id);
          if (itemEnCarrito) {
            return {
              ...producto,
              cantidadRestante: producto.cantidadRestante - itemEnCarrito.cantidad,
              cantidadVendida: (producto.cantidadVendida || 0) + itemEnCarrito.cantidad
            };
          }
          return producto;
        })
      );

      // Limpiar el carrito
      setCarrito([]);
      
      // Resetear el producto actual
      setProductoActual({
        productoId: '',
        cantidad: 1
      });

      // Resetear el formulario
      setFormData({
        fechadeVenta: getLocalDateTimeString(),
        estadoPago: 'Pendiente',
        cantidadPagada: 0,
        targetUserId: ''
      });

      // Notificar al componente padre
      if (onVentaCreated) {
        onVentaCreated(data.venta);
      }

      onClose();
    } catch (error) {
      setError(error.message || 'Error al crear la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Verificación de permisos: admins, super_admins y users pueden crear ventas
  if (!['admin', 'super_admin', 'user'].includes(currentUserRole)) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-60" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="bg-white rounded-lg w-full max-w-md p-6" style={{ maxWidth: '90vw' }}>
          <div className="text-center">
            <div className="p-3 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4">
              <X className="text-red-600 w-10 h-10" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
            <p className="text-gray-600 mb-4">
              No tienes permisos para crear ventas.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white w-full max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl h-auto min-h-[60vh] max-h-[298vh] overflow-y-auto rounded-lg shadow-xl relative p-0 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-purple-600 px-4 sm:px-6 py-4 rounded-t-none sm:rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <ShoppingCart className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Nueva Venta</h2>
              <p className="text-xs sm:text-sm text-purple-200">Complete los detalles de la venta</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-purple-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-3 sm:px-6 py-3 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={16} />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-6 w-full flex-1 min-h-0 overflow-y-auto"
        >
          {/* Main two-column layout for web */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column: all form inputs */}
            <div className="flex-1 min-w-0">
              {/* User and Date Selection */}
              <div className={`grid gap-4 mb-6 ${currentUserRole === 'user' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {usuarios && usuarios.length > 0 && currentUserRole !== 'user' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Asignar a Usuario
                    </label>
                    <select
                      value={formData.targetUserId}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetUserId: e.target.value }))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Seleccionar usuario...</option>
                      {usuarios.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role === 'super_admin' ? 'Super Admin' : 
                                      user.role === 'admin' ? 'Admin' : 
                                      'Usuario'})
                          {user.id === user?.id ? ' (Tú)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha de Venta
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fechadeVenta}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechadeVenta: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Product Selection Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Agregar Productos</h3>
                  <button
                    type="button"
                    onClick={agregarProducto}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={18} />
                    Agregar al Carrito
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Producto
                    </label>
                    <select
                      value={productoActual.productoId}
                      onChange={(e) => setProductoActual(prev => ({ ...prev, productoId: e.target.value }))}
                      className="w-full p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Seleccionar producto...</option>
                      {productosDisponibles.map(producto => (
                        <option key={producto._id} value={producto._id}>
                          {producto.nombre} - Stock: {producto.cantidadRestante} - S/ {producto.precio}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productoActual.cantidad}
                      onChange={(e) => setProductoActual(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                      className="w-full p-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Estado de Pago
                  </label>
                  <select
                    value={formData.estadoPago}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      estadoPago: e.target.value,
                      cantidadPagada: e.target.value === 'Pagado' ? montoTotal : 0
                    }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>

                {formData.estadoPago === 'Parcial' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Cantidad Pagada
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={montoTotal}
                      value={formData.cantidadPagada}
                      onChange={(e) => setFormData(prev => ({ ...prev, cantidadPagada: parseFloat(e.target.value) }))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total de la venta:</span>
                  <span className="text-2xl font-bold text-gray-900">S/ {montoTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || carrito.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Crear Venta
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right column: cart table (sticky on desktop) */}
            <div className="flex-1 min-w-0 md:pl-2">
              {carrito.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 md:mb-0 md:sticky md:top-24">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Productos en el carrito</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {carrito.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{item.nombre}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.cantidad}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">S/ {item.precioUnitario.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">S/ {item.subtotal.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                type="button"
                                onClick={() => eliminarDelCarrito(index)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Eliminar producto"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VentaCreationModal;
