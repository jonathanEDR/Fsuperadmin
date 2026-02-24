import React, { useState, useEffect, useCallback } from 'react';
import { recetaService } from '../../../services/recetaService';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

/**
 * Componente para mostrar el historial de producciones de una receta
 * Con paginación real del servidor: carga 20 registros por página
 * y usa "Cargar más" para traer los siguientes desde el backend.
 */
const HistorialProduccionReceta = ({ recetaId, recetaNombre, unidadMedida = 'unidad' }) => {
  const { canViewPrices, isSuperAdmin } = useQuickPermissions();
  
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');
  const [expandido, setExpandido] = useState(true);
  
  // Paginación real del servidor
  const LIMITE_POR_PAGINA = isSuperAdmin ? 20 : 10;
  const [paginaActual, setPaginaActual] = useState(1);
  const [paginacion, setPaginacion] = useState({
    total: 0,
    totalPaginas: 0,
    tieneProxima: false
  });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    operador: ''
  });
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalProducciones: 0,
    cantidadTotalProducida: 0,
    costoTotalProduccion: 0,
    promedioProduccionDiaria: 0
  });

  // Cargar primera página al montar o cuando cambian filtros
  useEffect(() => {
    if (recetaId) {
      // Reset al cambiar filtros
      setHistorial([]);
      setPaginaActual(1);
      cargarHistorial(1, true);
    }
  }, [recetaId, filtros.fechaInicio, filtros.fechaFin, filtros.operador]);

  useEffect(() => {
    calcularEstadisticas();
  }, [historial]);

  const cargarHistorial = useCallback(async (pagina = 1, esNuevaBusqueda = false) => {
    try {
      if (esNuevaBusqueda) {
        setLoading(true);
      } else {
        setCargandoMas(true);
      }
      setError('');
      
      const opciones = {
        pagina,
        limite: LIMITE_POR_PAGINA,
        ...(filtros.fechaInicio && { fechaInicio: filtros.fechaInicio }),
        ...(filtros.fechaFin && { fechaFin: filtros.fechaFin }),
        ...(filtros.operador && { operador: filtros.operador })
      };
      
      const response = await recetaService.obtenerHistorialProduccion(recetaId, opciones);
      
      if (response.success && response.data) {
        const nuevosRegistros = response.data.historial || [];
        const paginacionData = response.data.paginacion || {};
        
        if (esNuevaBusqueda) {
          setHistorial(nuevosRegistros);
        } else {
          // Append: agregar al final sin duplicar
          setHistorial(prev => {
            const idsExistentes = new Set(prev.map(p => p._id?.toString()));
            const sinDuplicados = nuevosRegistros.filter(r => !idsExistentes.has(r._id?.toString()));
            return [...prev, ...sinDuplicados];
          });
        }
        
        setPaginacion({
          total: paginacionData.total || 0,
          totalPaginas: paginacionData.totalPaginas || 0,
          tieneProxima: paginacionData.tieneProxima || false
        });
        setPaginaActual(pagina);
      } else {
        if (esNuevaBusqueda) setHistorial([]);
      }
    } catch (err) {
      console.error('❌ Error al cargar historial de producción:', err);
      setError(err.message || 'Error al cargar el historial');
      if (esNuevaBusqueda) setHistorial([]);
    } finally {
      setLoading(false);
      setCargandoMas(false);
    }
  }, [recetaId, filtros, LIMITE_POR_PAGINA]);

  const calcularEstadisticas = () => {
    if (!historial.length) {
      setEstadisticas({
        totalProducciones: 0,
        cantidadTotalProducida: 0,
        costoTotalProduccion: 0,
        promedioProduccionDiaria: 0
      });
      return;
    }

    const totalProducciones = historial.length;
    const cantidadTotalProducida = historial.reduce((acc, prod) => 
      acc + (prod.rendimientoReal?.cantidad || 0), 0
    );
    const costoTotalProduccion = historial.reduce((acc, prod) => 
      acc + (prod.costoTotal || 0), 0
    );

    // Calcular promedio diario
    const fechas = historial.map(prod => new Date(prod.fecha)).filter(f => !isNaN(f.getTime()));
    
    let promedioProduccionDiaria = 0;
    if (fechas.length > 0) {
      const fechaMin = new Date(Math.min(...fechas));
      const fechaMax = new Date(Math.max(...fechas));
      const diasTranscurridos = Math.max(1, Math.ceil((fechaMax - fechaMin) / (1000 * 60 * 60 * 24)) + 1);
      promedioProduccionDiaria = cantidadTotalProducida / diasTranscurridos;
    }

    setEstadisticas({
      totalProducciones,
      cantidadTotalProducida,
      costoTotalProduccion,
      promedioProduccionDiaria
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima'
    });
  };

  // El historial ya viene filtrado y paginado del servidor
  const historialFiltrado = historial;

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({ fechaInicio: '', fechaFin: '', operador: '' });
  };

  const cargarMas = () => {
    if (paginacion.tieneProxima && !cargandoMas) {
      cargarHistorial(paginaActual + 1, false);
    }
  };

  // Si no hay historial y no está cargando, mostrar mensaje compacto
  if (!loading && historial.length === 0) {
    return (
      <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-xl">📊</span>
          <span className="font-medium">Historial de Producción</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          No hay producciones registradas para esta receta.
          Las producciones aparecerán aquí cuando uses "Agregar Movimiento" desde el módulo de Movimientos de Inventario.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full p-4 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center justify-between hover:from-purple-100 hover:to-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span className="font-semibold text-gray-800">Historial de Producción</span>
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
            {paginacion.total || historial.length} {(paginacion.total || historial.length) === 1 ? 'producción' : 'producciones'}
          </span>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${expandido ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandido && (
        <div className="p-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Cargando historial...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Estadísticas */}
              <div className={`grid grid-cols-2 ${canViewPrices ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 mb-4`}>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-xs font-medium text-gray-500">Total Producciones</div>
                  <div className="text-xl font-bold text-blue-600">{estadisticas.totalProducciones}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-xs font-medium text-gray-500">Cantidad Producida</div>
                  <div className="text-xl font-bold text-green-600">{estadisticas.cantidadTotalProducida}</div>
                  <div className="text-xs text-gray-400">{unidadMedida}</div>
                </div>
                {canViewPrices && (
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="text-xs font-medium text-gray-500">Costo Total</div>
                    <div className="text-xl font-bold text-purple-600">
                      S/.{estadisticas.costoTotalProduccion.toFixed(2)}
                    </div>
                  </div>
                )}
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="text-xs font-medium text-gray-500">Promedio Diario</div>
                  <div className="text-xl font-bold text-orange-600">
                    {estadisticas.promedioProduccionDiaria.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">{unidadMedida}/día</div>
                </div>
              </div>

              {/* Filtros colapsables */}
              <div className="bg-gray-50 rounded-lg mb-4">
                <button
                  onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
                  className="w-full p-2 flex items-center justify-between text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtros
                    {(filtros.fechaInicio || filtros.fechaFin || filtros.operador) && (
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        Activos
                      </span>
                    )}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${filtrosExpandidos ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {filtrosExpandidos && (
                  <div className="p-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
                        <input
                          type="date"
                          value={filtros.fechaInicio}
                          onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                          className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin</label>
                        <input
                          type="date"
                          value={filtros.fechaFin}
                          onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                          className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Operador</label>
                        <input
                          type="text"
                          value={filtros.operador}
                          onChange={(e) => handleFiltroChange('operador', e.target.value)}
                          placeholder="Filtrar..."
                          className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={limpiarFiltros}
                          className="w-full px-2 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-xs"
                        >
                          🗑️ Limpiar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de producciones */}
              <div className="space-y-3">
                {historialFiltrado.map((produccion, index) => (
                  <ProduccionCard 
                    key={produccion._id || index}
                    produccion={produccion}
                    unidadMedida={unidadMedida}
                    canViewPrices={canViewPrices}
                    formatearFecha={formatearFecha}
                  />
                ))}
              </div>

              {/* Indicador de progreso de carga */}
              {historial.length > 0 && paginacion.total > 0 && (
                <div className="text-center mt-3">
                  <span className="text-xs text-gray-500">
                    Mostrando {historial.length} de {paginacion.total} producciones
                  </span>
                </div>
              )}

              {/* Botón Cargar más - llama al servidor por la siguiente página */}
              {paginacion.tieneProxima && (
                <div className="text-center mt-4">
                  <button
                    onClick={cargarMas}
                    disabled={cargandoMas}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                  >
                    {cargandoMas ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        Cargando...
                      </>
                    ) : (
                      <>
                        📄 Cargar más ({paginacion.total - historial.length} restantes)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Indicador cuando se cargaron todos */}
              {!paginacion.tieneProxima && historial.length > LIMITE_POR_PAGINA && (
                <div className="text-center mt-3">
                  <span className="text-xs text-gray-500">
                    ✓ Mostrando todas las {historial.length} producciones
                  </span>
                </div>
              )}

              {/* Sin resultados con filtros */}
              {historialFiltrado.length === 0 && !loading && (
                <div className="text-center py-6 text-gray-500">
                  <span className="text-3xl block mb-2">🔍</span>
                  <p>No se encontraron producciones{(filtros.fechaInicio || filtros.fechaFin || filtros.operador) ? ' con los filtros aplicados' : ''}</p>
                  {(filtros.fechaInicio || filtros.fechaFin || filtros.operador) && (
                    <button
                      onClick={limpiarFiltros}
                      className="mt-2 text-purple-600 hover:text-purple-700 text-sm underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Tarjeta individual de producción
 */
const ProduccionCard = ({ produccion, unidadMedida, canViewPrices, formatearFecha }) => {
  const [detallesExpandidos, setDetallesExpandidos] = useState(false);

  // Calcular diferencia de rendimiento
  const rendimientoPlaneado = produccion.rendimientoPlaneado?.cantidad || 0;
  const rendimientoReal = produccion.rendimientoReal?.cantidad || 0;
  const diferenciaCantidad = produccion.diferenciaRendimiento?.cantidad || (rendimientoReal - rendimientoPlaneado);
  const diferenciaPorcentaje = produccion.diferenciaRendimiento?.porcentaje || 
    (rendimientoPlaneado > 0 ? ((diferenciaCantidad / rendimientoPlaneado) * 100).toFixed(1) : 0);

  // Separar ingredientes y recetas de ingredientesConsumidos
  const ingredientes = (produccion.ingredientesConsumidos || []).filter(item => 
    item.tipo !== 'receta' && !item.receta
  );
  const recetas = (produccion.ingredientesConsumidos || []).filter(item => 
    item.tipo === 'receta' || item.receta
  );

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* Header de la tarjeta */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setDetallesExpandidos(!detallesExpandidos)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">{formatearFecha(produccion.fecha)}</span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                🏭 Producción
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-green-600">
                +{rendimientoReal} {unidadMedida}
              </span>
              {diferenciaCantidad !== 0 && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  diferenciaCantidad > 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {diferenciaCantidad > 0 ? '+' : ''}{diferenciaCantidad} ({diferenciaPorcentaje}%)
                </span>
              )}
              {canViewPrices && produccion.costoTotal > 0 && (
                <span className="text-sm font-medium text-purple-600">
                  S/.{produccion.costoTotal.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${detallesExpandidos ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Detalles expandidos */}
      {detallesExpandidos && (
        <div className="p-3 border-t border-gray-200 bg-white space-y-3">
          {/* Rendimiento detallado */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs font-medium text-blue-700 mb-2">📏 Rendimiento</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-gray-500">Original</div>
                <div className="font-semibold">{produccion.rendimientoOriginal?.cantidad || '-'}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Planeado</div>
                <div className="font-semibold">{rendimientoPlaneado}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Real</div>
                <div className="font-bold text-green-600">{rendimientoReal}</div>
              </div>
            </div>
          </div>

          {/* Ingredientes consumidos */}
          {ingredientes.length > 0 && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-orange-700 mb-2">
                🥬 Ingredientes Consumidos ({ingredientes.length})
              </div>
              <div className="space-y-1">
                {ingredientes.map((ing, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-700">
                      • {ing.nombre || 'Ingrediente'}
                      <span className="text-gray-500 ml-1">
                        ({ing.cantidad} {ing.unidadMedida || unidadMedida})
                      </span>
                    </span>
                    {canViewPrices && ing.costoTotal > 0 && (
                      <span className="text-orange-600 font-medium">
                        S/.{ing.costoTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recetas consumidas */}
          {recetas.length > 0 && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-purple-700 mb-2">
                📋 Recetas Utilizadas ({recetas.length})
              </div>
              <div className="space-y-1">
                {recetas.map((rec, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-gray-700">
                      • {rec.nombre || 'Receta'}
                      <span className="text-gray-500 ml-1">
                        ({rec.cantidad} {rec.unidadMedida || 'porciones'})
                      </span>
                    </span>
                    {canViewPrices && rec.costoTotal > 0 && (
                      <span className="text-purple-600 font-medium">
                        S/.{rec.costoTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Costos - Solo super_admin */}
          {canViewPrices && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-700 mb-2">💰 Resumen de Costos</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Costo Total:</span>
                  <span className="font-bold text-purple-600 ml-1">
                    S/.{(produccion.costoTotal || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Costo/Unidad:</span>
                  <span className="font-bold text-blue-600 ml-1">
                    S/.{(produccion.costoUnitario || 0).toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Diferencias de ingredientes */}
          {(produccion.diferenciasIngredientes || []).length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-xs font-medium text-yellow-700 mb-2">
                ⚠️ Diferencias vs Receta Base
              </div>
              <div className="space-y-1 text-xs">
                {produccion.diferenciasIngredientes.map((dif, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-700">{dif.nombre}</span>
                    <span className={dif.diferencia > 0 ? 'text-red-600' : 'text-green-600'}>
                      {dif.diferencia > 0 ? '+' : ''}{dif.diferencia} ({dif.porcentaje}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {(produccion.motivo || produccion.observaciones) && (
            <div className="bg-gray-50 p-3 rounded-lg">
              {produccion.motivo && (
                <div className="text-xs">
                  <span className="text-gray-500">Motivo:</span>
                  <span className="text-gray-700 ml-1">{produccion.motivo}</span>
                </div>
              )}
              {produccion.observaciones && (
                <div className="text-xs mt-1">
                  <span className="text-gray-500">Observaciones:</span>
                  <span className="text-gray-700 ml-1">{produccion.observaciones}</span>
                </div>
              )}
            </div>
          )}

          {/* Operador */}
          <div className="text-xs text-gray-400 text-right">
            👤 {produccion.operador || 'Sistema'}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialProduccionReceta;
