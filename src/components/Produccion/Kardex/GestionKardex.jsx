import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kardexService } from '../../../services/kardexService';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import BreadcrumbProduccion from '../BreadcrumbProduccion';
import DetalleKardexItem from './DetalleKardexItem';

/**
 * GestionKardex - Página principal del módulo Kardex
 * 
 * Muestra:
 * - Resumen general valorizado del inventario
 * - Configuración del método de valuación
 * - Tarjetas por tipo (Ingredientes, Materiales, Recetas)
 * - Alertas de vencimiento
 */
const GestionKardex = () => {
  const navigate = useNavigate();
  const { canViewPrices, isSuperAdmin } = useQuickPermissions();

  const [resumen, setResumen] = useState(null);
  const [configuracion, setConfiguracion] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabActiva, setTabActiva] = useState('resumen');
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const resultados = await Promise.allSettled([
        kardexService.obtenerResumen(),
        kardexService.obtenerConfiguracion(),
        kardexService.obtenerAlertasVencimiento(15)
      ]);

      if (resultados[0].status === 'fulfilled' && resultados[0].value.success) {
        const raw = resultados[0].value.data;
        // Transformar la respuesta del backend al formato del componente
        const porTipo = {};
        (raw.items || []).forEach(item => {
          if (!porTipo[item.tipoItem]) {
            porTipo[item.tipoItem] = { _id: item.tipoItem, valorTotal: 0, cantidad: 0, totalLotes: 0 };
          }
          porTipo[item.tipoItem].valorTotal += item.valorTotal || 0;
          porTipo[item.tipoItem].cantidad += 1;
          porTipo[item.tipoItem].totalLotes += item.cantidadLotes || 0;
        });
        setResumen({
          totalItems: raw.totales?.totalItems || 0,
          valorTotal: raw.totales?.valorTotalInventario || 0,
          totalLotes: raw.totales?.totalLotes || 0,
          porTipo: Object.values(porTipo),
          items: raw.items || []
        });
      }
      if (resultados[1].status === 'fulfilled' && resultados[1].value.success) {
        setConfiguracion(resultados[1].value.data);
      }
      if (resultados[2].status === 'fulfilled' && resultados[2].value.success) {
        setAlertas(resultados[2].value.data?.lotes || []);
      }

      // Si el resumen falló pero hay config, no es un error fatal
      const resumenFallo = resultados[0].status === 'rejected';
      const configFallo = resultados[1].status === 'rejected';
      if (resumenFallo && configFallo) {
        const errMsg = resultados[0].reason?.response?.data?.message 
          || resultados[0].reason?.message 
          || 'No se pudo conectar con el Kardex';
        setError(errMsg);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar datos del Kardex');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGuardarConfiguracion = async (nuevoMetodo) => {
    try {
      setGuardandoConfig(true);
      await kardexService.actualizarConfiguracion({ metodoValuacion: nuevoMetodo });
      await cargarDatos();
      alert('✅ Configuración actualizada correctamente');
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setGuardandoConfig(false);
    }
  };

  const handleInicializarConfig = async () => {
    try {
      setGuardandoConfig(true);
      await kardexService.inicializarConfiguracion();
      await cargarDatos();
      alert('✅ Configuración inicializada correctamente');
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setGuardandoConfig(false);
    }
  };

  if (!canViewPrices) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600">Solo super_admin puede acceder al módulo Kardex.</p>
      </div>
    );
  }

  const TABS = [
    { id: 'resumen', label: 'Resumen', icon: '📊' },
    { id: 'inventario', label: 'Inventario', icon: '📒' },
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
    { id: 'alertas', label: `Alertas ${alertas.length > 0 ? `(${alertas.length})` : ''}`, icon: '🔔' }
  ];

  return (
    <div className="px-2 sm:px-6 py-4">
      <BreadcrumbProduccion />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            📈 Kardex de Inventario
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistema de valuación PEPS - Control de lotes e inventario
          </p>
        </div>
        <button
          onClick={cargarDatos}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={cargarDatos} className="ml-2 underline font-medium">Reintentar</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Cargando Kardex...</span>
        </div>
      ) : (
        <>
          {/* TAB: Resumen */}
          {tabActiva === 'resumen' && (
            <div className="space-y-6">
              {/* Tarjetas de resumen principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-5 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Valor Total</p>
                      <p className="text-2xl font-bold mt-1">
                        S/.{(resumen?.valorTotal || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">💰</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Items con Stock</p>
                      <p className="text-2xl font-bold mt-1">{resumen?.totalItems || 0}</p>
                    </div>
                    <div className="text-3xl opacity-80">📦</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-200 text-xs font-medium uppercase tracking-wide">Lotes Activos</p>
                      <p className="text-2xl font-bold mt-1">{resumen?.totalLotes || 0}</p>
                    </div>
                    <div className="text-3xl opacity-80">📋</div>
                  </div>
                </div>

                <div className={`${alertas.length > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'} text-white p-5 rounded-xl shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${alertas.length > 0 ? 'text-red-200' : 'text-green-200'} text-xs font-medium uppercase tracking-wide`}>Alertas</p>
                      <p className="text-2xl font-bold mt-1">{alertas.length}</p>
                    </div>
                    <div className="text-3xl opacity-80">{alertas.length > 0 ? '⚠️' : '✅'}</div>
                  </div>
                </div>
              </div>

              {/* Desglose por tipo */}
              {resumen?.porTipo && resumen.porTipo.length > 0 && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      📊 Inventario por Categoría
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {resumen.porTipo.map((tipo, idx) => {
                      const tipoLabel = {
                        'Ingrediente': { icon: '🥬', label: 'Ingredientes', color: 'text-green-600 bg-green-50' },
                        'Material': { icon: '📦', label: 'Materiales', color: 'text-yellow-600 bg-yellow-50' },
                        'RecetaProducto': { icon: '📋', label: 'Recetas/Productos', color: 'text-purple-600 bg-purple-50' }
                      }[tipo._id || tipo.tipoItem] || { icon: '📄', label: tipo._id || tipo.tipoItem, color: 'text-gray-600 bg-gray-50' };

                      const valorTotal = tipo.valorTotal || 0;
                      const porcentaje = resumen.valorTotal > 0 ? (valorTotal / resumen.valorTotal * 100) : 0;

                      return (
                        <div key={idx} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${tipoLabel.color}`}>
                            {tipoLabel.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800">{tipoLabel.label}</span>
                              <span className="font-bold text-gray-900">S/.{valorTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-20 text-right">
                                {(tipo.cantidad || tipo.totalItems || 0)} items · {porcentaje.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Método activo */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl">⚙️</div>
                <div>
                  <p className="font-medium text-indigo-800">Método de Valuación Activo</p>
                  <p className="text-sm text-indigo-600">
                    {configuracion?.metodoValuacion || 'PEPS'} — {
                      configuracion?.metodoValuacion === 'PROMEDIO_PONDERADO' 
                        ? 'Promedio Ponderado' 
                        : 'Primeras Entradas, Primeras Salidas'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Inventario - Listado de items con acceso a tarjeta Kardex */}
          {tabActiva === 'inventario' && (
            <>
              {itemSeleccionado ? (
                <DetalleKardexItem
                  itemId={itemSeleccionado.itemId}
                  tipoItem={itemSeleccionado.tipoItem}
                  nombreItem={itemSeleccionado.nombreItem}
                  onVolver={() => setItemSeleccionado(null)}
                />
              ) : (
                <div className="space-y-4">
                  {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { id: 'todos', label: 'Todos' },
                        { id: 'Ingrediente', label: '🥬 Ingredientes' },
                        { id: 'Material', label: '📦 Materiales' },
                        { id: 'RecetaProducto', label: '📋 Recetas' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFiltroTipo(f.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                            filtroTipo === f.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de items */}
                  {(() => {
                    const itemsFiltrados = (resumen?.items || []).filter(item => {
                      if (filtroTipo !== 'todos' && item.tipoItem !== filtroTipo) return false;
                      if (busqueda && !item.nombreItem?.toLowerCase().includes(busqueda.toLowerCase())) return false;
                      return true;
                    });

                    if (itemsFiltrados.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <span className="text-4xl block mb-2">📭</span>
                          <p className="text-gray-500 text-sm">No se encontraron items en el Kardex.</p>
                        </div>
                      );
                    }

                    const tipoIconos = {
                      'Ingrediente': { icon: '🥬', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700' },
                      'Material': { icon: '📦', color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
                      'RecetaProducto': { icon: '📋', color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700' }
                    };

                    return (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b flex items-center justify-between">
                          <h3 className="font-semibold text-indigo-800 text-sm">
                            📒 Items del Kardex ({itemsFiltrados.length})
                          </h3>
                          <span className="text-xs text-gray-500">
                            Click en un item para ver su tarjeta Kardex
                          </span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {itemsFiltrados.map((item, idx) => {
                            const tipoInfo = tipoIconos[item.tipoItem] || { icon: '📄', color: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-600' };
                            return (
                              <button
                                key={idx}
                                onClick={() => setItemSeleccionado(item)}
                                className="w-full px-4 py-3 flex items-center gap-4 hover:bg-indigo-50 transition-colors text-left group"
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${tipoInfo.color} border`}>
                                  {tipoInfo.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-800 truncate group-hover:text-indigo-700">
                                      {item.nombreItem}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tipoInfo.badge}`}>
                                      {item.tipoItem === 'RecetaProducto' ? 'Receta' : item.tipoItem}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                                    <span>{item.cantidadTotal?.toFixed(2)} {item.unidadMedida || 'u'}</span>
                                    <span>·</span>
                                    <span>{item.cantidadLotes} lote{item.cantidadLotes !== 1 ? 's' : ''}</span>
                                    {item.ultimaEntrada && (
                                      <>
                                        <span>·</span>
                                        <span>Última entrada: {new Date(item.ultimaEntrada).toLocaleDateString('es-PE')}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-900">S/.{(item.valorTotal || 0).toFixed(2)}</div>
                                  <div className="text-xs text-gray-500">
                                    C/U: S/.{(item.costoPromedio || 0).toFixed(2)}
                                  </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}

          {/* TAB: Configuración */}
          {tabActiva === 'configuracion' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    ⚙️ Configuración del Kardex
                  </h3>
                </div>
                <div className="p-5 space-y-6">
                  {/* Método de valuación */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Método de Valuación de Inventario
                    </label>
                    <div className="space-y-3">
                      <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        (configuracion?.metodoValuacion || 'PEPS') === 'PEPS'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="metodo"
                          value="PEPS"
                          checked={(configuracion?.metodoValuacion || 'PEPS') === 'PEPS'}
                          onChange={() => handleGuardarConfiguracion('PEPS')}
                          disabled={guardandoConfig}
                          className="mt-1 text-indigo-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">PEPS (Recomendado)</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Primeras Entradas, Primeras Salidas. Los lotes más antiguos se consumen primero. 
                            Ideal para productos perecederos y control de caducidad.
                          </div>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        configuracion?.metodoValuacion === 'PROMEDIO_PONDERADO'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="metodo"
                          value="PROMEDIO_PONDERADO"
                          checked={configuracion?.metodoValuacion === 'PROMEDIO_PONDERADO'}
                          onChange={() => handleGuardarConfiguracion('PROMEDIO_PONDERADO')}
                          disabled={guardandoConfig}
                          className="mt-1 text-indigo-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Promedio Ponderado</div>
                          <div className="text-sm text-gray-500 mt-1">
                            El costo unitario se calcula como promedio de todos los lotes. 
                            Es más simple pero menos preciso para control de caducidad.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Info */}
                  {configuracion && (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Moneda:</span>
                        <span className="font-medium">{configuracion.moneda || 'PEN'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Última actualización:</span>
                        <span className="font-medium">
                          {configuracion.updatedAt 
                            ? new Date(configuracion.updatedAt).toLocaleDateString('es-PE', { dateStyle: 'medium' })
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Actualizado por:</span>
                        <span className="font-medium">{configuracion.actualizadoPor || 'sistema'}</span>
                      </div>
                    </div>
                  )}

                  {/* Reinicializar */}
                  {!configuracion && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-800 mb-3">
                        No se encontró configuración del Kardex. Inicialice con los valores por defecto.
                      </p>
                      <button
                        onClick={handleInicializarConfig}
                        disabled={guardandoConfig}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {guardandoConfig ? 'Inicializando...' : '🔧 Inicializar Configuración'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Alertas */}
          {tabActiva === 'alertas' && (
            <div className="space-y-4">
              {alertas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-lg font-medium text-gray-800">Sin alertas</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    No hay lotes próximos a vencer en los próximos 15 días.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b">
                    <h3 className="font-semibold text-red-800 flex items-center gap-2">
                      ⚠️ Lotes próximos a vencer ({alertas.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {alertas.map((lote, idx) => {
                      const diasRestantes = lote.fechaVencimiento 
                        ? Math.ceil((new Date(lote.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      return (
                        <div key={idx} className="px-5 py-4 flex items-center gap-4 hover:bg-red-50 transition-colors">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                            diasRestantes !== null && diasRestantes <= 3 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {diasRestantes !== null ? `${diasRestantes}d` : '⏰'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">
                              {lote.item?.nombre || 'Item desconocido'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Lote {lote.numeroLote} · {lote.cantidadDisponible} {lote.unidadMedida} disponible
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-medium text-gray-700">
                              S/.{(lote.precioUnitario || 0).toFixed(2)}/u
                            </div>
                            <div className="text-gray-500">
                              {lote.fechaVencimiento 
                                ? new Date(lote.fechaVencimiento).toLocaleDateString('es-PE')
                                : 'Sin fecha'
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GestionKardex;
