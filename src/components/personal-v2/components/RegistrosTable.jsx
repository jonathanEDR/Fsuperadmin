/**
 * Tabla de registros de gestión personal
 * Con agrupación por fecha, filtros y acciones
 */

import React, { useMemo, useState } from 'react';
import { Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { 
  agruparRegistrosPorFecha,
  obtenerDescripcionTipo,
  obtenerColorTipo,
  obtenerIconoTipo,
  formatearMontoConSigno,
  esRegistroAutomatico
} from '../utils/registrosHelper';

const RegistrosTable = React.memo(({ 
  registros,
  onEliminar,
  formatearMoneda,
  loading,
  filtroFecha,
  customRange
}) => {
  
  // Filtrar registros según criterio de fecha
  const registrosFiltrados = useMemo(() => {
    if (!registros || registros.length === 0) return [];
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return registros.filter(registro => {
      const fechaRegistro = new Date(registro.fechaDeGestion);
      fechaRegistro.setHours(0, 0, 0, 0);
      
      switch (filtroFecha) {
        case 'hoy':
          return fechaRegistro.getTime() === hoy.getTime();
        
        case 'semana':
          const inicioSemana = new Date(hoy);
          inicioSemana.setDate(hoy.getDate() - hoy.getDay());
          return fechaRegistro >= inicioSemana;
        
        case 'mes':
          return (
            fechaRegistro.getMonth() === hoy.getMonth() &&
            fechaRegistro.getFullYear() === hoy.getFullYear()
          );
        
        case 'custom':
          if (!customRange.start || !customRange.end) return true;
          const fechaInicio = new Date(customRange.start);
          const fechaFin = new Date(customRange.end);
          fechaInicio.setHours(0, 0, 0, 0);
          fechaFin.setHours(23, 59, 59, 999);
          return fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
        
        case 'historico':
        default:
          return true;
      }
    });
  }, [registros, filtroFecha, customRange]);

  // Agrupar registros por fecha
  const registrosAgrupados = useMemo(() => {
    return agruparRegistrosPorFecha(registrosFiltrados);
  }, [registrosFiltrados]);

  // Calcular totales de registros filtrados
  const totalesFiltrados = useMemo(() => {
    return registrosFiltrados.reduce((acc, registro) => ({
      gastos: acc.gastos + (registro.monto || 0),
      faltantes: acc.faltantes + (registro.faltante || 0),
      adelantos: acc.adelantos + (registro.adelanto || 0),
      pagosDiarios: acc.pagosDiarios + (registro.pagodiario || 0),
      bonificaciones: acc.bonificaciones + (registro.bonificacion || 0)
    }), { gastos: 0, faltantes: 0, adelantos: 0, pagosDiarios: 0, bonificaciones: 0 });
  }, [registrosFiltrados]);

  // Estado para controlar qué fechas están expandidas
  const [fechasExpandidas, setFechasExpandidas] = useState({});

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFechaCorta = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const toggleFechaExpandida = (fechaKey) => {
    setFechasExpandidas(prev => ({
      ...prev,
      [fechaKey]: !prev[fechaKey]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando registros...</p>
      </div>
    );
  }

  if (registrosFiltrados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">No hay registros para mostrar</p>
        <p className="text-sm text-gray-500 mt-1">
          {filtroFecha !== 'historico' 
            ? 'Intenta cambiar el filtro de fecha' 
            : 'Crea el primer registro'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de totales */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Resumen de Registros Filtrados ({registrosFiltrados.length})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Gastos</p>
            <p className="text-lg font-bold text-red-600">
              {formatearMoneda(totalesFiltrados.gastos)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Faltantes</p>
            <p className="text-lg font-bold text-orange-600">
              {formatearMoneda(totalesFiltrados.faltantes)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Adelantos</p>
            <p className="text-lg font-bold text-blue-600">
              {formatearMoneda(totalesFiltrados.adelantos)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Pagos Diarios</p>
            <p className="text-lg font-bold text-green-600">
              {formatearMoneda(totalesFiltrados.pagosDiarios)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de registros AGRUPADOS POR FECHA */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Pago Diario
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Bonif.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Faltantes
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Gastos
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total a Pagar
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {Object.entries(registrosAgrupados).map(([fechaKey, grupo]) => (
                <React.Fragment key={fechaKey}>
                  {/* Fila principal del grupo */}
                  <tr className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFechaExpandida(fechaKey)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {fechasExpandidas[fechaKey] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {formatearFechaCorta(grupo.fecha)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {grupo.totalRegistros} registro{grupo.totalRegistros !== 1 ? 's' : ''}
                            {grupo.tieneRegistrosAutomaticos && (
                              <span className="ml-1 text-purple-600">● Auto</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-green-600">
                        {formatearMoneda(grupo.pagoDiario)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-yellow-600">
                        +{formatearMoneda(grupo.bonificacion || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-orange-600">
                        -{formatearMoneda(grupo.faltantes)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-red-600">
                        -{formatearMoneda(grupo.gastos)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${
                        grupo.totalAPagar >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatearMoneda(grupo.totalAPagar)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFechaExpandida(fechaKey)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {fechasExpandidas[fechaKey] ? 'Ocultar' : 'Ver'}
                      </button>
                    </td>
                  </tr>

                  {/* Fila expandida con desglose de registros */}
                  {fechasExpandidas[fechaKey] && (
                    <tr>
                      <td colSpan="6" className="bg-gray-50 px-4 py-3">
                        <div className="space-y-2">
                          {/* Título del desglose */}
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">
                            Desglose de Registros:
                          </h4>

                          {/* Lista de registros individuales */}
                          <div className="space-y-1">
                            {grupo.registros.map((registro) => {
                              const tipo = registro.tipo || 'pago_diario';
                              const esAuto = esRegistroAutomatico(registro);

                              return (
                                <div
                                  key={registro._id}
                                  className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="text-sm">
                                      {obtenerIconoTipo(tipo)}
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-900">
                                          {obtenerDescripcionTipo(tipo)}
                                        </span>
                                        {esAuto && (
                                          <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                            Auto
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 truncate max-w-xs">
                                        {registro.descripcion}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className={`text-sm font-semibold ${
                                      tipo === 'pago_diario' ? 'text-green-600' :
                                      tipo === 'faltante_cobro' ? 'text-orange-600' :
                                      tipo === 'gasto_cobro' ? 'text-red-600' :
                                      'text-blue-600'
                                    }`}>
                                      {formatearMontoConSigno(registro)}
                                    </span>
                                    
                                    <button
                                      onClick={() => onEliminar(registro._id)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Eliminar registro"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Resumen del grupo */}
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="text-center">
                                <p className="text-xs text-gray-600">Pago Diario</p>
                                <p className="text-sm font-semibold text-green-600">
                                  {formatearMoneda(grupo.pagoDiario)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600">Faltantes</p>
                                <p className="text-sm font-semibold text-orange-600">
                                  -{formatearMoneda(grupo.faltantes)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600">Gastos</p>
                                <p className="text-sm font-semibold text-red-600">
                                  -{formatearMoneda(grupo.gastos)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-600">Adelantos</p>
                                <p className="text-sm font-semibold text-blue-600">
                                  -{formatearMoneda(grupo.adelantos)}
                                </p>
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
