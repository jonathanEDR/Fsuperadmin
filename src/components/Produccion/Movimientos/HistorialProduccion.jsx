import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { X, Factory, Loader2, BarChart3, Trash2, ChevronDown, Filter, Check, Lightbulb, FileText, ShoppingCart, User, Carrot, ClipboardList, DollarSign } from 'lucide-react';

const HistorialProduccion = ({ producto, isOpen, onClose }) => {
  const { canViewPrices, isSuperAdmin } = useQuickPermissions();
  const [historialProducciones, setHistorialProducciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Límite inicial según rol: 20 para super_admin, 5 para admin/user
  const limiteInicial = isSuperAdmin ? 20 : 5;
  const incrementoPagina = isSuperAdmin ? 20 : 5;
  
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    operador: '',
    estado: '',
    limite: 10,
    pagina: 1
  });
  
  // Estado para filtros colapsables en móvil
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);
  
  // Estado para paginación de tarjetas - límite según rol
  const [itemsVisibles, setItemsVisibles] = useState(limiteInicial);

  // Estadísticas del historial
  const [estadisticas, setEstadisticas] = useState({
    totalProducciones: 0,
    cantidadTotalProducida: 0,
    costoTotalProduccion: 0,
    promedioProduccionDiaria: 0
  });

  useEffect(() => {
    if (isOpen && producto) {
      cargarHistorialProducciones();
      calcularEstadisticas();
    }
  }, [isOpen, producto, filtros]);

  const cargarHistorialProducciones = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Crear filtros de búsqueda específicos para el producto
      const filtrosBusqueda = {
        item: producto._id,
        tipo: 'entrada', // Solo movimientos de entrada (producciones)
        tipoMovimiento: 'produccion',
        ...filtros
      };
      
      const response = await movimientoUnificadoService.obtenerHistorial(filtrosBusqueda);
      
      // Extraer movimientos de la respuesta
      let movimientos = [];
      if (response.success && response.data) {
        if (Array.isArray(response.data.movimientos)) {
          movimientos = response.data.movimientos;
        } else if (Array.isArray(response.data)) {
          movimientos = response.data;
        }
      } else if (Array.isArray(response)) {
        movimientos = response;
      }
      
      // Filtrar movimientos que correspondan al producto específico
      const movimientosDelProducto = movimientos.filter(mov => {
        const esDelProducto = mov.item?.nombre === producto.nombre || 
                            mov.item?._id === producto._id ||
                            mov.producto?.nombre === producto.nombre ||
                            mov.producto?._id === producto._id;
        
        const esEntrada = mov.tipo === 'entrada'; // Solo movimientos de entrada (producciones)
        
        return esDelProducto && esEntrada;
      });
      
      setHistorialProducciones(movimientosDelProducto);
      
    } catch (error) {
      console.error('❌ Error al cargar historial de producciones:', error);
      setError(error.message || 'Error al cargar el historial');
      setHistorialProducciones([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = () => {
    if (!historialProducciones.length) {
      setEstadisticas({
        totalProducciones: 0,
        cantidadTotalProducida: 0,
        costoTotalProduccion: 0,
        promedioProduccionDiaria: 0
      });
      return;
    }

    const totalProducciones = historialProducciones.length;
    const cantidadTotalProducida = historialProducciones.reduce((acc, mov) => acc + (mov.cantidad || 0), 0);
    const costoTotalProduccion = historialProducciones.reduce((acc, mov) => acc + (mov.costoTotal || mov.costo || 0), 0);

    // Calcular promedio diario basado en el rango de fechas
    const fechas = historialProducciones.map(mov => {
      const fecha = mov.fecha || mov.createdAt || mov.fechaCreacion;
      return fecha ? new Date(fecha) : new Date();
    });
    
    const fechasValidas = fechas.filter(fecha => !isNaN(fecha.getTime()));
    
    if (fechasValidas.length === 0) {
      setEstadisticas({
        totalProducciones,
        cantidadTotalProducida,
        costoTotalProduccion,
        promedioProduccionDiaria: 0
      });
      return;
    }
    
    const fechaMin = new Date(Math.min(...fechasValidas));
    const fechaMax = new Date(Math.max(...fechasValidas));
    const diasTranscurridos = Math.max(1, Math.ceil((fechaMax - fechaMin) / (1000 * 60 * 60 * 24)) + 1);
    const promedioProduccionDiaria = cantidadTotalProducida / diasTranscurridos;

    setEstadisticas({
      totalProducciones,
      cantidadTotalProducida,
      costoTotalProduccion,
      promedioProduccionDiaria
    });
  };

  const formatearFecha = (movimiento) => {
    const fecha = movimiento.fecha || movimiento.createdAt || movimiento.fechaCreacion;
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit', // Agregar segundos
      timeZone: 'America/Lima' // Usar zona horaria de Perú
    });
  };

  const getEstadoColor = (movimiento) => {
    // Para movimientos, podemos usar el tipo o motivo para determinar el estado
    if (movimiento.tipo === 'entrada') {
      return 'bg-green-100 text-green-800'; // Producción completada
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (movimiento) => {
    // Para movimientos de entrada de producción
    if (movimiento.tipo === 'entrada') {
      return 'Completada';
    }
    return 'Procesado';
  };

  // Filtrar movimientos en el cliente según los filtros aplicados
  const movimientosFiltrados = historialProducciones.filter(movimiento => {
    // Filtro por fecha de inicio
    if (filtros.fechaInicio) {
      const fechaMovimiento = new Date(movimiento.fecha || movimiento.createdAt || movimiento.fechaCreacion);
      const fechaInicio = new Date(filtros.fechaInicio);
      if (fechaMovimiento < fechaInicio) return false;
    }

    // Filtro por fecha de fin
    if (filtros.fechaFin) {
      const fechaMovimiento = new Date(movimiento.fecha || movimiento.createdAt || movimiento.fechaCreacion);
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999); // Incluir todo el día
      if (fechaMovimiento > fechaFin) return false;
    }

    // Filtro por operador
    if (filtros.operador) {
      const operadorMovimiento = (movimiento.operador || movimiento.usuario || '').toLowerCase();
      const operadorBuscado = filtros.operador.toLowerCase();
      if (!operadorMovimiento.includes(operadorBuscado)) return false;
    }

    // Filtro por estado
    if (filtros.estado) {
      if (filtros.estado === 'completada' && movimiento.tipo !== 'entrada') return false;
    }

    return true;
  });

  // Funciones para manejar filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      pagina: 1 // Resetear paginación al cambiar filtros
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      operador: '',
      estado: '',
      limite: 10,
      pagina: 1
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-[98vw] sm:max-w-7xl max-h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 rounded-t-2xl">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 flex-shrink-0">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                  Historial de Cantidades (Producción)
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {producto.nombre} - Registro completo de producciones
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 sm:p-2 rounded-xl transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Estadísticas */}
          <div className="p-3 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <div className={`grid grid-cols-2 ${canViewPrices ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-2 sm:gap-4`}>
              <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 text-center">
                <div className="text-xs sm:text-sm font-medium text-gray-500">Total Producciones</div>
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {estadisticas.totalProducciones}
                </div>
                <div className="text-xs text-gray-400">registros</div>
              </div>
              <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 text-center">
                <div className="text-xs sm:text-sm font-medium text-gray-500">Cantidad Total Producida</div>
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {estadisticas.cantidadTotalProducida}
                </div>
                <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidad'}</div>
              </div>
              {canViewPrices && (
                <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 text-center">
                  <div className="text-xs sm:text-sm font-medium text-gray-500">Costo Total</div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    S/.{estadisticas.costoTotalProduccion.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">inversión total</div>
                </div>
              )}
              <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 text-center">
                <div className="text-xs sm:text-sm font-medium text-gray-500">Promedio Diario</div>
                <div className="text-lg sm:text-2xl font-bold text-orange-600">
                  {estadisticas.promedioProduccionDiaria.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidad'}/día</div>
              </div>
            </div>
          </div>

          {/* Filtros - Colapsables en móvil */}
          <div className="border-b bg-gray-50">
            {/* Botón para expandir/colapsar filtros en móvil */}
            <button
              onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
              className="w-full p-3 sm:hidden flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                Filtros
                {(filtros.fechaInicio || filtros.fechaFin || filtros.operador || filtros.estado) && (
                  <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Activos
                  </span>
                )}
              </span>
              <ChevronDown size={16} className={`transition-transform ${filtrosExpandidos ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Contenido de filtros */}
            <div className={`
              p-3 sm:p-6 
              ${filtrosExpandidos ? 'block' : 'hidden'} sm:block
            `}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                    className="w-full p-1.5 sm:p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                    className="w-full p-1.5 sm:p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => handleFiltroChange('estado', e.target.value)}
                    className="w-full p-1.5 sm:p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="completada">Completados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Operador
                  </label>
                  <input
                    type="text"
                    value={filtros.operador}
                    onChange={(e) => handleFiltroChange('operador', e.target.value)}
                    placeholder="Filtrar..."
                    className="w-full p-1.5 sm:p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
                  />
                </div>
                <div className="flex items-end col-span-2 sm:col-span-1">
                  <button
                    onClick={limpiarFiltros}
                    className="w-full px-3 py-1.5 sm:py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Tabla de Historial */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span className="ml-2 sm:ml-3 text-sm sm:text-base text-gray-600">Cargando historial...</span>
              </div>
            ) : movimientosFiltrados.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 inline-block mb-3 sm:mb-4">
                  <Factory size={40} className="text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Sin historial de producciones
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  No se encontraron movimientos de producción para {producto.nombre}
                </p>
                <div className="text-xs sm:text-sm text-gray-400 bg-gray-50/60 rounded-xl border border-gray-100 p-3 sm:p-4 max-w-md mx-auto">
                  <p className="flex items-center gap-1.5 justify-center font-medium text-gray-500 mb-2">
                    <Lightbulb size={14} className="text-amber-500" />
                    Los movimientos de producción aparecerán aquí cuando:
                  </p>
                  <ul className="list-disc text-left mt-2 space-y-1 ml-4">
                    <li>Uses la función "Incrementar Stock" del producto</li>
                    <li>Registres producciones con consumo de ingredientes</li>
                    <li>Hagas ajustes manuales de inventario</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white">
                {/* 🎯 VISTA MÓVIL: Tarjetas con "Ver más" */}
                <div className="md:hidden p-3 space-y-3">
                  {movimientosFiltrados.slice(0, itemsVisibles).map((movimiento, index) => (
                    <div 
                      key={movimiento._id || index}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm"
                    >
                      {/* Header: Fecha y badge */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs text-gray-500">
                            {formatearFecha(movimiento)}
                          </span>
                          <div className="text-xs text-gray-400 mt-0.5">
                            ID: {(movimiento._id || '').slice(-6)}
                          </div>
                        </div>
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Factory size={12} /> Producción
                        </span>
                      </div>

                      {/* Cantidad y Costo */}
                      <div className={`grid ${canViewPrices ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-3`}>
                        <div className="bg-green-50 p-2 rounded-xl text-center">
                          <div className="text-xs text-gray-500">Cantidad</div>
                          <div className="text-lg font-bold text-green-600">
                            +{movimiento.cantidad || 0}
                          </div>
                          <div className="text-xs text-gray-400">{producto.unidadMedida || 'und'}</div>
                        </div>
                        {canViewPrices && (
                          <div className="bg-purple-50 p-2 rounded-xl text-center">
                            <div className="text-xs text-gray-500">Costo Total</div>
                            <div className="text-lg font-bold text-purple-600">
                              S/.{(movimiento.costoTotal || movimiento.costo || 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">
                              S/.{((movimiento.costoTotal || movimiento.costo || 0) / (movimiento.cantidad || 1)).toFixed(2)}/u
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Motivo */}
                      {movimiento.motivo && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">Motivo: </span>
                          <span className="text-xs text-gray-700">{movimiento.motivo}</span>
                        </div>
                      )}

                      {/* Footer: Usuario */}
                      <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User size={12} /> {movimiento.operador || movimiento.usuario || 'N/A'}
                        </span>
                        {movimiento.precioVenta && (
                          <span className="text-xs text-green-600 font-medium">
                            Venta: S/.{movimiento.precioVenta.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Botón "Ver más" - Incremento según rol */}
                  {itemsVisibles < movimientosFiltrados.length && (
                    <button
                      onClick={() => setItemsVisibles(prev => prev + incrementoPagina)}
                      className="w-full py-3 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <ChevronDown size={16} />
                      Ver más {incrementoPagina} ({movimientosFiltrados.length - itemsVisibles} restantes)
                    </button>
                  )}

                  {/* Indicador cuando se muestran todos */}
                  {itemsVisibles >= movimientosFiltrados.length && movimientosFiltrados.length > limiteInicial && (
                    <p className="text-center text-xs text-gray-500 py-2 flex items-center justify-center gap-1">
                      <Check size={14} className="text-green-500" /> Mostrando todos los {movimientosFiltrados.length} movimientos
                    </p>
                  )}
                </div>

                {/* 🎯 VISTA DESKTOP: Tabla completa */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha & Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad Agregada
                        </th>
                        {canViewPrices && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Costo Total
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Productos y Ingredientes
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Motivo/Observaciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {movimientosFiltrados.slice(0, itemsVisibles).map((movimiento, index) => {
                        return (
                          <tr key={movimiento._id || index} className="hover:bg-gray-50 transition-colors">
                            {/* Fecha y Hora */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatearFecha(movimiento)}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {(movimiento._id || '').slice(-6)}
                              </div>
                              <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                                <Factory size={12} /> Producción
                              </div>
                            </td>

                            {/* Cantidad Agregada */}
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="text-xl font-bold text-green-600">
                                +{movimiento.cantidad || 0}
                              </div>
                              <div className="text-xs text-gray-500">
                                {producto.unidadMedida || 'unidades'}
                              </div>
                              {movimiento.cantidadAnterior && (
                                <div className="text-xs text-gray-400">
                                  Anterior: {movimiento.cantidadAnterior}
                                </div>
                              )}
                            </td>

                            {/* Costo Total */}
                            {canViewPrices && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-purple-600">
                                  S/.{(movimiento.costoTotal || movimiento.costo || 0).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  S/.{((movimiento.costoTotal || movimiento.costo || 0) / (movimiento.cantidad || 1)).toFixed(2)}/unidad
                                </div>
                                {movimiento.precioVenta && (
                                  <div className="text-xs text-green-600 font-medium">
                                    Venta: S/.{movimiento.precioVenta.toFixed(2)}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Productos y Ingredientes */}
                            <td className="px-4 py-4">
                              <div className="text-xs space-y-2 max-w-80">
                                <div className="space-y-2">
                                  {/* Producto Producido */}
                                  <div className="bg-green-50 p-2 rounded-xl border border-green-200">
                                    <div className="text-green-800 font-semibold mb-1 flex items-center gap-1">
                                      <Factory size={13} /> Producto Producido
                                    </div>
                                    <div className="text-green-700">
                                      • {producto.nombre} (+{movimiento.cantidad || 0} {producto.unidadMedida || 'unidades'})
                                    </div>
                                    {canViewPrices && (
                                      <div className="text-green-600 text-xs">
                                        Costo: S/.{(movimiento.costoTotal || movimiento.costo || 0).toFixed(2)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Mostrar ingredientes consumidos */}
                                  {((movimiento.detalles?.ingredientesConsumidos?.length || movimiento.ingredientesConsumidos?.length || movimiento.ingredientesUtilizados?.length) || 0) > 0 && (
                                    <div className="bg-orange-50 p-2 rounded-xl border border-orange-200">
                                      <div className="text-orange-800 font-semibold mb-1 flex items-center gap-1">
                                        <Carrot size={13} /> Ingredientes Consumidos ({(movimiento.detalles?.ingredientesConsumidos || movimiento.ingredientesConsumidos || movimiento.ingredientesUtilizados || []).length})
                                      </div>
                                      <div className="space-y-1">
                                        {(movimiento.detalles?.ingredientesConsumidos || movimiento.ingredientesConsumidos || movimiento.ingredientesUtilizados || []).map((ing, idx) => {
                                          // Obtener nombre del ingrediente
                                          let nombreIngrediente = ing.nombre || ing.ingrediente || 'Ingrediente';
                                          if (typeof ing.ingrediente === 'object' && ing.ingrediente?.nombre) {
                                            nombreIngrediente = ing.ingrediente.nombre;
                                          }
                                          
                                          // Obtener cantidad y unidad
                                          const cantidad = ing.cantidadUtilizada || ing.cantidad || 0;
                                          const unidad = ing.unidadMedida || '';
                                          
                                          // Obtener costo
                                          const costoUnitario = ing.costoUnitario || ing.costo || 0;
                                          const costoTotal = cantidad * costoUnitario;
                                          
                                          return (
                                            <div key={idx} className="text-orange-700">
                                              • {nombreIngrediente} 
                                              <span className="text-orange-600 ml-1">
                                                ({cantidad} {unidad})
                                              </span>
                                              {canViewPrices && costoUnitario > 0 && (
                                                <span className="text-orange-500 text-xs ml-1">
                                                  - S/.{costoTotal.toFixed(2)} (S/.{costoUnitario.toFixed(2)}/u)
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Mostrar recetas consumidas */}
                                  {((movimiento.detalles?.recetasConsumidas?.length || movimiento.recetasConsumidas?.length || movimiento.recetasUtilizadas?.length) || 0) > 0 && (
                                    <div className="bg-blue-50 p-2 rounded-xl border border-blue-200">
                                      <div className="text-blue-800 font-semibold mb-1 flex items-center gap-1">
                                        <ClipboardList size={13} /> Recetas Utilizadas ({(movimiento.detalles?.recetasConsumidas || movimiento.recetasConsumidas || movimiento.recetasUtilizadas || []).length})
                                      </div>
                                      <div className="space-y-1">
                                        {(movimiento.detalles?.recetasConsumidas || movimiento.recetasConsumidas || movimiento.recetasUtilizadas || []).map((rec, idx) => {
                                          // Obtener nombre de la receta
                                          let nombreReceta = rec.nombre || rec.receta || 'Receta';
                                          if (typeof rec.receta === 'object' && rec.receta?.nombre) {
                                            nombreReceta = rec.receta.nombre;
                                          }
                                          
                                          // Obtener cantidad y unidad
                                          const cantidad = rec.cantidadUtilizada || rec.cantidad || 0;
                                          const unidad = rec.unidadMedida || 'porciones';
                                          
                                          // Obtener costo
                                          const costoUnitario = rec.costoUnitario || rec.costo || 0;
                                          const costoTotal = cantidad * costoUnitario;
                                          
                                          return (
                                            <div key={idx} className="text-blue-700">
                                              • {nombreReceta} 
                                              <span className="text-blue-600 ml-1">
                                                ({cantidad} {unidad})
                                              </span>
                                              {canViewPrices && costoUnitario > 0 && (
                                                <span className="text-blue-500 text-xs ml-1">
                                                  - S/.{costoTotal.toFixed(2)} (S/.{costoUnitario.toFixed(2)}/u)
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Si no hay detalles específicos */}
                                  {(!movimiento.detalles?.ingredientesConsumidos || movimiento.detalles.ingredientesConsumidos.length === 0) &&
                                   (!movimiento.ingredientesConsumidos || movimiento.ingredientesConsumidos.length === 0) &&
                                   (!movimiento.ingredientesUtilizados || movimiento.ingredientesUtilizados.length === 0) &&
                                   (!movimiento.detalles?.recetasConsumidas || movimiento.detalles.recetasConsumidas.length === 0) &&
                                   (!movimiento.recetasConsumidas || movimiento.recetasConsumidas.length === 0) &&
                                   (!movimiento.recetasUtilizadas || movimiento.recetasUtilizadas.length === 0) && (
                                    <div className={`p-2 rounded-xl border ${
                                      (movimiento.motivo || '').includes('inventario de ventas')
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-purple-50 border-purple-200'
                                    }`}>
                                      <div className={`font-medium ${
                                        (movimiento.motivo || '').includes('inventario de ventas')
                                          ? 'text-blue-700'
                                          : 'text-purple-700'
                                      }`}>
                                        {(movimiento.motivo || '').includes('inventario de ventas')
                                          ? <span className="flex items-center gap-1"><ShoppingCart size={13} /> Entrada desde inventario de ventas</span>
                                          : <span className="flex items-center gap-1"><Factory size={13} /> Producción sin consumo específico</span>
                                        }
                                      </div>
                                      <div className={`text-xs ${
                                        (movimiento.motivo || '').includes('inventario de ventas')
                                          ? 'text-blue-600'
                                          : 'text-purple-600'
                                      }`}>
                                        {(movimiento.motivo || '').includes('inventario de ventas')
                                          ? 'Registro simultáneo con entrada de productos'
                                          : 'Incremento directo al inventario'
                                        }
                                      </div>
                                    </div>
                                  )}

                                  {/* Información adicional de costos - Solo para super_admin */}
                                  {canViewPrices && (
                                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-200">
                                      <div className="text-gray-700 text-xs">
                                        <span className="flex items-center gap-1 font-semibold mb-1"><DollarSign size={13} /> Resumen Económico:</span>
                                        <br />• Costo por unidad: S/.{((movimiento.costoTotal || movimiento.costo || 0) / (movimiento.cantidad || 1)).toFixed(2)}
                                        {movimiento.precioVenta && (
                                          <span>
                                            <br />• Precio venta: S/.{movimiento.precioVenta.toFixed(2)}
                                            <br />• Margen: S/.{(movimiento.precioVenta - ((movimiento.costoTotal || movimiento.costo || 0) / (movimiento.cantidad || 1))).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Motivo/Observaciones */}
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-600 max-w-48">
                                <div className="truncate" title={movimiento.motivo || movimiento.observaciones || 'Sin especificar'}>
                                  <strong>Motivo:</strong> {movimiento.motivo || 'Sin especificar'}
                                </div>
                                {movimiento.observaciones && movimiento.observaciones !== movimiento.motivo && (
                                  <div className="text-xs text-gray-500 mt-1 truncate" title={movimiento.observaciones}>
                                    <strong>Obs:</strong> {movimiento.observaciones}
                                  </div>
                                )}
                                {movimiento.notas && (
                                  <div className="text-xs text-gray-500 mt-1 truncate flex items-center gap-1" title={movimiento.notas}>
                                    <FileText size={12} /> {movimiento.notas}
                                  </div>
                                )}
                                {/* Información adicional del operador */}
                                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                  <User size={12} /> {movimiento.operador || movimiento.usuario || 'N/A'}
                                </div>
                                {/* ID del movimiento */}
                                <div className="text-xs text-gray-400 mt-1">
                                  ID: {(movimiento._id || '').slice(-8)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Botón Ver más - Desktop */}
                  {itemsVisibles < movimientosFiltrados.length && (
                    <div className="flex justify-center py-4 bg-gray-50 border-t border-gray-200">
                      <button
                        onClick={() => setItemsVisibles(prev => prev + incrementoPagina)}
                        className="px-6 py-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors font-medium flex items-center gap-2"
                      >
                        <ChevronDown size={18} />
                        Ver más {incrementoPagina}
                      </button>
                    </div>
                  )}
                  {movimientosFiltrados.length > limiteInicial && itemsVisibles >= movimientosFiltrados.length && (
                    <div className="text-center py-3 bg-gray-50 border-t border-gray-200">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Check size={14} className="text-green-500" /> Mostrando todos los movimientos
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer con estadísticas - Solo visible en desktop */}
                <div className="hidden md:block bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">
                        Mostrando {Math.min(itemsVisibles, movimientosFiltrados.length)} de {movimientosFiltrados.length} movimientos de producción
                      </span>
                      <span className="text-gray-500 ml-2">
                        • Total registros: {estadisticas.totalProducciones}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 font-medium">
                          +{estadisticas.cantidadTotalProducida} {producto.unidadMedida || 'unidades'} agregadas
                        </span>
                      </div>
                      {canViewPrices && (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-purple-700 font-medium">
                            S/.{estadisticas.costoTotalProduccion.toFixed(2)} invertidos
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer móvil simplificado */}
                <div className="md:hidden bg-gray-50 px-3 py-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">
                      {Math.min(itemsVisibles, movimientosFiltrados.length)}/{movimientosFiltrados.length} movimientos
                    </span>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-medium">
                        +{estadisticas.cantidadTotalProducida} {producto.unidadMedida || 'und'}
                      </span>
                      {canViewPrices && (
                        <span className="text-purple-600 font-medium">
                          S/.{estadisticas.costoTotalProduccion.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorialProduccion;
