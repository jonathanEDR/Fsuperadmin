import React, { useState, useEffect } from 'react';
import { sucursalInventarioService } from '../../../services/sucursalInventarioService';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { Truck, ScrollText, BarChart3, Plus, RefreshCw, Package, MapPin, Calendar, FileText, Undo2, Store, AlertTriangle, Search, X, Loader2, CheckCircle, XCircle, Info, Check, Clock, Trash2 } from 'lucide-react';

const TransferenciasSucursales = () => {
  // Hook de permisos para control de roles
  const { canViewPrices } = useQuickPermissions();
  
  // Estados para datos
  const [materiales, setMateriales] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [historial, setHistorial] = useState([]);
  
  // Estados de loading
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  
  // Estados para filtros de estadísticas
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Estados del formulario
  const [materialSeleccionado, setMaterialSeleccionado] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Estados de UI
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('transferencia'); // 'transferencia' | 'estadisticas' | 'historial'
  const [mostrarModalRevertir, setMostrarModalRevertir] = useState(false);
  const [movimientoARevertir, setMovimientoARevertir] = useState(null);
  const [motivoReversion, setMotivoReversion] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (vistaActiva === 'historial') {
      cargarHistorial();
    } else if (vistaActiva === 'transferencia') {
      // Recargar materiales cuando se vuelve a la vista de transferencias
      cargarDatos();
    } else if (vistaActiva === 'estadisticas') {
      // Cargar estadísticas cuando se accede a esa vista
      cargarEstadisticas();
    }
  }, [vistaActiva]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [materialesRes, sucursalesRes, estadisticasRes] = await Promise.all([
        sucursalInventarioService.obtenerMaterialesDisponibles(),
        sucursalInventarioService.obtenerSucursalesActivas(),
        sucursalInventarioService.obtenerEstadisticas()
      ]);

      setMateriales(materialesRes.data || []);
      setSucursales(sucursalesRes.data || []);
      setEstadisticas(estadisticasRes.data || []);
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const response = await sucursalInventarioService.obtenerHistorialCompleto({ limite: 50 });
      setHistorial(response.data || []);
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar historial: ' + error.message);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      setLoadingEstadisticas(true);
      const filtros = {};
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
      
      const response = await sucursalInventarioService.obtenerEstadisticas(filtros);
      setEstadisticas(response.data || []);
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar estadísticas: ' + error.message);
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const aplicarFiltrosFecha = () => {
    cargarEstadisticas();
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    // Recargar estadísticas sin filtros
    setTimeout(() => cargarEstadisticas(), 100);
  };

  const abrirModalRevertir = (movimiento) => {
    setMovimientoARevertir(movimiento);
    setMotivoReversion('');
    setMostrarModalRevertir(true);
  };

  const confirmarReversion = async () => {
    if (!motivoReversion.trim()) {
      mostrarMensaje('error', 'Por favor ingrese el motivo de la reversión');
      return;
    }

    try {
      setProcesando(true);
      const resultado = await sucursalInventarioService.revertirTransferencia(
        movimientoARevertir._id,
        motivoReversion
      );

      mostrarMensaje('success', resultado.message || 'Transferencia revertida exitosamente');
      setMostrarModalRevertir(false);
      setMovimientoARevertir(null);
      setMotivoReversion('');
      
      // Recargar datos
      cargarDatos();
      cargarHistorial();

    } catch (error) {
      mostrarMensaje('error', error.message);
    } finally {
      setProcesando(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!materialSeleccionado || !sucursalSeleccionada || !cantidad) {
      mostrarMensaje('error', 'Por favor complete todos los campos requeridos');
      return;
    }

    const cantidadNum = parseFloat(cantidad);
    if (cantidadNum <= 0) {
      mostrarMensaje('error', 'La cantidad debe ser mayor a 0');
      return;
    }

    // Verificar disponibilidad
    const material = materiales.find(m => m._id === materialSeleccionado);
    if (cantidadNum > material.disponible) {
      mostrarMensaje('error', `Stock insuficiente. Disponible: ${material.disponible} ${material.unidadMedida}`);
      return;
    }

    try {
      setProcesando(true);
      
      const datos = {
        materialId: materialSeleccionado,
        sucursalId: sucursalSeleccionada,
        cantidad: cantidadNum,
        motivo: motivo || 'Transferencia a sucursal',
        observaciones
      };

      const resultado = await sucursalInventarioService.registrarTransferencia(datos);
      
      mostrarMensaje('success', resultado.message || 'Transferencia realizada exitosamente');
      
      // Limpiar formulario
      setMaterialSeleccionado('');
      setSucursalSeleccionada('');
      setCantidad('');
      setMotivo('');
      setObservaciones('');
      setMostrarFormulario(false);
      
      // Recargar datos
      cargarDatos();
      
    } catch (error) {
      mostrarMensaje('error', error.message);
    } finally {
      setProcesando(false);
    }
  };

  const materialActual = materiales.find(m => m._id === materialSeleccionado);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-teal-500" />
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de notificación */}
      {mensaje.texto && (
        <div className={`p-4 rounded-xl ${
          mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' :
          mensaje.tipo === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`flex items-center gap-2 ${
            mensaje.tipo === 'success' ? 'text-green-800' :
            mensaje.tipo === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {mensaje.tipo === 'success' ? <CheckCircle size={16} /> : mensaje.tipo === 'error' ? <XCircle size={16} /> : <Info size={16} />}
            {mensaje.texto}
          </p>
        </div>
      )}

      {/* Tabs de navegación - Responsive: solo iconos en móvil */}
      <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200">
        <button
          onClick={() => setVistaActiva('transferencia')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors ${
            vistaActiva === 'transferencia'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Transferencias"
        >
          <span className="text-lg sm:text-base"><Truck size={18} /></span>
          <span className="hidden sm:inline ml-1">Transferencias</span>
        </button>
        <button
          onClick={() => setVistaActiva('historial')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors ${
            vistaActiva === 'historial'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Historial"
        >
          <span className="text-lg sm:text-base"><ScrollText size={18} /></span>
          <span className="hidden sm:inline ml-1">Historial</span>
        </button>
        <button
          onClick={() => setVistaActiva('estadisticas')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors ${
            vistaActiva === 'estadisticas'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Estadísticas por Sucursal"
        >
          <span className="text-lg sm:text-base"><BarChart3 size={18} /></span>
          <span className="hidden sm:inline ml-1">Estadísticas</span>
        </button>
      </div>

      {/* Vista de Transferencias */}
      {vistaActiva === 'transferencia' && (
        <div className="space-y-6">
          {/* Botones de acción - Responsive: solo iconos en móvil */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="px-3 sm:px-6 py-2 sm:py-3 text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl transition-colors shadow-sm flex items-center gap-2"
              title="Nueva Transferencia a Sucursal"
            >
              <span className="text-lg"><Plus size={18} /></span>
              <span className="hidden sm:inline">Nueva Transferencia a Sucursal</span>
            </button>
            <button
              onClick={() => cargarDatos()}
              disabled={loading}
              className="px-3 sm:px-4 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2"
              title="Actualizar lista de materiales"
            >
              <span>{loading ? <Clock size={16} className="animate-pulse" /> : <RefreshCw size={16} />}</span>
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>

          {/* Resumen de materiales disponibles */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={18} className="text-gray-600" /> <span className="hidden sm:inline">Materiales Disponibles para Transferir</span>
              <span className="sm:hidden">Materiales Disponibles</span>
            </h3>
            {materiales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay materiales disponibles en el almacén central
              </p>
            ) : (
              <>
                {/* Vista de tarjetas para móvil */}
                <div className="grid grid-cols-1 gap-3 sm:hidden">
                  {materiales.map(material => (
                    <div
                      key={material._id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="font-medium text-gray-900 mb-2">
                        {material.nombre}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Disponible:</span>
                        <span className="font-semibold text-green-600">
                          {material.disponible} {material.unidadMedida}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista de tabla para desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Material</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Disponible</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Unidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {materiales.map(material => (
                        <tr key={material._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{material.nombre}</td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">
                            {material.disponible}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {material.unidadMedida}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vista de Historial */}
      {vistaActiva === 'historial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ScrollText size={18} className="text-gray-600" /> <span className="hidden sm:inline">Historial de Transferencias</span>
              <span className="sm:hidden">Historial</span>
            </h3>
            <button
              onClick={cargarHistorial}
              className="px-3 sm:px-4 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1"
              title="Actualizar historial"
            >
              <span><RefreshCw size={16} /></span>
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>

          {loadingHistorial ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-teal-500" />
              <span className="ml-3 text-gray-600">Cargando historial...</span>
            </div>
          ) : historial.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-500">No hay transferencias registradas</p>
            </div>
          ) : (
            <>
              {/* Vista de tarjetas para móvil - visible solo en pantallas < 640px */}
              <div className="block sm:hidden space-y-3">
                {historial.map((mov) => {
                  const esRevertido = mov.observaciones?.includes('[REVERTIDO');
                  const esReversion = mov.cantidad < 0;

                  return (
                    <div
                      key={mov._id}
                      className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                        esRevertido ? 'border-red-400 bg-red-50' :
                        esReversion ? 'border-orange-400' : 'border-green-400'
                      }`}
                    >
                      {/* Header: Material y Cantidad */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {mov.item?.nombre || 'Material eliminado'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {mov.item?.unidadMedida}
                          </div>
                        </div>
                        <span className={`text-lg font-bold ${
                          esReversion ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {esReversion ? '' : '+'}{mov.cantidad}
                        </span>
                      </div>

                      {/* Info: Sucursal y Fecha */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 flex items-center gap-1"><MapPin size={14} /> Sucursal:</span>
                          <span className="text-gray-900 font-medium">
                            {mov.sucursalDestino?.nombre || 'Sin sucursal'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> Fecha:</span>
                          <span className="text-gray-700">
                            {new Date(mov.fecha).toLocaleString('es-PE', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {mov.motivo && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 flex items-center gap-1"><FileText size={14} /> Motivo:</span>
                            <span className="text-gray-700 text-right max-w-[60%] truncate">
                              {mov.motivo}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Acción: Botón Revertir */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {!esRevertido && !esReversion ? (
                          <button
                            onClick={() => abrirModalRevertir(mov)}
                            className="w-full px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <span><Undo2 size={14} /></span>
                            <span>Revertir</span>
                          </button>
                        ) : (
                          <div className="text-center text-sm text-gray-400 flex items-center justify-center gap-1">
                            {esRevertido ? <><Check size={14} /> Revertido</> : <><Undo2 size={14} /> Reversión</>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vista de tabla para desktop - visible solo en pantallas >= 640px */}
              <div className="hidden sm:block bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Material</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Sucursal</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Operador</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Motivo</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {historial.map((mov) => {
                        const esRevertido = mov.observaciones?.includes('[REVERTIDO');
                        const esReversion = mov.cantidad < 0;

                        return (
                          <tr key={mov._id} className={`hover:bg-gray-50 ${esRevertido ? 'bg-red-50' : ''}`}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(mov.fecha).toLocaleString('es-PE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {mov.item?.nombre || 'Material eliminado'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {mov.item?.unidadMedida}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">
                                {mov.sucursalDestino?.nombre || 'Sin sucursal'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {mov.sucursalDestino?.ubicacion}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${
                                esReversion ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {esReversion ? '' : '+'}{mov.cantidad}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {mov.operadorEmail || mov.operador}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {mov.motivo}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {!esRevertido && !esReversion ? (
                                <button
                                  onClick={() => abrirModalRevertir(mov)}
                                  className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                                  title="Revertir transferencia"
                                >
                                  <Undo2 size={12} /> Revertir
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  {esRevertido ? 'Revertido' : 'Reversión'}
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
            </>
          )}
        </div>
      )}

      {/* Vista de Estadísticas */}
      {vistaActiva === 'estadisticas' && (
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-gray-600" /> <span className="hidden sm:inline">Inventario por Sucursal</span>
              <span className="sm:hidden">Inventario</span>
            </h3>
            <button
              onClick={cargarEstadisticas}
              disabled={loadingEstadisticas}
              className="px-3 sm:px-4 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1"
              title="Actualizar estadísticas"
            >
              <span>{loadingEstadisticas ? <Clock size={16} className="animate-pulse" /> : <RefreshCw size={16} />}</span>
              <span className="hidden sm:inline">{loadingEstadisticas ? 'Cargando...' : 'Actualizar'}</span>
            </button>
          </div>

          {/* Filtros de fecha */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar size={14} /> Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar size={14} /> Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={aplicarFiltrosFecha}
                  className="w-full px-3 sm:px-4 py-2 text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl transition-colors flex items-center justify-center gap-1"
                  title="Filtrar por fechas"
                >
                  <span><Search size={16} /></span>
                  <span className="hidden sm:inline">Filtrar</span>
                </button>
              </div>
              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="w-full px-3 sm:px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-1"
                  title="Limpiar filtros"
                >
                  <span><X size={16} /></span>
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              </div>
            </div>
            {(fechaInicio || fechaFin) && (
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">Filtrando:</span>
                {fechaInicio && <span className="ml-2">Desde {new Date(fechaInicio).toLocaleDateString('es-ES')}</span>}
                {fechaFin && <span className="ml-2">Hasta {new Date(fechaFin).toLocaleDateString('es-ES')}</span>}
              </div>
            )}
          </div>

          {loadingEstadisticas ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-teal-500" />
              <span className="ml-3 text-gray-600">Cargando estadísticas...</span>
            </div>
          ) : estadisticas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-500">
                No hay datos de inventario en sucursales
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estadisticas.map(stat => (
                <div key={stat._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{stat.nombreSucursal}</h4>
                      <p className="text-sm text-gray-500">{stat.ubicacion}</p>
                    </div>
                    <span className="p-2 bg-teal-50 rounded-xl border border-teal-100"><Store size={20} className="text-teal-600" /></span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Materiales:</span>
                      <span className="font-semibold">{stat.totalMateriales}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cantidad Total:</span>
                      <span className="font-semibold">{stat.cantidadTotal.toFixed(2)}</span>
                    </div>
                    {canViewPrices && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valor Total:</span>
                        <span className="font-semibold text-green-600">
                          S/ {stat.valorTotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Nueva Transferencia */}
      {mostrarFormulario && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setMostrarFormulario(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Store size={20} className="text-teal-600" />
                Registrar Salida a Sucursal
              </h3>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector de Material */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material * <span className="text-gray-500 text-xs">(Solo materiales con stock)</span>
                  </label>
                  <select
                    value={materialSeleccionado}
                    onChange={(e) => setMaterialSeleccionado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  >
                    <option value="">Seleccione un material</option>
                    {materiales.map(material => (
                      <option key={material._id} value={material._id}>
                        {material.nombre} - Disponible: {material.disponible} {material.unidadMedida}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Información del material seleccionado */}
                {materialActual && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Stock Total</p>
                        <p className="font-semibold">{materialActual.cantidadTotal} {materialActual.unidadMedida}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Disponible</p>
                        <p className="font-semibold text-green-600">{materialActual.disponible} {materialActual.unidadMedida}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selector de Sucursal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sucursal Destino *
                  </label>
                  <select
                    value={sucursalSeleccionada}
                    onChange={(e) => setSucursalSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  >
                    <option value="">Seleccione una sucursal</option>
                    {sucursales.map(sucursal => (
                      <option key={sucursal._id} value={sucursal._id}>
                        {sucursal.nombre} - {sucursal.ubicacion}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad a Transferir *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ingrese la cantidad"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  />
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Abastecimiento mensual, pedido urgente, etc."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows="3"
                    placeholder="Notas adicionales (opcional)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={procesando}
                    className="flex-1 px-4 py-2 text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {procesando ? 'Procesando...' : <><Check size={16} /> Confirmar Transferencia</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para revertir */}
      {mostrarModalRevertir && movimientoARevertir && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={22} className="text-amber-500" /> Confirmar Reversión
            </h3>
            
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Material:</strong> {movimientoARevertir.item?.nombre}
              </p>
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Cantidad:</strong> {movimientoARevertir.cantidad} {movimientoARevertir.item?.unidadMedida}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>Sucursal:</strong> {movimientoARevertir.sucursalDestino?.nombre}
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Esta acción devolverá el material al almacén central y lo restará del inventario de la sucursal.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la reversión *
              </label>
              <textarea
                value={motivoReversion}
                onChange={(e) => setMotivoReversion(e.target.value)}
                rows="3"
                placeholder="Ej: Transferencia realizada por error, cantidad incorrecta, etc."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmarReversion}
                disabled={procesando || !motivoReversion.trim()}
                className="flex-1 px-4 py-2 text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                {procesando ? 'Procesando...' : <><Check size={16} /> Confirmar Reversión</>}
              </button>
              <button
                onClick={() => {
                  setMostrarModalRevertir(false);
                  setMovimientoARevertir(null);
                  setMotivoReversion('');
                }}
                disabled={procesando}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferenciasSucursales;
