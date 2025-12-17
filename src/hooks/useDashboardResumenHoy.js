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
      const isDev = import.meta.env.DEV;
      
      if (isDev) console.log('📊 Dashboard - Obteniendo datos para fecha:', fechaHoy);
      
      // Hacer todas las llamadas en paralelo
      const [ventasRes, cobrosRes, produccionRes, pagosRes, registrosRes] = await Promise.allSettled([
        // Obtener ventas del día (sin límite para obtener todas)
        api.get(`/api/ventas?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}&limit=1000`),
        // Obtener cobros del día
        api.get(`/api/cobros?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`),
        // Obtener producción del día
        api.get(`/api/produccion/estadisticas/graficos?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`),
        // Obtener pagos al personal del día
        api.get(`/api/pagos-realizados/estadisticas/graficos?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`),
        // Obtener registros diarios de pago del día
        api.get(`/api/gestion-personal/estadisticas/registros-diarios?fechaInicio=${fechaHoy}&fechaFin=${fechaHoy}`)
      ]);

      // Debug: Log de resultados (solo en desarrollo)
      if (isDev) {
        console.log('📊 Dashboard - Resultados:', {
          ventas: ventasRes.status,
          cobros: cobrosRes.status,
          produccion: produccionRes.status,
          pagos: pagosRes.status,
          registros: registrosRes.status
        });

        if (produccionRes.status === 'rejected') {
          console.error('❌ Producción error:', produccionRes.reason);
        }
        if (registrosRes.status === 'rejected') {
          console.error('❌ Registros error:', registrosRes.reason);
        }
      }

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

      // Procesar producción - con manejo robusto
      if (produccionRes.status === 'fulfilled' && produccionRes.value?.data) {
        const responseData = produccionRes.value.data;
        
        // Manejar diferentes formatos de respuesta
        if (responseData.success && responseData.data?.totales) {
          costoProduccion = responseData.data.totales.costoTotalProduccion || 0;
          unidadesProducidas = responseData.data.totales.totalUnidadesProducidas || 0;
          totalProducciones = responseData.data.totales.totalProducciones || 0;
        } else if (responseData.totales) {
          // Formato alternativo sin wrapper 'data'
          costoProduccion = responseData.totales.costoTotalProduccion || 0;
          unidadesProducidas = responseData.totales.totalUnidadesProducidas || 0;
          totalProducciones = responseData.totales.totalProducciones || 0;
        }
      }

      // Procesar pagos al personal - con manejo robusto
      if (pagosRes.status === 'fulfilled' && pagosRes.value?.data) {
        const responseData = pagosRes.value.data;
        
        if (responseData.success && responseData.data?.totales) {
          pagosPersonal = responseData.data.totales.montoTotalPagado || 0;
          cantidadPagosPersonal = responseData.data.totales.totalPagos || 0;
        } else if (responseData.totales) {
          pagosPersonal = responseData.totales.montoTotalPagado || 0;
          cantidadPagosPersonal = responseData.totales.totalPagos || 0;
        }
      }

      // Procesar registros diarios - con manejo robusto
      if (registrosRes.status === 'fulfilled' && registrosRes.value?.data) {
        const responseData = registrosRes.value.data;
        
        let totalesData = null;
        if (responseData.success && responseData.data?.totales) {
          totalesData = responseData.data.totales;
        } else if (responseData.totales) {
          totalesData = responseData.totales;
        }
        
        if (totalesData) {
          // Total devengado = pago diario + bonificaciones
          const pagosDiarios = totalesData.sumaPagosDiarios || 0;
          const bonificaciones = totalesData.sumaBonificaciones || 0;
          registrosDiarios = pagosDiarios + bonificaciones;
          cantidadRegistrosDiarios = totalesData.totalRegistros || 0;
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
