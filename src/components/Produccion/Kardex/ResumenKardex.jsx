import React, { useState, useEffect, useCallback } from 'react';
import { kardexService } from '../../../services/kardexService';

/**
 * ResumenKardex - Vista del resumen general del inventario valorizado
 * 
 * Muestra:
 * - Total de items con lotes activos
 * - Valor total del inventario
 * - Desglose por tipo (Ingrediente, Material, RecetaProducto)
 * - Lotes próximos a vencer
 */
const ResumenKardex = ({ tipoItem = null, compacto = false }) => {
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandido, setExpandido] = useState(!compacto);

  useEffect(() => {
    cargarResumen();
  }, [tipoItem]);

  const cargarResumen = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [resumenResp, alertasResp] = await Promise.all([
        kardexService.obtenerResumen(tipoItem),
        kardexService.obtenerAlertasVencimiento(7)
      ]);

      if (resumenResp.success) {
        const raw = resumenResp.data;
        // Transformar respuesta del backend
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
          porTipo: Object.values(porTipo)
        });
      }
      if (alertasResp.success) {
        setAlertas(alertasResp.data?.lotes || []);
      }
    } catch (err) {
      if (err.response?.status === 400 || err.message?.includes('No hay')) {
        setError('kardex_vacio');
      } else {
        setError(err.message || 'Error al cargar resumen');
      }
    } finally {
      setLoading(false);
    }
  }, [tipoItem]);

  const formatearTipo = (tipo) => {
    const map = {
      'Ingrediente': '🥬 Ingredientes',
      'Material': '📦 Materiales',
      'RecetaProducto': '📋 Recetas'
    };
    return map[tipo] || tipo;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full p-4 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between hover:from-emerald-100 hover:to-teal-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <span className="font-semibold text-emerald-800">Resumen Inventario Kardex</span>
          {alertas.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full animate-pulse">
              {alertas.length} alertas
            </span>
          )}
        </div>
        <svg 
          className={`w-5 h-5 text-emerald-500 transition-transform ${expandido ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandido && (
        <div className="p-4 space-y-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              <span className="ml-2 text-sm text-emerald-600">Cargando resumen...</span>
            </div>
          )}

          {/* Kardex vacío */}
          {error === 'kardex_vacio' && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <span className="text-2xl block mb-2">📋</span>
              <p className="text-sm text-amber-800">
                El Kardex no tiene datos aún. Ejecute la migración para inicializar los lotes.
              </p>
            </div>
          )}

          {/* Error */}
          {error && error !== 'kardex_vacio' && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={cargarResumen} className="text-xs text-red-600 underline mt-1">
                Reintentar
              </button>
            </div>
          )}

          {/* Datos del resumen */}
          {resumen && !loading && !error && (
            <>
              {/* Tarjetas de resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-500 mb-1">Valor Total Inventario</div>
                  <div className="text-xl font-bold text-emerald-700">
                    S/.{(resumen.valorTotal || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-500 mb-1">Items con Stock</div>
                  <div className="text-xl font-bold text-blue-700">
                    {resumen.totalItems || 0}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-500 mb-1">Lotes Activos</div>
                  <div className="text-xl font-bold text-purple-700">
                    {resumen.totalLotes || 0}
                  </div>
                </div>
              </div>

              {/* Desglose por tipo */}
              {resumen.porTipo && resumen.porTipo.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Desglose por tipo</h5>
                  {resumen.porTipo.map((tipo, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{formatearTipo(tipo._id || tipo.tipoItem)}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-800">
                          S/.{(tipo.valorTotal || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tipo.cantidad || tipo.totalItems || 0} items · {tipo.lotes || tipo.totalLotes || 0} lotes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Alertas de vencimiento */}
              {alertas.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-red-800 mb-2">
                    ⏰ Lotes próximos a vencer (7 días)
                  </h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {alertas.map((lote, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-red-700">
                          {lote.item?.nombre || 'Item'} - Lote {lote.numeroLote}
                        </span>
                        <span className="text-red-600 font-medium">
                          {lote.cantidadDisponible} u · Vence: {new Date(lote.fechaVencimiento).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Método activo */}
              <div className="text-center">
                <span className="text-xs text-gray-400">
                  Método de valuación: {resumen.metodo || 'PEPS'} · Moneda: {resumen.moneda || 'PEN'}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumenKardex;
