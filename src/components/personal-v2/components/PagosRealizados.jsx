/**
 * Panel de Pagos Realizados para Módulo V2
 * Gestión completa de pagos a colaboradores con calendario mensual
 * ACTUALIZADO: Soporte para selección de días específicos
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Trash2, Plus, Calendar, CreditCard } from 'lucide-react';
import CalendarioSeleccionDias from './CalendarioSeleccionDias';
import ResumenSeleccion from './ResumenSeleccion';

const PagosRealizados = React.memo(({ 
  colaboradores,
  pagosRealizados,
  registros,
  estadisticasBulk,
  onCrearPago,
  onEliminarPago,
  formatearMoneda,
  loading
}) => {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null);
  
  // Estados para calendario principal
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());
  
  // NUEVO: Estados para selección de días
  const [registrosSeleccionados, setRegistrosSeleccionados] = useState([]);
  const [registrosPendientes, setRegistrosPendientes] = useState([]);
  
  // Estado del formulario - Usar fecha local de Perú
  const obtenerFechaHoyPeru = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  };
  
  const [formData, setFormData] = useState({
    fechaPago: obtenerFechaHoyPeru(),
    montoTotal: 0,
    metodoPago: 'efectivo',
    observaciones: '',
    estado: 'pagado'
  });

  const metodosPago = ['efectivo', 'transferencia', 'deposito', 'cheque'];
  const estadosPago = ['pagado', 'parcial', 'pendiente'];

  // Calcular monto pendiente por colaborador
  const calcularMontoPendiente = useCallback((clerkId) => {
    const estadisticas = estadisticasBulk[clerkId] || {};
    const totalAPagar = estadisticas.totalAPagarConCobros || 0;
    
    // Restar pagos realizados
    const totalPagado = pagosRealizados
      .filter(p => p.colaboradorUserId === clerkId)
      .reduce((sum, p) => sum + (p.montoTotal || p.monto || 0), 0);
    
    return totalAPagar - totalPagado;
  }, [pagosRealizados, estadisticasBulk]);

  // Funciones de calendario
  const obtenerNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
  };

  const obtenerDiasDelMes = (mes, año) => {
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    return Array.from({ length: diasEnMes }, (_, i) => i + 1);
  };

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

  const irAMesActual = () => {
    const hoy = new Date();
    setMesActual(hoy.getMonth());
    setAñoActual(hoy.getFullYear());
  };

  // Agrupar pagos por día
  const agruparPagosPorDia = useMemo(() => {
    const agrupados = {};
    
    pagosRealizados.forEach(pago => {
      // Distribuir pago entre los días de diasPagados
      if (pago.diasPagados && pago.diasPagados.length > 0) {
        pago.diasPagados.forEach(diaPagado => {
          const fecha = new Date(diaPagado.fecha || diaPagado.fechaRegistro);
          
          // Solo incluir si es del mes actual
          if (fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual) {
            const dia = fecha.getDate();
            if (!agrupados[dia]) {
              agrupados[dia] = [];
            }
            
            // Agregar pago parcial con el monto específico de ese día
            agrupados[dia].push({
              ...pago,
              montoTotal: diaPagado.montoPagadoDia || 0,
              esPagoParcial: true,
              conceptos: diaPagado.conceptos || {}
            });
          }
        });
      } else {
        // Si no tiene diasPagados, usar fechaPago (comportamiento anterior)
        const fechaPago = new Date(pago.fechaPago);
        if (fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === añoActual) {
          const dia = fechaPago.getDate();
          if (!agrupados[dia]) {
            agrupados[dia] = [];
          }
          agrupados[dia].push(pago);
        }
      }
    });

    return agrupados;
  }, [pagosRealizados, mesActual, añoActual]);

  // Calcular monto automático según días seleccionados
  const montoCalculado = useMemo(() => {
    if (registrosSeleccionados.length === 0) {
      return 0;
    }
    
    // Usar sistema de registros independientes
    let sumaPagos = 0;
    let sumaBonificaciones = 0;
    let sumaFaltantes = 0;
    let sumaAdelantos = 0;
    
    registrosSeleccionados.forEach(registro => {
      const tipo = registro.tipo || 'pago_diario';
      
      if (tipo === 'pago_diario') {
        // Si pagodiario es 0, calcular desde el sueldo del colaborador
        let pagoDiarioReal = registro.pagodiario || 0;
        if (pagoDiarioReal === 0 && colaboradorSeleccionado?.sueldo) {
          pagoDiarioReal = colaboradorSeleccionado.sueldo / 30;
        }
        
        sumaPagos += pagoDiarioReal;
        sumaBonificaciones += registro.bonificacion || 0;
        sumaAdelantos += registro.adelanto || 0;
      } else if (tipo === 'faltante_cobro') {
        sumaFaltantes += registro.faltante || 0;
      }
      // gastos NO se restan (solo referenciales)
    });
    
    // Nueva fórmula: Total = Pagos + Bonificaciones - Faltantes - Adelantos
    return sumaPagos + sumaBonificaciones - sumaFaltantes - sumaAdelantos;
  }, [registrosSeleccionados, colaboradorSeleccionado]);

  const obtenerRegistrosPendientes = useCallback((clerkId) => {
    return registros.filter(r => 
      r.colaboradorUserId === clerkId && 
      r.estadoPago === 'pendiente'
    ).sort((a, b) => new Date(a.fechaDeGestion) - new Date(b.fechaDeGestion));
  }, [registros]);

  const handleSeleccionDias = useCallback((registros) => {
    setRegistrosSeleccionados(registros);
  }, []);

  // Abrir modal
  const handleAbrirModal = (colaborador) => {
    setColaboradorSeleccionado(colaborador);
    
    // Obtener registros pendientes del colaborador
    const pendientes = obtenerRegistrosPendientes(colaborador.clerk_id);
    setRegistrosPendientes(pendientes);
    
    // Resetear selección
    setRegistrosSeleccionados([]);
    
    setFormData({
      fechaPago: obtenerFechaHoyPeru(),
      montoTotal: 0,
      metodoPago: 'efectivo',
      observaciones: '',
      estado: 'pagado'
    });
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setColaboradorSeleccionado(null);
    setRegistrosSeleccionados([]);
    setRegistrosPendientes([]);
    setFormData({
      fechaPago: obtenerFechaHoyPeru(),
      montoTotal: 0,
      metodoPago: 'efectivo',
      observaciones: '',
      estado: 'pagado'
    });
  };

  // Submit pago ACTUALIZADO
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que haya días seleccionados
    if (registrosSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un día para pagar');
      return;
    }

    if (montoCalculado <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    // ✅ Filtrar solo registros pago_diario para enviar al backend
    // (Los faltantes/gastos/adelantos se marcarán automáticamente por fecha)
    const registrosPagoDiario = registrosSeleccionados.filter(r => 
      !r.tipo || r.tipo === 'pago_diario'
    );

    const dataToSubmit = {
      colaboradorUserId: colaboradorSeleccionado.clerk_id,
      // Convertir fecha local de Perú a UTC/ISO para enviar al backend
      fechaPago: new Date(formData.fechaPago + 'T12:00:00-05:00').toISOString(),
      registrosIds: registrosPagoDiario.map(r => r._id), // NUEVO: Solo IDs de pago_diario
      metodoPago: formData.metodoPago,
      observaciones: formData.observaciones.trim(),
      estado: formData.estado
      // montoTotal se calcula automáticamente en el backend
    };

    try {
      await onCrearPago(dataToSubmit);
      handleCerrarModal();
    } catch (error) {
      alert('Error al registrar el pago: ' + error.message);
    }
  };

  // Confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!confirmacionEliminar) return;
    await onEliminarPago(confirmacionEliminar);
    setConfirmacionEliminar(null);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Lima'
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabla de Colaboradores */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Resumen de Colaboradores</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Saldo Pendiente</span>
                  <span className="sm:hidden">Saldo</span>
                </th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Pago
                </th>
                <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Último
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Acciones</span>
                  <span className="sm:hidden">-</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {colaboradores.map(colaborador => {
                const montoPendiente = calcularMontoPendiente(colaborador.clerk_id);
                const ultimoPago = pagosRealizados
                  .filter(p => p.colaboradorUserId === colaborador.clerk_id)
                  .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))[0];

                return (
                  <tr key={colaborador._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs sm:text-sm">
                            {colaborador.nombre_negocio.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {colaborador.nombre_negocio}
                          </div>
                          <div className="text-xs text-gray-500 truncate hidden sm:block">{colaborador.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                        montoPendiente > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        <span className="hidden sm:inline">{formatearMoneda(montoPendiente)}</span>
                        <span className="sm:hidden">{formatearMoneda(montoPendiente).replace('S/ ', 'S/')}</span>
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm text-gray-700">
                      {ultimoPago ? formatearFecha(ultimoPago.fechaPago) : (
                        <span className="text-gray-400 italic">Sin pagos</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      {ultimoPago ? (
                        <span className="text-xs sm:text-sm font-bold text-green-600">
                          {formatearMoneda(ultimoPago.montoTotal)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleAbrirModal(colaborador)}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-2 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-sm"
                        title="Registrar Pago"
                      >
                        <Plus size={16} className="flex-shrink-0" />
                        <span className="hidden sm:inline">Registrar Pago</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendario de Pagos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header del calendario */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600 sm:w-6 sm:h-6" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">Calendario de Pagos</h3>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => navegarMes('anterior')}
                    className="px-2 sm:px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">← Anterior</span>
                    <span className="sm:hidden">←</span>
                  </button>
                  
                  <div className="text-center min-w-[100px] sm:min-w-[140px]">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-800">
                      <span className="hidden sm:inline">{obtenerNombreMes(mesActual)}</span>
                      <span className="sm:hidden">{obtenerNombreMes(mesActual).slice(0, 3)}</span>
                      {' '}{añoActual}
                    </h4>
                    <button
                      onClick={irAMesActual}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Hoy
                    </button>
                  </div>
                  
                  <button
                    onClick={() => navegarMes('siguiente')}
                    className="px-2 sm:px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Siguiente →</span>
                    <span className="sm:hidden">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla calendario con scroll horizontal */}
            <div className="relative">
              {/* Indicador de scroll derecho */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 sm:hidden" />
              
              <div className="overflow-x-auto scrollbar-hide">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {/* Columna Día - Sticky */}
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase border-r bg-gray-50 sticky left-0 z-20 w-14 sm:w-20">
                        Día
                      </th>
                      {colaboradores.map(colaborador => {
                        // Obtener 2 iniciales
                        const nombre = colaborador.nombre_negocio || '';
                        const palabras = nombre.trim().split(' ');
                        const iniciales = palabras.length >= 2
                          ? (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase()
                          : nombre.slice(0, 2).toUpperCase();
                        
                        return (
                          <th 
                            key={colaborador._id}
                            className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase border-r min-w-[50px] sm:min-w-[120px]"
                          >
                            {/* Desktop: nombre completo */}
                            <div className="hidden sm:block font-semibold truncate" title={colaborador.nombre_negocio}>
                              {colaborador.nombre_negocio}
                            </div>
                            {/* Móvil: 2 iniciales con tooltip */}
                            <div 
                              className="sm:hidden font-semibold w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700"
                              title={colaborador.nombre_negocio}
                            >
                              {iniciales}
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase min-w-[60px] sm:min-w-[80px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {obtenerDiasDelMes(mesActual, añoActual).map(dia => {
                    const pagosHoy = agruparPagosPorDia[dia] || [];
                    const totalDia = pagosHoy.reduce((sum, p) => sum + p.montoTotal, 0);

                    return (
                      <tr key={dia} className="hover:bg-gray-50">
                        {/* Columna Día - Sticky */}
                        <td className="px-2 sm:px-3 py-2 text-center border-r bg-gray-50 sticky left-0 z-10">
                          <div className="font-bold text-gray-900 text-sm sm:text-base">{dia}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">
                            {new Date(añoActual, mesActual, dia).toLocaleDateString('es-PE', { weekday: 'short' })}
                          </div>
                        </td>
                        
                        {colaboradores.map(colaborador => {
                          const pagosColaborador = pagosHoy.filter(p => p.colaboradorUserId === colaborador.clerk_id);

                          return (
                            <td key={`${dia}-${colaborador._id}`} className="px-1 sm:px-3 py-1 sm:py-2 border-r">
                              {pagosColaborador.length > 0 ? (
                                <div className="space-y-1">
                                  {pagosColaborador.map(pago => {
                                    const diasCubiertos = pago.diasPagados?.length || 0;
                                    const tooltipInfo = diasCubiertos > 0 
                                      ? `${diasCubiertos} día${diasCubiertos > 1 ? 's' : ''} cubierto${diasCubiertos > 1 ? 's' : ''}`
                                      : pago.observaciones || 'Pago registrado';
                                    
                                    return (
                                      <div 
                                        key={pago._id}
                                        className="flex justify-between items-start p-1.5 sm:p-2 bg-green-50 rounded border-l-2 sm:border-l-4 border-green-400 group relative"
                                        title={tooltipInfo}
                                      >
                                        <div className="flex-1 min-w-0">
                                          {/* Monto - Siempre visible */}
                                          <div className="font-semibold text-green-800 text-xs sm:text-sm truncate">
                                            {formatearMoneda(pago.montoTotal)}
                                          </div>
                                          {/* Detalles - Solo desktop */}
                                          <div className="hidden sm:block text-xs text-green-600">{pago.metodoPago}</div>
                                          {diasCubiertos > 0 && (
                                            <div className="hidden sm:block text-xs text-blue-600 font-medium">
                                              ✓ {diasCubiertos} día{diasCubiertos > 1 ? 's' : ''}
                                            </div>
                                          )}
                                          {pago.observaciones && (
                                            <div className="hidden sm:block text-xs text-gray-500 truncate" title={pago.observaciones}>
                                              {pago.observaciones}
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => setConfirmacionEliminar(pago._id)}
                                          className="ml-1 sm:ml-2 text-red-500 hover:text-red-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                          title="Eliminar"
                                        >
                                          <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center text-gray-300 text-xs">-</div>
                              )}
                            </td>
                          );
                        })}
                        
                        <td className="px-2 sm:px-3 py-2 text-center">
                          {totalDia > 0 && (
                            <span className="font-bold text-green-700 text-xs sm:text-sm">
                              {formatearMoneda(totalDia)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Modal de Creación de Pago - COMPACTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-5xl w-full my-4 max-h-[95vh] overflow-y-auto">
            {/* Header Compacto */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Registrar Pago - {colaboradorSeleccionado?.nombre_negocio}
                </h3>
                <p className="text-xs text-gray-600">Selecciona los días a pagar</p>
              </div>
              <button 
                onClick={handleCerrarModal} 
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              {/* Layout: Calendario + Resumen */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                {/* Calendario (3/5) */}
                <div className="lg:col-span-3">
                  <CalendarioSeleccionDias
                    colaborador={colaboradorSeleccionado}
                    registrosPendientes={registrosPendientes}
                    onSeleccionChange={handleSeleccionDias}
                    loading={loading}
                  />
                </div>

                {/* Resumen + Método de Pago (2/5) */}
                <div className="lg:col-span-2 space-y-4">
                  <ResumenSeleccion
                    registrosSeleccionados={registrosSeleccionados}
                    formatearMoneda={formatearMoneda}
                    colaboradorSeleccionado={colaboradorSeleccionado}
                  />
                  
                  {/* Método de Pago debajo del resumen */}
                  <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                      <CreditCard size={16} />
                      Información del Pago
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Fecha de Pago
                        </label>
                        <input
                          type="date"
                          value={formData.fechaPago}
                          onChange={(e) => setFormData(prev => ({ ...prev, fechaPago: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Método de Pago
                        </label>
                        <select
                          value={formData.metodoPago}
                          onChange={(e) => setFormData(prev => ({ ...prev, metodoPago: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          {metodosPago.map(metodo => (
                            <option key={metodo} value={metodo}>
                              {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Observaciones (opcional)
                        </label>
                        <textarea
                          value={formData.observaciones}
                          onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                          rows={2}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Opcional..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones Sticky en Footer */}
              <div className="sticky bottom-0 bg-white border-t pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCerrarModal}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || registrosSeleccionados.length === 0}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      Guardar Pago ({formatearMoneda(montoCalculado)})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {confirmacionEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmacionEliminar(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PagosRealizados.displayName = 'PagosRealizados';

export default PagosRealizados;
