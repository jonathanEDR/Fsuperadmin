import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle, Search, Filter } from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState('');
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cantidades, setCantidades] = useState({}); // Para manejar las cantidades de cada producto
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

  // Efecto para cargar categorías
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const token = await getToken();
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCategorias(data);
        }
      } catch (error) {
        console.log('Error al cargar categorías (opcional):', error.message);
      }
    };

    loadCategorias();
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

  // Filtrar productos con stock, búsqueda y categoría
  const productosDisponibles = useMemo(() => {
    console.log('Filtrando productos:', {
      totalProductos: productos.length,
      searchTerm,
      selectedCategory,
      categorias: categorias.map(c => ({ id: c._id, nombre: c.nombre }))
    });

    return productos.filter(producto => {
      // Filtro de stock
      if (producto.cantidadRestante <= 0) return false;
      
      // Filtro de búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchName = producto.nombre?.toLowerCase().includes(searchLower);
        const matchCode = producto.codigoProducto?.toLowerCase().includes(searchLower);
        if (!matchName && !matchCode) return false;
      }
      
      // Filtro de categoría (corregido)
      if (selectedCategory && selectedCategory !== '') {
        console.log('Filtrando por categoría:', {
          selectedCategory,
          productoCategoryId: producto.categoryId,
          productoCategoryName: producto.categoryName,
          producto: producto.nombre
        });
        
        // Comparar tanto por categoryId como por categoryName para mayor compatibilidad
        const matchesCategoryId = producto.categoryId && producto.categoryId.toString() === selectedCategory;
        const matchesCategoryName = producto.categoryName && 
          categorias.find(cat => cat._id === selectedCategory && cat.nombre === producto.categoryName);
        
        if (!matchesCategoryId && !matchesCategoryName) {
          return false;
        }
      }
      
      return true;
    });
  }, [productos, searchTerm, selectedCategory, categorias]);

  // Calcular el total de la venta
  const montoTotal = useMemo(() => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  }, [carrito]);

  // Agregar producto al carrito
  const agregarProducto = (producto = null, cantidad = null) => {
    const productoSeleccionado = producto || productos.find(p => p._id === productoActual.productoId);
    const cantidadSeleccionada = cantidad || productoActual.cantidad;

    if (!productoSeleccionado) {
      setError('Selecciona un producto');
      return;
    }

    if (cantidadSeleccionada > productoSeleccionado.cantidadRestante) {
      setError(`Solo hay ${productoSeleccionado.cantidadRestante} unidades disponibles`);
      return;
    }

    const subtotal = productoSeleccionado.precio * cantidadSeleccionada;
    
    setCarrito(prevCarrito => [...prevCarrito, {
      productoId: productoSeleccionado._id,
      nombre: productoSeleccionado.nombre,
      cantidad: cantidadSeleccionada,
      precioUnitario: productoSeleccionado.precio,
      subtotal
    }]);

    // Mantener los filtros activos - solo limpiar errores
    setError('');
    
    // Mostrar mensaje de éxito
    const mensaje = `✓ ${productoSeleccionado.nombre} (${cantidadSeleccionada}) agregado al carrito`;
    setSuccessMessage(mensaje);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Eliminar producto del carrito
  const eliminarDelCarrito = (index) => {
    setCarrito(prevCarrito => prevCarrito.filter((_, i) => i !== index));
  };

  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setCarrito([]);
    setCantidades({});
    setSearchTerm('');
    setSelectedCategory('');
    setError('');
    setSuccessMessage('');
    setFormData({
      fechadeVenta: getLocalDateTimeString(),
      estadoPago: 'Pendiente',
      cantidadPagada: 0,
      targetUserId: ''
    });
  };

  // Función para manejar el cierre del modal
  const handleClose = () => {
    limpiarFormulario();
    onClose();
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

      handleClose();
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
              onClick={handleClose}
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
            onClick={handleClose}
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

        {/* Success message */}
        {successMessage && (
          <div className="px-3 sm:px-6 py-3 bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-2 text-green-600">
              <Plus size={16} />
              <p className="text-sm">{successMessage}</p>
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
                  <div className="text-sm text-gray-500">
                    {productosDisponibles.length} productos disponibles
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Filtros de búsqueda */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Buscar producto
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o código..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Filtrar por categoría
                      </label>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Todas las categorías</option>
                          {categorias.map(categoria => (
                            <option key={categoria._id} value={categoria._id}>
                              {categoria.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Lista de productos */}
                  <div className="max-h-80 overflow-y-auto border rounded-lg bg-white">
                    {productosDisponibles.length > 0 ? (
                      <div className="grid gap-2 p-2">
                        {productosDisponibles.map(producto => (
                          <div key={producto._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">{producto.nombre}</h4>
                                {producto.categoryName && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {producto.categoryName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Código: {producto.codigoProducto}</span>
                                <span>Stock: {producto.cantidadRestante}</span>
                                <span className="font-semibold text-green-600">S/ {producto.precio}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <input
                                type="number"
                                min="1"
                                max={producto.cantidadRestante}
                                placeholder="Cantidad"
                                value={cantidades[producto._id] || ''}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  setCantidades(prev => ({
                                    ...prev,
                                    [producto._id]: valor
                                  }));
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const cantidad = parseInt(cantidades[producto._id]) || 0;
                                    if (cantidad > 0 && cantidad <= producto.cantidadRestante) {
                                      agregarProducto(producto, cantidad);
                                      setCantidades(prev => ({
                                        ...prev,
                                        [producto._id]: ''
                                      }));
                                    }
                                  }
                                }}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                id={`cantidad-${producto._id}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const cantidad = parseInt(cantidades[producto._id]) || 0;
                                  if (cantidad > 0 && cantidad <= producto.cantidadRestante) {
                                    agregarProducto(producto, cantidad);
                                    // Limpiar solo este input específico después de agregar
                                    setCantidades(prev => ({
                                      ...prev,
                                      [producto._id]: ''
                                    }));
                                  } else if (cantidad === 0) {
                                    setError('La cantidad debe ser mayor a 0');
                                    setTimeout(() => setError(''), 3000);
                                  } else {
                                    setError(`Solo hay ${producto.cantidadRestante} unidades disponibles`);
                                    setTimeout(() => setError(''), 3000);
                                  }
                                }}
                                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Search size={48} className="mx-auto mb-2 text-gray-300" />
                        <p>No se encontraron productos disponibles</p>
                        {(searchTerm || selectedCategory) && (
                          <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                        )}
                      </div>
                    )}
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
                  {/* Total de la venta debajo de la tabla */}
                  <div className="flex justify-between items-center px-4 py-4 border-t bg-gray-50">
                    <span className="text-gray-700 font-medium">Total de la venta:</span>
                    <span className="text-2xl font-bold text-gray-900">S/ {montoTotal.toFixed(2)}</span>
                  </div>
                  {/* Botones de acción debajo del total */}
                  <div className="flex justify-end gap-3 px-4 pb-4">
                    <button
                      type="button"
                      onClick={handleClose}
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
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VentaCreationModal;
