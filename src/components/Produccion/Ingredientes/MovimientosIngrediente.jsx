import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowUp, ArrowDown, Scale, Factory, RefreshCw, ClipboardList } from 'lucide-react';
import { ingredienteService } from '../../../services/ingredienteService';

const MovimientosIngrediente = ({ ingrediente, onCerrar }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limite, setLimite] = useState(50);

  useEffect(() => {
    cargarMovimientos();
  }, [limite]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const response = await ingredienteService.obtenerMovimientos(ingrediente._id, limite);
      setMovimientos(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar movimientos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoColor = (tipo) => {
    const colores = {
      entrada: 'bg-green-100 text-green-800',
      salida: 'bg-red-100 text-red-800',
      ajuste: 'bg-blue-100 text-blue-800',
      produccion: 'bg-purple-100 text-purple-800',
      consumo: 'bg-orange-100 text-orange-800'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getTipoIcono = (tipo) => {
    const iconos = {
      entrada: ArrowUp,
      salida: ArrowDown,
      ajuste: Scale,
      produccion: Factory,
      consumo: RefreshCw
    };
    const IconComponent = iconos[tipo] || ClipboardList;
    return <IconComponent size={18} />;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 rounded-2xl shadow-xl border border-gray-100 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-lg border border-purple-200">
              <ClipboardList size={18} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Historial de Movimientos - {ingrediente.nombre}
            </h3>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">

          {/* Información del ingrediente */}
          <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Unidad:</span>
                <span className="ml-2 font-medium">{ingrediente.unidadMedida}</span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-medium">{ingrediente.cantidad}</span>
              </div>
              <div>
                <span className="text-gray-600">Procesado:</span>
                <span className="ml-2 font-medium">{ingrediente.procesado}</span>
              </div>
              <div>
                <span className="text-gray-600">Disponible:</span>
                <span className="ml-2 font-medium text-blue-600">
                  {ingrediente.cantidad - ingrediente.procesado}
                </span>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <label className="text-sm text-gray-600 mr-2">Mostrar últimos:</label>
              <select
                value={limite}
                onChange={(e) => setLimite(parseInt(e.target.value))}
                className="border border-gray-200 rounded-xl px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <button
              onClick={cargarMovimientos}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {movimientos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay movimientos registrados
                </div>
              ) : (
                <div className="space-y-2">
                  {movimientos.map((movimiento, index) => (
                    <div
                      key={movimiento._id || index}
                      className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{getTipoIcono(movimiento.tipo)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(movimiento.tipo)}`}>
                              {movimiento.tipo.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatearFecha(movimiento.fecha)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Motivo:</strong> {movimiento.motivo}
                          </div>

                          {movimiento.observaciones && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Observaciones:</strong> {movimiento.observaciones}
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            <strong>Operador:</strong> {movimiento.operador}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-gray-500">Anterior</div>
                              <div className="font-medium">{movimiento.cantidadAnterior}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Cantidad</div>
                              <div className={`font-medium ${
                                movimiento.tipo === 'entrada' || movimiento.tipo === 'ajuste' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {movimiento.tipo === 'entrada' || (movimiento.tipo === 'ajuste' && movimiento.cantidadNueva > movimiento.cantidadAnterior) 
                                  ? '+' 
                                  : '-'
                                }{movimiento.cantidad}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Nueva</div>
                              <div className="font-medium">{movimiento.cantidadNueva}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botón cerrar */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onCerrar}
              className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovimientosIngrediente;
