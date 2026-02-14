import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Package, Plus, Edit2, Trash2, Users, Search, X, FileSpreadsheet } from 'lucide-react';
import ProductCreationModal from './ProductCreationModal';
import InventarioHistorial from './InventarioHistorial';
import InventarioModal from './InventarioModal';
import { Dialog } from '@headlessui/react';
import CatalogoModal from './CatalogoModal';
import CategoryModal from './CategoryModal';
import BulkUploadModal from './BulkUploadModal';
import { movimientoUnificadoService } from '../../services/movimientoUnificadoService';
import api from '../../services/api';
import categoryService from '../../services/categoryService';
import useInventarioProducto from '../../hooks/useInventarioProducto';

function ProductoList({ userRole: propUserRole = 'user', hideHeader = false }) {
  const { getToken } = useAuth();
  const inventarioHook = useInventarioProducto();
  
  // Estado para el modal de inventario
  const [isInventarioModalOpen, setIsInventarioModalOpen] = useState(false);
  const [inventarioForm, setInventarioForm] = useState({
    productoId: '',
    cantidad: '',
    precio: '',
    lote: '',
    observaciones: '',
    proveedor: '',
    fechaVencimiento: '',
    catalogoProduccionId: '',
    cantidadProduccion: ''
  });
  const [catalogoProductos, setCatalogoProductos] = useState([]);

  // Cargar productos registrados para el selector (no productos del catálogo)
  useEffect(() => {
    const fetchProductosRegistrados = async () => {
      try {
        const token = await getToken();
        
        // Obtener productos ya registrados (que tienen categorías)
        const productosRes = await api.get('/api/productos', { headers: { Authorization: `Bearer ${token}` } });
        
        // Transformar productos registrados al formato esperado por el modal
        const productosParaModal = productosRes.data.map(producto => {
          // Verificar si el producto tiene catalogoProductoId válido
          if (!producto.catalogoProductoId) {
            console.warn(`[WARNING] Producto ${producto.nombre} (${producto.codigoProducto}) no tiene catalogoProductoId válido`);
          }
          
          return {
            _id: producto._id,
            codigoProducto: producto.codigoProducto,
            nombre: producto.nombre,
            categoria: producto.categoryId?.nombre || 'Sin categoría',
            catalogoProductoId: producto.catalogoProductoId, // No usar fallback
            // Información adicional que puede ser útil
            precio: producto.precio,
            cantidadRestante: producto.cantidadRestante
          };
        });
        

        
        setCatalogoProductos(productosParaModal);
      } catch (err) {
        console.error('Error al cargar productos registrados:', err);
        setCatalogoProductos([]);
      }
    };
    if (isInventarioModalOpen) fetchProductosRegistrados();
  }, [isInventarioModalOpen, getToken]);

  // Handler para registrar entrada de inventario
  const handleInventarioSubmit = async (e) => {
    e.preventDefault();
    inventarioHook.clearError();
    
    try {
      // Validar campos requeridos
      if (!inventarioForm.productoId || !inventarioForm.cantidad || !inventarioForm.precio) {
        throw new Error('Los campos Producto, Cantidad y Precio son obligatorios');
      }

      // Encontrar el producto seleccionado
      const productoSeleccionado = catalogoProductos.find(p => p._id === inventarioForm.productoId);
      if (!productoSeleccionado) {
        throw new Error('Producto no encontrado');
      }

      // Validar que el producto tiene ID válido
      if (!productoSeleccionado._id) {
        throw new Error(`El producto ${productoSeleccionado.nombre} no tiene un ID válido. Por favor, verifica la configuración del producto.`);
      }

      // Preparar datos para el nuevo endpoint
      const entradaData = {
        productoId: productoSeleccionado._id,
        cantidad: Number(inventarioForm.cantidad),
        precio: Number(inventarioForm.precio),
        lote: inventarioForm.lote || '',
        observaciones: inventarioForm.observaciones || '',
        proveedor: inventarioForm.proveedor || '',
        fechaVencimiento: inventarioForm.fechaVencimiento || null
      };

      // Crear entrada usando el hook
      const response = await inventarioHook.createEntry(entradaData);

      // === REGISTRAR TAMBIÉN EN PRODUCCIÓN SI ESTÁ ACTIVO ===
      // Leer datos de producción del evento (pasados desde InventarioModal)
      const datosProduccionEvento = e._datosProduccion;
      
      if (datosProduccionEvento) {
        try {
          const { catalogoProduccionId, cantidadProduccion, recetasCalculadas, tieneFormula } = datosProduccionEvento;
          
          const datosProduccion = {
            tipoProducto: 'produccion',
            productoId: catalogoProduccionId,
            cantidad: cantidadProduccion,
            operador: user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Usuario',
            motivo: tieneFormula 
              ? 'Entrada desde inventario de ventas (registro simultáneo con consumo de recetas)'
              : 'Entrada desde inventario de ventas (registro simultáneo)',
            observaciones: `Registrado junto con entrada de venta: ${inventarioForm.cantidad} unidades. ${inventarioForm.observaciones || ''}`.trim(),
            costoTotal: 0,
            ingredientesUtilizados: [],
            recetasUtilizadas: recetasCalculadas,
            consumirRecursos: tieneFormula // Solo consumir si hay fórmula
          };
          await movimientoUnificadoService.agregarCantidad(datosProduccion);
        } catch (prodError) {
          console.error('⚠️ Error al registrar en producción (la entrada de venta sí se guardó):', prodError);
          // No lanzamos error aquí para no perder la entrada de venta que ya se guardó
        }
      }
      
      // Cerrar modal y limpiar formulario
      setIsInventarioModalOpen(false);
      setInventarioForm({
        productoId: '',
        cantidad: '',
        precio: '',
        lote: '',
        observaciones: '',
        proveedor: '',
        fechaVencimiento: '',
        catalogoProduccionId: '',
        cantidadProduccion: ''
      });

      // Refrescar datos
      await Promise.all([
        fetchProductos(),
        refrescarHistorial()
      ]);
      
    } catch (err) {
      console.error('Error al registrar entrada:', err);
      // El error ya está manejado en el hook
    }
  };

  // Función para cerrar el modal de inventario y limpiar formulario
  const handleCloseInventarioModal = () => {
    setIsInventarioModalOpen(false);
    setInventarioForm({
      productoId: '',
      cantidad: '',
      precio: '',
      lote: '',
      observaciones: '',
      proveedor: '',
      fechaVencimiento: '',
      catalogoProduccionId: '',
      cantidadProduccion: ''
    });
    inventarioHook.clearError();
  };

  // Función de callback cuando se actualiza una categoría (opcional, el modal ya maneja todo internamente)
  const handleCategoryModalSubmit = async (formData) => {
    // El modal ya maneja la creación/edición internamente
    // Este callback es opcional para cualquier lógica adicional
    console.log('Categoría actualizada:', formData);
    
    // Podrías refrescar datos relacionados aquí si fuera necesario
    // await fetchProductos();
  };
  const { user } = useUser();
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Usar directamente el rol pasado como prop, con fallback solo si es necesario
  const userRole = propUserRole || 'user';
  
  // Verificar si es admin o super_admin
  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';
  
  // Verificar si es super_admin (solo para mostrar columna de acciones)
  const isSuperAdmin = userRole === 'super_admin';
  
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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCatalogoModalOpen, setIsCatalogoModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria: '',
    stock: 'todos' // 'todos', 'conStock', 'sinStock'
  });
  const [categorias, setCategorias] = useState([]);
  
  const productosPorPagina = 24;
  
  // Función para filtrar productos
  const productosFiltrados = productos.filter(producto => {
    // Filtro por búsqueda (nombre del producto)
    const cumpleBusqueda = producto.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    // Filtro por categoría
    const cumpleCategoria = !filtros.categoria || producto.categoryId?._id === filtros.categoria;
    
    // Filtro por stock
    let cumpleStock = true;
    if (filtros.stock === 'conStock') {
      cumpleStock = (producto.cantidadRestante || 0) > 0;
    } else if (filtros.stock === 'sinStock') {
      cumpleStock = (producto.cantidadRestante || 0) === 0;
    }
    
    return cumpleBusqueda && cumpleCategoria && cumpleStock;
  });
  
  const productosAmostrar = productosFiltrados.slice(0, productosPorPagina);
  const [paginaTerminados, setPaginaTerminados] = useState(1);
  const productosPorPaginaTerminados = 10;
  const productosTerminadosPorPagina = productosTerminados.slice(
    (paginaTerminados - 1) * productosPorPaginaTerminados,
    paginaTerminados * productosPorPaginaTerminados
  );

  // Estado para historial de entradas de inventario
  const [historialEntradas, setHistorialEntradas] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  // Consultar historial de entradas al montar el componente
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setHistorialLoading(true);
        const historial = await inventarioHook.getAllEntries();
        setHistorialEntradas(Array.isArray(historial) ? historial : []);
      } catch (err) {
        console.error('Error al obtener historial:', err);
        setHistorialEntradas([]);
      } finally {
        setHistorialLoading(false);
      }
    };
    fetchHistorial();
  }, [getToken]);

  // Función para refrescar el historial
  const refrescarHistorial = async () => {
    try {
      setHistorialLoading(true);
      const historial = await inventarioHook.getAllEntries();
      setHistorialEntradas(Array.isArray(historial) ? historial : []);
    } catch (err) {
      console.error('Error al refrescar historial:', err);
      setHistorialEntradas([]);
    } finally {
      setHistorialLoading(false);
    }
  };

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

  // Funciones para manejar filtros
  const handleFiltroChange = (tipo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [tipo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      categoria: '',
      stock: 'todos'
    });
  };

  // Función para normalizar nombres
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

      // Mostrar todos los productos sin filtrar por stock
      setProductos(productosData);
      setProductosTerminados([]); // Limpiar productos terminados ya que ahora mostramos todos juntos
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

  // Cargar categorías para el filtro
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const categoriasData = await categoryService.getAllCategories();
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        setCategorias([]);
      }
    };
    fetchCategorias();
  }, []);

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



  return (
    <div className="container mx-auto px-4 py-8">
      {/* Modal para registrar entrada/lote de inventario */}
      <InventarioModal
        isOpen={isInventarioModalOpen}
        onClose={handleCloseInventarioModal}
        inventarioForm={inventarioForm}
        setInventarioForm={setInventarioForm}
        inventarioError={inventarioHook.error}
        inventarioLoading={inventarioHook.loading}
        catalogoProductos={catalogoProductos}
        handleInventarioSubmit={handleInventarioSubmit}
      />
      
      {/* 🎯 OPTIMIZADO: Header mejorado con contador integrado y botones reorganizados */}
      <div className="mb-8">
        {/* Título principal con contador de productos */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800">Gestión de Productos</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {productosFiltrados.length} de {productos.length} productos
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Administra los productos de tu organización
              </p>
            </div>
          </div>
          
      
        </div>

        {/* Botones de acción reorganizados debajo del título */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCatalogoModalOpen(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Ver / Agregar Catálogo</span>
            <span className="sm:hidden">Catálogo</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Ver / Agregar Categorías</span>
            <span className="sm:hidden">Categorías</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Agregar Producto</span>
            <span className="sm:hidden">Producto</span>
          </button>

          {/* Botón Importar Masivo (solo para admin) */}
          {isAdminUser && (
            <button
              onClick={() => setIsBulkUploadModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg transform hover:scale-105"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">Importar Masivo</span>
              <span className="sm:hidden">Excel</span>
            </button>
          )}

          {/* Botón registrar entrada (solo para admin) */}
          {isAdminUser && (
            <button
              onClick={() => setIsInventarioModalOpen(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Registrar Entrada/Lote</span>
              <span className="sm:hidden">Entrada</span>
            </button>
          )}
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

      {/* Modal de catálogo */}
      <CatalogoModal
        open={isCatalogoModalOpen}
        onClose={() => setIsCatalogoModalOpen(false)}
      />
      {/* Modal de categorías */}
      <CategoryModal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategoryModalSubmit}
      />

      {/* Modal de carga masiva */}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={async () => {
          await fetchProductos();
          console.log('Productos actualizados tras importación masiva');
        }}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {/* 🎯 OPTIMIZADO: Filtros súper compactos - solo esenciales */}
      <div className="bg-orange-100 p-3 rounded-lg mb-6 border border-orange-200">
        <h3 className="text-center text-base font-semibold text-orange-800 mb-3">
          Selecciona tus productos favoritos para crear una venta
        </h3>
        
        {/* Grid responsivo para filtros - máximo 2 filas, solo elementos esenciales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          {/* Campo de búsqueda */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar productos"
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filtro por categoría */}
          <div>
            <select
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria._id} value={categoria._id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por stock - sin checkbox ni botón limpiar */}
          <div>
            <select
              value={filtros.stock}
              onChange={(e) => handleFiltroChange('stock', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
            >
              <option value="todos">Todos los productos</option>
              <option value="conStock">Solo con stock</option>
              <option value="sinStock">Sin stock</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Mensaje cuando no hay productos filtrados */}
          {productosFiltrados.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600">
                  No hay productos que coincidan con los filtros seleccionados.
                </p>
                <button
                  onClick={limpiarFiltros}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <X size={16} className="mr-2" />
                  Limpiar filtros
                </button>
              </div>
            </div>
          ) : (
            <>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  {isSuperAdmin && (
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{producto.categoryId?.nombre || 'Sin categoría'}</td>
                    {isSuperAdmin && (
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canEditDelete(producto) && (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEditProducto(producto)}
                              className="inline-flex items-center p-2 rounded-md text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200"
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProducto(producto._id)}
                              className="inline-flex items-center p-2 rounded-md text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* 🎯 OPTIMIZADO: Cards móviles compactas - 1 fila por producto */}
            <div className="sm:hidden flex flex-col gap-2 p-2">
              {productosAmostrar.map((producto) => (
                <div key={producto._id} className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                  {/* Fila principal con toda la información */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Nombre del producto y badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {producto.nombre}
                        </span>
                        {producto.creatorInfo?.role === 'super_admin' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                            SA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Información compacta en línea */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                      {/* Stock */}
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{producto.cantidadRestante || 0}</span>
                        <span className="text-gray-400">u</span>
                      </span>
                      
                      {/* Precio */}
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-green-600">S/ {parseFloat(producto.precio).toFixed(2)}</span>
                      </span>
                      
                      {/* Categoría */}
                      <span className="hidden xs:flex items-center gap-1 max-w-20 truncate">
                        <span className="font-medium">{producto.categoryId?.nombre || 'Sin cat.'}</span>
                      </span>

                      {/* Botones de acción - solo iconos */}
                      {isSuperAdmin && canEditDelete(producto) && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditProducto(producto)}
                            className="p-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteProducto(producto._id)}
                            className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información adicional solo visible en pantallas muy pequeñas */}
                  <div className="xs:hidden mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      <span>Cat: {producto.categoryId?.nombre || 'Sin categoría'}</span>
                      <span className="ml-3">Total: {producto.cantidad || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historial de entradas de inventario */}
          <InventarioHistorial 
            historialEntradas={historialEntradas} 
            loading={historialLoading}
            userRole={userRole}
            onRefresh={refrescarHistorial}
            onEdit={async (id, data) => {
              try {
                await inventarioHook.updateEntry(id, data);
                await refrescarHistorial();
                await fetchProductos();
              } catch (err) {
                console.error('Error al editar entrada:', err);
              }
            }}
            onDelete={async (id) => {
              try {
                await inventarioHook.deleteEntry(id);
                await refrescarHistorial();
                await fetchProductos();
              } catch (err) {
                console.error('Error al eliminar entrada:', err);
              }
            }}
          />
          </>
          )}

        </div>
      )}
    </div>
  );
}

export default ProductoList;
