import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '@clerk/clerk-react';

// Custom hook para lógica de gastos
export default function useGastos() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros y estados auxiliares
  const [dateFilter, setDateFilter] = useState('year');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '', active: false });

  // Fetch gastos
  const fetchGastos = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await api.get('/api/gastos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGastos(response.data);
    } catch (error) {
      setError('Error al cargar los gastos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos]);

  // Agregar gasto
  const addGasto = async (nuevoGasto) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const montoTotal = parseFloat(nuevoGasto.costoUnidad) * parseFloat(nuevoGasto.cantidad);
      const fechaLocal = new Date(nuevoGasto.fechaGasto);
      const fechaISO = fechaLocal.toISOString();
      await api.post('/api/gastos', { ...nuevoGasto, montoTotal, fechaGasto: fechaISO }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGastos();
    } catch (error) {
      setError('Error al agregar el gasto. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar gasto
  const updateGasto = async (gasto) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const montoTotal = parseFloat(gasto.costoUnidad) * parseFloat(gasto.cantidad);
      await api.put(`/api/gastos/${gasto._id}`, { ...gasto, montoTotal, fechaGasto: gasto.fechaGasto }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGastos();
    } catch (error) {
      setError('Error al actualizar el gasto. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar gasto
  const deleteGasto = async (id) => {
    setError(null);
    try {
      const token = await getToken();
      await api.delete(`/api/gastos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGastos();
    } catch (error) {
      setError('Error al eliminar el gasto. Por favor, intenta nuevamente.');
    }
  };

  // Filtros de fecha
  const handleDateFilterChange = (filterType, days) => {
    setDateFilter(filterType);
    setCustomDateRange({ start: '', end: '', active: false });
  };
  const handleCustomDateRange = () => {
    if (customDateRange.start && customDateRange.end) {
      setDateFilter('custom');
      setCustomDateRange(prev => ({ ...prev, active: true }));
    }
  };

  return {
    gastos,
    loading,
    error,
    isSubmitting,
    dateFilter,
    customDateRange,
    setCustomDateRange,
    setDateFilter,
    handleDateFilterChange,
    handleCustomDateRange,
    fetchGastos,
    addGasto,
    updateGasto,
    deleteGasto,
    setError
  };
}
