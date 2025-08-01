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
      // Validación básica de datos del producto
      if (!producto.nombre || producto.nombre.trim() === '') {
        console.warn('Producto sin nombre encontrado:', producto);
        return false;
      }
      
      if (!producto.precio || producto.precio <= 0) {
        console.warn('Producto sin precio válido:', producto);
        return false;
      }
      
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

    // Validación adicional para productos con datos incompletos
    if (!productoSeleccionado.nombre || productoSeleccionado.nombre.trim() === '') {
      setError('Este producto no tiene nombre válido. Contacta al administrador.');
      return;
    }

    if (!productoSeleccionado.precio || productoSeleccionado.precio <= 0) {
      setError('Este producto no tiene precio válido. Contacta al administrador.');
      return;
    }

    if (cantidadSeleccionada <= 0) {
      setError('La cantidad debe ser mayor a 0');
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

      // Validar que todos los productos del carrito tengan datos válidos
      for (const item of carrito) {
        if (!item.nombre || item.nombre.trim() === '') {
          throw new Error('Hay productos sin nombre válido en el carrito');
        }
        if (!item.precioUnitario || item.precioUnitario <= 0) {
          throw new Error('Hay productos sin precio válido en el carrito');
        }
        if (!item.cantidad || item.cantidad <= 0) {
          throw new Error('Hay productos con cantidad inválida en el carrito');
        }
        if (!item.productoId) {
          throw new Error('Hay productos sin ID válido en el carrito');
        }
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-3">
      <div className="bg-white w-full h-full sm:w-full sm:max-w-7xl sm:h-[95vh] rounded-none sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border border-gray-100 flex flex-col mx-auto">
        {/* Header responsivo */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <ShoppingCart className="text-white" size={16} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Nueva Venta</h2>
              <p className="text-white/70 text-xs sm:text-sm hidden sm:block">Sistema de gestión</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/20 transition-colors p-2 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages responsivos */}
        {error && (
          <div className="mx-3 sm:mx-6 mt-2 sm:mt-3 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg flex-shrink-0">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={14} />
              <p className="text-xs sm:text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-3 sm:mx-6 mt-2 sm:mt-3 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg flex-shrink-0">
            <div className="flex items-center gap-2 text-green-600">
              <Plus size={14} />
              <p className="text-xs sm:text-sm font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Contenido principal responsivo */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Panel principal: Formulario y productos */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 lg:order-1">
            <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
              {/* Controles superiores responsivos optimizados */}
              <div className="p-3 sm:p-4 bg-gray-50 border-b space-y-3 flex-shrink-0">
                {/* Primera fila: Usuario y Fecha en una sola línea */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {usuarios && usuarios.length > 0 && currentUserRole !== 'user' ? (
                    <>
                      <div>
                        <label className="block text-lg sm:text-base font-semibold text-gray-700 mb-2">
                          👤 Usuario
                        </label>
                        <select
                          value={formData.targetUserId}
                          onChange={(e) => setFormData(prev => ({ ...prev, targetUserId: e.target.value }))}
                          className="w-full p-4 sm:p-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Seleccionar...</option>
                          {usuarios.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.role === 'super_admin' ? 'Super' : user.role === 'admin' ? 'Admin' : 'User'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-lg sm:text-base font-semibold text-gray-700 mb-2">
                          📅 Fecha
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.fechadeVenta}
                          onChange={(e) => setFormData(prev => ({ ...prev, fechadeVenta: e.target.value }))}
                          className="w-full p-4 sm:p-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <label className="block text-lg sm:text-base font-semibold text-gray-700 mb-2">
                        📅 Fecha
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.fechadeVenta}
                        onChange={(e) => setFormData(prev => ({ ...prev, fechadeVenta: e.target.value }))}
                        className="w-full p-4 sm:p-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Segunda fila: Filtros de búsqueda en una sola línea */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 sm:pl-10 pr-4 sm:pr-3 py-4 sm:py-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="relative">
                    <Filter className="absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full pl-12 sm:pl-10 pr-4 sm:pr-3 py-4 sm:py-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Todas</option>
                      {categorias.map(categoria => (
                        <option key={categoria._id} value={categoria._id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de productos responsiva */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 min-h-0">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl sm:text-base font-bold text-gray-900">Productos Disponibles</h3>
                  <span className="px-3 py-2 sm:px-2 sm:py-1 bg-indigo-100 text-indigo-800 rounded-full text-xl sm:text-sm font-semibold">
                    {productosDisponibles.length}
                  </span>
                </div>
                
                {productosDisponibles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-3">
                    {productosDisponibles.map(producto => (
                      <div key={producto._id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-3 hover:shadow-md transition-shadow">
                        {/* Primera fila: Nombre y controles */}
                        <div className="flex items-center justify-between mb-4 sm:mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-2xl sm:text-sm truncate leading-tight">{producto.nombre}</h4>
                          </div>
                          {/* Controles de cantidad y agregar */}
                          <div className="flex items-center gap-3 ml-3">
                            <input
                              type="number"
                              min="1"
                              max={producto.cantidadRestante}
                              placeholder="1"
                              value={cantidades[producto._id] || ''}
                              onChange={(e) => {
                                const valor = e.target.value;
                                setCantidades(prev => ({
                                  ...prev,
                                  [producto._id]: valor
                                }));
                              }}
                              className="w-24 sm:w-14 px-4 py-4 sm:px-2 sm:py-1 text-2xl sm:text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500 font-bold"
                            />
                            
                            <button
                              type="button"
                              onClick={() => {
                                const cantidad = parseInt(cantidades[producto._id]) || 1;
                                if (cantidad > 0 && cantidad <= producto.cantidadRestante) {
                                  agregarProducto(producto, cantidad);
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
                              className="px-6 py-4 sm:px-2 sm:py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-2xl sm:text-sm font-bold shadow-md"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        {/* Categoría debajo del título si existe */}
                        {producto.categoryName && (
                          <div className="mb-4 sm:mb-2">
                            <span className="inline-block px-4 py-2 sm:px-2 sm:py-0.5 text-xl sm:text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                              {producto.categoryName}
                            </span>
                          </div>
                        )}
                        
                        {/* Info del producto en tres columnas con letras más grandes */}
                        <div className="grid grid-cols-3 gap-6 sm:gap-2">
                          <div className="text-center">
                            <div className="text-gray-500 text-xl sm:text-xs mb-3 sm:mb-1 font-medium">Código</div>
                            <span className="font-mono bg-gray-100 px-4 py-3 sm:px-1 sm:py-0.5 rounded text-2xl sm:text-xs font-bold block">
                              {producto.codigoProducto}
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500 text-xl sm:text-xs mb-3 sm:mb-1 font-medium">Stock</div>
                            <span className={`px-4 py-3 sm:px-1 sm:py-0.5 rounded font-bold text-2xl sm:text-xs block ${
                              producto.cantidadRestante > 10 ? 'bg-green-100 text-green-800' :
                              producto.cantidadRestante > 5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {producto.cantidadRestante}
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500 text-xl sm:text-xs mb-3 sm:mb-1 font-medium">Precio</div>
                            <span className="font-bold text-green-600 bg-green-50 px-4 py-3 sm:px-1 sm:py-0.5 rounded text-3xl sm:text-sm block">
                              S/ {producto.precio}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-lg sm:text-base">No hay productos disponibles</p>
                  </div>
                )}
              </div>

              {/* Información de pago responsiva */}
              <div className="p-3 sm:p-4 bg-gray-50 border-t flex-shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-lg sm:text-base font-semibold text-gray-700 mb-2">Estado de Pago</label>
                    <select
                      value={formData.estadoPago}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        estadoPago: e.target.value,
                        cantidadPagada: e.target.value === 'Pagado' ? montoTotal : 0
                      }))}
                      className="w-full p-4 sm:p-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="Pendiente">💤 Pendiente</option>
                      <option value="Parcial">⏳ Parcial</option>
                      <option value="Pagado">💰 Pagado</option>
                    </select>
                  </div>

                  {formData.estadoPago !== 'Pendiente' && (
                    <div>
                      <label className="block text-lg sm:text-base font-semibold text-gray-700 mb-2">
                        💳 Cantidad Pagada
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={montoTotal}
                        step="0.01"
                        value={formData.cantidadPagada}
                        onChange={(e) => setFormData(prev => ({ ...prev, cantidadPagada: parseFloat(e.target.value) || 0 }))}
                        className="w-full p-4 sm:p-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Panel derecho: Carrito responsivo */}
          <div className="w-full lg:w-96 xl:w-80 bg-gray-50 border-t lg:border-t-0 lg:border-l flex flex-col lg:order-2 flex-shrink-0">
            {carrito.length > 0 ? (
              <>
                {/* Header del carrito responsivo */}
                <div className="p-6 sm:p-4 bg-indigo-600 text-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl sm:text-lg">🛒</span>
                      <span className="font-semibold text-2xl sm:text-base">Mi Carrito</span>
                    </div>
                    <span className="bg-white/20 px-4 py-2 sm:px-3 sm:py-1.5 rounded-full text-lg sm:text-xs font-bold">
                      {carrito.length}
                    </span>
                  </div>
                </div>

                {/* Items del carrito responsivos */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 min-h-0">
                  {carrito.map((item, index) => (
                    <div key={index} className="bg-white border rounded-lg p-3 sm:p-3">
                      <div className="flex items-center justify-between gap-3">
                        {/* Nombre del producto */}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 text-2xl sm:text-sm truncate leading-tight">
                            {item.nombre}
                          </h5>
                        </div>
                        
                        {/* Información del producto en línea */}
                        <div className="flex items-center gap-6 sm:gap-2 text-base sm:text-xs">
                          <div className="text-center">
                            <div className="text-gray-500 text-lg sm:text-xs font-medium">Cant.</div>
                            <div className="font-bold text-2xl sm:text-sm">{item.cantidad}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500 text-lg sm:text-xs font-medium">Precio</div>
                            <div className="font-bold text-2xl sm:text-sm">S/ {item.precioUnitario.toFixed(2)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-500 text-lg sm:text-xs font-medium">Total</div>
                            <div className="font-bold text-green-600 text-2xl sm:text-sm">S/ {item.subtotal.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {/* Botón eliminar */}
                        <button
                          type="button"
                          onClick={() => eliminarDelCarrito(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-2 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={20} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen y botones responsivos */}
                <div className="p-4 sm:p-4 bg-white border-t flex-shrink-0">
                  <div className="mb-6 sm:mb-4 flex justify-between items-center">
                    <span className="text-3xl sm:text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-4xl sm:text-2xl font-black text-green-600">
                      S/ {montoTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full px-6 py-5 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-2xl sm:text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmit(e);
                      }}
                      disabled={isSubmitting || carrito.length === 0}
                      className="w-full px-6 py-5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-2xl sm:text-sm font-medium"
                    >
                      {isSubmitting ? 'Procesando...' : 'Crear Venta'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 min-h-0">
                <div className="text-center p-6">
                  <div className="text-6xl sm:text-4xl mb-4">🛒</div>
                  <p className="text-xl sm:text-sm font-medium">Carrito vacío</p>
                  <p className="text-lg sm:text-xs text-gray-400 mt-2">Agrega productos para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaCreationModal;
