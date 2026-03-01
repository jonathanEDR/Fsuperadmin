import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, BarChart3, ChevronDown, FileText, Leaf, AlertTriangle } from 'lucide-react';
import { kardexService } from '../../../services/kardexService';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

/**
 * TarjetaKardex - Muestra el desglose PEPS real del costo de producción de una receta
 * 
 * Reemplaza la calculadora de costos simple con datos reales del Kardex:
 * - Costo PEPS real por cada ingrediente (basado en lotes existentes)
 * - Desglose de qué lotes se consumirían
 * - Disponibilidad real vs requerida
 * - Costo unitario y total de producción
 */
const TarjetaKardex = ({ recetaId, recetaNombre, rendimiento, cantidadAProducir = 1 }) => {
  const { canViewPrices, isSuperAdmin } = useQuickPermissions();
  
  const [simulacion, setSimulacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cantidad, setCantidad] = useState(cantidadAProducir);
  const [expandido, setExpandido] = useState(true);
  const [detalleExpandido, setDetalleExpandido] = useState(null);

  useEffect(() => {
    if (recetaId && canViewPrices) {
      simularCosto();
    }
  }, [recetaId, cantidad]);

  const simularCosto = useCallback(async () => {
    if (!recetaId) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await kardexService.simularCostoProduccion(recetaId, cantidad);
      
      if (response.success) {
        setSimulacion(response.data);
      } else {
        setError(response.message || 'Error al simular costo');
      }
    } catch (err) {
      // Si el Kardex no tiene datos (no migrado), mostrar aviso amigable
      if (err.message?.includes('No hay lotes') || err.response?.status === 400) {
        setError('kardex_vacio');
      } else {
        setError(err.message || 'Error al conectar con el Kardex');
      }
    } finally {
      setLoading(false);
    }
  }, [recetaId, cantidad]);

  // No renderizar si no tiene permisos de precios
  if (!canViewPrices) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full p-4 flex items-center justify-between hover:from-indigo-100 hover:to-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-600" />
          <span className="font-semibold text-indigo-800">Costos Kardex PEPS</span>
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
            Valuación Real
          </span>
        </div>
        <ChevronDown 
          size={20}
          className={`text-indigo-500 transition-transform ${expandido ? 'rotate-180' : ''}`}
        />
      </button>

      {expandido && (
        <div className="px-4 pb-4 space-y-4">
          {/* Selector de cantidad */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-indigo-700">
              Lotes a producir:
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-2 py-1 border border-indigo-200 rounded-xl text-center text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <span className="text-xs text-gray-500">
              = {(typeof rendimiento === 'number' ? rendimiento : rendimiento?.cantidad || 1) * cantidad} unidades
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-sm text-indigo-600">Calculando costos PEPS...</span>
            </div>
          )}

          {/* Error: Kardex vacío */}
          {error === 'kardex_vacio' && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Kardex sin datos iniciales</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Ejecute la migración del Kardex para cargar los lotes iniciales desde el inventario existente.
                    Los precios se mostrarán cuando haya lotes registrados.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error genérico */}
          {error && error !== 'kardex_vacio' && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={simularCosto}
                className="text-xs text-red-600 underline mt-1"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Datos de simulación */}
          {simulacion && !loading && !error && (
            <>
              {/* Resumen de costos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                  <div className="text-xs text-gray-500 mb-1">Costo Total</div>
                  <div className="text-lg font-bold text-indigo-700">
                    S/.{simulacion.costoTotalProduccion.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                  <div className="text-xs text-gray-500 mb-1">Costo/Unidad</div>
                  <div className="text-lg font-bold text-blue-700">
                    S/.{simulacion.costoUnitarioProducto.toFixed(4)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                  <div className="text-xs text-gray-500 mb-1">Unidades</div>
                  <div className="text-lg font-bold text-green-700">
                    {simulacion.unidadesProducidas}
                  </div>
                </div>
                <div className={`bg-white p-3 rounded-xl border text-center ${
                  simulacion.todosDisponibles 
                    ? 'border-green-200' 
                    : 'border-red-200'
                }`}>
                  <div className="text-xs text-gray-500 mb-1">Disponibilidad</div>
                  <div className={`text-lg font-bold ${
                    simulacion.todosDisponibles ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {simulacion.todosDisponibles ? '✓ OK' : '✗ Falta'}
                  </div>
                </div>
              </div>

              {/* Desglose por ingrediente */}
              <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden">
                <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                  <h5 className="text-sm font-medium text-indigo-800 flex items-center gap-1.5">
                    <FileText size={14} /> Desglose PEPS por Ingrediente
                  </h5>
                </div>
                <div className="divide-y divide-gray-100">
                  {simulacion.desglose.map((item, index) => (
                    <div key={index} className="p-3">
                      {/* Header del item */}
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setDetalleExpandido(
                          detalleExpandido === index ? null : index
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm">
                            {item.tipo === 'receta' ? <FileText size={14} className="text-purple-500" /> : <Leaf size={14} className="text-green-500" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {item.nombre}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.cantidadRequerida} {item.unidadMedida}
                              {' · '}
                              <span className={item.suficiente ? 'text-green-600' : 'text-red-600'}>
                                Disponible: {item.disponible}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-bold text-indigo-700">
                              S/.{item.costoTotal.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              S/.{item.costoUnitarioPeps.toFixed(4)}/u
                            </div>
                          </div>
                          {item.lotesAConsumir?.length > 0 && (
                            <ChevronDown 
                              size={16}
                              className={`text-gray-400 transition-transform ${
                                detalleExpandido === index ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </div>
                      </div>

                      {/* Estado insuficiente */}
                      {!item.suficiente && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded px-2 py-1">
                          <span className="text-xs text-red-700 flex items-center gap-1">
                            <AlertTriangle size={12} /> Faltan {(item.cantidadRequerida - item.disponible).toFixed(2)} {item.unidadMedida}
                          </span>
                        </div>
                      )}

                      {/* Desglose de lotes PEPS */}
                      {detalleExpandido === index && item.lotesAConsumir?.length > 0 && (
                        <div className="mt-2 ml-6 space-y-1">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Lotes a consumir (PEPS - más antiguo primero):
                          </div>
                          {item.lotesAConsumir.map((lote, loteIdx) => (
                            <div 
                              key={loteIdx}
                              className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-xs">
                                  {lote.numeroLote}
                                </span>
                                <span className="text-gray-600">
                                  {lote.cantidad} u × S/.{lote.precioUnitario.toFixed(4)}
                                </span>
                              </div>
                              <span className="font-medium text-gray-800">
                                S/.{lote.costoTotal.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="px-3 py-2 bg-indigo-50 border-t border-indigo-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-800">
                      Costo Total de Producción
                    </span>
                    <span className="text-lg font-bold text-indigo-800">
                      S/.{simulacion.costoTotalProduccion.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-indigo-600">
                      {simulacion.unidadesProducidas} unidades producidas
                    </span>
                    <span className="text-xs text-indigo-600">
                      S/.{simulacion.costoUnitarioProducto.toFixed(4)} por unidad
                    </span>
                  </div>
                </div>
              </div>

              {/* Método de valuación */}
              <div className="text-center">
                <span className="text-xs text-gray-400">
                  Método: PEPS (Primeras Entradas, Primeras Salidas)
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TarjetaKardex;
