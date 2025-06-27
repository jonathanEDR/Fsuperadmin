import { useState, useEffect, useCallback } from 'react';
import { getPagosRealizados, createPagoRealizado, deletePagoRealizado } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '@clerk/clerk-react';

export default function useGestionPersonalData() {
  const { getToken } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los pagos
  const fetchPagos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pagosData = await getPagosRealizados();
      // Normalizar los pagos para asegurar campos consistentes
      const pagosNormalizados = (pagosData || []).map(p => ({
        ...p,
        colaboradorUserId: p.colaboradorUserId || p.colaborador_id || p.clerk_id || '',
        montoTotal: typeof p.montoTotal === 'number' ? p.montoTotal : (p.monto || 0),
        fechaPago: p.fechaPago || p.fechaDeGestion || '',
      }));
      setPagos(pagosNormalizados);
    } catch (err) {
      setError('Error al cargar pagos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener colaboradores
  const fetchColaboradores = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');
      const response = await api.get('/api/gestion-personal/colaboradores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        // Mapear clerk_id a colaboradorUserId para compatibilidad frontend
        const colaboradoresValidos = response.data
          .filter(c => c && (typeof c.nombre_negocio === 'string' || typeof c.nombre === 'string'))
          .map(c => ({
            ...c,
            colaboradorUserId: c.clerk_id,
            nombre: c.nombre_negocio || c.nombre || '',
            departamento: c.departamento || '',
          }));
        setColaboradores(colaboradoresValidos);
      } else {
        setColaboradores([]);
      }
    } catch (err) {
      setColaboradores([]);
    }
  }, [getToken]);

  // Obtener registros para calcular montos pendientes
  const fetchRegistros = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');
      const response = await api.get('/api/gestion-personal', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistros(response.data || []);
    } catch (err) {
      setRegistros([]);
    }
  }, [getToken]);

  useEffect(() => {
    fetchPagos();
    fetchColaboradores();
    fetchRegistros();
  }, [fetchPagos, fetchColaboradores, fetchRegistros]);

  // Agregar nuevo pago
  const agregarPago = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createPagoRealizado(formData);
      if (response) {
        await fetchPagos();
      }
      return response;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al agregar pago');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar pago
  const eliminarPago = async (pagoId) => {
    setLoading(true);
    setError(null);
    try {
      await deletePagoRealizado(pagoId);
      await fetchPagos();
    } catch (err) {
      setError('Error al eliminar pago: ' + (err.response?.data?.message || err.message));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    pagos,
    colaboradores,
    registros,
    loading,
    error,
    fetchPagos,
    fetchColaboradores,
    fetchRegistros,
    agregarPago,
    eliminarPago,
    setError
  };
}
