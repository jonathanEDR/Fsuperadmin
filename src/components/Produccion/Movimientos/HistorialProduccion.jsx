import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import DetalleProduccion from '../Produccion/DetalleProduccion';

const HistorialProduccion = ({ producto, isOpen, onClose }) => {
  const [historialProducciones, setHistorialProducciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    operador: '',
    estado: '',
    limite: 10,
    pagina: 1
  });
  
  // Estados para modal de detalle
  const [detalleProduccionOpen, setDetalleProduccionOpen] = useState(false);
  const [produccionSeleccionada, setProduccionSeleccionada] = useState(null);

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
      
      console.log('🔍 Cargando historial de producciones para:', producto.nombre);
      console.log('📋 Filtros aplicados:', filtrosBusqueda);
      
      const response = await movimientoUnificadoService.obtenerHistorial(filtrosBusqueda);
      
      console.log('📦 Respuesta del servicio de movimientos:', response);
      
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
      
      console.log('📋 Movimientos extraídos:', movimientos.length);
      
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
      console.log('✅ Movimientos de producción filtrados:', movimientosDelProducto.length);
      
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
      minute: '2-digit'
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Historial de Cantidades (Producción)
                </h3>
                <p className="text-sm text-gray-500">
                  {producto.nombre} - Registro completo de producciones
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Estadísticas */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-sm font-medium text-gray-500">Total Producciones</div>
                <div className="text-2xl font-bold text-blue-600">
                  {estadisticas.totalProducciones}
                </div>
                <div className="text-xs text-gray-400">registros</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-sm font-medium text-gray-500">Cantidad Total Producida</div>
                <div className="text-2xl font-bold text-green-600">
                  {estadisticas.cantidadTotalProducida}
                </div>
                <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidades'}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-sm font-medium text-gray-500">Costo Total</div>
                <div className="text-2xl font-bold text-purple-600">
                  S/.{estadisticas.costoTotalProduccion.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">inversión total</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-sm font-medium text-gray-500">Promedio Diario</div>
                <div className="text-2xl font-bold text-orange-600">
                  {estadisticas.promedioProduccionDiaria.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidades'}/día</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="completada">✅ Completados</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operador
                </label>
                <input
                  type="text"
                  value={filtros.operador}
                  onChange={(e) => handleFiltroChange('operador', e.target.value)}
                  placeholder="Filtrar por operador..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={limpiarFiltros}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Tabla de Historial */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando historial...</span>
              </div>
            ) : movimientosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sin historial de producciones
                </h3>
                <p className="text-gray-500 mb-4">
                  No se encontraron movimientos de producción para {producto.nombre}
                </p>
                <div className="text-sm text-gray-400 bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
                  <p>💡 Los movimientos de producción aparecerán aquí cuando:</p>
                  <ul className="list-disc text-left mt-2 space-y-1 ml-4">
                    <li>Uses la función "Incrementar Stock" del producto</li>
                    <li>Registres producciones con consumo de ingredientes</li>
                    <li>Hagas ajustes manuales de inventario</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha & Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad Agregada
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Costo Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Productos y Ingredientes
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Motivo/Observaciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {movimientosFiltrados.map((movimiento, index) => {
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
                              <div className="text-xs text-purple-600 mt-1">
                                🏭 Producción
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

                            {/* Productos y Ingredientes */}
                            <td className="px-4 py-4">
                              <div className="text-xs space-y-2 max-w-80">
                                <div className="space-y-2">
                                  {/* Producto Producido */}
                                  <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                                    <div className="text-green-800 font-semibold mb-1">
                                      🏭 Producto Producido
                                    </div>
                                    <div className="text-green-700">
                                      • {producto.nombre} (+{movimiento.cantidad || 0} {producto.unidadMedida || 'unidades'})
                                    </div>
                                    <div className="text-green-600 text-xs">
                                      Costo: S/.{(movimiento.costoTotal || movimiento.costo || 0).toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Mostrar ingredientes consumidos */}
                                  {((movimiento.detalles?.ingredientesConsumidos?.length || movimiento.ingredientesConsumidos?.length || movimiento.ingredientesUtilizados?.length) || 0) > 0 && (
                                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-200">
                                      <div className="text-orange-800 font-semibold mb-1">
                                        🥬 Ingredientes Consumidos ({(movimiento.detalles?.ingredientesConsumidos || movimiento.ingredientesConsumidos || movimiento.ingredientesUtilizados || []).length})
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
                                              {costoUnitario > 0 && (
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
                                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                                      <div className="text-blue-800 font-semibold mb-1">
                                        📋 Recetas Utilizadas ({(movimiento.detalles?.recetasConsumidas || movimiento.recetasConsumidas || movimiento.recetasUtilizadas || []).length})
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
                                              {costoUnitario > 0 && (
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
                                    <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
                                      <div className="text-purple-700 font-medium">
                                        🏭 Producción sin consumo específico
                                      </div>
                                      <div className="text-purple-600 text-xs">
                                        Incremento directo al inventario
                                      </div>
                                    </div>
                                  )}

                                  {/* Información adicional de costos */}
                                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <div className="text-gray-700 text-xs">
                                      💰 <strong>Resumen Económico:</strong>
                                      <br />• Costo por unidad: S/.{((movimiento.costoTotal || movimiento.costo || 0) / (movimiento.cantidad || 1)).toFixed(2)}
                                      {movimiento.precioVenta && (
                                        <span>
                                          <br />• Precio venta: S/.{movimiento.precioVenta.toFixed(2)}
                                          <br />• Margen: S/.{(movimiento.precioVenta - ((movimiento.costoTotal || movimiento.costo || 0) / (movimiento.cantidad || 1))).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
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
                                  <div className="text-xs text-gray-500 mt-1 truncate" title={movimiento.notas}>
                                    📝 {movimiento.notas}
                                  </div>
                                )}
                                {/* Información adicional del operador */}
                                <div className="text-xs text-blue-600 mt-1">
                                  👤 {movimiento.operador || movimiento.usuario || 'N/A'}
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
                </div>

                {/* Footer con estadísticas */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">
                        Mostrando {movimientosFiltrados.length} movimientos de producción
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
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-purple-700 font-medium">
                          S/.{estadisticas.costoTotalProduccion.toFixed(2)} invertidos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Producción - Temporalmente deshabilitado */}
      {/* TODO: Implementar modal específico para detalles de movimientos de producción */}
      {false && detalleProduccionOpen && produccionSeleccionada && (
        <DetalleProduccion
          produccionId={produccionSeleccionada._id}
          produccion={produccionSeleccionada}
          onClose={() => {
            setDetalleProduccionOpen(false);
            setProduccionSeleccionada(null);
          }}
          onProduccionActualizada={() => {
            cargarHistorialProducciones();
            calcularEstadisticas();
          }}
          esModal={true}
        />
      )}
    </>
  );
};

export default HistorialProduccion;
