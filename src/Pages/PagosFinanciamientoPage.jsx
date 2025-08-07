import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit, Eye, CreditCard, Calendar, DollarSign, Building, User, CheckCircle, Clock, XCircle } from 'lucide-react';
import TablaPagosFinanciamiento from '../components/Finanzas/PagosFinanciamiento/TablaPagosFinanciamiento';
import axios from 'axios';
import { toast } from 'react-toastify';
import CampoPagosFinanciamiento from '../components/Finanzas/PagosFinanciamiento/CampoPagosFinanciamiento';
import { useFormularioPagosFinanciamiento } from '../components/Finanzas/PagosFinanciamiento/useFormularioPagosFinanciamiento';
import { pagosFinanciamientoService, prestamosService } from '../services/finanzasService';

// Función de utilidad para validar objetos de préstamo
const esPrestamoValido = (prestamo) => {
  return prestamo && 
         typeof prestamo === 'object' && 
         (prestamo.id || prestamo._id) &&
         typeof (prestamo.id || prestamo._id) !== 'undefined';
};

function PagosFinanciamientoPage() {
  const [pagos, setPagos] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    prestamoId: '',
    estado: '',
    metodoPago: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [cargando, setCargando] = useState(true);
  const [datosInicializados, setDatosInicializados] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoModal, setTipoModal] = useState('crear'); // crear, editar, ver
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    totalPagos: 0,
    pagosRealizados: 0,
    pagosPendientes: 0,
    montoTotal: 0,
    montoPagado: 0,
    montoPendiente: 0
  });

  const nuevoPago = useFormularioPagosFinanciamiento({
    prestamoId: '',
    numeroCuota: '',
    fechaPago: '',
    fechaVencimiento: '',
    montoPrincipal: '',
    montoInteres: '',
    montoTotal: '',
    metodoPago: 'transferencia',
    estado: 'pendiente',
    referenciaPago: '',
    observaciones: '',
    comprobante: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar pagos filtrados cuando cambian los filtros
  useEffect(() => {
    cargarPagos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      // Cargar pagos
      const pagosResponse = await pagosFinanciamientoService.obtenerTodos(filtros);
      setPagos(Array.isArray(pagosResponse.data) ? pagosResponse.data : []);
      
      // Cargar préstamos de manera defensiva
      try {
        const prestamosResponse = await prestamosService.obtenerTodos();
        console.log('🔍 Respuesta de préstamos:', prestamosResponse);
        const prestamosData = Array.isArray(prestamosResponse.data) ? prestamosResponse.data : [];
        console.log('🔍 Datos de préstamos procesados:', prestamosData);
        setPrestamos(prestamosData);
      } catch (prestamosError) {
        console.warn('Error al cargar préstamos:', prestamosError);
        setPrestamos([]); // Array vacío si no se pueden cargar los préstamos
      }
      
      calcularEstadisticas(Array.isArray(pagosResponse.data) ? pagosResponse.data : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setPagos([]);
      setPrestamos([]);
    } finally {
      setCargando(false);
      setDatosInicializados(true); // Marcar que los datos básicos están listos
    }
  };

  const cargarPagos = async () => {
    try {
      setCargando(true);
      const response = await pagosFinanciamientoService.obtenerTodos(filtros);
      setPagos(response.data || []);
      calcularEstadisticas(response.data || []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstadisticas = (data) => {
    const stats = data.reduce((acc, pago) => {
      acc.totalPagos += 1;
      const montoTotal = parseFloat(pago.montoTotal || 0);
      acc.montoTotal += montoTotal;
      
      if (pago.estado === 'realizado') {
        acc.pagosRealizados += 1;
        acc.montoPagado += montoTotal;
      } else if (pago.estado === 'pendiente') {
        acc.pagosPendientes += 1;
        acc.montoPendiente += montoTotal;
      }
      
      return acc;
    }, { 
      totalPagos: 0, 
      pagosRealizados: 0, 
      pagosPendientes: 0, 
      montoTotal: 0, 
      montoPagado: 0, 
      montoPendiente: 0 
    });

    setEstadisticas(stats);
  };

  const abrirModal = (tipo, pago = null) => {
    setTipoModal(tipo);
    setPagoSeleccionado(pago);
    if (pago && tipo === 'editar') {
      nuevoPago.setFormData({
        ...pago,
        fechaPago: pago.fechaPago ? new Date(pago.fechaPago).toISOString().split('T')[0] : '',
        fechaVencimiento: pago.fechaVencimiento ? new Date(pago.fechaVencimiento).toISOString().split('T')[0] : ''
      });
    } else if (tipo === 'crear') {
      nuevoPago.resetForm();
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPagoSeleccionado(null);
    nuevoPago.resetForm();
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    try {
      const datosPago = {
        ...nuevoPago.formData,
        montoTotal: parseFloat(nuevoPago.formData?.montoPrincipal || "" || 0) + parseFloat(nuevoPago.formData?.montoInteres || "" || 0)
      };

      if (tipoModal === 'crear') {
        await pagosFinanciamientoService.crear(datosPago);
      } else if (tipoModal === 'editar') {
        await pagosFinanciamientoService.actualizar(pagoSeleccionado._id, datosPago);
      }
      cerrarModal();
      cargarPagos();
    } catch (error) {
      console.error('Error al guardar pago:', error);
    }
  };

  const eliminarPago = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este pago?')) {
      try {
        await pagosFinanciamientoService.eliminar(id);
        cargarPagos();
      } catch (error) {
        console.error('Error al eliminar pago:', error);
      }
    }
  };

  const marcarComoRealizado = async (id) => {
    try {
      await pagosFinanciamientoService.actualizar(id, { 
        estado: 'realizado',
        fechaPago: new Date().toISOString()
      });
      cargarPagos();
    } catch (error) {
      console.error('Error al marcar pago como realizado:', error);
    }
  };

  const columnasTabla = [
    {
      campo: 'numeroCuota',
      encabezado: 'Cuota',
      renderizar: (pago) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span className="font-medium">#{pago.numeroCuota}</span>
        </div>
      )
    },
    {
      campo: 'prestamoId',
      encabezado: 'Préstamo',
      renderizar: (pago) => {
        const prestamo = Array.isArray(prestamos) ? prestamos.find(p => (p.id || p._id) === pago.prestamoId) : null;
        return (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-600" />
            <span>
              {prestamo 
                ? `${prestamo.entidadFinanciera || 'Sin entidad'} - ${prestamo.descripcion || prestamo.tipo || 'Sin descripción'}` 
                : 'N/A'
              }
            </span>
          </div>
        );
      }
    },
    {
      campo: 'montoTotal',
      encabezado: 'Monto',
      renderizar: (pago) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-600">
            ${parseFloat(pago.montoTotal || 0).toLocaleString()}
          </span>
        </div>
      )
    },
    {
      campo: 'fechaVencimiento',
      encabezado: 'Vencimiento',
      renderizar: (pago) => {
        const fechaVencimiento = new Date(pago.fechaVencimiento);
        const hoy = new Date();
        const esVencido = fechaVencimiento < hoy && pago.estado === 'pendiente';
        
        return (
          <div className={`flex items-center gap-2 ${esVencido ? 'text-red-600' : ''}`}>
            <Calendar className="w-4 h-4" />
            <span>{fechaVencimiento.toLocaleDateString()}</span>
            {esVencido && <XCircle className="w-4 h-4" />}
          </div>
        );
      }
    },
    {
      campo: 'estado',
      encabezado: 'Estado',
      renderizar: (pago) => {
        const iconoEstado = {
          'pendiente': Clock,
          'realizado': CheckCircle,
          'vencido': XCircle
        };
        
        const IconoEstado = iconoEstado[pago.estado] || Clock;
        
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              pago.estado === 'realizado' ? 'bg-green-100 text-green-800' :
              pago.estado === 'vencido' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              <IconoEstado className="w-3 h-3" />
              {pago.estado}
            </span>
          </div>
        );
      }
    },
    {
      campo: 'metodoPago',
      encabezado: 'Método',
      renderizar: (pago) => (
        <span className="text-gray-600">{pago.metodoPago}</span>
      )
    }
  ];

  const acciones = [
    {
      icono: <Eye className="w-4 h-4" />,
      tooltip: 'Ver detalles',
      onClick: (pago) => abrirModal('ver', pago),
      color: 'text-blue-600'
    },
    {
      icono: <Edit className="w-4 h-4" />,
      tooltip: 'Editar',
      onClick: (pago) => abrirModal('editar', pago),
      color: 'text-green-600'
    },
    {
      icono: <CheckCircle className="w-4 h-4" />,
      tooltip: 'Marcar como realizado',
      onClick: (pago) => marcarComoRealizado(pago._id),
      color: 'text-green-600',
      condicional: (pago) => pago.estado === 'pendiente'
    },
    {
      icono: <Trash2 className="w-4 h-4" />,
      tooltip: 'Eliminar',
      onClick: (pago) => eliminarPago(pago._id),
      color: 'text-red-600'
    }
  ];

  const tarjetasEstadisticas = [
    {
      titulo: 'Total Pagos',
      valor: estadisticas.totalPagos,
      icono: <CreditCard className="w-6 h-6" />,
      color: 'bg-blue-500',
      tendencia: null
    },
    {
      titulo: 'Pagos Realizados',
      valor: estadisticas.pagosRealizados,
      icono: <CheckCircle className="w-6 h-6" />,
      color: 'bg-green-500',
      tendencia: null
    },
    {
      titulo: 'Pagos Pendientes',
      valor: estadisticas.pagosPendientes,
      icono: <Clock className="w-6 h-6" />,
      color: 'bg-yellow-500',
      tendencia: null
    },
    {
      titulo: 'Monto Total',
      valor: `$${estadisticas.montoTotal.toLocaleString()}`,
      icono: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-500',
      tendencia: null
    }
  ];

  const metodosPago = [
    'transferencia',
    'efectivo',
    'cheque',
    'tarjeta_credito',
    'tarjeta_debito',
    'debito_automatico'
  ];

  const estadosPago = [
    'pendiente',
    'realizado',
    'vencido'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagos de Financiamiento</h1>
        <p className="text-gray-600">Gestiona todos los pagos y cuotas de préstamos</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {tarjetasEstadisticas.map((tarjeta, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{tarjeta.titulo}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{tarjeta.valor}</p>
              </div>
              <div className={`p-3 rounded-full ${tarjeta.color} text-white`}>
                {tarjeta.icono}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar pagos..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtros.prestamoId}
            onChange={(e) => setFiltros({...filtros, prestamoId: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los préstamos</option>
            {Array.isArray(prestamos) && prestamos
              .filter(esPrestamoValido) // Usar la función de validación
              .map(prestamo => (
                <option key={prestamo.id || prestamo._id} value={prestamo.id || prestamo._id}>
                  {(prestamo.entidadFinanciera || 'Sin entidad')} - {(prestamo.descripcion || prestamo.tipo || 'Sin descripción')}
                </option>
              ))
            }
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            {estadosPago.map(estado => (
              <option key={estado} value={estado}>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filtros.metodoPago}
            onChange={(e) => setFiltros({...filtros, metodoPago: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los métodos</option>
            {metodosPago.map(metodo => (
              <option key={metodo} value={metodo}>
                {metodo.replace('_', ' ').charAt(0).toUpperCase() + metodo.replace('_', ' ').slice(1)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Fecha inicio"
          />

          <input
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Fecha fin"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Pagos</h2>
          <button
            onClick={() => abrirModal('crear')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pago
          </button>
        </div>

        <TablaPagosFinanciamiento
          datos={pagos}
          columnas={columnasTabla}
          acciones={acciones}
          cargando={cargando}
          mensajeVacio="No hay pagos registrados"
        />
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tipoModal === 'crear' ? 'Nuevo Pago' :
                     tipoModal === 'editar' ? 'Editar Pago' :
                     'Detalles del Pago'}
                  </h3>
                  <button
                    onClick={cerrarModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                {tipoModal === 'ver' && pagoSeleccionado ? (
                  <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Pago</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Número de Cuota:</span>
                    <p className="text-gray-900 font-semibold">#{pagoSeleccionado.numeroCuota}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Monto Principal:</span>
                    <p className="text-gray-900">${parseFloat(pagoSeleccionado.montoPrincipal || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Monto Interés:</span>
                    <p className="text-gray-900">${parseFloat(pagoSeleccionado.montoInteres || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Monto Total:</span>
                    <p className="text-gray-900 font-semibold text-lg">
                      ${parseFloat(pagoSeleccionado.montoTotal || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Estado y Método</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Estado:</span>
                    <p className="text-gray-900">{pagoSeleccionado.estado}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Método de Pago:</span>
                    <p className="text-gray-900">{pagoSeleccionado.metodoPago}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Fecha de Vencimiento:</span>
                    <p className="text-gray-900">
                      {new Date(pagoSeleccionado.fechaVencimiento).toLocaleDateString()}
                    </p>
                  </div>
                  {pagoSeleccionado.fechaPago && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Fecha de Pago:</span>
                      <p className="text-gray-900">
                        {new Date(pagoSeleccionado.fechaPago).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {pagoSeleccionado.referenciaPago && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Referencia de Pago</h3>
                <p className="text-gray-600">{pagoSeleccionado.referenciaPago}</p>
              </div>
            )}
            
            {pagoSeleccionado.observaciones && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Observaciones</h3>
                <p className="text-gray-600">{pagoSeleccionado.observaciones}</p>
              </div>
            )}
          </div>
        ) : !datosInicializados ? (
          <div className="p-6 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-gray-500 mt-4">Cargando formulario...</p>
          </div>
        ) : (
          <form onSubmit={manejarSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CampoPagosFinanciamiento
                label="Préstamo"
                name="prestamoId"
                type="select"
                options={(() => {
                  // Validación defensiva completa
                  if (!Array.isArray(prestamos) || prestamos.length === 0) {
                    return [{ value: '', label: 'No hay préstamos disponibles' }];
                  }
                  
                  return prestamos
                    .filter(esPrestamoValido) // Usar la función de validación
                    .map(prestamo => {
                      const id = prestamo.id || prestamo._id || '';
                      const entidad = prestamo.entidadFinanciera || 'Sin entidad';
                      const descripcion = prestamo.descripcion || prestamo.tipo || `Préstamo #${id}`;
                      
                      return {
                        value: id,
                        label: `${entidad} - ${descripcion}`
                      };
                    });
                })()}
                value={nuevoPago.formData?.prestamoId || ''}
                onChange={nuevoPago.handleChange}
                required
                disabled={!Array.isArray(prestamos) || prestamos.length === 0}
              />

              <CampoPagosFinanciamiento
                label="Número de Cuota"
                name="numeroCuota"
                type="number"
                value={nuevoPago.formData?.numeroCuota || ""}
                onChange={nuevoPago.handleChange}
                min="1"
                required
              />

              <CampoPagosFinanciamiento
                label="Monto Principal"
                name="montoPrincipal"
                type="number"
                value={nuevoPago.formData?.montoPrincipal || ""}
                onChange={nuevoPago.handleChange}
                step="0.01"
                min="0"
                required
              />

              <CampoPagosFinanciamiento
                label="Monto Interés"
                name="montoInteres"
                type="number"
                value={nuevoPago.formData?.montoInteres || ""}
                onChange={nuevoPago.handleChange}
                step="0.01"
                min="0"
                required
              />

              <CampoPagosFinanciamiento
                label="Fecha de Vencimiento"
                name="fechaVencimiento"
                type="date"
                value={nuevoPago.formData?.fechaVencimiento || ""}
                onChange={nuevoPago.handleChange}
                required
              />

              <CampoPagosFinanciamiento
                label="Método de Pago"
                name="metodoPago"
                type="select"
                options={metodosPago.map(metodo => ({ 
                  value: metodo, 
                  label: metodo.replace('_', ' ').charAt(0).toUpperCase() + metodo.replace('_', ' ').slice(1)
                }))}
                value={nuevoPago.formData?.metodoPago || ""}
                onChange={nuevoPago.handleChange}
                required
              />

              <CampoPagosFinanciamiento
                label="Estado"
                name="estado"
                type="select"
                options={estadosPago.map(estado => ({ 
                  value: estado, 
                  label: estado.charAt(0).toUpperCase() + estado.slice(1) 
                }))}
                value={nuevoPago.formData?.estado || ""}
                onChange={nuevoPago.handleChange}
                required
              />

              {nuevoPago.formData?.estado || "" === 'realizado' && (
                <CampoPagosFinanciamiento
                  label="Fecha de Pago"
                  name="fechaPago"
                  type="date"
                  value={nuevoPago.formData?.fechaPago || ""}
                  onChange={nuevoPago.handleChange}
                />
              )}
            </div>

            <CampoPagosFinanciamiento
              label="Referencia de Pago"
              name="referenciaPago"
              type="text"
              value={nuevoPago.formData?.referenciaPago || ""}
              onChange={nuevoPago.handleChange}
              placeholder="Número de transacción, cheque, etc."
            />

            <CampoPagosFinanciamiento
              label="Observaciones"
              name="observaciones"
              type="textarea"
              value={nuevoPago.formData?.observaciones || ""}
              onChange={nuevoPago.handleChange}
              rows={3}
            />

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Monto Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${(parseFloat(nuevoPago.formData?.montoPrincipal || "" || 0) + parseFloat(nuevoPago.formData?.montoInteres || "" || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {tipoModal === 'crear' ? 'Crear Pago' : 'Actualizar Pago'}
              </button>
            </div>
          </form>
        )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cerrarModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PagosFinanciamientoPage;
