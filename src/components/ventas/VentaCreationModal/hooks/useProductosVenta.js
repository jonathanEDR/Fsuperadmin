import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { esProductoValido } from '../utils/ventaValidators';

/**
 * Hook personalizado para gestionar productos y su filtrado
 * @returns {Object} Estado y funciones para productos
 */
export const useProductosVenta = () => {
  const { getToken } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  /**
   * Carga productos desde el backend
   */
  useEffect(() => {
    const loadProductos = async () => {
      setLoading(true);
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
        setError('');
      } catch (error) {
        setError('Error al cargar la lista de productos');
        console.error('Error loading productos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProductos();
  }, [getToken]);

  /**
   * Carga categorías desde el backend
   */
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

  /**
   * Filtra productos disponibles según búsqueda, categoría y stock
   */
  const productosDisponibles = useMemo(() => {
    return productos.filter(producto => {
      // Validación básica de datos del producto
      if (!esProductoValido(producto)) {
        return false;
      }
      
      // Filtro de stock (solo productos con stock disponible)
      if (producto.cantidadRestante <= 0) {
        return false;
      }
      
      // Filtro de búsqueda (por nombre o código)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchName = producto.nombre?.toLowerCase().includes(searchLower);
        const matchCode = producto.codigoProducto?.toLowerCase().includes(searchLower);
        if (!matchName && !matchCode) {
          return false;
        }
      }
      
      // Filtro de categoría
      if (selectedCategory && selectedCategory !== '') {
        // Comparar tanto por categoryId como por categoryName para mayor compatibilidad
        const matchesCategoryId = producto.categoryId && 
          producto.categoryId.toString() === selectedCategory;
        const matchesCategoryName = producto.categoryName && 
          categorias.find(cat => 
            cat._id === selectedCategory && 
            cat.nombre === producto.categoryName
          );
        
        if (!matchesCategoryId && !matchesCategoryName) {
          return false;
        }
      }
      
      return true;
    });
  }, [productos, searchTerm, selectedCategory, categorias]);

  /**
   * Actualiza la cantidad restante de un producto después de una venta
   */
  const actualizarStockProducto = (productoId, cantidadVendida) => {
    setProductos(prevProductos => 
      prevProductos.map(producto => {
        if (producto._id === productoId) {
          return {
            ...producto,
            cantidadRestante: producto.cantidadRestante - cantidadVendida,
            cantidadVendida: (producto.cantidadVendida || 0) + cantidadVendida
          };
        }
        return producto;
      })
    );
  };

  /**
   * Actualiza el stock de múltiples productos
   */
  const actualizarStockMultiple = (items) => {
    setProductos(prevProductos => 
      prevProductos.map(producto => {
        const itemVendido = items.find(item => item.productoId === producto._id);
        if (itemVendido) {
          return {
            ...producto,
            cantidadRestante: producto.cantidadRestante - itemVendido.cantidad,
            cantidadVendida: (producto.cantidadVendida || 0) + itemVendido.cantidad
          };
        }
        return producto;
      })
    );
  };

  /**
   * Busca un producto por ID
   */
  const buscarProductoPorId = (productoId) => {
    return productos.find(p => p._id === productoId);
  };

  /**
   * Limpia los filtros de búsqueda
   */
  const limpiarFiltros = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  return {
    productos,
    categorias,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    productosDisponibles,
    actualizarStockProducto,
    actualizarStockMultiple,
    buscarProductoPorId,
    limpiarFiltros,
    setError
  };
};
