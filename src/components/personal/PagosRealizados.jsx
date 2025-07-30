import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { getPagosRealizados, createPagoRealizado, deletePagoRealizado } from '../../services/api';
import api from '../../services/api';
import useGestionPersonalData from './useGestionPersonalData';

function PagosRealizados() {
  // Usar el custom hook para obtener datos y funciones compartidas
  const {
    pagos,
    colaboradores,
    registros,
    datosCobros,
    loading,
    error,
    fetchPagos,
    agregarPago,
    eliminarPago,
    setError
  } = useGestionPersonalData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
  const [nuevoPago, setNuevoPago] = useState({
    colaboradorUserId: '',
    fechaPago: new Date().toISOString().split('T')[0],
    montoTotal: 0,
    metodoPago: 'efectivo',
    periodoInicio: '',
    periodoFin: '',
    observaciones: '',
    estado: 'pagado'
  });
  const [pagosMostrados, setPagosMostrados] = useState(10);
  const [userRole, setUserRole] = useState(null);
  
  // Estados para el calendario mensual de pagos
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());

  const metodosPago = ['efectivo', 'transferencia', 'deposito', 'cheque'];
  const estadosPago = ['pagado', 'parcial', 'pendiente'];

  const getFechaActualString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Funciones para el calendario mensual
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

  // Agrupar pagos por día del mes actual
  const agruparPagosPorDia = () => {
    const agrupados = {};
    const pagosDelMes = pagos.filter(pago => {
      const fechaPago = new Date(pago.fechaPago);
      return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === añoActual;
    });

    pagosDelMes.forEach(pago => {
      const dia = new Date(pago.fechaPago).getDate();
      if (!agrupados[dia]) {
        agrupados[dia] = [];
      }
      agrupados[dia].push(pago);
    });

    return agrupados;
  };

  const formatearMoneda = (cantidad) => {
    if (cantidad === null || cantidad === undefined) return 'S/0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(cantidad);
  };

  // Calcular monto pendiente por colaborador (FÓRMULA EXACTA DE GESTIONPERSONALLIST)
  const calcularMontoPendiente = (colaboradorUserId) => {
    if (!colaboradorUserId) return 0;
    
    // Obtener registros de gestión del colaborador
    const registrosColaborador = registros.filter(r => r.colaboradorUserId === colaboradorUserId);
    const pagosColaborador = pagos.filter(p => p.colaboradorUserId === colaboradorUserId);
    
    // Calcular totales de gestión básica (pagosDiarios y adelantos)
    const totalesGestion = registrosColaborador.reduce((totales, registro) => ({
      pagosDiarios: totales.pagosDiarios + (registro.pagodiario || 0),
      adelantos: totales.adelantos + (registro.adelanto || 0)
    }), { pagosDiarios: 0, adelantos: 0 });
    
    // Calcular faltantes de cobros del colaborador
    let faltantesCobros = 0;
    if (datosCobros && datosCobros.resumen && datosCobros.resumen.cobrosDetalle) {
      // Filtrar cobros que pertenecen a este colaborador
      const cobrosColaborador = datosCobros.resumen.cobrosDetalle.filter(cobro => 
        cobro.colaboradorUserId === colaboradorUserId || cobro.vendedorUserId === colaboradorUserId
      );
      
      faltantesCobros = cobrosColaborador.reduce((total, cobro) => total + (cobro.faltantes || 0), 0);
    }
    
    // FÓRMULA EXACTA: totalAPagar = pagosDiarios - faltantesCobros - adelantos
    const totalAPagar = totalesGestion.pagosDiarios - faltantesCobros - totalesGestion.adelantos;
    
    // El saldo pendiente es lo que debe cobrar menos lo que ya se le pagó
    const totalPagado = pagosColaborador.reduce((total, pago) => total + pago.montoTotal, 0);
    
    return totalAPagar - totalPagado;
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field, value) => {
    setNuevoPago(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Abrir modal para agregar pago
  const abrirModalPago = (colaborador) => {
    const montoPendiente = calcularMontoPendiente(colaborador.colaboradorUserId);
    setColaboradorSeleccionado(colaborador);
    setNuevoPago({
      colaboradorUserId: colaborador.colaboradorUserId,
      fechaPago: getFechaActualString(),
      montoTotal: Math.max(0, montoPendiente),
      metodoPago: 'efectivo',
      periodoInicio: '',
      periodoFin: '',
      observaciones: '',
      estado: 'pagado'
    });
    setIsModalOpen(true);
  };

  // Agregar nuevo pago
  const handleAgregarPago = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        colaboradorUserId: nuevoPago.colaboradorUserId,
        fechaPago: new Date(nuevoPago.fechaPago).toISOString(),
        montoTotal: parseFloat(nuevoPago.montoTotal) || 0,
        metodoPago: nuevoPago.metodoPago,
        periodoInicio: nuevoPago.periodoInicio ? new Date(nuevoPago.periodoInicio).toISOString() : null,
        periodoFin: nuevoPago.periodoFin ? new Date(nuevoPago.periodoFin).toISOString() : null,
        observaciones: nuevoPago.observaciones.trim(),
        estado: nuevoPago.estado
      };
      if (formData.montoTotal <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }
      const response = await agregarPago(formData);
      if (response) {
        setIsModalOpen(false);
        setColaboradorSeleccionado(null);
        setNuevoPago({
          colaboradorUserId: '',
          fechaPago: getFechaActualString(),
          montoTotal: 0,
          metodoPago: 'efectivo',
          periodoInicio: '',
          periodoFin: '',
          observaciones: '',
          estado: 'pagado'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al agregar pago');
    }
  };

  // Eliminar pago
  const confirmarEliminarPago = async () => {
    if (!pagoAEliminar) return;
    try {
      await eliminarPago(pagoAEliminar);
      setIsConfirmModalOpen(false);
      setPagoAEliminar(null);
    } catch (err) {
      setError('Error al eliminar pago: ' + (err.response?.data?.message || err.message));
      setIsConfirmModalOpen(false);
      setPagoAEliminar(null);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Obtener el rol del usuario autenticado desde el backend
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await api.get('/api/admin/me');
        setUserRole(res.data.role?.trim().toLowerCase() || null);
      } catch (err) {
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Gestión de Pagos Realizados</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Layout Principal: Desktop lado a lado, Mobile apilado */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        
        {/* Tarjetas de Colaboradores - Desktop: Sidebar, Mobile: Full width */}
        <div className="xl:col-span-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Colaboradores</h3>
          <div className="space-y-4">
            {colaboradores.filter(colaborador => colaborador && colaborador.colaboradorUserId).map(colaborador => {
              const montoPendiente = calcularMontoPendiente(colaborador.colaboradorUserId);
              const ultimoPago = pagos
                .filter(p => p.colaboradorUserId === colaborador.colaboradorUserId)
                .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))[0];

              return (
                <div key={colaborador.colaboradorUserId} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-gray-800">{colaborador.nombre}</h4>
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {colaborador.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full inline-block mt-2">
                      {colaborador.departamento}
                    </p>
                  </div>

                  {/* Información financiera */}
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Saldo Pendiente:</span>
                        <span className={`font-bold text-base ${montoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          S/. {montoPendiente.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Último Pago:</span>
                        <span className="text-sm text-gray-700">
                          {ultimoPago ? formatearFecha(ultimoPago.fechaPago) : 'Sin pagos'}
                        </span>
                      </div>

                      {ultimoPago && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Monto Último:</span>
                          <span className="text-sm font-bold text-green-600">
                            S/. {ultimoPago.montoTotal.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botón para agregar pago */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => abrirModalPago(colaborador)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Registrar Pago
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendario de pagos - Desktop: Main content, Mobile: Full width */}
        <div className="xl:col-span-8">
          <div className="bg-white rounded-xl shadow-lg">
            {/* Header del calendario con navegación */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg lg:text-xl font-bold text-gray-800">Calendario de Pagos</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navegarMes('anterior')}
                    className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <span className="mr-2">←</span>
                    Anterior
                  </button>
                  
                  <div className="text-center">
                    <h4 className="text-base lg:text-lg font-semibold text-gray-800">
                      {obtenerNombreMes(mesActual)} {añoActual}
                    </h4>
                    <button
                      onClick={irAMesActual}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Ir a mes actual
                    </button>
                  </div>
                  
                  <button
                    onClick={() => navegarMes('siguiente')}
                    className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Siguiente
                    <span className="ml-2">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla calendario responsiva */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-12">
                      Día
                    </th>
                    {colaboradores.map(colaborador => (
                      <th 
                        key={colaborador.colaboradorUserId}
                        className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[120px]"
                      >
                        <div className="text-center">
                          <div className="font-semibold text-sm">{colaborador.nombre}</div>
                          <div className="text-xs text-gray-400 hidden md:block">{colaborador.departamento}</div>
                        </div>
                      </th>
                    ))}
                    <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Total Día
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {obtenerDiasDelMes(mesActual, añoActual).map(dia => {
                    const pagosDelDia = agruparPagosPorDia();
                    const pagosHoy = pagosDelDia[dia] || [];
                    const totalDia = pagosHoy.reduce((total, pago) => total + pago.montoTotal, 0);

                    return (
                      <tr key={dia} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                          <div className="text-center">
                            <div className="font-bold">{dia}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(añoActual, mesActual, dia).toLocaleDateString('es-PE', { weekday: 'short' })}
                            </div>
                          </div>
                        </td>
                        {colaboradores.map(colaborador => {
                          const pagosColaborador = pagosHoy.filter(p => p.colaboradorUserId === colaborador.colaboradorUserId);
                          const totalColaborador = pagosColaborador.reduce((total, pago) => total + pago.montoTotal, 0);

                          return (
                            <td 
                              key={`${dia}-${colaborador.colaboradorUserId}`}
                              className="px-2 py-2 text-sm border-r border-gray-200"
                            >
                              {pagosColaborador.length > 0 ? (
                                <div className="space-y-1">
                                  {pagosColaborador.map(pago => (
                                    <div 
                                      key={pago._id}
                                      className="flex justify-between items-center p-2 bg-green-50 rounded border-l-4 border-green-400"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-green-800 text-sm">
                                          {formatearMoneda(pago.montoTotal)}
                                        </div>
                                        <div className="text-xs text-green-600">
                                          {pago.metodoPago}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {pago.estado}
                                        </div>
                                        {pago.observaciones && (
                                          <div className="text-xs text-gray-400 truncate" title={pago.observaciones}>
                                            {pago.observaciones}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => {
                                          setPagoAEliminar(pago._id);
                                          setIsConfirmModalOpen(true);
                                        }}
                                        className="ml-2 text-red-400 hover:text-red-600 text-xs p-1"
                                        title="Eliminar pago"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                  {pagosColaborador.length > 1 && (
                                    <div className="text-xs font-medium text-gray-600 border-t pt-1">
                                      Total: {formatearMoneda(totalColaborador)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <button
                                    onClick={() => abrirModalPago(colaborador)}
                                    className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                    title="Agregar pago"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-sm font-medium text-gray-900 bg-blue-50">
                          <div className="text-center">
                            <div className="font-bold text-blue-800">
                              {formatearMoneda(totalDia)}
                            </div>
                            {pagosHoy.length > 0 && (
                              <div className="text-xs text-blue-600">
                                {pagosHoy.length} pago{pagosHoy.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Fila de totales del mes */}
                <tfoot>
                  <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 border-t-2 border-blue-200">
                    <td className="px-2 py-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                      <div className="text-center">TOTAL MES</div>
                    </td>
                    {colaboradores.map(colaborador => {
                      const pagosDelMes = pagos.filter(pago => {
                        const fechaPago = new Date(pago.fechaPago);
                        return fechaPago.getMonth() === mesActual && 
                               fechaPago.getFullYear() === añoActual &&
                               pago.colaboradorUserId === colaborador.colaboradorUserId;
                      });
                      const totalMesColaborador = pagosDelMes.reduce((total, pago) => total + pago.montoTotal, 0);

                      return (
                        <td 
                          key={`total-${colaborador.colaboradorUserId}`}
                          className="px-2 py-3 text-sm font-bold text-center border-r border-gray-200"
                        >
                          <div className="text-blue-800">
                            {formatearMoneda(totalMesColaborador)}
                          </div>
                          {pagosDelMes.length > 0 && (
                            <div className="text-xs text-blue-600">
                              {pagosDelMes.length} pago{pagosDelMes.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-3 text-sm font-bold text-center bg-blue-200">
                      <div className="text-blue-900">
                        {formatearMoneda(
                          pagos
                            .filter(pago => {
                              const fechaPago = new Date(pago.fechaPago);
                              return fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === añoActual;
                            })
                            .reduce((total, pago) => total + pago.montoTotal, 0)
                        )}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para agregar pago - Completamente responsivo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold mb-4 text-gray-800">
                Registrar Pago - {colaboradorSeleccionado?.nombre}
              </h3>
              <form onSubmit={handleAgregarPago} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Fecha de Pago *</label>
                  <input
                    type="date"
                    value={nuevoPago.fechaPago}
                    onChange={(e) => handleInputChange('fechaPago', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Monto Total *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoPago.montoTotal}
                    onChange={(e) => handleInputChange('montoTotal', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Saldo pendiente: S/. {calcularMontoPendiente(nuevoPago.colaboradorUserId).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Método de Pago *</label>
                  <select
                    value={nuevoPago.metodoPago}
                    onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {metodosPago.map(metodo => (
                      <option key={metodo} value={metodo}>
                        {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Estado del Pago *</label>
                  <select
                    value={nuevoPago.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {estadosPago.map(estado => (
                      <option key={estado} value={estado}>
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Período Inicio</label>
                    <input
                      type="date"
                      value={nuevoPago.periodoInicio}
                      onChange={(e) => handleInputChange('periodoInicio', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Período Fin</label>
                    <input
                      type="date"
                      value={nuevoPago.periodoFin}
                      onChange={(e) => handleInputChange('periodoFin', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Observaciones</label>
                  <textarea
                    value={nuevoPago.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Observaciones adicionales del pago..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setColaboradorSeleccionado(null);
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium shadow-md"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar Pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setPagoAEliminar(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarPago}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PagosRealizados;
