import React, { useState, useEffect } from 'react';
import { sucursalInventarioService } from '../../../services/sucursalInventarioService';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

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

  // Estados para tarjetas expandibles de estadísticas
  const [sucursalExpandida, setSucursalExpandida] = useState(null);
  const [detalleSucursal, setDetalleSucursal] = useState({});
  const [loadingDetalle, setLoadingDetalle] = useState({});

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

  // Función para expandir/colapsar tarjeta y cargar detalle de sucursal
  const toggleDetalleSucursal = async (sucursalId) => {
    // Si ya está expandida, la colapsamos
    if (sucursalExpandida === sucursalId) {
      setSucursalExpandida(null);
      return;
    }

    // Expandir la tarjeta
    setSucursalExpandida(sucursalId);

    // Si ya tenemos el detalle cacheado, no lo volvemos a cargar
    if (detalleSucursal[sucursalId]) {
      return;
    }

    // Cargar el detalle de la sucursal
    try {
      setLoadingDetalle(prev => ({ ...prev, [sucursalId]: true }));
      const response = await sucursalInventarioService.obtenerInventarioSucursal(sucursalId);
      // La respuesta tiene estructura: { sucursal, items, totalItems, valorTotal }
      // Los items pueden venir en response.data.items o response.items dependiendo del formato
      const items = response.data?.items || response.items || [];
      setDetalleSucursal(prev => ({
        ...prev,
        [sucursalId]: items
      }));
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar detalle: ' + error.message);
    } finally {
      setLoadingDetalle(prev => ({ ...prev, [sucursalId]: false }));
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de notificación */}
      {mensaje.texto && (
        <div className={`p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' :
          mensaje.tipo === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`${
            mensaje.tipo === 'success' ? 'text-green-800' :
            mensaje.tipo === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {mensaje.tipo === 'success' ? '✅ ' : mensaje.tipo === 'error' ? '❌ ' : 'ℹ️ '}
            {mensaje.texto}
          </p>
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setVistaActiva('transferencia')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActiva === 'transferencia'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🚚 Transferencias
        </button>
        <button
          onClick={() => setVistaActiva('historial')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActiva === 'historial'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📜 Historial
        </button>
        <button
          onClick={() => setVistaActiva('estadisticas')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActiva === 'estadisticas'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Estadísticas por Sucursal
        </button>
      </div>

      {/* Vista de Transferencias */}
      {vistaActiva === 'transferencia' && (
        <div className="space-y-6">
          {/* Botones de acción */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-md flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Nueva Transferencia a Sucursal</span>
            </button>
            <button
              onClick={() => cargarDatos()}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
              title="Actualizar lista de materiales"
            >
              <span>{loading ? '⏳' : '🔄'}</span>
              <span>Actualizar</span>
            </button>
          </div>

          {/* Resumen de materiales disponibles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📦 Materiales Disponibles para Transferir
            </h3>
            {materiales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay materiales disponibles en el almacén central
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
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
            )}
          </div>
        </div>
      )}

      {/* Vista de Historial */}
      {vistaActiva === 'historial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              📜 Historial de Transferencias
            </h3>
            <button
              onClick={cargarHistorial}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>

          {loadingHistorial ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              <span className="ml-3 text-gray-600">Cargando historial...</span>
            </div>
          ) : historial.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No hay transferencias registradas</p>
            </div>
          ) : (
            <>
              {/* Vista de Tarjetas para móviles */}
              <div className="block md:hidden space-y-3">
                {historial.map((mov) => {
                  const esRevertido = mov.observaciones?.includes('[REVERTIDO');
                  const esReversion = mov.cantidad < 0;

                  return (
                    <div
                      key={mov._id}
                      className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                        esRevertido ? 'border-red-400 bg-red-50' :
                        esReversion ? 'border-orange-400' : 'border-teal-400'
                      }`}
                    >
                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {mov.item?.nombre || 'Material eliminado'}
                          </h4>
                          <p className="text-xs text-gray-500">{mov.item?.unidadMedida}</p>
                        </div>
                        <span className={`text-lg font-bold ${
                          esReversion ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {esReversion ? '' : '+'}{mov.cantidad}
                        </span>
                      </div>

                      {/* Información de la tarjeta */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <span className="w-5 text-center mr-2">🏪</span>
                          <span className="font-medium">Sucursal:</span>
                          <span className="ml-1">{mov.sucursalDestino?.nombre || 'Sin sucursal'}</span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <span className="w-5 text-center mr-2">📅</span>
                          <span className="font-medium">Fecha:</span>
                          <span className="ml-1">
                            {new Date(mov.fecha).toLocaleString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <span className="w-5 text-center mr-2">👤</span>
                          <span className="font-medium">Operador:</span>
                          <span className="ml-1 truncate">{mov.operadorEmail || mov.operador}</span>
                        </div>

                        {mov.motivo && (
                          <div className="flex items-start text-gray-600">
                            <span className="w-5 text-center mr-2">📝</span>
                            <span className="font-medium">Motivo:</span>
                            <span className="ml-1 break-words">{mov.motivo}</span>
                          </div>
                        )}
                      </div>

                      {/* Acción de la tarjeta */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {!esRevertido && !esReversion ? (
                          <button
                            onClick={() => abrirModalRevertir(mov)}
                            className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex items-center justify-center"
                          >
                            ↩️ Revertir Transferencia
                          </button>
                        ) : (
                          <div className="text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              esRevertido ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {esRevertido ? '🚫 Revertido' : '↩️ Reversión'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vista de Tabla para pantallas medianas y grandes */}
              <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
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
                                  ↩️ Revertir
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              📊 Inventario por Sucursal
            </h3>
            <button
              onClick={cargarEstadisticas}
              disabled={loadingEstadisticas}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {loadingEstadisticas ? '⏳ Cargando...' : '🔄 Actualizar'}
            </button>
          </div>

          {/* Filtros de fecha */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={aplicarFiltrosFecha}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  🔍 Filtrar
                </button>
              </div>
              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ✕ Limpiar
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              <span className="ml-3 text-gray-600">Cargando estadísticas...</span>
            </div>
          ) : estadisticas.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">
                No hay datos de inventario en sucursales
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estadisticas.map(stat => {
                const estaExpandida = sucursalExpandida === stat._id;
                const materialesSucursal = detalleSucursal[stat._id] || [];
                const cargandoDetalle = loadingDetalle[stat._id];

                return (
                  <div
                    key={stat._id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
                      estaExpandida ? 'ring-2 ring-teal-500' : 'hover:shadow-lg'
                    }`}
                  >
                    {/* Cabecera clickeable */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => toggleDetalleSucursal(stat._id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{stat.nombreSucursal}</h4>
                          <p className="text-sm text-gray-500">{stat.ubicacion}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🏪</span>
                          <span className={`text-gray-400 transition-transform duration-300 ${
                            estaExpandida ? 'rotate-180' : ''
                          }`}>
                            ▼
                          </span>
                        </div>
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
                      {/* Indicador de click */}
                      <div className="mt-3 text-center">
                        <span className="text-xs text-teal-600">
                          {estaExpandida ? 'Click para ocultar detalle' : 'Click para ver materiales'}
                        </span>
                      </div>
                    </div>

                    {/* Sección expandible con detalle de materiales */}
                    {estaExpandida && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          📦 Detalle de Materiales
                        </h5>

                        {cargandoDetalle ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                            <span className="ml-2 text-sm text-gray-500">Cargando...</span>
                          </div>
                        ) : materialesSucursal.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No hay materiales en esta sucursal
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {materialesSucursal.map((item, index) => {
                              // El item puede tener estructura: { material: {...}, cantidad } o directa
                              const materialInfo = item.material || item;
                              const cantidad = item.cantidad ?? item.stock ?? 0;
                              const precioUnitario = materialInfo.precioUnitario || 0;
                              const valorTotal = cantidad * precioUnitario;

                              return (
                                <div
                                  key={item._id || materialInfo._id || index}
                                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 truncate">
                                        {materialInfo.nombre || 'Sin nombre'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {materialInfo.unidadMedida || ''}
                                      </p>
                                    </div>
                                    <div className="text-right ml-3">
                                      <span className="font-bold text-teal-600 text-lg">
                                        {cantidad.toFixed(2)}
                                      </span>
                                      {canViewPrices && valorTotal > 0 && (
                                        <p className="text-xs text-green-600">
                                          S/ {valorTotal.toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Nueva Transferencia */}
      {mostrarFormulario && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setMostrarFormulario(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="text-2xl mr-2">🏪</span>
                Registrar Salida a Sucursal
              </h3>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ✕
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={procesando}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {procesando ? 'Procesando...' : '✓ Confirmar Transferencia'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ⚠️ Confirmar Reversión
            </h3>
            
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmarReversion}
                disabled={procesando || !motivoReversion.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {procesando ? 'Procesando...' : '✓ Confirmar Reversión'}
              </button>
              <button
                onClick={() => {
                  setMostrarModalRevertir(false);
                  setMovimientoARevertir(null);
                  setMotivoReversion('');
                }}
                disabled={procesando}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
