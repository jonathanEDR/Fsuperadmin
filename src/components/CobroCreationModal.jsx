import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import VentasSelectionList from './VentasSelectionList';
import { createCobro } from '../services/cobroService';
import { useUser } from '@clerk/clerk-react';

const CobroCreationModal = ({ isOpen, onClose, onCobroCreated }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [ventasDetails, setVentasDetails] = useState({});
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.error('Usuario no autenticado');
      onClose();
    }
  }, [isLoaded, isSignedIn, onClose]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    yape: '0',
    efectivo: '0',
    gastosImprevistos: '0',
    descripcion: ''
  });

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedVentas([]);
      setVentasDetails({});
      setFormData({
        yape: '0',
        efectivo: '0',
        gastosImprevistos: '0',
        descripcion: ''
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
      console.log(`Calculando venta ${ventaId}: pendiente = ${pendiente}`);
      return sum + pendiente;
    }, 0);
  }, [selectedVentas, ventasDetails]);

  // Calcular el total ingresado
  const montoIngresado = useMemo(() => {
    const yape = parseFloat(formData.yape) || 0;
    const efectivo = parseFloat(formData.efectivo) || 0;
    const gastos = parseFloat(formData.gastosImprevistos) || 0;
    const total = yape + efectivo + gastos;
    console.log(`Total ingresado: ${yape} + ${efectivo} + ${gastos} = ${total}`);
    return total;
  }, [formData.yape, formData.efectivo, formData.gastosImprevistos]);
  // Manejar selección de ventas
  const handleVentaSelection = (ventaId, ventaDetails = null) => {
    console.log('Seleccionando venta:', { ventaId, detalles: ventaDetails });
    
    // Asegurarnos de que tenemos los detalles de la venta
    if (!ventaDetails) {
      console.error('No se recibieron los detalles de la venta');
      setError('Error: No se pueden obtener los detalles de la venta');
      return;
    }    // Procesar los detalles de la venta
    const montoTotal = parseFloat(ventaDetails.montoTotal || 0);
    const cantidadPagada = parseFloat(ventaDetails.cantidadPagada || 0);
    const montoPendiente = montoTotal - cantidadPagada;
    
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

    console.log('Detalles actualizados:', {
      ventaId,
      detalles: detallesProcesados,
      montoTotal: detallesProcesados.montoTotal,
      montoPendiente: detallesProcesados.montoPendiente
    });
  };

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Asegurar que solo se acepten números y sean 0 o positivos
    if (['yape', 'efectivo', 'gastosImprevistos'].includes(name)) {
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
    const gastosImprevistos = parseFloat(formData.gastosImprevistos) || 0;

    if (yape < 0 || efectivo < 0 || gastosImprevistos < 0) {
      throw new Error('Los montos no pueden ser negativos');
    }

    const tolerance = 0.01;
    if (Math.abs(montoIngresado - ventasTotal) > tolerance) {
      throw new Error(`El monto total ingresado (S/. ${montoIngresado.toFixed(2)}) debe ser igual al total de las ventas seleccionadas (S/. ${ventasTotal.toFixed(2)})`);
    }

    // Verificar que al menos un método de pago tenga monto
    if (yape === 0 && efectivo === 0 && gastosImprevistos === 0) {
      throw new Error('Debe ingresar al menos un monto de pago');
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
      const gastosImprevistos = parseFloat(formData.gastosImprevistos) || 0;
      const totalMetodosPago = yape + efectivo + gastosImprevistos;

      // Validar que la suma de los métodos de pago sea igual al total de ventas
      if (Math.abs(totalMetodosPago - ventasTotal) > 0.01) {
        throw new Error(`La suma de los métodos de pago (${totalMetodosPago.toFixed(2)}) debe ser igual al total de ventas (${ventasTotal.toFixed(2)})`);
      }

      // Procesar la distribución de pagos
      const distribucionPagos = selectedVentas.map(ventaId => {
        const venta = ventasDetails[ventaId];
        const montoTotal = parseFloat(venta.montoTotal);
        const montoPendiente = parseFloat(venta.montoPendiente);
        const montoPagado = montoPendiente;

        if (isNaN(montoTotal) || isNaN(montoPendiente) || isNaN(montoPagado)) {
          throw new Error(`Error en los montos de la venta ${ventaId}`);
        }

        return {
          ventaId,
          montoPagado,
          montoOriginal: montoTotal,
          montoPendiente: Math.max(0, montoTotal - montoPagado)
        };
      });

      const cobroData = {
        ventas: distribucionPagos.map(({ ventaId, montoPagado }) => ({
          ventaId,
          montoPagado
        })),
        distribucionPagos,
        montoPagado: ventasTotal,
        montoTotalVentas: ventasTotal,        yape,
        efectivo,
        gastosImprevistos,
        descripcion: formData.descripcion || '',
        observaciones: formData.descripcion || '',
        gastosImprevistos: parseFloat(formData.gastosImprevistos) || 0,
        descripcion: formData.descripcion,
        montoTotal: ventasTotal,
        observaciones: formData.descripcion
      };

      await createCobro(cobroData);
      onCobroCreated(true);
      onClose();
    } catch (err) {
      console.error('Error al crear cobro:', err);
      setError(err.message || 'Error al crear el cobro');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Cobro</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Seleccionar Ventas</h3>
              <div className="border rounded-lg overflow-hidden mb-4">
                <VentasSelectionList
                  selectedVentas={selectedVentas}
                  onVentaSelect={handleVentaSelection}
                  onError={setError}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-lg font-semibold text-gray-800">
                    Total a Cobrar
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({selectedVentas.length} venta{selectedVentas.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  S/. {ventasTotal.toFixed(2)}
                </div>
              </div>
              {montoIngresado > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span>Monto Ingresado:</span>
                  <span className={Math.abs(montoIngresado - ventasTotal) < 0.01 ? 'text-green-600' : 'text-red-500'}>
                    S/. {montoIngresado.toFixed(2)}
                  </span>
                </div>
              )}
              {montoIngresado > 0 && Math.abs(montoIngresado - ventasTotal) >= 0.01 && (
                <div className="text-sm text-red-500 mt-1">
                  {montoIngresado > ventasTotal 
                    ? `Excede por: S/. ${(montoIngresado - ventasTotal).toFixed(2)}`
                    : `Falta: S/. ${(ventasTotal - montoIngresado).toFixed(2)}`}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yape
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="yape"
                  value={formData.yape}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Efectivo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="efectivo"
                  value={formData.efectivo}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gastos Imprevistos
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="gastosImprevistos"
                  value={formData.gastosImprevistos}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Agregar observaciones o notas..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CobroCreationModal;
