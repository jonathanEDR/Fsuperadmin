import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import * as inventarioCRUDService from '../services/inventarioCRUDService';

export default function useInventarioProducto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  const createEntry = async (entryData) => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await inventarioCRUDService.createEntry(entryData, token);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (id, entryData) => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await inventarioCRUDService.updateEntry(id, entryData, token);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id) => {
    setLoading(true);
    try {
      const token = await getToken();
      await inventarioCRUDService.deleteEntry(id, token);
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getHistory = async (productoId) => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await inventarioCRUDService.getHistory(productoId, token);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAllEntries = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await inventarioCRUDService.getAllEntries(token);
      setError(null);
      // Extraer solo las entradas del objeto de respuesta
      return response.entradas || [];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    getHistory,
    getAllEntries,
    clearError
  };
}
