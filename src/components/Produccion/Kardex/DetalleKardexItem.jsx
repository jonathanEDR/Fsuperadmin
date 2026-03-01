import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronLeft, RefreshCw, Package, Search, X, BookOpen, Inbox, Leaf, FileText, AlertTriangle, Clock, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { kardexService } from '../../../services/kardexService';

/**
 * DetalleKardexItem - Tarjeta Kardex contable de un item individual
 * 
 * Muestra la vista clásica de Kardex contable:
 * Fecha | Concepto | ENTRADAS (Qty/PU/Total) | SALIDAS (Qty/PU/Total) | SALDO (Qty/Valor/CU)
 * 
 * + Lotes activos con stock
 * + Filtros por fecha
 * + Paginación
 */
const DetalleKardexItem = ({ itemId, tipoItem, nombreItem, onVolver }) => {
  const [tarjeta, setTarjeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({ fechaInicio: '', fechaFin: '' });
  const [pagina, setPagina] = useState(1);
  const [mostrarLotes, setMostrarLotes] = useState(false);

  const LIMITE = 50;

  useEffect(() => {
    cargarTarjeta(1);
  }, [itemId, tipoItem]);

  const cargarTarjeta = useCallback(async (pag = 1) => {
    if (!itemId || !tipoItem) return;

    try {
      setLoading(true);
      setError('');

      const opciones = {
        pagina: pag,
        limite: LIMITE
      };
      if (filtros.fechaInicio) opciones.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) opciones.fechaFin = filtros.fechaFin;

      const response = await kardexService.obtenerTarjetaKardex(tipoItem, itemId, opciones);

      if (response.success) {
        setTarjeta(response.data);
        setPagina(pag);
      } else {
        setError(response.message || 'Error al cargar tarjeta');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar tarjeta Kardex');
    } finally {
      setLoading(false);
    }
  }, [itemId, tipoItem, filtros]);

  const handleFiltrar = () => {
    cargarTarjeta(1);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ fechaInicio: '', fechaFin: '' });
    setTimeout(() => cargarTarjeta(1), 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearConcepto = (concepto) => {
    const conceptos = {
      'compra': { label: 'Compra', color: 'text-green-700 bg-green-50', icon: <Package size={14} /> },
      'produccion': { label: 'Producción', color: 'text-blue-700 bg-blue-50', icon: <Leaf size={14} /> },
      'devolucion_produccion': { label: 'Devolución', color: 'text-orange-700 bg-orange-50', icon: <RefreshCw size={14} /> },
      'ajuste_positivo': { label: 'Ajuste (+)', color: 'text-emerald-700 bg-emerald-50', icon: <ChevronRightIcon size={14} /> },
      'inventario_inicial': { label: 'Inventario Inicial', color: 'text-indigo-700 bg-indigo-50', icon: <FileText size={14} /> },
      'consumo_produccion': { label: 'Consumo Producción', color: 'text-red-700 bg-red-50', icon: <AlertTriangle size={14} /> },
      'consumo_receta': { label: 'Consumo Receta', color: 'text-purple-700 bg-purple-50', icon: <BookOpen size={14} /> },
      'ajuste_negativo': { label: 'Ajuste (-)', color: 'text-red-700 bg-red-50', icon: <ChevronLeft size={14} /> },
      'merma': { label: 'Merma', color: 'text-gray-700 bg-gray-100', icon: <AlertTriangle size={14} /> },
      'transferencia_salida': { label: 'Transferencia', color: 'text-amber-700 bg-amber-50', icon: <Package size={14} /> }
    };
    return conceptos[concepto] || { label: concepto, color: 'text-gray-700 bg-gray-50', icon: <FileText size={14} /> };
  };

  const tipoIcono = {
    'Ingrediente': <Leaf size={20} className="text-green-600" />,
    'Material': <Package size={20} className="text-yellow-600" />,
    'RecetaProducto': <FileText size={20} className="text-purple-600" />
  };

  return (
    <div className="space-y-4">
      {/* Header con botón volver */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
            title="Volver al listado"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {tipoIcono[tipoItem] || <FileText size={20} className="text-gray-500" />} {tarjeta?.item?.nombre || nombreItem}
            </h2>
            <p className="text-sm text-gray-500">
              Tarjeta Kardex · {tipoItem} · {tarjeta?.configuracion?.metodoValuacion || 'PEPS'}
            </p>
          </div>
        </div>
        <button
          onClick={() => cargarTarjeta(pagina)}
          disabled={loading}
          className="px-3 py-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Resumen actual */}
      {tarjeta?.resumenActual && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
            <div className="text-xs text-blue-600 font-medium">Stock Actual</div>
            <div className="text-xl font-bold text-blue-800">
              {tarjeta.resumenActual.cantidadTotal.toFixed(2)}
            </div>
            <div className="text-xs text-blue-500">{tarjeta.item?.unidadMedida || 'u'}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
            <div className="text-xs text-emerald-600 font-medium">Valor Total</div>
            <div className="text-xl font-bold text-emerald-800">
              S/.{tarjeta.resumenActual.valorTotal.toFixed(2)}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center">
            <div className="text-xs text-purple-600 font-medium">Costo Promedio</div>
            <div className="text-xl font-bold text-purple-800">
              S/.{tarjeta.resumenActual.costoPromedioPonderado.toFixed(4)}
            </div>
            <div className="text-xs text-purple-500">por unidad</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
            <div className="text-xs text-amber-600 font-medium">Lotes Activos</div>
            <div className="text-xl font-bold text-amber-800">
              {tarjeta.resumenActual.cantidadLotes}
            </div>
          </div>
        </div>
      )}

      {/* Lotes activos (colapsable) */}
      {tarjeta?.resumenActual?.lotes?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setMostrarLotes(!mostrarLotes)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors"
          >
            <span className="font-medium text-amber-800 text-sm">
              <Package size={16} className="text-amber-600" /> Lotes Activos ({tarjeta.resumenActual.lotes.length})
            </span>
            <ChevronDown 
              size={16}
              className={`text-amber-500 transition-transform ${mostrarLotes ? 'rotate-180' : ''}`}
            />
          </button>
          {mostrarLotes && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <th className="px-3 py-2 text-left">Lote</th>
                    <th className="px-3 py-2 text-right">Disponible</th>
                    <th className="px-3 py-2 text-right">P/U</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2 text-left">Entrada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tarjeta.resumenActual.lotes.map((lote, idx) => (
                    <tr key={idx} className="hover:bg-amber-50 transition-colors">
                      <td className="px-3 py-2">
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-mono text-xs">
                          {lote.numeroLote}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{lote.cantidadDisponible}</td>
                      <td className="px-3 py-2 text-right text-gray-600">S/.{lote.precioUnitario.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-medium text-emerald-700">S/.{lote.valorLote.toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {formatearFecha(lote.fechaEntrada)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filtros de fecha */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={handleFiltrar}
            className="px-4 py-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Search size={14} /> Filtrar
          </button>
          {(filtros.fechaInicio || filtros.fechaFin) && (
            <button
              onClick={handleLimpiarFiltros}
              className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Cargando tarjeta Kardex...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => cargarTarjeta(1)} className="text-red-600 text-xs underline mt-2">Reintentar</button>
        </div>
      )}

      {/* ============================================================ */}
      {/* TABLA KARDEX CONTABLE - LA VISTA PRINCIPAL                   */}
      {/* ============================================================ */}
      {!loading && !error && tarjeta?.movimientos && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b flex items-center justify-between">
            <h3 className="font-semibold text-indigo-800 text-sm flex items-center gap-2">
              <BookOpen size={16} /> Tarjeta Kardex Contable
            </h3>
            <span className="text-xs text-gray-500">
              {tarjeta.paginacion?.total || 0} movimientos
            </span>
          </div>

          {tarjeta.movimientos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Inbox size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay movimientos registrados en este período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-2 py-2 text-left" rowSpan="2">Fecha</th>
                    <th className="px-2 py-2 text-left" rowSpan="2">Concepto</th>
                    <th className="px-1 py-1 text-center border-l border-gray-600" colSpan="3">
                      <span className="text-green-300">ENTRADAS</span>
                    </th>
                    <th className="px-1 py-1 text-center border-l border-gray-600" colSpan="3">
                      <span className="text-red-300">SALIDAS</span>
                    </th>
                    <th className="px-1 py-1 text-center border-l border-gray-600" colSpan="3">
                      <span className="text-blue-300">SALDO</span>
                    </th>
                  </tr>
                  <tr className="bg-gray-700 text-gray-300 text-xs">
                    {/* Entradas */}
                    <th className="px-2 py-1 text-right border-l border-gray-600">Qty</th>
                    <th className="px-2 py-1 text-right">P/U</th>
                    <th className="px-2 py-1 text-right">Total</th>
                    {/* Salidas */}
                    <th className="px-2 py-1 text-right border-l border-gray-600">Qty</th>
                    <th className="px-2 py-1 text-right">P/U</th>
                    <th className="px-2 py-1 text-right">Total</th>
                    {/* Saldo */}
                    <th className="px-2 py-1 text-right border-l border-gray-600">Qty</th>
                    <th className="px-2 py-1 text-right">Valor</th>
                    <th className="px-2 py-1 text-right">C/U</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tarjeta.movimientos.map((mov, idx) => {
                    const esEntrada = mov.tipoMovimiento === 'entrada';
                    const conceptoInfo = formatearConcepto(mov.concepto);

                    return (
                      <tr 
                        key={mov._id || idx} 
                        className={`hover:bg-gray-50 transition-colors ${
                          esEntrada ? 'bg-green-50/30' : 'bg-red-50/30'
                        }`}
                      >
                        {/* Fecha */}
                        <td className="px-2 py-2 text-gray-600 whitespace-nowrap text-xs">
                          {formatearFecha(mov.fecha)}
                        </td>

                        {/* Concepto */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <span>{conceptoInfo.icon}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${conceptoInfo.color}`}>
                              {conceptoInfo.label}
                            </span>
                          </div>
                          {mov.observaciones && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[150px]" title={mov.observaciones}>
                              {mov.observaciones}
                            </div>
                          )}
                        </td>

                        {/* ENTRADAS: Qty / P.U. / Total */}
                        <td className="px-2 py-2 text-right text-green-700 font-medium border-l border-gray-100">
                          {esEntrada ? mov.entrada?.cantidad?.toFixed(2) : ''}
                        </td>
                        <td className="px-2 py-2 text-right text-green-600 text-xs">
                          {esEntrada ? `S/.${mov.entrada?.precioUnitario?.toFixed(2)}` : ''}
                        </td>
                        <td className="px-2 py-2 text-right text-green-700 font-medium">
                          {esEntrada ? `S/.${mov.entrada?.costoTotal?.toFixed(2)}` : ''}
                        </td>

                        {/* SALIDAS: Qty / P.U. / Total */}
                        <td className="px-2 py-2 text-right text-red-700 font-medium border-l border-gray-100">
                          {!esEntrada ? mov.salida?.cantidad?.toFixed(2) : ''}
                        </td>
                        <td className="px-2 py-2 text-right text-red-600 text-xs">
                          {!esEntrada ? `S/.${mov.salida?.costoUnitarioPonderado?.toFixed(2)}` : ''}
                        </td>
                        <td className="px-2 py-2 text-right text-red-700 font-medium">
                          {!esEntrada ? `S/.${mov.salida?.costoTotal?.toFixed(2)}` : ''}
                        </td>

                        {/* SALDO: Qty / Valor / C.U. */}
                        <td className="px-2 py-2 text-right font-bold text-blue-800 border-l border-gray-100">
                          {mov.saldo?.cantidad?.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right font-medium text-blue-700">
                          S/.{mov.saldo?.valorTotal?.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right text-blue-600 text-xs">
                          S/.{mov.saldo?.costoUnitarioPromedio?.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {tarjeta.paginacion && tarjeta.paginacion.totalPaginas > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Página {tarjeta.paginacion.pagina} de {tarjeta.paginacion.totalPaginas}
                {' · '}{tarjeta.paginacion.total} movimientos
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => cargarTarjeta(pagina - 1)}
                  disabled={pagina <= 1 || loading}
                  className="px-3 py-1 text-gray-700 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button
                  onClick={() => cargarTarjeta(pagina + 1)}
                  disabled={pagina >= tarjeta.paginacion.totalPaginas || loading}
                  className="px-3 py-1 text-gray-700 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  Siguiente <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referencia del número de movimiento */}
      {!loading && !error && tarjeta?.movimientos?.length > 0 && (
        <div className="text-center text-xs text-gray-400">
          Método: {tarjeta?.configuracion?.metodoValuacion || 'PEPS'} · Moneda: {tarjeta?.configuracion?.moneda || 'PEN'}
        </div>
      )}
    </div>
  );
};

export default DetalleKardexItem;
