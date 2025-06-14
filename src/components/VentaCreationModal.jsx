import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';

const VentaCreationModal = ({ isOpen, onClose, onVentaCreated, userRole }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Estado para el carrito
  const [carrito, setCarrito] = useState([]);
  
  // Estado para el producto actual siendo agregado
  const [productoActual, setProductoActual] = useState({
    productoId: '',
    cantidad: 1
  });

  // Estado para el resto de datos de la venta
  const [formData, setFormData] = useState({
    fechadeVenta: new Date().toISOString().slice(0, 16),
    estadoPago: 'Pendiente',
    cantidadPagada: 0,
    targetUserId: ''
  });  // Establecer el rol del usuario cuando cambie el prop
  useEffect(() => {
    if (!userRole) {
      console.warn('No se proporcionó userRole, usando user como predeterminado');
      setCurrentUserRole('user');
    } else {
      console.log('Role set from props:', userRole);
      setCurrentUserRole(userRole);
    }
  }, [userRole]);

  // Cargar productos y usuarios cuando se abre el modal
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      
      try {
        const token = await getToken();
        
        // Cargar productos
        const productosResponse = await fetch('http://localhost:5000/api/productos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!productosResponse.ok) {
          throw new Error('Error al cargar productos');
        }
        
        const productosData = await productosResponse.json();
        setProductos(productosData);

        // Cargar usuarios
        const usuariosResponse = await fetch('http://localhost:5000/api/admin/users-profiles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!usuariosResponse.ok) {
          throw new Error('Error al cargar usuarios');
        }

        const data = await usuariosResponse.json();
        if (data && data.users) {          const mappedUsers = data.users.map(user => ({
            id: user.clerk_id,
            name: user.nombre_negocio || user.email || 'Usuario sin nombre',
            email: user.email,
            role: user.role
          }));

          // Filtrar usuarios según el rol del usuario actual
          let filteredUsers;
          
          console.log('Filtrando usuarios con rol:', currentUserRole);
          
          if (currentUserRole === 'super_admin') {
            // Super admin puede ver y asignar a admin y users
            filteredUsers = mappedUsers.filter(u => u.role !== 'super_admin');
            console.log('Usuarios filtrados para super_admin:', filteredUsers);
          } else if (currentUserRole === 'admin') {
            // Admin puede ver y asignar a users y a sí mismo
            filteredUsers = mappedUsers.filter(u => 
              u.role === 'user' || // Puede asignar a todos los usuarios normales
              u.id === user?.id    // Y a sí mismo
            );
            console.log('Usuarios filtrados para admin:', filteredUsers);
          } else {
            // Users solo pueden crear ventas para sí mismos
            filteredUsers = mappedUsers.filter(u => u.id === user?.id);
            console.log('Usuarios filtrados para user:', filteredUsers);
          }

          // Si no hay usuario seleccionado y hay usuarios filtrados, seleccionar al usuario actual por defecto
          if (!formData.targetUserId && filteredUsers.length > 0) {
            const currentUserInList = filteredUsers.find(u => u.id === user?.id);
            if (currentUserInList) {
              setFormData(prev => ({ ...prev, targetUserId: currentUserInList.id }));
            }
          }

          setUsuarios(filteredUsers);
        } else {
          throw new Error('Error al obtener la lista de usuarios');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar datos: ' + error.message);
      }
    };

    fetchData();
  }, [isOpen, getToken]);

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
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
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
          cantidadPagada: formData.estadoPago === 'Pagado' ? montoTotal : formData.cantidadPagada,
          targetUserId: formData.targetUserId || user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la venta');
      }

      const data = await response.json();
      if (onVentaCreated) {
        onVentaCreated(data);
      }
      
      onClose();
      
      // Limpiar el formulario
      setCarrito([]);
      setProductoActual({
        productoId: '',
        cantidad: 1
      });
      setFormData({
        fechadeVenta: new Date().toISOString().slice(0, 16),
        estadoPago: 'Pendiente',
        cantidadPagada: 0,
        targetUserId: ''
      });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al crear la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl overflow-hidden relative">
        <div className="flex justify-between items-center bg-purple-600 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Nueva Venta</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Selector de usuario */}
            {usuarios && usuarios.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar a Usuario
                </label>
                <select
                  value={formData.targetUserId}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetUserId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fecha de venta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Venta
              </label>
              <input
                type="datetime-local"
                value={formData.fechadeVenta}
                onChange={(e) => setFormData(prev => ({ ...prev, fechadeVenta: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Agregar productos */}
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Agregar Productos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto
                </label>
                <select
                  value={productoActual.productoId}
                  onChange={(e) => setProductoActual(prev => ({ ...prev, productoId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Seleccionar producto...</option>
                  {productosDisponibles.map(producto => (
                    <option 
                      key={producto._id} 
                      value={producto._id}
                    >
                      {producto.nombre} - Stock: {producto.cantidadRestante} - Precio: S/ {producto.precio}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={productoActual.cantidad}
                  onChange={(e) => setProductoActual(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={agregarProducto}
                  className="w-full p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Agregar
                </button>
              </div>
            </div>

            {/* Lista de productos en el carrito */}
            {carrito.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Productos en el carrito:</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {carrito.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">{item.nombre}</td>
                          <td className="px-4 py-2">{item.cantidad}</td>
                          <td className="px-4 py-2">S/ {item.precioUnitario.toFixed(2)}</td>
                          <td className="px-4 py-2">S/ {item.subtotal.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => eliminarDelCarrito(index)}
                              className="text-red-600 hover:text-red-800"
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

          {/* Información de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Pago
              </label>
              <select
                value={formData.estadoPago}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  estadoPago: e.target.value,
                  cantidadPagada: e.target.value === 'Pagado' ? montoTotal : 0
                }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Parcial">Parcial</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>

            {formData.estadoPago === 'Parcial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Pagada
                </label>
                <input
                  type="number"
                  min="0"
                  max={montoTotal}
                  value={formData.cantidadPagada}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidadPagada: parseFloat(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total de la venta:</span>
              <span className="text-xl font-bold">S/ {montoTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || carrito.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </span>
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Crear Venta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VentaCreationModal;
