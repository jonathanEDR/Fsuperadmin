import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '@clerk/clerk-react';

export const usePersonalPayment = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);  const registrarPagoPersonal = async (pagoData, onSuccess) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('No autorizado');

      const monto = parseFloat(pagoData.monto);
      if (monto <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }      // Para pagos personales generales, solo registrar en Caja
      // El backend se encargará de crear el Gasto automáticamente y el PagoRealizado si hay colaboradorId
      const egresoData = {
        tipo: 'egreso',
        categoria: 'pago_personal',
        descripcion: pagoData.descripcion || `Pago Personal - ${pagoData.colaboradorNombre || 'N/A'}`,
        monto: monto,
        fecha: pagoData.fecha,
        metodoPago: pagoData.metodoPago,
        colaboradorUserId: pagoData.colaboradorUserId, // ID del colaborador para crear PagoRealizado automáticamente
        colaboradorNombre: pagoData.colaboradorNombre,
        numeroComprobante: pagoData.numeroComprobante,
        observaciones: pagoData.observaciones,
        seccion: pagoData.seccion, // Información adicional para el backend
        esAutomatico: false // Marcarlo como manual ya que viene del usuario
      };

      console.log('Registrando pago personal como movimiento de caja:', egresoData);

      // 1. Registrar movimiento en caja
      const response = await api.post('/api/caja/movimiento', egresoData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Registrar pago en pagos realizados
      const pagoRealizadoData = {
        colaboradorUserId: pagoData.colaboradorUserId,
        fechaPago: pagoData.fecha,
        montoTotal: monto,
        metodoPago: pagoData.metodoPago,
        periodoInicio: pagoData.periodoInicio || null,
        periodoFin: pagoData.periodoFin || null,
        observaciones: pagoData.observaciones || '',
        estado: 'pagado',
      };
      try {
        await api.post('/api/pagos-realizados', pagoRealizadoData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Pago registrado en pagos realizados');
      } catch (err) {
        console.error('Error al registrar en pagos realizados:', err);
        // No detenemos el flujo si falla aquí, pero podrías mostrar un warning si lo deseas
      }

      console.log('Pago personal registrado exitosamente:', response.data);

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error al registrar pago de personal:', err);
      setError(err.response?.data?.message || err.message || 'Error al registrar pago');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const obtenerColaboradores = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No autorizado');

      const response = await api.get('/api/gestion-personal/colaboradores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data || [];
    } catch (err) {
      console.error('Error al obtener colaboradores:', err);
      throw err;
    }
  };

  return {
    registrarPagoPersonal,
    obtenerColaboradores,
    loading,
    error,
    setError
  };
};
