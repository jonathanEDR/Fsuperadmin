/**
 * Tabla de registros de gestion personal
 * Con agrupacion por fecha, filtros y acciones
 */

import React, { useMemo, useState } from 'react';
import { Trash2, Calendar, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import {
  agruparRegistrosPorFecha,
  obtenerDescripcionTipo,
  obtenerColorTipo,
  obtenerIconoTipo,
  obtenerColorMontoTexto,
  formatearMontoConSigno,
  esRegistroAutomatico
} from '../utils/registrosHelper';

const RegistrosTable = React.memo(({
  registros, onEliminar, formatearMoneda, loading, filtroFecha, customRange, userRole
}) => {

  // Filtrar registros segun criterio de fecha
  const registrosFiltrados = useMemo(() => {
    if (!registros || registros.length === 0) return [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return registros.filter(registro => {
      const fr = new Date(registro.fechaDeGestion);
      fr.setHours(0, 0, 0, 0);
      switch (filtroFecha) {
        case 'hoy': return fr.getTime() === hoy.getTime();
        case 'semana': { const ini = new Date(hoy); ini.setDate(hoy.getDate() - hoy.getDay()); return fr >= ini; }
        case 'mes': return fr.getMonth() === hoy.getMonth() && fr.getFullYear() === hoy.getFullYear();
        case 'custom': {
          if (!customRange.start || !customRange.end) return true;
          const fi = new Date(customRange.start); fi.setHours(0,0,0,0);
          const ff = new Date(customRange.end); ff.setHours(23,59,59,999);
          return fr >= fi && fr <= ff;
        }
        default: return true;
      }
    });
  }, [registros, filtroFecha, customRange]);

  const registrosAgrupados = useMemo(() => agruparRegistrosPorFecha(registrosFiltrados), [registrosFiltrados]);

  const totalesFiltrados = useMemo(() => {
    return registrosFiltrados.reduce((acc, r) => ({
      gastos: acc.gastos + (r.monto || 0),
      faltantes: acc.faltantes + (r.faltante || 0),
      adelantos: acc.adelantos + (r.adelanto || 0),
      pagosDiarios: acc.pagosDiarios + (r.pagodiario || 0),
      bonificaciones: acc.bonificaciones + (r.bonificacion || 0)
    }), { gastos: 0, faltantes: 0, adelantos: 0, pagosDiarios: 0, bonificaciones: 0 });
  }, [registrosFiltrados]);

  const [fechasExpandidas, setFechasExpandidas] = useState({});

  const fmtFechaCorta = (fecha) => new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Lima'
  });

  const toggleFecha = (key) => setFechasExpandidas(p => ({ ...p, [key]: !p[key] }));

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Loader2 size={24} className="animate-spin text-blue-400 mx-auto" />
        <p className="mt-2 text-xs text-gray-400">Cargando registros...</p>
      </div>
    );
  }

  if (registrosFiltrados.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Calendar size={36} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No hay registros para mostrar</p>
        <p className="text-xs text-gray-400 mt-1">
          {filtroFecha !== 'historico' ? 'Intenta cambiar el filtro de fecha' : 'Crea el primer registro'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Resumen de totales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
          Resumen Filtrado ({registrosFiltrados.length})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-red-50 rounded-xl p-2.5 border border-red-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Gastos</p>
            <p className="text-sm font-bold text-red-600">{formatearMoneda(totalesFiltrados.gastos)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-2.5 border border-orange-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Faltantes</p>
            <p className="text-sm font-bold text-orange-600">{formatearMoneda(totalesFiltrados.faltantes)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Adelantos</p>
            <p className="text-sm font-bold text-blue-600">{formatearMoneda(totalesFiltrados.adelantos)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Pagos Diarios</p>
            <p className="text-sm font-bold text-emerald-600">{formatearMoneda(totalesFiltrados.pagosDiarios)}</p>
          </div>
        </div>
      </div>

      {/* Tabla agrupada por fecha */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Pago Diario</th>
                <th className="hidden sm:table-cell px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Bonif.</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Faltantes</th>
                <th className="hidden sm:table-cell px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gastos</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(registrosAgrupados).map(([fechaKey, grupo]) => (
                <React.Fragment key={fechaKey}>
                  {/* Fila principal del grupo */}
                  <tr className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleFecha(fechaKey)} className="text-gray-400 hover:text-gray-600 transition-colors">
                          {fechasExpandidas[fechaKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <div>
                          <span className="text-sm font-medium text-gray-800">{fmtFechaCorta(grupo.fecha)}</span>
                          <span className="block text-[10px] text-gray-400">
                            {grupo.totalRegistros} registro{grupo.totalRegistros !== 1 ? 's' : ''}
                            {grupo.tieneRegistrosAutomaticos && (
                              <span className="ml-1 text-purple-500 font-medium">Auto</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-semibold text-emerald-600">{formatearMoneda(grupo.pagoDiario)}</span>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-right">
                      <span className="text-sm font-semibold text-amber-600">+{formatearMoneda(grupo.bonificacion || 0)}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-semibold text-orange-500">-{formatearMoneda(grupo.faltantes)}</span>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 text-right">
                      <span className="text-sm font-semibold text-red-500">-{formatearMoneda(grupo.gastos)}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-sm font-bold ${grupo.totalAPagar >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formatearMoneda(grupo.totalAPagar)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => toggleFecha(fechaKey)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors">
                        {fechasExpandidas[fechaKey] ? 'Ocultar' : 'Ver'}
                      </button>
                    </td>
                  </tr>

                  {/* Desglose expandido */}
                  {fechasExpandidas[fechaKey] && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50/40 px-4 py-3">
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Desglose:</h4>
                          {grupo.registros.map((registro) => {
                            const tipo = registro.tipo || 'pago_diario';
                            const esAuto = esRegistroAutomatico(registro);
                            return (
                              <div key={registro._id}
                                className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-sm flex-shrink-0">{obtenerIconoTipo(tipo, registro)}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-medium text-gray-800">{obtenerDescripcionTipo(tipo, registro)}</span>
                                      {esAuto && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-600 rounded-full border border-purple-100 font-medium">Auto</span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-400 truncate max-w-xs">{registro.descripcion}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-sm font-semibold ${obtenerColorMontoTexto(tipo, registro)}`}>
                                    {formatearMontoConSigno(registro)}
                                  </span>
                                  {userRole === 'super_admin' && (
                                    <button onClick={() => onEliminar(registro._id)}
                                      className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all" title="Eliminar">
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {/* Resumen del grupo */}
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400">Pago Diario</p>
                                <p className="text-xs font-semibold text-emerald-600">{formatearMoneda(grupo.pagoDiario)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400">Faltantes</p>
                                <p className="text-xs font-semibold text-orange-500">-{formatearMoneda(grupo.faltantes)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400">Gastos</p>
                                <p className="text-xs font-semibold text-red-500">-{formatearMoneda(grupo.gastos)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-gray-400">Adelantos</p>
                                <p className="text-xs font-semibold text-blue-600">-{formatearMoneda(grupo.adelantos)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

RegistrosTable.displayName = 'RegistrosTable';
export default RegistrosTable;