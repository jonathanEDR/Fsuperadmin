import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Search, Filter, ShoppingCart, ShoppingBag, X, Plus, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCardCatalogo from './ProductCardCatalogo';
import FiltrosCatalogo from './FiltrosCatalogo';
import CarritoFlotante from './CarritoFlotante';

const CatalogoVentasPageView = ({ userRole = 'user' }) => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  // Función para obtener la ruta de ventas según el rol
  const getVentasRoute = () => {
    switch (userRole) {
      case 'super_admin':
        return '/super-admin/ventas';
      case 'admin':
        return '/admin/ventas';
      case 'user':
        return '/user/ventas';
      default:
        return '/user/ventas'; // fallback para usuarios normales
    }
  };
  
  // Estados principales
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria: '',
    ordenarPor: 'nombre',
    soloConStock: true,
    direccionOrden: 'asc'
  });
  
  // Estado para el carrito flotante
  const [vistaCarrito, setVistaCarrito] = useState(false);
  const [cargandoProducto, setCargandoProducto] = useState(null);

  // Estados para modo de venta
  const [modoVenta, setModoVenta] = useState('nueva');
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [loadingVentas, setLoadingVentas] = useState(false);

  // Responsive states
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Cargar productos y categorías en paralelo
      const [productosRes, categoriasRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/productos`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!productosRes.ok || !categoriasRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const [productosData, categoriasData] = await Promise.all([
        productosRes.json(),
        categoriasRes.json()
      ]);

      setProductos(productosData || []);
      setCategorias(categoriasData || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar productos
  const productosDisponibles = useMemo(() => {
    return productos.filter(producto => {
      // Filtro de stock
      if (filtros.soloConStock && producto.cantidadRestante <= 0) return false;
      
      // Filtro de búsqueda
      if (filtros.busqueda) {
        const searchLower = filtros.busqueda.toLowerCase();
        const matchName = producto.nombre?.toLowerCase().includes(searchLower);
        const matchCode = producto.codigoProducto?.toLowerCase().includes(searchLower);
        if (!matchName && !matchCode) return false;
      }
      
      // Filtro de categoría
      if (filtros.categoria && filtros.categoria !== '') {
        const matchesCategoryId = producto.categoryId && producto.categoryId.toString() === filtros.categoria;
        const matchesCategoryName = producto.categoryName && 
          categorias.find(cat => cat._id === filtros.categoria && cat.nombre === producto.categoryName);
        
        if (!matchesCategoryId && !matchesCategoryName) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      
      switch (filtros.ordenarPor) {
        case 'precio':
          comparison = (a.precio || 0) - (b.precio || 0);
          break;
        case 'stock':
          comparison = (a.cantidadRestante || 0) - (b.cantidadRestante || 0);
          break;
        case 'categoria':
          comparison = (a.categoryName || '').localeCompare(b.categoryName || '');
          break;
        default: // nombre
          comparison = (a.nombre || '').localeCompare(b.nombre || '');
      }
      
      return filtros.direccionOrden === 'desc' ? -comparison : comparison;
    });
  }, [productos, filtros, categorias]);

  // Calcular total del carrito
  const totalCarrito = useMemo(() => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  }, [carrito]);

  // Agregar producto al carrito
  const agregarAlCarrito = async (producto) => {
    setCargandoProducto(producto._id);
    
    try {
      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const itemExistente = carrito.find(item => item.productoId === producto._id);
      
      if (itemExistente) {
        setCarrito(carrito.map(item =>
          item.productoId === producto._id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precioUnitario }
            : item
        ));
      } else {
        const nuevoItem = {
          productoId: producto._id,
          nombre: producto.nombre,
          codigoProducto: producto.codigoProducto,
          precioUnitario: producto.precio,
          cantidad: 1,
          subtotal: producto.precio,
          stock: producto.cantidadRestante
        };
        setCarrito([...carrito, nuevoItem]);
      }
    } finally {
      setCargandoProducto(null);
    }
  };

  // Actualizar cantidad en carrito
  const actualizarCantidadCarrito = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }
    
    setCarrito(carrito.map(item =>
      item.productoId === productoId
        ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precioUnitario }
        : item
    ));
  };

  // Eliminar producto del carrito
  const eliminarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(item => item.productoId !== productoId));
  };

  // Limpiar carrito
  const limpiarCarrito = () => {
    setCarrito([]);
  };

  // Cargar ventas pendientes para modo "agregar a existente"
  const cargarVentasPendientes = async () => {
    setLoadingVentas(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ventas?page=1&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Error al cargar ventas');
      const data = await response.json();
      const todasVentas = data.ventas || data;
      // Solo ventas con estado de pago pendiente y no finalizadas
      const pendientes = todasVentas.filter(v =>
        v.estadoPago !== 'Pagado' && v.estadoVenta !== 'finalizada'
      );
      setVentasPendientes(pendientes);
    } catch (err) {
      console.error('Error al cargar ventas pendientes:', err);
      setError('Error al cargar ventas pendientes');
    } finally {
      setLoadingVentas(false);
    }
  };

  // Cambiar modo de venta
  const handleModoChange = (modo) => {
    setModoVenta(modo);
    setVentaSeleccionada(null);
    setError('');
    // Cargar ventas pendientes solo la primera vez que se cambia al modo existente
    if (modo === 'existente' && ventasPendientes.length === 0) {
      cargarVentasPendientes();
    }
  };
  const handleConfirmarVenta = async () => {
    if (carrito.length === 0) {
      setError('Agrega al menos un producto al carrito');
      return;
    }
    if (modoVenta === 'existente' && !ventaSeleccionada) {
      setError('Selecciona una venta existente a la que agregar los productos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getToken();

      if (modoVenta === 'existente') {
        // Agregar cada producto del carrito a la venta seleccionada
        for (const item of carrito) {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/ventas/${ventaSeleccionada}/productos`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                productoId: item.productoId,
                cantidad: item.cantidad
              })
            }
          );
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || `Error al agregar "${item.nombre}"`);
          }
        }
      } else {
        // Crear una nueva venta con todos los productos
        const ventaData = {
          productos: carrito.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal
          })),
          fechadeVenta: new Date().toISOString(),
          montoTotal: totalCarrito,
          estadoPago: 'Pendiente',
          cantidadPagada: 0
        };

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(ventaData)
        });

        if (!response.ok) {
          throw new Error('Error al crear la venta');
        }
      }

      // Limpiar estado y navegar
      limpiarCarrito();
      setVistaCarrito(false);
      setModoVenta('nueva');
      setVentaSeleccionada(null);
      navigate(getVentasRoute());

    } catch (err) {
      console.error('Error al confirmar venta:', err);
      setError(err.message || 'Error al confirmar la venta');
    } finally {
      setLoading(false);
    }
  };

  // Calcular dimensiones responsivas
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(getVentasRoute())}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title="Volver a ventas"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ShoppingBag size={20} className="text-blue-600" /> Catálogo de Productos</h1>
                <p className="text-sm text-gray-600">
                  {productosDisponibles.length} productos disponibles
                </p>
              </div>
            </div>
            
            {/* Contador del carrito */}
            <button
              onClick={() => setVistaCarrito(!vistaCarrito)}
              className="relative p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-lg"
            >
              <ShoppingCart size={20} />
              {carrito.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {carrito.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtros */}
        <div className="mb-6">
          <FiltrosCatalogo
            filtros={filtros}
            onFiltrosChange={setFiltros}
            categorias={categorias}
            totalProductos={productosDisponibles.length}
            compactMode={false}
            isMobile={windowSize.width < 768}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </p>
          </div>
        )}

        {/* Grid de productos */}
        <div className="flex gap-6">
          {/* Panel de productos */}
          <div className={`${vistaCarrito && isDesktop ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 size={48} className="animate-spin text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando productos...</p>
                </div>
              </div>
            ) : productosDisponibles.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 text-lg mb-2">No hay productos disponibles</p>
                  <p className="text-gray-500 text-sm">Ajusta los filtros para ver más productos</p>
                </div>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                isMobile 
                  ? 'grid-cols-1' 
                  : isTablet 
                    ? 'grid-cols-2' 
                    : vistaCarrito && isDesktop
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
              }`}>
                {productosDisponibles.map(producto => (
                  <ProductCardCatalogo
                    key={producto._id}
                    producto={producto}
                    onAgregarCarrito={agregarAlCarrito}
                    cargando={cargandoProducto === producto._id}
                    yaEnCarrito={carrito.some(item => item.productoId === producto._id)}
                    cantidadEnCarrito={carrito.find(item => item.productoId === producto._id)?.cantidad || 0}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Panel del carrito (desktop) */}
          {vistaCarrito && isDesktop && (
            <div className="w-1/3">
              <CarritoFlotante
                carrito={carrito}
                totalCarrito={totalCarrito}
                onActualizarCantidad={actualizarCantidadCarrito}
                onEliminarProducto={eliminarDelCarrito}
                onLimpiarCarrito={limpiarCarrito}
                onConfirmarVenta={handleConfirmarVenta}
                onCerrar={() => setVistaCarrito(false)}
                modoVenta={modoVenta}
                onModoChange={handleModoChange}
                ventasPendientes={ventasPendientes}
                ventaSeleccionada={ventaSeleccionada}
                onVentaSeleccionada={setVentaSeleccionada}
                loadingVentas={loadingVentas}
              />
            </div>
          )}
        </div>

        {/* Carrito flotante (móvil y tablet) */}
        {vistaCarrito && !isDesktop && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-xl shadow-2xl">
              <CarritoFlotante
                carrito={carrito}
                totalCarrito={totalCarrito}
                onActualizarCantidad={actualizarCantidadCarrito}
                onEliminarProducto={eliminarDelCarrito}
                onLimpiarCarrito={limpiarCarrito}
                onConfirmarVenta={handleConfirmarVenta}
                onCerrar={() => setVistaCarrito(false)}
                modoVenta={modoVenta}
                onModoChange={handleModoChange}
                ventasPendientes={ventasPendientes}
                ventaSeleccionada={ventaSeleccionada}
                onVentaSeleccionada={setVentaSeleccionada}
                loadingVentas={loadingVentas}
              />
            </div>
          </div>
        )}

        {/* Footer con resumen del carrito */}
        {carrito.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 shadow-2xl z-40 border-t border-blue-500">
            <div className="max-w-7xl mx-auto p-3 sm:p-4">
              {/* Layout móvil y desktop */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                {/* Info del carrito */}
                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
                  <span className="text-white text-xs sm:text-sm font-medium">
                    {carrito.length} producto{carrito.length !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-white text-sm sm:text-lg">
                    Total: S/ {totalCarrito.toFixed(2)}
                  </span>
                </div>
                
                {/* Botones - Verticales en móvil, horizontales en desktop */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {!vistaCarrito && (
                    <button
                      onClick={() => setVistaCarrito(true)}
                      className="bg-white/30 backdrop-blur-sm text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-white/40 transition-all border-2 border-white font-bold shadow-md text-sm sm:text-base"
                    >
                      Ver Carrito
                    </button>
                  )}
                  <button
                    onClick={handleConfirmarVenta}
                    className="bg-white text-blue-600 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl hover:bg-blue-50 transition-all font-bold shadow-lg flex items-center justify-center gap-2 border-2 border-white text-sm sm:text-base"
                  >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                    Confirmar Venta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogoVentasPageView;
