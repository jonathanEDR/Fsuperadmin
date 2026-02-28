import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { getLocalDateTimeString, isValidDateNotFuture, convertLocalDateTimeToISO } from '../../utils/dateUtils';

const PaymentModal = ({ isOpen, onClose, onSubmit, venta, userRole = 'user' }) => {
  const [formData, setFormData] = useState({
    yape: 0,
    efectivo: 0,
    billetes: 0,
    faltantes: 0,
    gastosImprevistos: 0,
    descripcion: '',
    fechaCobro: getLocalDateTimeString() // Fecha y hora actual de Perú por defecto
  });

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        yape: 0,
        efectivo: 0,
        billetes: 0,
        faltantes: 0,
        gastosImprevistos: 0,
        descripcion: '',
        fechaCobro: getLocalDateTimeString() // Usar fecha y hora actual de Perú
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    if (name !== 'descripcion' && name !== 'fechaCobro') {
      processedValue = parseFloat(value) || 0;
      if (processedValue < 0) processedValue = 0; // No permitir negativos
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar fecha usando la función utilitaria
    if (!formData.fechaCobro) {
      alert('Debe seleccionar una fecha y hora de cobro');
      return;
    }
    
    // Validar que la fecha/hora no sea futura
    const fechaSeleccionada = new Date(formData.fechaCobro);
    const ahora = new Date();
    if (fechaSeleccionada > ahora) {
      alert('La fecha y hora de cobro no puede ser en el futuro');
      return;
    }
    
    // Calcular el total automáticamente
    const total = (parseFloat(formData.yape) || 0) + 
                  (parseFloat(formData.efectivo) || 0) + 
                  (parseFloat(formData.billetes) || 0) + 
                  (parseFloat(formData.faltantes) || 0) + 
                  (parseFloat(formData.gastosImprevistos) || 0);

    // Validar que al menos un método de pago tenga valor
    if (total <= 0) {
      alert('Debe ingresar al menos un método de pago');
      return;
    }

    // Validar que el monto no exceda el monto total de la venta
    const montoTotalVenta = parseFloat(venta.montoTotal) || 0;
    const tolerance = 0.01; // Tolerancia para diferencias de centavos
    
    if (total > montoTotalVenta + tolerance) {
      alert(`El monto total ingresado (S/. ${total.toFixed(2)}) no puede ser mayor al monto total de la venta (S/. ${montoTotalVenta.toFixed(2)})`);
      return;
    }

    // Validar que el monto no sea negativo
    if (total < 0) {
      alert('El monto total no puede ser negativo');
      return;
    }

    // Asegurarse de que todos los valores numéricos sean números válidos
    const validatedData = {
      ...formData,
      yape: parseFloat(formData.yape) || 0,
      efectivo: parseFloat(formData.efectivo) || 0,
      billetes: parseFloat(formData.billetes) || 0,
      faltantes: parseFloat(formData.faltantes) || 0,
      gastosImprevistos: parseFloat(formData.gastosImprevistos) || 0,
      descripcion: formData.descripcion.trim(),
      fechaCobro: convertLocalDateTimeToISO(formData.fechaCobro)
    };

    onSubmit(validatedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="text-green-600" size={20} />
              Procesar Pago Individual
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Main layout - Stack on mobile, side-by-side on desktop */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
              {/* Left column: all payment inputs */}
              <div className="flex-1 min-w-0 space-y-3 overflow-y-auto lg:max-h-[70vh]">
                
                {/* Información de la venta */}
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Total de la Venta
                  </label>
                  <input
                    type="text"
                    value={`S/. ${venta.montoTotal.toFixed(2)}`}
                    disabled
                    className="w-full p-2 text-sm bg-gray-100 border border-gray-300 rounded-md font-medium text-gray-900"
                  />
                </div>

                {/* Métodos de Pago Principal - Fila 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yape
                    </label>
                    <input
                      type="number"
                      name="yape"
                      value={formData.yape}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billetes
                    </label>
                    <input
                      type="number"
                      name="billetes"
                      value={formData.billetes}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Métodos de Pago Secundarios - Fila 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Efectivo
                    </label>
                    <input
                      type="number"
                      name="efectivo"
                      value={formData.efectivo}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Faltantes
                    </label>
                    <input
                      type="number"
                      name="faltantes"
                      value={formData.faltantes}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Gastos Imprevistos - Línea completa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gastos Imprevistos
                  </label>
                  <input
                    type="number"
                    name="gastosImprevistos"
                    value={formData.gastosImprevistos}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    placeholder="Agregar observaciones o notas..."
                    rows={2}
                  />
                </div>

                {/* Resumen visual del total ingresado */}
                {(() => {
                  const montoIngresado = (parseFloat(formData.yape) || 0) + 
                                       (parseFloat(formData.efectivo) || 0) + 
                                       (parseFloat(formData.billetes) || 0) + 
                                       (parseFloat(formData.faltantes) || 0) + 
                                       (parseFloat(formData.gastosImprevistos) || 0);
                  const ventaTotal = parseFloat(venta.montoTotal) || 0;
                  
                  if (montoIngresado > 0) {
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-md p-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-green-800">Total Ingresado:</span>
                          <span className={`font-bold ${Math.abs(montoIngresado - ventaTotal) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                            S/. {montoIngresado.toFixed(2)}
                          </span>
                        </div>
                        {Math.abs(montoIngresado - ventaTotal) >= 0.01 && ventaTotal > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            {montoIngresado > ventaTotal 
                              ? `Excede por: S/. ${(montoIngresado - ventaTotal).toFixed(2)}`
                              : `Falta: S/. ${(ventaTotal - montoIngresado).toFixed(2)}`}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Fecha y Hora de Cobro */}
                <div className="border-t border-gray-200 pt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha y Hora de Cobro <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaCobro"
                      value={formData.fechaCobro}
                      onChange={handleChange}
                      max={getLocalDateTimeString()}
                      required
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Fecha y hora en horario de Perú (no puede ser en el futuro)
                    </p>
                  </div>
                </div>
              </div>

              {/* Right column: payment summary and breakdown */}
              <div className="flex-1 min-w-0 lg:pl-2 space-y-4 overflow-y-auto lg:max-h-[70vh]">
                {/* Resumen del total */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg border border-green-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                    <div className="mb-2 sm:mb-0">
                      <span className="text-base sm:text-lg font-semibold text-gray-800">
                        Venta Individual
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      S/. {venta.montoTotal.toFixed(2)}
                    </div>
                  </div>
                  
                  {(() => {
                    const montoIngresado = (parseFloat(formData.yape) || 0) + (parseFloat(formData.efectivo) || 0) + (parseFloat(formData.billetes) || 0) + (parseFloat(formData.faltantes) || 0) + (parseFloat(formData.gastosImprevistos) || 0);
                    
                    if (montoIngresado > 0) {
                      return (
                        <>
                          <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-green-200">
                            <span className="font-medium text-gray-600">Monto Ingresado:</span>
                            <span className={`font-semibold ${Math.abs(montoIngresado - venta.montoTotal) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                              S/. {montoIngresado.toFixed(2)}
                            </span>
                          </div>
                          {montoIngresado > 0 && Math.abs(montoIngresado - venta.montoTotal) >= 0.01 && (
                            <div className="text-sm mt-1">
                              {montoIngresado > venta.montoTotal 
                                ? <span className="text-orange-600 font-medium">Excede por: S/. {(montoIngresado - venta.montoTotal).toFixed(2)}</span>
                                : <span className="text-red-600 font-medium">Falta: S/. {(venta.montoTotal - montoIngresado).toFixed(2)}</span>}
                            </div>
                          )}
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Resumen del desglose de pagos */}
                {(() => {
                  const hasPayments = (parseFloat(formData.yape) > 0 || parseFloat(formData.efectivo) > 0 || parseFloat(formData.billetes) > 0 || parseFloat(formData.faltantes) > 0 || parseFloat(formData.gastosImprevistos) > 0);
                  
                  if (hasPayments) {
                    return (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg border border-blue-200 lg:sticky lg:top-24">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Desglose del pago
                        </h4>
                        <div className="space-y-1 sm:space-y-2 text-sm">
                          {parseFloat(formData.yape) > 0 && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-blue-700 font-medium">Yape:</span>
                              <span className="text-blue-900 font-semibold">S/. {(parseFloat(formData.yape) || 0).toFixed(2)}</span>
                            </div>
                          )}
                          {parseFloat(formData.efectivo) > 0 && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-blue-700 font-medium">Efectivo:</span>
                              <span className="text-blue-900 font-semibold">S/. {(parseFloat(formData.efectivo) || 0).toFixed(2)}</span>
                            </div>
                          )}
                          {parseFloat(formData.billetes) > 0 && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-blue-700 font-medium">Billetes:</span>
                              <span className="text-blue-900 font-semibold">S/. {(parseFloat(formData.billetes) || 0).toFixed(2)}</span>
                            </div>
                          )}
                          {parseFloat(formData.faltantes) > 0 && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-orange-700 font-medium">Faltantes:</span>
                              <span className="text-orange-900 font-semibold">S/. {(parseFloat(formData.faltantes) || 0).toFixed(2)}</span>
                            </div>
                          )}
                          {parseFloat(formData.gastosImprevistos) > 0 && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-red-700 font-medium">Gastos Imprevistos:</span>
                              <span className="text-red-900 font-semibold">S/. {(parseFloat(formData.gastosImprevistos) || 0).toFixed(2)}</span>
                            </div>
                          )}
                          {(() => {
                            const totalPago = (parseFloat(formData.yape) || 0) + (parseFloat(formData.efectivo) || 0) + (parseFloat(formData.billetes) || 0) + (parseFloat(formData.faltantes) || 0) + (parseFloat(formData.gastosImprevistos) || 0);
                            const montoTotalVenta = parseFloat(venta.montoTotal) || 0;
                            const excedeLimite = totalPago > montoTotalVenta;
                            
                            return (
                              <div className="flex justify-between items-center font-semibold border-t border-blue-300 pt-2 mt-2">
                                <span className="text-blue-900">Total ingresado:</span>
                                <span className={`text-base sm:text-lg ${Math.abs(totalPago - montoTotalVenta) < 0.01 ? 'text-green-600' : excedeLimite ? 'text-red-600' : 'text-blue-900'}`}>
                                  S/. {totalPago.toFixed(2)}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Información adicional del estado del pago */}
                        {(() => {
                          const totalPago = (parseFloat(formData.yape) || 0) + (parseFloat(formData.efectivo) || 0) + (parseFloat(formData.billetes) || 0) + (parseFloat(formData.faltantes) || 0) + (parseFloat(formData.gastosImprevistos) || 0);
                          const montoTotalVenta = parseFloat(venta.montoTotal) || 0;
                          const excedeLimite = totalPago > montoTotalVenta;
                          
                          if (excedeLimite) {
                            return (
                              <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <div className="font-medium">⚠️ El monto excede el límite permitido</div>
                                <div className="flex justify-between mt-1">
                                  <span>Monto máximo permitido:</span>
                                  <span>S/. {montoTotalVenta.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Excede por:</span>
                                  <span>S/. {(totalPago - montoTotalVenta).toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
                              <div className="flex justify-between">
                                <span>Saldo pendiente después del pago:</span>
                                <span className="font-medium">S/. {Math.max(0, montoTotalVenta - totalPago).toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Botones de acción - Movidos aquí */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm order-2 sm:order-1"
                  >
                    Cancelar
                  </button>
                  {(() => {
                    const totalPago = (parseFloat(formData.yape) || 0) + (parseFloat(formData.efectivo) || 0) + (parseFloat(formData.billetes) || 0) + (parseFloat(formData.faltantes) || 0) + (parseFloat(formData.gastosImprevistos) || 0);
                    const montoTotalVenta = parseFloat(venta.montoTotal) || 0;
                    const excedeLimite = totalPago > montoTotalVenta;
                    const sinMonto = totalPago <= 0;
                    
                    return (
                      <button
                        type="submit"
                        disabled={excedeLimite || sinMonto}
                        className={`px-4 py-2 rounded-md transition-colors font-medium text-sm order-1 sm:order-2 ${
                          excedeLimite || sinMonto
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        title={
                          excedeLimite 
                            ? 'El monto excede el límite permitido' 
                            : sinMonto 
                              ? 'Debe ingresar al menos un método de pago'
                              : 'Procesar Pago'
                        }
                      >
                        {excedeLimite ? 'Monto Excedido' : sinMonto ? 'Sin Monto' : 'Procesar Pago'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
