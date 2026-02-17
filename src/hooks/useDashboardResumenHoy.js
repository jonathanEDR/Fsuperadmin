import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook para obtener resumen de datos para el Dashboard
 * Obtiene: Ventas netas, Total cobros, Costo producción, Pagos personal, Registros diarios
 * Zona horaria: America/Lima (UTC-5)
 * @param {string} periodo - 'hoy' | 'mes' - Período a consultar
 */
export const useDashboardResumenHoy = (periodo = 'hoy') => {
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
    cantidadRegistrosDiarios: 0,
    totalEgresos: 0,
    flujoNeto: 0
  });

  // Obtener rango de fechas según el período seleccionado
  const obtenerRangoFechas = useCallback(() => {
    const ahora = new Date();
    const fechaHoy = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    
    if (periodo === 'mes') {
      // Obtener primer día del mes actual
      const [year, month] = fechaHoy.split('-');
      const fechaInicio = `${year}-${month}-01`;
      return { fechaInicio, fechaFin: fechaHoy };
    }
    
    // Por defecto: solo hoy
    return { fechaInicio: fechaHoy, fechaFin: fechaHoy };
  }, [periodo]);

  const fetchResumenDia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { fechaInicio, fechaFin } = obtenerRangoFechas();
      
      // Hacer todas las llamadas en paralelo
      const [ventasRes, cobrosRes, produccionRes, pagosRes, registrosRes, cajaRes] = await Promise.allSettled([
        // Obtener ventas del período
        api.get(`/api/ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&limit=10000`),
        // Obtener cobros del período
        api.get(`/api/cobros?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
        // Obtener producción del período
        api.get(`/api/produccion/estadisticas/graficos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
        // Obtener pagos al personal del período
        api.get(`/api/pagos-realizados/estadisticas/graficos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
        // Obtener registros diarios de pago del período
        api.get(`/api/gestion-personal/estadisticas/registros-diarios?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
        // Obtener resumen de caja del período
        api.get(`/api/caja/resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
      ]);

      // Procesar ventas
      let ventasNetas = 0;
      let totalCobros = 0;
      let costoProduccion = 0;
      let unidadesProducidas = 0;
      let totalProducciones = 0;
      let pagosPersonal = 0;
      let cantidadPagosPersonal = 0;
      let registrosDiarios = 0;
      let cantidadRegistrosDiarios = 0;
      let totalEgresos = 0;
      let totalIngresos = 0;

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
        } else {
          // Formato no reconocido - continuar sin error
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

      // Procesar resumen de caja
      if (cajaRes.status === 'fulfilled' && cajaRes.value?.data) {
        const cajaData = cajaRes.value.data;
        totalEgresos = cajaData.totalEgresos || 0;
        totalIngresos = cajaData.totalIngresos || 0;
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
        cantidadRegistrosDiarios,
        totalEgresos,
        flujoNeto: totalIngresos - totalEgresos
      });

    } catch (err) {
      console.error('❌ Error al obtener resumen del día:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [obtenerRangoFechas]);

  useEffect(() => {
    fetchResumenDia();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchResumenDia, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchResumenDia, periodo]);

  return {
    ...resumen,
    loading,
    error,
    refetch: fetchResumenDia
  };
};

export default useDashboardResumenHoy;
