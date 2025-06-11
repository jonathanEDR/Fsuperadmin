import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../services/api';

function ProductoList({ userRole = 'user' }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [currentUserId, setCurrentUserId] = useState(null);

  // Efecto para mantener currentUserId actualizado
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id.replace('user_', ''));
    }
  }, [user]);

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
  const [productosTerminados, setProductosTerminados] = useState([]);
  const productosPorPagina = 24;
  const productosAmostrar = productos.slice(0, productosPorPagina);

  const [paginaTerminados, setPaginaTerminados] = useState(1);
  const productosPorPaginaTerminados = 10;
  const productosTerminadosPorPagina = productosTerminados.slice(
    (paginaTerminados - 1) * productosPorPaginaTerminados,
    paginaTerminados * productosPorPaginaTerminados
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Función para verificar permisos
  const canEditDelete = (product) => {
    // Si es super_admin, tiene todos los permisos
    if (userRole === 'super_admin') {
      return true;
    }

    // Si es admin, puede editar/eliminar cualquier producto excepto los de super_admin
    if (userRole === 'admin') {
      return product.creatorInfo?.role !== 'super_admin';
    }

    // Usuarios normales no tienen permisos
    return false;
  };


  // Envuelve fetchProductos en useCallback
  const fetchProductos = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }    const response = await api.get('/api/productos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const productosActivos = [];
      const productosFinalizados = [];

      response.data.forEach((producto) => {
        if (producto.cantidadRestante === 0) {
          productosFinalizados.push({
            ...producto,
            fechaAgotamiento: new Date().toLocaleString(),
          });
        } else {
          productosActivos.push(producto);
        }
      });

      setProductos(productosActivos);
      setProductosTerminados(productosFinalizados);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setError('Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);
  // useEffect para llamar a fetchProductos
  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleDeleteProducto = async (productoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:5000/api/productos/${productoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No tienes permiso para eliminar este producto');
      }

      // Actualizar la lista de productos después de eliminar
      setProductos(productos.filter(p => p._id !== productoId));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError(error.message || 'Error al eliminar el producto');
    }
  };

  const handleAddOrEditProducto = async () => {
    try {
      // Validación de permisos
      if (!['admin', 'super_admin'].includes(userRole)) {
        setError('No tienes permisos para realizar esta acción');
        return;
      }

      // Validación de campos
      if (!productoData.nombre || productoData.precio <= 0 || productoData.cantidad < 0) {
        setError('Por favor, completa todos los campos correctamente.');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      // Obtener token
      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }

      // Limpiar y preparar el ID del usuario
      const currentUserId = user?.id?.replace('user_', '');
      // Log para debugging
      console.log('ID del usuario actual:', {
        rawId: user?.id,
        cleanId: currentUserId,
        userRole
      });      // Preparar payload del producto con IDs limpios
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

      // Log detallado del payload
      console.log('Datos del producto a crear:', {
        ...productoPayload,
        currentUserId,
        userRole,
        idDetails: {
          originalUserId: user?.id,
          cleanedUserId: currentUserId,
          roleCheck: userRole === 'admin'
        }
      });

      // Enviar petición al servidor
      if (productoData.editing) {
        const response = await api.put(
          `/api/productos/${productoData.currentProductoId}`,
          productoPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Producto actualizado:', response.data);
      } else {
        const response = await api.post('/api/productos', productoPayload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Producto creado:', response.data);
      }

      // Actualizar la lista y limpiar el formulario
      await fetchProductos(); // Recargar la lista de productos
      resetForm(); // Limpiar el formulario

      // Mostrar mensaje de éxito
      alert(productoData.editing ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');

    } catch (error) {
      // Manejo detallado de errores
      console.error('Error completo:', error);
      console.error('Detalles del error:', {
        mensaje: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      setError(
        'Error al gestionar producto: ' +
        (error.response?.data?.message || error.message)
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleEditProducto = (producto) => {
    if (!['admin', 'super_admin'].includes(userRole)) {
      setError('No tienes permisos para realizar esta acción');
      return;
    }

    if (!canEditDelete(producto)) {
      setError('No tienes permisos para editar este producto');
      return;
    }

    setProductoData({
      ...productoData,
      editing: true,
      currentProductoId: producto._id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: producto.cantidad,
      showForm: true
    });
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

  useEffect(() => {
    if (productos.length > 0) {
      console.log('Estado actual de productos:', productos.map(p => ({
        id: p._id,
        nombre: p.nombre,
        creatorId: p.creatorId,
        userId: p.userId,
        currentUserId: user?.id,
        canEdit: canEditDelete(p),
        idsMatch: {
          creatorMatch: String(p.creatorId) === String(user?.id),
          userMatch: String(p.userId) === String(user?.id)
        }
      })));
    }
  }, [productos, user]);


  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : productos.length === 0 ? (
          <p className="text-center text-gray-500">No hay productos disponibles</p>
        ) : (          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {productosAmostrar.map((producto) => (
              <div 
                key={producto._id} 
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full"
              >
                {/* Cabecera de la tarjeta */}
                <div className="p-4 relative">
                  {producto.creatorInfo?.role === 'super_admin' && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-block px-2 py-1 bg-gradient-to-r from-purple-600 to-purple-400 text-white text-xs rounded-lg shadow-sm">
                        Super Admin
                      </span>
                    </div>
                  )}
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-1">{producto.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      Creado por: {producto.creatorName || 'Desconocido'}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    S/ {parseFloat(producto.precio).toFixed(2)}
                  </p>
                </div>

                {/* Línea divisoria con gradiente */}
                <div className="h-px bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100"></div>

                {/* Contenido y estadísticas */}
                <div className="p-4 flex-grow">
                  <div className="flex justify-between mb-4">
                    <div className="text-center flex-1">
                      <span className="text-sm text-gray-500 block mb-1">Stock Total</span>
                      <span className="text-xl font-bold text-gray-800">{producto.cantidad}</span>
                    </div>
                    <div className="w-px bg-gray-100"></div>
                    <div className="text-center flex-1">
                      <span className="text-sm text-gray-500 block mb-1">Disponible</span>
                      <span className={`text-xl font-bold ${
                        producto.cantidadRestante <= 5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {producto.cantidadRestante}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-500">Stock usado</span>
                      <span className="font-medium text-gray-800">
                        {Math.round((producto.cantidad - producto.cantidadRestante) / producto.cantidad * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all ${
                          producto.cantidadRestante <= 5 
                            ? 'bg-gradient-to-r from-red-500 to-red-400' 
                            : 'bg-gradient-to-r from-green-500 to-green-400'
                        }`}
                        style={{
                          width: `${((producto.cantidad - producto.cantidadRestante) / producto.cantidad) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {canEditDelete(producto) ? (
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEditProducto(producto)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white text-blue-600 
                                 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors text-sm font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProducto(producto._id)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white text-red-600 
                                 rounded-lg border border-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : userRole === 'admin' && producto.creatorInfo?.role === 'super_admin' && (
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-500 italic text-center">
                      No puedes modificar productos de Super Admin
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
              {/* Mostrar productos terminados */}
        <h3 className="text-2xl font-semibold text-gray-800 mt-6">Productos Terminados</h3>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="px-6 py-2 border-b text-left">Nombre</th>
                <th className="px-6 py-2 border-b text-left">Cantidad</th>
                <th className="px-6 py-2 border-b text-left">Cantidad Vendida</th>
                <th className="px-6 py-2 border-b text-left">Costo</th>
                <th className="px-6 py-2 border-b text-left">Precio</th>
                <th className="px-6 py-2 border-b text-left">Fecha de Agotamiento</th>
              </tr>
            </thead>
            <tbody>
              {productosTerminadosPorPagina.map((producto) => (
                <tr key={producto._id} className="hover:bg-gray-100">
                  <td className="px-6 py-3 border-b">{producto.nombre}</td>
                  <td className="px-6 py-3 border-b">{producto.cantidad}</td>
                  <td className="px-6 py-3 border-b">{producto.cantidadVendida}</td>
                  <td className="px-6 py-3 border-b">S/ {producto.precioCompra}</td>
                  <td className="px-6 py-3 border-b">S/ {producto.precio}</td>
                  <td className="px-6 py-3 border-b">{producto.fechaAgotamiento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}

export default ProductoList;
