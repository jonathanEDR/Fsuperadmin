import React, { useState, useEffect } from 'react';
import { X, Loader2, Package, Factory, RefreshCw, ArrowUp, ArrowDown, Send, BarChart3, Calendar, User, AlertTriangle } from 'lucide-react';
import { materialService } from '../../../services/materialService';

const MovimientosMaterial = ({ material, onCerrar }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarMovimientos();
  }, [material._id]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const response = await materialService.obtenerMovimientos(material._id);
      setMovimientos(response.data || []);
      setError('');
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setError('Error al cargar los movimientos');
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      'entrada': <Package size={14} />,
      'consumo': <Factory size={14} />,
      'restauracion': <RefreshCw size={14} />,
      'ajuste_positivo': <ArrowUp size={14} />,
      'ajuste_negativo': <ArrowDown size={14} />,
      'salida': <Send size={14} />
    };
    return icons[tipo] || <BarChart3 size={14} />;
  };

  const getTipoColor = (tipo) => {
    const colors = {
      'entrada': 'text-green-600 bg-green-50',
      'consumo': 'text-red-600 bg-red-50',
      'restauracion': 'text-blue-600 bg-blue-50',
      'ajuste_positivo': 'text-green-600 bg-green-50',
      'ajuste_negativo': 'text-red-600 bg-red-50',
      'salida': 'text-orange-600 bg-orange-50'
    };
    return colors[tipo] || 'text-gray-600 bg-gray-50';
  };

  const formatearTipo = (tipo) => {
    const tipos = {
      'entrada': 'Entrada',
      'consumo': 'Consumo',
      'restauracion': 'Restauración',
      'ajuste_positivo': 'Ajuste (+)',
      'ajuste_negativo': 'Ajuste (-)',
      'salida': 'Salida'
    };
    return tipos[tipo] || tipo;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border border-gray-100 w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-xl rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Movimientos de Inventario
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {material.nombre} • {material.unidadMedida}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Estado Actual del Material */}
        <div className="bg-gray-50 p-4 rounded-xl mb-6">
          <h4 className="font-medium text-gray-700 mb-3">Estado Actual</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600 text-lg">
                {material.cantidad}
              </div>
              <div className="text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600 text-lg">
                {material.consumido}
              </div>
              <div className="text-gray-600">Consumido</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600 text-lg">
                {material.cantidad - material.consumido}
              </div>
              <div className="text-gray-600">Disponible</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600 text-lg">
                S/.{((material.cantidad - material.consumido) * material.precioUnitario).toFixed(2)}
              </div>
              <div className="text-gray-600">Valor Stock</div>
            </div>
          </div>
        </div>

        {/* Lista de Movimientos */}
        <div className="bg-white">
          <h4 className="font-medium text-gray-700 mb-4">
            Historial de Movimientos ({movimientos.length})
          </h4>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-medium text-gray-600 mb-2">
                Sin movimientos registrados
              </p>
              <p className="text-gray-500">
                Los movimientos aparecerán aquí cuando se realicen ajustes al inventario
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {movimientos.map((movimiento, index) => (
                <div
                  key={movimiento._id || index}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getTipoColor(movimiento.tipo)}`}>
                        {getTipoIcon(movimiento.tipo)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {formatearTipo(movimiento.tipo)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(movimiento.tipo)}`}>
                            {movimiento.cantidad} {material.unidadMedida}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {movimiento.motivo}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {formatearFecha(movimiento.fecha)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} /> {movimiento.operador}
                          </span>
                          {movimiento.cantidadAnterior !== undefined && (
                            <span className="flex items-center gap-1">
                              <BarChart3 size={12} /> {movimiento.cantidadAnterior} → {movimiento.cantidadNueva}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón Cerrar */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onCerrar}
            className="px-6 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovimientosMaterial;
