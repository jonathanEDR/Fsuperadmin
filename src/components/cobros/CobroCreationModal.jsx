import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { VentasSelectionList } from '.';  // Import from local module
import { createCobro } from '../../services/cobroService';
import PaymentModal from './PaymentModal';
import { getLocalDateString, getLocalDateTimeString, isValidDateNotFuture, convertLocalDateTimeToISO } from '../../utils/dateUtils';

const CobroCreationModal = ({ isOpen, onClose, onCobroCreated, userRole = 'user' }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [ventasDetails, setVentasDetails] = useState({});
  const [ventaParaPagar, setVentaParaPagar] = useState(null);
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      onClose();
    }
  }, [isLoaded, isSignedIn, onClose]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    yape: '0',
    efectivo: '0',
    billetes: '0',
    faltantes: '0',
    gastosImprevistos: '0',
    descripcion: '',
    fechaCobro: getLocalDateTimeString() // Fecha y hora actual de Perú por defecto
  });

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedVentas([]);
      setVentasDetails({});
      setFormData({
        yape: '0',
        efectivo: '0',
        billetes: '0',
        faltantes: '0',
        gastosImprevistos: '0',
        descripcion: '',
        fechaCobro: getLocalDateTimeString() // Usar fecha y hora actual de Perú
      });
      setError(null);
    }
  }, [isOpen]);

  // Calcular el total de ventas seleccionadas
  const ventasTotal = useMemo(() => {
    return selectedVentas.reduce((sum, ventaId) => {
      const venta = ventasDetails[ventaId];
      if (!venta) return sum;
      const pendiente = parseFloat(venta.montoPendiente || 0);
      return sum + pendiente;
    }, 0);
  }, [selectedVentas, ventasDetails]);

  // Calcular el total ingresado
  const montoIngresado = useMemo(() => {
    const yape = parseFloat(formData.yape) || 0;
    const efectivo = parseFloat(formData.efectivo) || 0;
    const billetes = parseFloat(formData.billetes) || 0;
    const faltantes = parseFloat(formData.faltantes) || 0;
    const gastos = parseFloat(formData.gastosImprevistos) || 0;
    const total = yape + efectivo + billetes + faltantes + gastos;
    return total;
  }, [formData.yape, formData.efectivo, formData.billetes, formData.faltantes, formData.gastosImprevistos]);
  // Manejar selección de ventas
  const handleVentaSelection = (ventaId, ventaDetails = null) => {
    // Asegurarnos de que tenemos los detalles de la venta
    if (!ventaDetails) {
      setError('Error: No se pueden obtener los detalles de la venta');
      return;
    }    // Procesar los detalles de la venta usando montoTotal original
    const montoTotal = parseFloat(ventaDetails.montoTotal || 0);
    const cantidadPagada = parseFloat(ventaDetails.cantidadPagada || 0);
    const montoPendiente = Math.max(0, montoTotal - cantidadPagada);
    
    const detallesProcesados = {
      ...ventaDetails,
      montoTotal: montoTotal,
      cantidadPagada: cantidadPagada,
      montoPendiente: montoPendiente
    };

    setSelectedVentas(prev => {
      const isSelected = prev.includes(ventaId);
      if (isSelected) {
        // Si la venta ya estaba seleccionada, la quitamos
        return prev.filter(id => id !== ventaId);
      } else {
        // Si la venta no estaba seleccionada, la agregamos
        return [...prev, ventaId];
      }
    });

    // Actualizar los detalles de la venta
    setVentasDetails(prev => ({
      ...prev,
      [ventaId]: detallesProcesados
    }));
  };

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Asegurar que solo se acepten números y sean 0 o positivos
    if (['yape', 'efectivo', 'billetes', 'faltantes', 'gastosImprevistos'].includes(name)) {
      const numValue = parseFloat(value) || 0;
      if (numValue < 0) return; // No permitir números negativos
      setFormData(prev => ({ ...prev, [name]: numValue.toString() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  // Validar el formulario
  const validateForm = () => {
    if (!user) {
      throw new Error('No se encontró la información del usuario');
    }
    
    if (!user.primaryEmailAddress?.emailAddress) {
      throw new Error('No se encontró el email del usuario');
    }

    if (selectedVentas.length === 0) {
      throw new Error('Debe seleccionar al menos una venta');
    }

    // Verificar que haya detalles para todas las ventas seleccionadas
    for (const ventaId of selectedVentas) {
      if (!ventasDetails[ventaId]) {
        throw new Error(`Error: No se encontraron los detalles de la venta ${ventaId}`);
      }
    }

    const yape = parseFloat(formData.yape) || 0;
    const efectivo = parseFloat(formData.efectivo) || 0;
    const billetes = parseFloat(formData.billetes) || 0;
    const faltantes = parseFloat(formData.faltantes) || 0;
    const gastosImprevistos = parseFloat(formData.gastosImprevistos) || 0;

    if (yape < 0 || efectivo < 0 || billetes < 0 || faltantes < 0 || gastosImprevistos < 0) {
      throw new Error('Los montos no pueden ser negativos');
    }

    const tolerance = 0.01;
    if (Math.abs(montoIngresado - ventasTotal) > tolerance) {
      throw new Error(`El monto total ingresado (S/. ${montoIngresado.toFixed(2)}) debe ser igual al total de las ventas seleccionadas (S/. ${ventasTotal.toFixed(2)})`);
    }

    // Verificar que al menos un método de pago tenga monto
    if (yape === 0 && efectivo === 0 && billetes === 0 && faltantes === 0 && gastosImprevistos === 0) {
      throw new Error('Debe ingresar al menos un monto de pago');
    }

    // Validar fecha de cobro
    if (!formData.fechaCobro) {
      throw new Error('Debe seleccionar una fecha y hora de cobro');
    }

    // Validar fecha/hora usando zona horaria local
    const fechaSeleccionada = new Date(formData.fechaCobro);
    const ahora = new Date();
    if (fechaSeleccionada > ahora) {
      throw new Error('La fecha y hora de cobro no puede ser en el futuro');
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      validateForm();
      
      // Verificar que el usuario está autenticado
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Preparando datos del cobro...');      // Procesar cada venta y asegurar que los números sean válidos      // Calcular montos totales
      const yape = parseFloat(formData.yape) || 0;
      const efectivo = parseFloat(formData.efectivo) || 0;
      const billetes = parseFloat(formData.billetes) || 0;
      const faltantes = parseFloat(formData.faltantes) || 0;
      const gastosImprevistos = parseFloat(formData.gastosImprevistos) || 0;
      const totalMetodosPago = yape + efectivo + billetes + faltantes + gastosImprevistos;

      // Validar que la suma de los métodos de pago sea igual al total de ventas
      if (Math.abs(totalMetodosPago - ventasTotal) > 0.01) {
        throw new Error(`La suma de los métodos de pago (${totalMetodosPago.toFixed(2)}) debe ser igual al total de ventas (${ventasTotal.toFixed(2)})`);
      }

      console.log('🔍 Debug - Datos antes de enviar:');
      // Preparar los datos en el formato que espera el servicio
      const ventasParaServicio = selectedVentas.map(ventaId => {
        const venta = ventasDetails[ventaId];
        return {
          _id: ventaId,
          montoTotal: parseFloat(venta.montoTotal),
          montoPendiente: parseFloat(venta.montoPendiente)
        };
      });

      const cobroData = {
        ventas: ventasParaServicio,
        yape,
        efectivo,
        billetes,
        faltantes,
        gastosImprevistos,
        montoTotal: ventasTotal,
        descripcion: formData.descripcion || '',

        fechaCobro: convertLocalDateTimeToISO(formData.fechaCobro)
      };

      await createCobro(cobroData);
      onCobroCreated(true);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear el cobro');
      setIsSubmitting(false);
    }
  };

  // Nuevo: función para abrir el modal de pago para una venta
  const handleAbrirPago = (ventaId) => {
    const venta = ventasDetails[ventaId];
    if (venta) setVentaParaPagar(venta);
  };

  // Nuevo: función para cerrar el modal de pago
  const handleCerrarPago = () => setVentaParaPagar(null);

  // Nuevo: función para procesar el pago (crear cobro individual)
  const handleProcesarPago = async (pagoData) => {
    try {
      if (!ventaParaPagar) {
        throw new Error('No se encontró la venta para procesar el pago');
      }

      // Preparar los datos para crear un cobro individual
      const montoTotalPago = (pagoData.yape || 0) + (pagoData.efectivo || 0) + (pagoData.billetes || 0) + (pagoData.faltantes || 0) + (pagoData.gastosImprevistos || 0);
      
      const cobroIndividual = {
        ventas: [{
          _id: ventaParaPagar._id,
          ventaId: ventaParaPagar._id,
          montoTotal: parseFloat(ventaParaPagar.montoTotal),
          montoPendiente: parseFloat(ventaParaPagar.montoPendiente),
          montoPagado: montoTotalPago
        }],
        distribucionPagos: [{
          ventaId: ventaParaPagar._id,
          montoPagado: montoTotalPago,
          montoOriginal: parseFloat(ventaParaPagar.montoTotal),
          montoPendiente: Math.max(0, parseFloat(ventaParaPagar.montoPendiente) - montoTotalPago)
        }],
        yape: pagoData.yape || 0,
        efectivo: pagoData.efectivo || 0,
        billetes: pagoData.billetes || 0,
        faltantes: pagoData.faltantes || 0,
        gastosImprevistos: pagoData.gastosImprevistos || 0,
        montoTotal: montoTotalPago,
        montoPagado: montoTotalPago,
        montoTotalVentas: parseFloat(ventaParaPagar.montoTotal),
        descripcion: pagoData.descripcion || '',
        fechaCobro: convertLocalDateTimeToISO(pagoData.fechaCobro)
      };

      // Usar el mismo servicio para crear el cobro
      await createCobro(cobroIndividual);
      
      // Cerrar el modal y notificar éxito
      setVentaParaPagar(null);
      
      // Opcional: recargar datos o mostrar mensaje de éxito
      if (onCobroCreated) {
        onCobroCreated(true);
      }
      
    } catch (error) {
      setError(error.message || 'Error al procesar el pago individual');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Registrar Nuevo Cobro</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Main layout - Stack on mobile, side-by-side on desktop */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
              {/* Left column: all payment inputs */}
              <div className="flex-1 min-w-0 space-y-3 overflow-y-auto lg:max-h-[70vh]">
                {/* Métodos de Pago Principal - Fila 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yape
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="yape"
                      value={formData.yape}
                      onChange={handleChange}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billetes
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="billetes"
                      value={formData.billetes}
                      onChange={handleChange}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      step="0.01"
                      min="0"
                      name="efectivo"
                      value={formData.efectivo}
                      onChange={handleChange}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Faltantes
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="faltantes"
                      value={formData.faltantes}
                      onChange={handleChange}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    step="0.01"
                    min="0"
                    name="gastosImprevistos"
                    value={formData.gastosImprevistos}
                    onChange={handleChange}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Descripción - Movido aquí */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Agregar observaciones o notas..."
                    rows={2}
                  />
                </div>

                {/* Resumen visual del total ingresado */}
                {montoIngresado > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-blue-800">Total Ingresado:</span>
                      <span className={`font-bold ${Math.abs(montoIngresado - ventasTotal) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                        S/. {montoIngresado.toFixed(2)}
                      </span>
                    </div>
                    {Math.abs(montoIngresado - ventasTotal) >= 0.01 && ventasTotal > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {montoIngresado > ventasTotal 
                          ? `Excede por: S/. ${(montoIngresado - ventasTotal).toFixed(2)}`
                          : `Falta: S/. ${(ventasTotal - montoIngresado).toFixed(2)}`}
                      </div>
                    )}
                  </div>
                )}

                {/* Fecha y Hora de Cobro - Movido al final */}
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
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Fecha y hora en horario de Perú (no puede ser en el futuro)
                    </p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm order-2 sm:order-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedVentas.length === 0}
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm order-1 sm:order-2"
                  >
                    {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
                  </button>
                </div>
              </div>

              {/* Right column: selected sales summary and desglose */}
              <div className="flex-1 min-w-0 lg:pl-2 space-y-4 overflow-y-auto lg:max-h-[70vh]">
                {/* Ventas seleccionadas y resumen */}
                <div className="lg:max-h-[38vh] overflow-y-auto">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Seleccionar Ventas</h3>
                  <div className="border rounded-lg overflow-hidden mb-3 sm:mb-4">
                    <VentasSelectionList
                      selectedVentas={selectedVentas}
                      onVentaSelect={handleVentaSelection}
                      onError={setError}
                    />
                  </div>
                  {/* Botón de pago individual para cada venta seleccionada */}
                  {selectedVentas.length > 0 && (
                    <div className="space-y-2">
                      {selectedVentas.map(ventaId => (
                        <div key={ventaId} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Venta: {ventaId.slice(-6)}</span>
                          <button
                            type="button"
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                            onClick={() => handleAbrirPago(ventaId)}
                          >
                            Pagar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                    <div className="mb-2 sm:mb-0">
                      <span className="text-base sm:text-lg font-semibold text-gray-800">
                        Total a Cobrar
                      </span>
                      <span className="ml-2 text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {selectedVentas.length} venta{selectedVentas.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      S/. {ventasTotal.toFixed(2)}
                    </div>
                  </div>
                  {montoIngresado > 0 && (
                    <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-600">Monto Ingresado:</span>
                      <span className={`font-semibold ${Math.abs(montoIngresado - ventasTotal) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                        S/. {montoIngresado.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {montoIngresado > 0 && Math.abs(montoIngresado - ventasTotal) >= 0.01 && (
                    <div className="text-sm mt-1">
                      {montoIngresado > ventasTotal 
                        ? <span className="text-orange-600 font-medium">Excede por: S/. {(montoIngresado - ventasTotal).toFixed(2)}</span>
                        : <span className="text-red-600 font-medium">Falta: S/. {(ventasTotal - montoIngresado).toFixed(2)}</span>}
                    </div>
                  )}
                </div>

                {/* Resumen del desglose de pagos */}
                {(parseFloat(formData.yape) > 0 || parseFloat(formData.efectivo) > 0 || parseFloat(formData.billetes) > 0 || parseFloat(formData.faltantes) > 0 || parseFloat(formData.gastosImprevistos) > 0) && (
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
                      <div className="flex justify-between items-center font-semibold border-t border-blue-300 pt-2 mt-2">
                        <span className="text-blue-900">Total ingresado:</span>
                        <span className={`text-base sm:text-lg ${Math.abs(montoIngresado - ventasTotal) < 0.01 ? 'text-green-600' : 'text-blue-900'}`}>
                          S/. {montoIngresado.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Nuevo: Modal de pago individual */}
      <PaymentModal
        isOpen={!!ventaParaPagar}
        onClose={handleCerrarPago}
        onSubmit={handleProcesarPago}
        venta={ventaParaPagar || { montoTotal: 0 }}
        userRole={userRole}
      />
    </div>
  );
};

export default CobroCreationModal;
