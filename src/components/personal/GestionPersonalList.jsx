import React, { useState, useMemo, useEffect } from 'react';

const GestionPersonalList = ({ 
  registros, 
  todosLosRegistros, // Todos los registros para cálculos de resumen
  onEliminar, 
  loading,
  filtroFecha,
  onFiltroChange,
  customDateRange,
  onCustomDateRangeChange,
  // Nuevas props para datos de cobros
  colaboradorId, // ID del colaborador actual
  datosCobros = null, // Datos de cobros del colaborador
  onRefreshData = null // Callback para refrescar datos
}) => {
  // Estado para el mes y año actual del calendario
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (cantidad) => {
    if (cantidad === null || cantidad === undefined) return 'S/0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(cantidad);
  };

  // Debug: Verificar datos de cobros recibidos
  useEffect(() => {
    console.log('🔍 GestionPersonalList - Datos de cobros recibidos:', datosCobros);
    if (datosCobros && datosCobros.resumen) {
      console.log('📊 GestionPersonalList - Resumen de cobros:', {
        totalFaltantes: datosCobros.resumen.totalFaltantes,
        totalGastosImprevistos: datosCobros.resumen.totalGastosImprevistos,
        cobrosDetalle: datosCobros.resumen.cobrosDetalle?.length || 0
      });
    }
  }, [datosCobros]);

  // Función para obtener el nombre del mes
  const obtenerNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
  };

  // Función para obtener los días del mes
  const obtenerDiasDelMes = (mes, año) => {
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    return Array.from({ length: diasEnMes }, (_, i) => i + 1);
  };

  // Función para agrupar registros por día (versión original - sin cambios)
  const agruparRegistrosPorDia = useMemo(() => {
    const registrosDelMes = registros.filter(registro => {
      const fechaRegistro = new Date(registro.fechaDeGestion);
      return fechaRegistro.getMonth() === mesActual && fechaRegistro.getFullYear() === añoActual;
    });

    const agrupados = {};
    registrosDelMes.forEach(registro => {
      const dia = new Date(registro.fechaDeGestion).getDate();
      if (!agrupados[dia]) {
        agrupados[dia] = [];
      }
      agrupados[dia].push(registro);
    });

    return agrupados;
  }, [registros, mesActual, añoActual]);

  // Función mejorada para agrupar registros por fecha de VENTA (para cobros)
  const agruparRegistrosPorFechaVenta = useMemo(() => {
    const agrupados = {};
    
    // Obtener todos los días del mes
    const diasDelMes = obtenerDiasDelMes(mesActual, añoActual);
    
    // Inicializar todos los días con arrays vacíos
    diasDelMes.forEach(dia => {
      agrupados[dia] = {
        registrosGestion: [],
        datosCobros: {
          faltantes: 0,
          gastosImprevistos: 0,
          totalVentasDelDia: 0,
          cobrosDetalle: []
        }
      };
    });

    // Agregar registros de gestión personal por fecha de gestión
    registros.forEach(registro => {
      const fechaRegistro = new Date(registro.fechaDeGestion);
      if (fechaRegistro.getMonth() === mesActual && fechaRegistro.getFullYear() === añoActual) {
        const dia = fechaRegistro.getDate();
        if (agrupados[dia]) {
          agrupados[dia].registrosGestion.push(registro);
        }
      }
    });

    // Agregar datos de cobros por fecha de VENTA
    if (datosCobros && datosCobros.resumen && datosCobros.resumen.cobrosDetalle) {
      datosCobros.resumen.cobrosDetalle.forEach(cobro => {
        // Iterar sobre las ventas de cada cobro para obtener las fechas de venta
        if (cobro.ventasRelacionadas && cobro.ventasRelacionadas.length > 0) {
          // Calcular monto total de las ventas relacionadas a este cobro
          const montoTotalVentasCobro = cobro.ventasRelacionadas.reduce((total, venta) => total + (venta.montoVenta || 0), 0);
          
          cobro.ventasRelacionadas.forEach(venta => {
            const fechaVenta = new Date(venta.fechaVenta);
            if (fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === añoActual) {
              const dia = fechaVenta.getDate();
              if (agrupados[dia]) {
                // Distribuir faltantes y gastos proporcionalmente según el monto de cada venta
                const proporcionVenta = montoTotalVentasCobro > 0 ? (venta.montoVenta || 0) / montoTotalVentasCobro : 1;
                
                const faltantesAsignados = (cobro.faltantes || 0) * proporcionVenta;
                const gastosAsignados = (cobro.gastosImprevistos || 0) * proporcionVenta;
                
                agrupados[dia].datosCobros.faltantes += faltantesAsignados;
                agrupados[dia].datosCobros.gastosImprevistos += gastosAsignados;
                agrupados[dia].datosCobros.totalVentasDelDia += venta.montoVenta || 0;
                agrupados[dia].datosCobros.cobrosDetalle.push({
                  cobroId: cobro.cobroId,
                  ventaId: venta.ventaId,
                  montoVenta: venta.montoVenta,
                  faltantesAsignados: faltantesAsignados,
                  gastosAsignados: gastosAsignados,
                  fechaCobro: cobro.fechaCobro,
                  descripcionCobro: cobro.descripcion
                });
                
                console.log(`📅 Día ${dia}: +${faltantesAsignados.toFixed(2)} faltantes, +${gastosAsignados.toFixed(2)} gastos de venta ${venta.ventaId}`);
              }
            }
          });
        }
      });
    }

    // Redondear los valores calculados
    Object.keys(agrupados).forEach(dia => {
      agrupados[dia].datosCobros.faltantes = Math.round(agrupados[dia].datosCobros.faltantes * 100) / 100;
      agrupados[dia].datosCobros.gastosImprevistos = Math.round(agrupados[dia].datosCobros.gastosImprevistos * 100) / 100;
    });
    
    return agrupados;
  }, [registros, mesActual, añoActual, datosCobros]);

  // Función para calcular totales de un día (solo gestión personal)
  const calcularTotalesDia = (registrosDia) => {
    if (!registrosDia || registrosDia.length === 0) {
      return { monto: 0, faltante: 0, adelanto: 0, pagodiario: 0 };
    }
    
    return registrosDia.reduce((totales, registro) => ({
      monto: totales.monto + (registro.monto || 0),
      faltante: totales.faltante + (registro.faltante || 0),
      adelanto: totales.adelanto + (registro.adelanto || 0),
      pagodiario: totales.pagodiario + (registro.pagodiario || 0)
    }), { monto: 0, faltante: 0, adelanto: 0, pagodiario: 0 });
  };

  // Función para calcular totales completos de un día (gestión + cobros)
  const calcularTotalesCompletosDelDia = (datosDelDia) => {
    const totalesGestion = calcularTotalesDia(datosDelDia.registrosGestion || []);
    const datosCobros = datosDelDia.datosCobros || { faltantes: 0, gastosImprevistos: 0 };
    
    return {
      // Totales de gestión personal
      monto: totalesGestion.monto,
      faltante: totalesGestion.faltante,
      adelanto: totalesGestion.adelanto,
      pagodiario: totalesGestion.pagodiario,
      
      // Totales de cobros (por fecha de venta)
      faltantesCobros: datosCobros.faltantes || 0,
      gastosImprevistos: datosCobros.gastosImprevistos || 0,
      totalVentasDelDia: datosCobros.totalVentasDelDia || 0,
      
      // Totales combinados
      totalFaltantes: (totalesGestion.faltante || 0) + (datosCobros.faltantes || 0),
      totalGastos: (totalesGestion.monto || 0) + (datosCobros.gastosImprevistos || 0)
    };
  };

  // Navegación de meses
  const navegarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (mesActual === 0) {
        setMesActual(11);
        setAñoActual(añoActual - 1);
      } else {
        setMesActual(mesActual - 1);
      }
    } else {
      if (mesActual === 11) {
        setMesActual(0);
        setAñoActual(añoActual + 1);
      } else {
        setMesActual(mesActual + 1);
      }
    }
  };

  // Ir al mes actual
  const irAMesActual = () => {
    const hoy = new Date();
    setMesActual(hoy.getMonth());
    setAñoActual(hoy.getFullYear());
  };
  const filtrarRegistrosPorFecha = (registros) => {
    console.log('Filtrando registros:', { filtroFecha, totalRegistros: registros.length }); // Debug
    
    if (filtroFecha === 'historico') return registros;
    
    const hoy = new Date();
    let inicio, fin;

    switch (filtroFecha) {
      case 'semana':
        const diaSemana = hoy.getDay();
        const diferenciaDias = diaSemana === 0 ? 6 : diaSemana - 1;
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - diferenciaDias);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
        fin.setHours(23, 59, 59, 999);
        break;

      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);
        break;

      case 'año':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(hoy.getFullYear(), 11, 31);
        fin.setHours(23, 59, 59, 999);
        break;

      case 'personalizado':
        if (customDateRange.start && customDateRange.end) {
          inicio = new Date(customDateRange.start);
          fin = new Date(customDateRange.end);
          fin.setHours(23, 59, 59, 999);
        } else {
          return registros;
        }
        break;

      default:
        return registros;
    }

    console.log('Rango de fechas:', { inicio, fin }); // Debug
    
    const registrosFiltrados = registros.filter(registro => {
      const fechaRegistro = new Date(registro.fechaDeGestion);
      const estaEnRango = fechaRegistro >= inicio && fechaRegistro <= fin;
      console.log('Registro:', { 
        fecha: fechaRegistro, 
        estaEnRango, 
        descripcion: registro.descripcion 
      }); // Debug
      return estaEnRango;
    });
    
    console.log('Registros después del filtro:', registrosFiltrados.length); // Debug
    return registrosFiltrados;
  };

  // Calcular totales usando TODOS los registros (para resumen correcto)
  const calcularTotalesCompletos = () => {
    if (!todosLosRegistros || todosLosRegistros.length === 0) {
      return { 
        monto: 0, 
        faltante: 0, 
        adelanto: 0, 
        pagodiario: 0,
        // Nuevos totales de cobros
        faltantesCobros: 0,
        gastosImprevistosCobros: 0,
        totalVentasCobros: 0
      };
    }
    
    const totalesGestion = todosLosRegistros.reduce((totales, registro) => ({
      monto: totales.monto + (registro.monto || 0),
      faltante: totales.faltante + (registro.faltante || 0),
      adelanto: totales.adelanto + (registro.adelanto || 0),
      pagodiario: totales.pagodiario + (registro.pagodiario || 0)
    }), { monto: 0, faltante: 0, adelanto: 0, pagodiario: 0 });

    // Agregar totales de cobros si existen
    let totalesCobros = { faltantesCobros: 0, gastosImprevistosCobros: 0, totalVentasCobros: 0 };
    if (datosCobros && datosCobros.resumen && datosCobros.resumen.cobrosDetalle) {
      totalesCobros = datosCobros.resumen.cobrosDetalle.reduce((totales, cobro) => ({
        faltantesCobros: totales.faltantesCobros + (cobro.faltantes || 0),
        gastosImprevistosCobros: totales.gastosImprevistosCobros + (cobro.gastosImprevistos || 0),
        totalVentasCobros: totales.totalVentasCobros + (cobro.montoTotalVentas || 0)
      }), { faltantesCobros: 0, gastosImprevistosCobros: 0, totalVentasCobros: 0 });
    }

    return { ...totalesGestion, ...totalesCobros };
  };

  // Calcular totales del período filtrado (para información adicional si se desea)
  const calcularTotalesFiltrados = () => {
    return registrosFiltrados.reduce((totales, registro) => ({
      monto: totales.monto + (registro.monto || 0),
      faltante: totales.faltante + (registro.faltante || 0),
      adelanto: totales.adelanto + (registro.adelanto || 0),
      pagodiario: totales.pagodiario + (registro.pagodiario || 0)
    }), { monto: 0, faltante: 0, adelanto: 0, pagodiario: 0 });
  };

  // Calcular totales de los últimos 12 meses usando la misma lógica del calendario
  const calcularTotalesAnuales = () => {
    const fechaActual = new Date();
    const hace12Meses = new Date();
    hace12Meses.setFullYear(fechaActual.getFullYear() - 1);

    // Filtrar registros de los últimos 12 meses
    const registrosUltimos12Meses = todosLosRegistros.filter(registro => {
      const fechaRegistro = new Date(registro.fechaDeGestion);
      return fechaRegistro >= hace12Meses && fechaRegistro <= fechaActual;
    });

    // Calcular totales de gestión
    const totalesGestion = registrosUltimos12Meses.reduce((totales, registro) => ({
      adelantos: totales.adelantos + (registro.adelanto || 0),
      pagosDiarios: totales.pagosDiarios + (registro.pagodiario || 0)
    }), { adelantos: 0, pagosDiarios: 0 });

    // Obtener totales de cobros de los últimos 12 meses
    let totalesCobros = { faltantesCobros: 0, gastosImprevistos: 0 };
    if (datosCobros && datosCobros.resumen && datosCobros.resumen.cobrosDetalle) {
      // Filtrar cobros de los últimos 12 meses
      const cobrosUltimos12Meses = datosCobros.resumen.cobrosDetalle.filter(cobro => {
        const fechaCobro = new Date(cobro.fechaCobro);
        return fechaCobro >= hace12Meses && fechaCobro <= fechaActual;
      });

      totalesCobros = cobrosUltimos12Meses.reduce((totales, cobro) => ({
        faltantesCobros: totales.faltantesCobros + (cobro.faltantes || 0),
        gastosImprevistos: totales.gastosImprevistos + (cobro.gastosImprevistos || 0)
      }), { faltantesCobros: 0, gastosImprevistos: 0 });
    }

    // Usar la MISMA fórmula que funciona en el calendario
    const totalAPagar = totalesGestion.pagosDiarios - totalesCobros.faltantesCobros - totalesGestion.adelantos;

    return {
      ...totalesGestion,
      ...totalesCobros,
      totalAPagar,
      periodo: '12 meses'
    };
  };

  const totalesCompletos = calcularTotalesAnuales();

  // Calcular totales del mes actual mostrado en el calendario
  const calcularTotalesDelMes = () => {
    const diasDelMes = obtenerDiasDelMes(mesActual, añoActual);
    let totalesMes = {
      registrosGestion: 0,
      ventasCobros: 0,
      faltantesCobros: 0,
      gastosImprevistos: 0,
      adelantos: 0,
      pagosDiarios: 0
    };

    diasDelMes.forEach(dia => {
      const datosDelDia = agruparRegistrosPorFechaVenta[dia] || { 
        registrosGestion: [], 
        datosCobros: { faltantes: 0, gastosImprevistos: 0, totalVentasDelDia: 0, cobrosDetalle: [] }
      };
      
      const registrosDia = datosDelDia.registrosGestion;
      const totalesDia = calcularTotalesDia(registrosDia);
      const datosCobros = datosDelDia.datosCobros;

      totalesMes.registrosGestion += registrosDia.length;
      totalesMes.ventasCobros += datosCobros.cobrosDetalle.length;
      totalesMes.faltantesCobros += datosCobros.faltantes || 0;
      totalesMes.gastosImprevistos += datosCobros.gastosImprevistos || 0;
      totalesMes.adelantos += totalesDia.adelanto || 0;
      totalesMes.pagosDiarios += totalesDia.pagodiario || 0;
    });

    // Calcular total a pagar: Pagos Diarios - Faltantes - Adelantos
    totalesMes.totalAPagar = totalesMes.pagosDiarios - totalesMes.faltantesCobros - totalesMes.adelantos;

    return totalesMes;
  };

  const totalesDelMes = calcularTotalesDelMes();

  return (
    <div className="space-y-4">
      {/* Navegación del Calendario */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navegarMes('anterior')}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            ← Anterior
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">
              {obtenerNombreMes(mesActual)} {añoActual}
            </h2>
            <button
              onClick={irAMesActual}
              className="text-sm text-blue-600 hover:text-blue-800 mt-1"
            >
              Ir a mes actual
            </button>
          </div>
          
          <button
            onClick={() => navegarMes('siguiente')}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>

          {/* Tabla Calendario Mensual */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-lg font-medium">
                Calendario de Registros - {obtenerNombreMes(mesActual)} {añoActual}
              </h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando registros...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Día</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Registros</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Faltantes Cobros</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Gastos Cobros</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Adelantos</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Pagos</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {obtenerDiasDelMes(mesActual, añoActual).map(dia => {
                      // Usar los datos combinados en lugar de solo registros de gestión
                      const datosDelDia = agruparRegistrosPorFechaVenta[dia] || { 
                        registrosGestion: [], 
                        datosCobros: { faltantes: 0, gastosImprevistos: 0, totalVentasDelDia: 0, cobrosDetalle: [] }
                      };
                      const registrosDia = datosDelDia.registrosGestion;
                      const totalesDia = calcularTotalesDia(registrosDia);
                      const datosCobros = datosDelDia.datosCobros;
                      const fechaCompleta = new Date(añoActual, mesActual, dia);
                      const esHoy = fechaCompleta.toDateString() === new Date().toDateString();
                      
                      // Determinar si hay actividad en el día
                      const tieneActividad = registrosDia.length > 0 || datosCobros.totalVentasDelDia > 0;
                      
                      return (
                        <tr key={dia} className={`hover:bg-gray-50 ${esHoy ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${esHoy ? 'text-blue-600' : 'text-gray-900'}`}>
                                {dia}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {fechaCompleta.toLocaleDateString('es-ES', { weekday: 'short' })}
                              </span>
                              {esHoy && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Hoy
                                </span>
                              )}
                              {/* Indicador de actividad */}
                              {tieneActividad && (
                                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full" title="Día con actividad"></span>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            <div className="space-y-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                registrosDia.length > 0 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {registrosDia.length} gestión
                              </span>
                              {datosCobros.cobrosDetalle.length > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {datosCobros.cobrosDetalle.length} ventas
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* COLUMNAS DE COBROS */}
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-medium ${
                              datosCobros.faltantes > 0 ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              {formatearMoneda(datosCobros.faltantes)}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-medium ${
                              datosCobros.gastosImprevistos > 0 ? 'text-purple-600' : 'text-gray-400'
                            }`}>
                              {formatearMoneda(datosCobros.gastosImprevistos)}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-medium ${
                              totalesDia.adelanto > 0 ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                              {formatearMoneda(totalesDia.adelanto)}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-medium ${
                              totalesDia.pagodiario > 0 ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {formatearMoneda(totalesDia.pagodiario)}
                            </span>
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            {tieneActividad && (
                              <div className="flex justify-center space-x-1">
                                {/* Botones para registros de gestión */}
                                {registrosDia.map(registro => (
                                  <button
                                    key={registro._id}
                                    onClick={() => {
                                      onEliminar(registro._id);
                                      // Refrescar datos si hay callback
                                      if (onRefreshData) {
                                        setTimeout(onRefreshData, 100);
                                      }
                                    }}
                                    className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 transition-colors"
                                    title={`Eliminar: ${registro.descripcion}`}
                                  >
                                    🗑️
                                  </button>
                                ))}
                                {/* Indicador de datos de cobros */}
                                {datosCobros.cobrosDetalle.length > 0 && (
                                  <span 
                                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                                    title={`${datosCobros.cobrosDetalle.length} ventas - Total: ${formatearMoneda(datosCobros.totalVentasDelDia)}`}
                                  >
                                    💰
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Fila de totales del mes */}
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr className="font-semibold">
                      <td className="px-4 py-3 text-left">
                        <span className="text-sm font-bold text-gray-800">
                          TOTAL {obtenerNombreMes(mesActual).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-200 text-blue-900">
                            {totalesDelMes.registrosGestion} gestión
                          </span>
                          {totalesDelMes.ventasCobros > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-200 text-purple-900">
                              {totalesDelMes.ventasCobros} ventas
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-red-600">
                          {formatearMoneda(totalesDelMes.faltantesCobros)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-purple-600">
                          {formatearMoneda(totalesDelMes.gastosImprevistos)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-blue-600">
                          {formatearMoneda(totalesDelMes.adelantos)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-green-600">
                          {formatearMoneda(totalesDelMes.pagosDiarios)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-600 mb-1">Total a Pagar:</span>
                          <span className={`text-sm font-bold px-2 py-1 rounded ${
                            totalesDelMes.totalAPagar >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {formatearMoneda(totalesDelMes.totalAPagar)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        
      {/* Resumen de totales simplificado */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-base sm:text-lg font-medium mb-3">Resumen del Colaborador (Últimos 12 Meses)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Faltantes de Ventas</p>
            <p className="text-base sm:text-lg font-bold text-red-500">{formatearMoneda(totalesCompletos.faltantesCobros || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Gastos Imprevistos</p>
            <p className="text-base sm:text-lg font-bold text-purple-600">{formatearMoneda(totalesCompletos.gastosImprevistos || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Adelantos</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">{formatearMoneda(totalesCompletos.adelantos || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Pagos Diarios</p>
            <p className="text-base sm:text-lg font-bold text-green-600">{formatearMoneda(totalesCompletos.pagosDiarios || 0)}</p>
          </div>
        </div>
        
        {/* Total a pagar con la fórmula correcta */}
        <div className="border-t border-gray-200 mt-4 pt-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total a Pagar (Pagos Diarios - Faltantes - Adelantos):</p>
            <p className={`text-xl font-bold px-4 py-2 rounded ${
              totalesCompletos.totalAPagar >= 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {formatearMoneda(totalesCompletos.totalAPagar)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionPersonalList;