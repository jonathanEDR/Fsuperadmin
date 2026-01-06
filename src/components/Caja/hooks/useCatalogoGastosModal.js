import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../../../services/api';

/**
 * Hook para cargar el catálogo de gastos en el modal de Caja
 * Filtra por categoría/sección y solo muestra items activos
 */
export default function useCatalogoGastosModal() {
  const { getToken } = useAuth();
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar catálogo completo
  const fetchCatalogo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await api.get('/api/catalogo-gastos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Solo items activos
      const itemsActivos = (response.data || []).filter(item => item.activo !== false);
      setCatalogo(itemsActivos);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
      setError('Error al cargar el catálogo de gastos');
      setCatalogo([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Cargar al montar
  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  // Filtrar catálogo por categoría/sección
  const getCatalogoPorCategoria = useCallback((categoria) => {
    if (!categoria) return [];

    // Mapeo de secciones del modal de caja a categorías del catálogo
    const mapeoSecciones = {
      'finanzas': 'Finanzas',
      'produccion': 'Producción',
      'ventas': 'Ventas',
      'admin': 'Administración'
    };

    const categoriaFiltro = mapeoSecciones[categoria] || categoria;
    return catalogo.filter(item => item.categoria === categoriaFiltro);
  }, [catalogo]);

  // Obtener item por ID
  const getItemById = useCallback((id) => {
    return catalogo.find(item => item._id === id);
  }, [catalogo]);

  // Agrupar por tipo de gasto dentro de una categoría
  const getCatalogoAgrupadoPorTipo = useCallback((categoria) => {
    const items = getCatalogoPorCategoria(categoria);
    return items.reduce((acc, item) => {
      const tipo = item.tipoDeGasto || 'Otros';
      if (!acc[tipo]) acc[tipo] = [];
      acc[tipo].push(item);
      return acc;
    }, {});
  }, [getCatalogoPorCategoria]);

  return {
    catalogo,
    loading,
    error,
    fetchCatalogo,
    getCatalogoPorCategoria,
    getCatalogoAgrupadoPorTipo,
    getItemById,
    setError
  };
}
