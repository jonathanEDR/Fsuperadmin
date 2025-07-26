import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Search, Filter, ShoppingCart, X, Plus, AlertCircle } from 'lucide-react';
import ProductCardCatalogo from './ProductCardCatalogo';
import FiltrosCatalogo from './FiltrosCatalogo';
import CarritoFlotante from './CarritoFlotante';

const CatalogoVentas = ({ 
  isOpen, 
  onClose, 
  onConfirmarVenta,
  userRole = 'user'
}) => {
  const { getToken } = useAuth();
  
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
    soloConStock: true,
    ordenarPor: 'nombre' // nombre, precio, stock
  });
  
  // Estados de UI
  const [vistaCarrito, setVistaCarrito] = useState(false);
  const [cargandoProducto, setCargandoProducto] = useState(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  // Manejar resize de ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      cargarDatosIniciales();
    }
  }, [isOpen]);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    setError('');
    
    try {
      await Promise.all([
        cargarProductos(),
        cargarCategorias()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
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
      
      // Filtrar solo productos activos
      const productosActivos = data.filter(producto => 
        producto.activo && 
        producto.status === 'activo' &&
        producto.precio > 0
      );
      
      setProductos(productosActivos);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      throw error;
    }
  };

  const cargarCategorias = async () => {
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar categorías');
      }

      const data = await response.json();
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      throw error;
    }
  };

  // Productos filtrados y ordenados
  const productosDisponibles = useMemo(() => {
    let productosFiltrados = [...productos];

    // Filtro por búsqueda
    if (filtros.busqueda.trim()) {
      const busqueda = filtros.busqueda.toLowerCase().trim();
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda) ||
        producto.codigoProducto.toLowerCase().includes(busqueda) ||
        (producto.categoryName && producto.categoryName.toLowerCase().includes(busqueda))
      );
    }

    // Filtro por categoría
    if (filtros.categoria) {
      productosFiltrados = productosFiltrados.filter(producto => {
        const matchesCategoryId = producto.categoryId && 
          producto.categoryId.toString() === filtros.categoria;
        const matchesCategoryName = producto.categoryName && 
          categorias.find(cat => 
            cat._id === filtros.categoria && 
            cat.nombre === producto.categoryName
          );
        return matchesCategoryId || matchesCategoryName;
      });
    }

    // Filtro por stock
    if (filtros.soloConStock) {
      productosFiltrados = productosFiltrados.filter(producto => 
        (producto.cantidadRestante || 0) > 0
      );
    }

    // Ordenamiento
    productosFiltrados.sort((a, b) => {
      switch (filtros.ordenarPor) {
        case 'precio':
          return a.precio - b.precio;
        case 'stock':
          return (b.cantidadRestante || 0) - (a.cantidadRestante || 0);
        case 'nombre':
        default:
          return a.nombre.localeCompare(b.nombre);
      }
    });

    return productosFiltrados;
  }, [productos, filtros, categorias]);

  // Funciones del carrito
  const agregarAlCarrito = async (producto, cantidad) => {
    setCargandoProducto(producto._id);
    
    try {
      // Verificar stock disponible
      if (cantidad > producto.cantidadRestante) {
        throw new Error(`Solo hay ${producto.cantidadRestante} unidades disponibles`);
      }

      // Verificar si el producto ya está en el carrito
      const productoExistente = carrito.find(item => item.productoId === producto._id);
      
      if (productoExistente) {
        const nuevaCantidadTotal = productoExistente.cantidad + cantidad;
        
        if (nuevaCantidadTotal > producto.cantidadRestante) {
          throw new Error(`Solo puedes agregar ${producto.cantidadRestante - productoExistente.cantidad} unidades más`);
        }

        // Actualizar cantidad existente
        setCarrito(prevCarrito =>
          prevCarrito.map(item =>
            item.productoId === producto._id
              ? {
                  ...item,
                  cantidad: nuevaCantidadTotal,
                  subtotal: producto.precio * nuevaCantidadTotal
                }
              : item
          )
        );
      } else {
        // Agregar nuevo producto
        const nuevoItem = {
          productoId: producto._id,
          nombre: producto.nombre,
          codigoProducto: producto.codigoProducto,
          cantidad: cantidad,
          precioUnitario: producto.precio,
          subtotal: producto.precio * cantidad,
          categoryName: producto.categoryName,
          stockDisponible: producto.cantidadRestante
        };

        setCarrito(prevCarrito => [...prevCarrito, nuevoItem]);
      }

      // Mostrar feedback visual
      setError('');
    } catch (error) {
      setError(error.message);
    } finally {
      setCargandoProducto(null);
    }
  };

  const actualizarCantidadCarrito = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }

    const producto = productos.find(p => p._id === productoId);
    if (!producto) return;

    if (nuevaCantidad > producto.cantidadRestante) {
      setError(`Solo hay ${producto.cantidadRestante} unidades disponibles`);
      return;
    }

    setCarrito(prevCarrito =>
      prevCarrito.map(item =>
        item.productoId === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: item.precioUnitario * nuevaCantidad
            }
          : item
      )
    );
    setError('');
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito(prevCarrito => 
      prevCarrito.filter(item => item.productoId !== productoId)
    );
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setError('');
  };

  // Calcular total del carrito
  const totalCarrito = useMemo(() => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  }, [carrito]);

  const handleClose = () => {
    limpiarCarrito();
    setFiltros({
      busqueda: '',
      categoria: '',
      soloConStock: true,
      ordenarPor: 'nombre'
    });
    setError('');
    setVistaCarrito(false);
    onClose();
  };

  const handleConfirmarVenta = () => {
    if (carrito.length === 0) {
      setError('Agrega al menos un producto al carrito');
      return;
    }

    // Pasar el carrito al componente padre para procesar la venta
    onConfirmarVenta(carrito);
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  // Calcular dimensiones basado en el estado del window size
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '8px' : '16px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        style={{ 
          width: isMobile ? '100%' : isTablet ? '90%' : '85%',
          height: isMobile ? '100%' : isTablet ? '90%' : '85%',
          maxWidth: '1400px',
          maxHeight: '900px',
          backgroundColor: '#1f2937',
          backgroundImage: 'linear-gradient(to bottom right, #1f2937, #111827)',
          borderRadius: isMobile ? '8px' : '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #374151',
          position: 'relative'
        }}
      >
        {/* Header optimizado con filtros integrados */}
        <div 
          style={{
            background: 'linear-gradient(to right, #f97316, #fbbf24, #facc15)',
            padding: isMobile ? '16px 12px' : '20px 24px',
            textAlign: 'center',
            position: 'relative',
            flexShrink: 0
          }}
        >
          {/* Botones de acción del header */}
          <div 
            style={{
              position: 'absolute',
              top: isMobile ? '8px' : '12px',
              right: isMobile ? '8px' : '16px',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '6px' : '8px',
              zIndex: 10
            }}
          >
            {/* Contador del carrito */}
            <button
              onClick={() => setVistaCarrito(!vistaCarrito)}
              style={{
                position: 'relative',
                padding: isMobile ? '6px' : '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(4px)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingCart size={14} />
              {carrito.length > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#f97316',
                    color: 'white',
                    fontSize: '10px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    border: '2px solid white'
                  }}
                >
                  {carrito.length}
                </span>
              )}
            </button>
            
            <button 
              onClick={handleClose}
              style={{
                padding: isMobile ? '6px' : '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(4px)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Contenido del header optimizado con filtros integrados */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Título y contador en una línea */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}
            >
              <h1 
                style={{
                  fontSize: isMobile ? '18px' : isTablet ? '24px' : '28px',
                  lineHeight: '1.1',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0
                }}
              >
                🍕 CATÁLOGO DE PRODUCTOS
              </h1>
              
              <div 
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  borderRadius: '20px',
                  color: '#1f2937',
                  padding: isMobile ? '4px 12px' : '6px 16px',
                  fontSize: isMobile ? '11px' : '13px',
                  fontWeight: 'bold',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                {productosDisponibles.length} productos
              </div>
            </div>
            
            <p 
              style={{
                fontSize: isMobile ? '12px' : '14px',
                color: '#374151',
                fontWeight: '500',
                margin: '0 0 12px 0'
              }}
            >
              Selecciona tus productos favoritos para crear una venta
            </p>

            {/* Filtros integrados en el header */}
            <div 
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '8px' : '12px',
                justifyContent: 'center'
              }}
            >
              <FiltrosCatalogo
                filtros={filtros}
                onFiltrosChange={setFiltros}
                categorias={categorias}
                totalProductos={productosDisponibles.length}
                compactMode={true}
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div 
            style={{
              margin: isMobile ? '12px' : '24px 24px 16px 24px',
              padding: isMobile ? '8px 12px' : '12px 16px',
              backgroundColor: 'rgba(185, 28, 28, 0.5)',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              flexShrink: 0
            }}
          >
            <p 
              style={{
                color: '#fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: isMobile ? '12px' : '14px',
                margin: 0
              }}
            >
              <AlertCircle size={14} />
              {error}
            </p>
          </div>
        )}

        {/* Contenido principal */}
        <div 
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            minHeight: 0
          }}
        >
          {/* Panel izquierdo - Solo productos */}
          <div 
            style={{
              flex: 1,
              width: vistaCarrito && isDesktop ? '66.666667%' : '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            {/* Grid de productos - Ahora con más espacio */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: isMobile ? '16px' : '24px',
                background: 'linear-gradient(to bottom right, #111827, #1f2937)'
              }}
            >
              {loading ? (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '256px'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div 
                      style={{
                        width: isMobile ? '32px' : '48px',
                        height: isMobile ? '32px' : '48px',
                        border: '4px solid #f97316',
                        borderTop: '4px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                      }}
                    ></div>
                    <p 
                      style={{
                        color: '#d1d5db',
                        fontSize: isMobile ? '14px' : '16px',
                        margin: 0
                      }}
                    >
                      Cargando productos...
                    </p>
                  </div>
                </div>
              ) : productosDisponibles.length === 0 ? (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '256px'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <ShoppingCart 
                      color="#4b5563"
                      size={isMobile ? 48 : 64}
                      style={{ margin: '0 auto 16px', display: 'block' }}
                    />
                    <p 
                      style={{
                        color: '#d1d5db',
                        fontSize: isMobile ? '16px' : '18px',
                        margin: '0 0 8px 0'
                      }}
                    >
                      No hay productos disponibles
                    </p>
                    <p 
                      style={{
                        color: '#6b7280',
                        fontSize: isMobile ? '12px' : '14px',
                        margin: 0
                      }}
                    >
                      Ajusta los filtros para ver más productos
                    </p>
                  </div>
                </div>
              ) : (
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile 
                      ? '1fr' 
                      : isTablet 
                        ? 'repeat(2, 1fr)' 
                        : vistaCarrito && isDesktop
                          ? 'repeat(2, 1fr)'
                          : 'repeat(3, 1fr)',
                    gap: isMobile ? '8px' : '12px',
                    alignItems: 'start'
                  }}
                >
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
          </div>

          {/* Panel derecho - Carrito */}
          {vistaCarrito && (
            <div 
              style={{
                width: isDesktop ? '33.333333%' : '100%',
                position: isDesktop ? 'relative' : 'absolute',
                top: isDesktop ? 'auto' : 0,
                left: isDesktop ? 'auto' : 0,
                right: isDesktop ? 'auto' : 0,
                bottom: isDesktop ? 'auto' : 0,
                zIndex: isDesktop ? 'auto' : 20,
                backgroundColor: isDesktop ? 'transparent' : 'rgba(0, 0, 0, 0.5)'
              }}
            >
              <CarritoFlotante
                carrito={carrito}
                totalCarrito={totalCarrito}
                onActualizarCantidad={actualizarCantidadCarrito}
                onEliminarProducto={eliminarDelCarrito}
                onLimpiarCarrito={limpiarCarrito}
                onConfirmarVenta={handleConfirmarVenta}
                onCerrar={() => setVistaCarrito(false)}
              />
            </div>
          )}
        </div>

        {/* Footer con acciones - nuevo diseño responsivo */}
        {!vistaCarrito && carrito.length > 0 && (
          <div 
            className="bg-gradient-to-r from-orange-500 to-yellow-400"
            style={{
              padding: window.innerWidth < 640 ? '12px' : '16px 24px',
              flexShrink: 0
            }}
          >
            <div 
              style={{
                display: 'flex',
                flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: window.innerWidth < 640 ? '12px' : '0'
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                  alignItems: 'center',
                  gap: window.innerWidth < 640 ? '8px' : '16px'
                }}
              >
                <span 
                  className="text-gray-900 font-medium"
                  style={{
                    fontSize: window.innerWidth < 640 ? '12px' : '14px'
                  }}
                >
                  {carrito.length} producto{carrito.length !== 1 ? 's' : ''} en el carrito
                </span>
                <span 
                  className="font-bold text-gray-900"
                  style={{
                    fontSize: window.innerWidth < 640 ? '16px' : '18px'
                  }}
                >
                  Total: S/ {totalCarrito.toFixed(2)}
                </span>
              </div>
              
              <div 
                style={{
                  display: 'flex',
                  gap: window.innerWidth < 640 ? '8px' : '12px',
                  width: window.innerWidth < 640 ? '100%' : 'auto'
                }}
              >
                <button
                  onClick={() => setVistaCarrito(true)}
                  className="text-gray-900 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-gray-900 border-opacity-20 font-medium"
                  style={{
                    padding: window.innerWidth < 640 ? '8px 12px' : '8px 16px',
                    fontSize: window.innerWidth < 640 ? '12px' : '14px',
                    flex: window.innerWidth < 640 ? 1 : 'none'
                  }}
                >
                  Ver Carrito
                </button>
                <button
                  onClick={handleConfirmarVenta}
                  className="bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg"
                  style={{
                    padding: window.innerWidth < 640 ? '8px 16px' : '8px 24px',
                    fontSize: window.innerWidth < 640 ? '12px' : '14px',
                    flex: window.innerWidth < 640 ? 1 : 'none'
                  }}
                >
                  <Plus size={16} />
                  Confirmar Venta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogoVentas;
