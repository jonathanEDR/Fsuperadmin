import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '@clerk/clerk-react';

// Custom hook para lógica de catálogo de gastos
export default function useCatalogoGastos() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    categoria: '',
    tipoDeGasto: '',
    activo: true,
    search: ''
  });

  // Fetch catálogo
  const fetchCatalogo = useCallback(async (filtrosCustom = null) => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const filtrosAUsar = filtrosCustom || filtros;

      // Construir query params
      const params = new URLSearchParams();
      if (filtrosAUsar.categoria) params.append('categoria', filtrosAUsar.categoria);
      if (filtrosAUsar.tipoDeGasto) params.append('tipoDeGasto', filtrosAUsar.tipoDeGasto);
      if (filtrosAUsar.activo !== undefined && filtrosAUsar.activo !== '') {
        params.append('activo', filtrosAUsar.activo);
      }
      if (filtrosAUsar.search) params.append('search', filtrosAUsar.search);

      const queryString = params.toString();
      const url = `/api/catalogo-gastos${queryString ? `?${queryString}` : ''}`;

      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCatalogo(response.data);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
      setError('Error al cargar el catálogo de gastos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, filtros]);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  // Agregar item al catálogo
  const addItemCatalogo = async (nuevoItem) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await api.post('/api/catalogo-gastos', nuevoItem, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCatalogo();
      return { success: true, data: response.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al agregar item al catálogo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar item del catálogo
  const updateItemCatalogo = async (item) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await api.put(`/api/catalogo-gastos/${item._id}`, item, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCatalogo();
      return { success: true, data: response.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al actualizar item del catálogo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar item del catálogo (soft delete)
  const deleteItemCatalogo = async (id, permanent = false) => {
    setError(null);
    try {
      const token = await getToken();
      await api.delete(`/api/catalogo-gastos/${id}${permanent ? '?permanent=true' : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCatalogo();
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al eliminar item del catálogo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Reactivar item del catálogo
  const reactivarItemCatalogo = async (id) => {
    setError(null);
    try {
      const token = await getToken();
      await api.patch(`/api/catalogo-gastos/${id}/reactivar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCatalogo();
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al reactivar item del catálogo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Obtener items por categoría (útil para el selector en GastoForm)
  const getItemsByCategoria = useCallback((categoria) => {
    return catalogo.filter(item => item.categoria === categoria && item.activo);
  }, [catalogo]);

  // Obtener items activos filtrados
  const getItemsActivos = useCallback(() => {
    return catalogo.filter(item => item.activo);
  }, [catalogo]);

  // Actualizar filtros
  const updateFiltros = (nuevosFiltros) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      categoria: '',
      tipoDeGasto: '',
      activo: true,
      search: ''
    });
  };

  return {
    catalogo,
    loading,
    error,
    isSubmitting,
    filtros,
    fetchCatalogo,
    addItemCatalogo,
    updateItemCatalogo,
    deleteItemCatalogo,
    reactivarItemCatalogo,
    getItemsByCategoria,
    getItemsActivos,
    updateFiltros,
    limpiarFiltros,
    setError
  };
}
