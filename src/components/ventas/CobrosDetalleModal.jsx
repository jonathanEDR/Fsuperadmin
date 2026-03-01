import React from 'react';
import { X, CreditCard, Banknote, Receipt, AlertCircle, TrendingDown } from 'lucide-react';

const CobrosDetalleModal = ({ isOpen, onClose, venta }) => {
  if (!isOpen || !venta) return null;
  
  const cobros = venta.cobros_detalle || {};
  const historial = cobros.historial || [];

  const formatCurrency = (amount) => `S/ ${(amount || 0).toFixed(2)}`;
  
  const formatDate = (date) => {
    if (!date) return 'Fecha no disponible';
    
    try {
      const parsedDate = new Date(date);
      
      if (isNaN(parsedDate.getTime())) {
        return 'Fecha no disponible';
      }
      
      return parsedDate.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha no disponible';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-gray-50 text-gray-800 p-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              💰 Detalle de Cobros
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              Venta #{venta._id ? venta._id.slice(-8) : 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Verificar si hay datos de cobros */}
          {!cobros || Object.keys(cobros).length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No hay información de cobros disponible para esta venta
              </p>
            </div>
          ) : (
            <>
              {/* Layout de 2 columnas: Izquierda (tarjetas + historial) y Derecha (resumen) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Columna Izquierda: Tarjetas + Historial (2/3 del espacio) */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Resumen de Pagos - Grid Compacto */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      📊 Resumen de Pagos
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Yape */}
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <CreditCard className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-gray-600">Yape</span>
                        </div>
                        <p className="text-lg font-bold text-purple-700">
                          {formatCurrency(cobros.yape)}
                        </p>
                      </div>

                      {/* Efectivo */}
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Banknote className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600">Efectivo</span>
                        </div>
                        <p className="text-lg font-bold text-green-700">
                          {formatCurrency(cobros.efectivo)}
                        </p>
                      </div>

                      {/* Billetes */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Receipt className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-gray-600">Billetes</span>
                        </div>
                        <p className="text-lg font-bold text-blue-700">
                          {formatCurrency(cobros.billetes)}
                        </p>
                      </div>

                      {/* Faltantes */}
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-gray-600">Faltantes</span>
                        </div>
                        <p className="text-lg font-bold text-red-700">
                          {formatCurrency(cobros.faltantes)}
                        </p>
                      </div>
                    </div>

                    {/* Gastos Imprevistos - Inline si existe */}
                    {cobros.gastosImprevistos > 0 && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-gray-600">Gastos Imprevistos</span>
                          </div>
                          <p className="text-lg font-bold text-amber-700">
                            {formatCurrency(cobros.gastosImprevistos)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Historial de Pagos - Compacto */}
                  {historial.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        💳 Historial de Pagos ({historial.length})
                      </h3>
                      <div className="space-y-2">
                        {historial.map((pago, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-medium text-gray-600">
                                Pago #{index + 1}
                              </span>
                              <span className="text-xs text-gray-500">
                                📅 {formatDate(pago.fechaPago)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {pago.yape > 0 && (
                                <div>
                                  <span className="text-gray-600">Yape:</span>
                                  <span className="ml-1 font-semibold text-purple-700">
                                    {formatCurrency(pago.yape)}
                                  </span>
                                </div>
                              )}
                              {pago.efectivo > 0 && (
                                <div>
                                  <span className="text-gray-600">Efectivo:</span>
                                  <span className="ml-1 font-semibold text-green-700">
                                    {formatCurrency(pago.efectivo)}
                                  </span>
                                </div>
                              )}
                              {pago.billetes > 0 && (
                                <div>
                                  <span className="text-gray-600">Billetes:</span>
                                  <span className="ml-1 font-semibold text-blue-700">
                                    {formatCurrency(pago.billetes)}
                                  </span>
                                </div>
                              )}
                              {pago.faltantes > 0 && (
                                <div>
                                  <span className="text-gray-600">Faltantes:</span>
                                  <span className="ml-1 font-semibold text-red-700">
                                    {formatCurrency(pago.faltantes)}
                                  </span>
                                </div>
                              )}
                              {pago.gastosImprevistos > 0 && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">G. Imprevistos:</span>
                                  <span className="ml-1 font-semibold text-amber-700">
                                    {formatCurrency(pago.gastosImprevistos)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                              <span className="text-xs font-semibold text-gray-700">
                                Total Pagado:
                              </span>
                              <span className="text-base font-bold text-blue-600">
                                {formatCurrency(pago.montoPagado)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Columna Derecha: Resumen Final (1/3 del espacio) - Sticky */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 sticky top-4">
                    <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      📝 Resumen Final
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span className="text-sm">Total Venta:</span>
                        <span className="font-semibold">{formatCurrency(venta.montoTotal)}</span>
                      </div>
                      <div className="flex justify-between text-green-700">
                        <span className="text-sm">Total Pagado:</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(venta.cantidadPagada)} ✅
                        </span>
                      </div>
                      <div className="flex justify-between text-red-700 pt-3 border-t-2 border-blue-300">
                        <span className="text-sm font-medium">Saldo Pendiente:</span>
                        <span className="font-bold text-xl">
                          {formatCurrency(venta.debe || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-3 rounded-b-xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CobrosDetalleModal;
