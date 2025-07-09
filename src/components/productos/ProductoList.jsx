import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Package, Plus, Edit2, Trash2, Users } from 'lucide-react';
import ProductCreationModal from './ProductCreationModal';
import ReservaModal from './ReservaModal';
import ReservasList from './ReservasList';
import api from '../../services/api';

function ProductoList({ userRole: propUserRole = 'user', hideHeader = false }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Usar directamente el rol pasado como prop, con fallback solo si es necesario
  const userRole = propUserRole || 'user';
  
  // Verificar si es admin o super_admin
  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';
  
  const [productoData, setProductoData] = useState({
    nombre: '',
    precio: 0,
    cantidad: 0,
    editing: false,
    currentProductoId: null,
    showForm: false
  });
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productosTerminados, setProductosTerminados] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);
  const [isSubmittingReserva, setIsSubmittingReserva] = useState(false);
  const productosPorPagina = 24;
  const productosAmostrar = productos.slice(0, productosPorPagina);
  const [paginaTerminados, setPaginaTerminados] = useState(1);
  const productosPorPaginaTerminados = 10;
  const productosTerminadosPorPagina = productosTerminados.slice(
    (paginaTerminados - 1) * productosPorPaginaTerminados,
    paginaTerminados * productosPorPaginaTerminados
  );

  // Mantener currentUserId actualizado
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id.replace('user_', ''));
    }
  }, [user]);

  // ...existing code...

  // Función para verificar permisos
  const canEditDelete = (product) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin') return product.creatorInfo?.role !== 'super_admin';
    return false;
  };

  // Función para normalizar nombres
  const normalizarNombre = (nombre) => nombre.toLowerCase().trim();

  // Función para verificar duplicados
  const verificarDuplicado = (nombre, idActual = null) => {
    const nombreNormalizado = normalizarNombre(nombre);
    return productos.some(p => 
      normalizarNombre(p.nombre) === nombreNormalizado && 
      (!idActual || p._id !== idActual)
    );
  };

  // Función principal para cargar productos
  const fetchProductos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      
      if (!token) {
        throw new Error('No estás autorizado');
      }

      const response = await api.get('/api/productos', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Asegurar que tenemos un array de productos
      const productosData = Array.isArray(response.data) ? response.data : 
                          Array.isArray(response.data.productos) ? response.data.productos : [];

      // Filtrar productos únicos por nombre
      const productMap = new Map();
      productosData.forEach(producto => {
        const nombreNormalizado = normalizarNombre(producto.nombre);
        if (!productMap.has(nombreNormalizado) || 
            (productMap.get(nombreNormalizado).updatedAt || '') < (producto.updatedAt || '')) {
          productMap.set(nombreNormalizado, producto);
        }
      });

      // Separar productos activos y terminados
      const activos = [];
      const terminados = [];

      productMap.forEach(producto => {
        if (producto.cantidadRestante === 0) {
          terminados.push({
            ...producto,
            fechaAgotamiento: new Date().toLocaleString()
          });
        } else {
          activos.push(producto);
        }
      });

      setProductos(activos);
      setProductosTerminados(terminados);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setError(error.message || 'Error al cargar los productos');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  // Función para iniciar la edición de un producto
  const handleEditProducto = (producto) => {
    try {
      setError(null);
      
      // Actualizar el estado directamente con los datos del producto
      setProductoData({
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: producto.cantidad,
        editing: true,
        currentProductoId: producto._id,
        showForm: true
      });

      // Abrir el modal de edición
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error al preparar edición:', error);
      setError('Error al preparar la edición del producto');
    }
  };

  // Función para guardar los cambios de un producto
  const handleUpdateProducto = async (productoId, datosActualizados) => {
    try {
      setError(null);
      setIsSubmitting(true);
      const token = await getToken();
      
      const response = await api.put(`/api/productos/${productoId}`, {
        ...datosActualizados,
        creatorName: user?.fullName || user?.firstName || user?.username || currentUserId,
        creatorEmail: user?.primaryEmailAddress?.emailAddress,
        creatorRole: userRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Actualizar el producto en la lista
      setProductos(prev => prev.map(p => 
        p._id === productoId ? response.data : p
      ));

      // Limpiar el estado y cerrar el modal
      setProductoData({
        nombre: '',
        precio: '',
        cantidad: '',
        editing: false,
        currentProductoId: null,
        showForm: false
      });
      setIsModalOpen(false);
      setIsSubmitting(false);

    } catch (error) {
      console.error('Error al actualizar producto:', error);
      setError(error.response?.data?.message || 'Error al actualizar el producto');
      setIsSubmitting(false);
    }
  };

  // Función para eliminar un producto
  const handleDeleteProducto = async (productoId) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar este producto?')) {
      return;
    }

    try {
      setError(null);
      const token = await getToken();
      
      await api.delete(`/api/productos/${productoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizar la lista después de eliminar
      setProductos(prevProductos => prevProductos.filter(p => p._id !== productoId));
      
      // Mostrar mensaje de éxito
      console.log('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al eliminar el producto';
      setError(errorMsg);
    }
  };

  // Función para agregar o editar productos
  const handleAddOrEditProducto = async () => {
    try {
      if (!isAdminUser) {
        throw new Error('No tienes permisos para realizar esta acción');
      }

      if (!productoData.nombre || productoData.precio <= 0 || productoData.cantidad < 0) {
        throw new Error('Por favor, completa todos los campos correctamente.');
      }

      setIsSubmitting(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No estás autorizado');
      }

      const nombreNormalizado = normalizarNombre(productoData.nombre);
      if (!productoData.editing && verificarDuplicado(nombreNormalizado)) {
        throw new Error('Ya existe un producto con este nombre');
      }

      const productoPayload = {
        nombre: productoData.nombre,
        precio: Number(productoData.precio),
        cantidad: Number(productoData.cantidad),
        userId: currentUserId,
        creatorId: currentUserId,
        creatorName: user?.fullName || user?.firstName || user?.username || currentUserId,
        creatorEmail: user?.primaryEmailAddress?.emailAddress,
        creatorRole: userRole
      };

      let response;
      if (productoData.editing) {
        response = await api.put(
          `/api/productos/${productoData.currentProductoId}`,
          productoPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Actualizar producto en el estado local
        setProductos(prev => prev.map(p => 
          p._id === productoData.currentProductoId ? response.data : p
        ));
      } else {
        response = await api.post('/api/productos', productoPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Agregar nuevo producto al estado local
        setProductos(prev => [...prev, response.data]);
      }

      resetForm();
      setError(null);
      // Recargar productos para asegurar sincronización
      fetchProductos();
      
    } catch (error) {
      console.error('Error al gestionar producto:', error);
      setError(error.message || 'Error al gestionar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };


  const resetForm = () => {
    setProductoData({
      nombre: '',
      precio: 0,
      cantidad: 0,
      editing: false,
      currentProductoId: null,
      showForm: false
    });
  };

  const toggleFormVisibility = () => {
    setProductoData(prevState => ({
      ...prevState,
      showForm: !prevState.showForm
    }));
  };

  // Efecto para limpiar duplicados en el estado local
  useEffect(() => {
    const productosUnicos = Array.from(
      new Map(productos.map(item => [normalizarNombre(item.nombre), item])).values()
    );
    
    if (productosUnicos.length !== productos.length) {
      setProductos(productosUnicos);
    }
  }, [productos]);

  // ...existing code...

  // Función para manejar la creación exitosa de un producto
  const handleProductSuccess = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      const response = await api.get('/api/productos', token);
      setProductos(response.data);
    } catch (error) {
      console.error('Error al actualizar productos:', error);
      setError('Error al actualizar la lista de productos');
    }
  }, [getToken]);

  // Función para manejar la creación de reservas
  const handleCreateReserva = async (reservaData) => {
    try {
      setIsSubmittingReserva(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No estás autorizado');
      }

      const response = await api.post('/api/reservas', reservaData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Reserva creada exitosamente:', response.data);
      
      // Recargar productos para actualizar el stock
      await fetchProductos();
      
      // Cerrar modal
      setIsReservaModalOpen(false);
      
      // Mostrar mensaje de éxito (opcional)
      alert('Reserva creada exitosamente');
      
    } catch (error) {
      console.error('Error al crear reserva:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al crear la reserva';
      setError(errorMsg);
    } finally {
      setIsSubmittingReserva(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con icono y botón */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Package className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Gestión de Productos</h3>
            <p className="text-sm text-gray-600">
              Administra los productos de tu organización
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdminUser && (
            <button
              onClick={() => setIsReservaModalOpen(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Users size={20} />
              Reservar para Colaborador
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Modal de creación/edición de producto */}
      <ProductCreationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProductoData({
            nombre: '',
            precio: '',
            cantidad: '',
            editing: false,
            currentProductoId: null,
            showForm: false
          });
        }}
        onSuccess={(producto) => {
          if (productoData.editing) {
            setProductos(prev => prev.map(p => 
              p._id === productoData.currentProductoId ? producto : p
            ));
          } else {
            setProductos(prev => [...prev, producto]);
          }
          setIsModalOpen(false);
          setProductoData({
            nombre: '',
            precio: '',
            cantidad: '',
            editing: false,
            currentProductoId: null,
            showForm: false
          });
        }}
        initialData={productoData.editing ? {
          _id: productoData.currentProductoId,
          nombre: productoData.nombre,
          precio: productoData.precio,
          cantidad: productoData.cantidad
        } : null}
        isEditing={productoData.editing}
      />

      {/* Modal de reservas */}
      <ReservaModal
        isOpen={isReservaModalOpen}
        onClose={() => setIsReservaModalOpen(false)}
        onSubmit={handleCreateReserva}
        productos={productos.filter(p => (p.cantidad - p.cantidadVendida) > 0)}
        isLoading={isSubmittingReserva}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tabla de Productos Activos */}
          {/* Responsive: tabla en desktop, cards en móvil */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            {/* Desktop Table */}
            <table className="hidden sm:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  {isAdminUser && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosAmostrar.map((producto) => (
                  <tr key={producto._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                      {producto.creatorInfo?.role === 'super_admin' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Super Admin</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{producto.cantidad || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{producto.cantidadRestante || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">S/ {parseFloat(producto.precio).toFixed(2)}</td>
                    {isAdminUser && (
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canEditDelete(producto) && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditProducto(producto)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200"
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProducto(producto._id)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile Cards */}
            <div className="sm:hidden flex flex-col gap-4 p-2">
              {productosAmostrar.map((producto) => (
                <div key={producto._id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 text-base">{producto.nombre}</div>
                    {producto.creatorInfo?.role === 'super_admin' && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Super Admin</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    <span>Cantidad: <span className="font-medium text-gray-800">{producto.cantidad || 0}</span></span>
                    <span>Disponible: <span className="font-medium text-gray-800">{producto.cantidadRestante || 0}</span></span>
                    <span>Precio: <span className="font-medium text-gray-800">S/ {parseFloat(producto.precio).toFixed(2)}</span></span>
                  </div>
                  {isAdminUser && canEditDelete(producto) && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditProducto(producto)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-md text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200"
                        title="Editar producto"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProducto(producto._id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>


          {/* Sección de Reservas de Colaboradores */}
          {isAdminUser && (
            <div className="mt-8">
              <ReservasList userRole={userRole} />
            </div>
          )}

          {/* Productos Terminados (solo para admin y super_admin) */}
          {isAdminUser && (
            <div className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Productos Terminados</h2>
                <p className="text-gray-600">Historial de productos completados y finalizados</p>
              </div>

              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Usado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Agotamiento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productosTerminadosPorPagina.map((producto) => (
                      <tr key={producto._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {producto.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {producto.cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {producto.stock_usado || '0%'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          S/ {parseFloat(producto.precio).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {producto.fechaAgotamiento
                            ? new Date(producto.fechaAgotamiento).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'No disponible'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación para productos terminados */}
                {productosTerminados.length > productosPorPaginaTerminados && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => setPaginaTerminados(prev => Math.max(prev - 1, 1))}
                      disabled={paginaTerminados === 1}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                      Página {paginaTerminados} de {Math.ceil(productosTerminados.length / productosPorPaginaTerminados)}
                    </span>
                    <button
                      onClick={() => setPaginaTerminados(prev => prev + 1)}
                      disabled={paginaTerminados >= Math.ceil(productosTerminados.length / productosPorPaginaTerminados)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default ProductoList;
