import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook para obtener resumen de datos del día actual para el Dashboard
 * Obtiene: Ventas netas, Total cobros, Costo producción, Pagos personal, Registros diarios
 * Zona horaria: America/Lima (UTC-5)
 */
export const useDashboardResumenHoy = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState({
    ventasNetas: 0,
    totalCobros: 0,
    costoProduccion: 0,
    unidadesProducidas: 0,
    totalProducciones: 0,
    pagosPersonal: 0,
    cantidadPagosPersonal: 0,
    registrosDiarios: 0,
    cantidadRegistrosDiarios: 0
  });

  // Obtener fecha de hoy en formato YYYY-MM-DD (zona horaria Perú)
  const obtenerFechaHoy = useCallback(() => {
    const ahora = new Date();
    // Obtener fecha en zona horaria de Perú
    const fechaPeru = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    return fechaPeru;
  }, []);

  const fetchResumenDia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fechaHoy = obtenerFechaHoy();
      
      // Hacer todas las llamadas en paralelo
      const [ventasRes, cobrosRes, produccionRes, pagosRes, registrosRes] = await Promise.allSettled([
        // Obtener ventas del día
        api.get(`/api/ventas?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`),
        // Obtener cobros del día
        api.get(`/api/cobros?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`),
        // Obtener producción del día
        api.get(`/api/produccion/estadisticas/graficos?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`),
        // Obtener pagos al personal del día
        api.get(`/api/pagos-realizados/estadisticas/graficos?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`),
        // Obtener registros diarios de pago del día
        api.get(`/api/gestion-personal/estadisticas/registros-diarios?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`)
      ]);

      let ventasNetas = 0;
      let totalCobros = 0;
      let costoProduccion = 0;
      let unidadesProducidas = 0;
      let totalProducciones = 0;
      let pagosPersonal = 0;
      let cantidadPagosPersonal = 0;
      let registrosDiarios = 0;
      let cantidadRegistrosDiarios = 0;

      // Procesar ventas
      if (ventasRes.status === 'fulfilled' && ventasRes.value?.data) {
        const ventasData = ventasRes.value.data;
        const ventas = Array.isArray(ventasData) ? ventasData : 
                       (ventasData.data || ventasData.ventas || []);
        
        if (Array.isArray(ventas)) {
          ventasNetas = ventas.reduce((sum, v) => {
            if (v.estado !== 'cancelada' && v.estado !== 'anulada') {
              return sum + (parseFloat(v.total) || parseFloat(v.montoTotal) || 0);
            }
            return sum;
          }, 0);
        }
      }

      // Procesar cobros
      if (cobrosRes.status === 'fulfilled' && cobrosRes.value?.data) {
        const cobrosData = cobrosRes.value.data;
        const cobros = Array.isArray(cobrosData) ? cobrosData : 
                       (cobrosData.data || cobrosData.cobros || []);
        
        if (Array.isArray(cobros)) {
          totalCobros = cobros.reduce((sum, c) => {
            // El modelo Cobro usa 'montoPagado' como campo principal
            return sum + (parseFloat(c.montoPagado) || parseFloat(c.monto) || parseFloat(c.montoCobrado) || parseFloat(c.total) || 0);
          }, 0);
        }
      }

      // Procesar producción
      if (produccionRes.status === 'fulfilled' && produccionRes.value?.data?.success) {
        const prodData = produccionRes.value.data.data;
        if (prodData?.totales) {
          costoProduccion = prodData.totales.costoTotalProduccion || 0;
          unidadesProducidas = prodData.totales.totalUnidadesProducidas || 0;
          totalProducciones = prodData.totales.totalProducciones || 0;
        }
      }

      // Procesar pagos al personal
      if (pagosRes.status === 'fulfilled' && pagosRes.value?.data?.success) {
        const pagosData = pagosRes.value.data.data;
        if (pagosData?.totales) {
          pagosPersonal = pagosData.totales.montoTotalPagado || 0;
          cantidadPagosPersonal = pagosData.totales.totalPagos || 0;
        }
      }

      // Procesar registros diarios
      if (registrosRes.status === 'fulfilled' && registrosRes.value?.data?.success) {
        const registrosData = registrosRes.value.data.data;
        if (registrosData?.totales) {
          // Total devengado = pago diario + bonificaciones
          const pagosDiarios = registrosData.totales.sumaPagosDiarios || 0;
          const bonificaciones = registrosData.totales.sumaBonificaciones || 0;
          registrosDiarios = pagosDiarios + bonificaciones;
          cantidadRegistrosDiarios = registrosData.totales.totalRegistros || 0;
        }
      }

      setResumen({
        ventasNetas,
        totalCobros,
        costoProduccion,
        unidadesProducidas,
        totalProducciones,
        pagosPersonal,
        cantidadPagosPersonal,
        registrosDiarios,
        cantidadRegistrosDiarios
      });

    } catch (err) {
      console.error('❌ Error al obtener resumen del día:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [obtenerFechaHoy]);

  useEffect(() => {
    fetchResumenDia();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchResumenDia, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchResumenDia]);

  return {
    ...resumen,
    loading,
    error,
    refetch: fetchResumenDia
  };
};

export default useDashboardResumenHoy;
