import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, MinusCircle, Loader2 } from 'lucide-react';
import { getLocalDateTimeString, formatLocalDate, convertLocalDateTimeToISO } from '../../utils/fechaHoraUtils';
import { useCantidadManagement } from '../../hooks/useCantidadManagement';

function QuickDevolucionModal({
  isOpen,
  onClose,
  onSubmit,
  venta,
  isSubmitting
}) {
  const [productosADevolver, setProductosADevolver] = useState([]);
  const [motivo, setMotivo] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hook unificado para gestión de cantidades
  const { 
    procesarDevolucion, 
    loading: cantidadLoading, 
    error: cantidadError,
    clearError 
  } = useCantidadManagement();

  // Inicializar fecha y hora con la fecha/hora actual cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      limpiarForm();
      // Usar la utilidad unificada para obtener la fecha/hora actual
      const fechaActual = getLocalDateTimeString();
      setFechaDevolucion(fechaActual);
      
      console.log('📅 Fecha inicializada para devolución:', {
        fechaLocal: fechaActual,
        fechaDisplay: formatLocalDate(fechaActual)
      });
    }
  }, [isOpen]);

  const agregarProducto = (producto) => {
    if (productosADevolver.some(p => p.producto.productoId._id === producto.productoId._id)) {
      return;
    }
    
    setProductosADevolver(prev => [...prev, {
      producto,
      cantidad: '',
      montoDevolucion: 0
    }]);
  };

  const actualizarCantidad = (index, cantidad) => {
    setProductosADevolver(prev => prev.map((item, i) => {
      if (i === index) {
        // ✅ VALIDACIÓN DE CANTIDAD AL ACTUALIZAR
        const cantidadNum = Number(cantidad) || 0;
        const cantidadMaxima = item.producto.cantidad;
        
        // Limitar la cantidad a la cantidad máxima disponible
        const cantidadFinal = Math.min(Math.max(0, cantidadNum), cantidadMaxima);
        
        // ✅ USAR EL PRECIO CORRECTO: precioUnitario de la venta, no del producto general
        const precioUnitario = item.producto.precioUnitario || item.producto.precio || 0;
        
        console.log('💰 Calculando monto devolución:', {
          producto: item.producto.productoId.nombre,
          cantidadIngresada: cantidadNum,
          cantidadMaxima,
          cantidadFinal,
          precioUnitario,
          montoDevolucion: precioUnitario * cantidadFinal
        });
        
        return {
          ...item,
          cantidad: cantidadFinal.toString(),
          montoDevolucion: precioUnitario * cantidadFinal
        };
      }
      return item;
    }));
  };

  const eliminarProducto = (index) => {
    setProductosADevolver(prev => prev.filter((_, i) => i !== index));
  };

  const limpiarForm = () => {
    setProductosADevolver([]);
    setMotivo('');
    setFechaDevolucion('');
    setErrorMessage('');
    clearError();
  };

  const validarDevolucion = () => {
    if (productosADevolver.length === 0) {
      setErrorMessage('Debe seleccionar al menos un producto para devolver');
      return false;
    }

    if (!motivo.trim() || motivo.length < 10) {
      setErrorMessage('El motivo debe tener al menos 10 caracteres');
      return false;
    }

    if (!fechaDevolucion) {
      setErrorMessage('Debe seleccionar una fecha para la devolución');
      return false;
    }

    // Validar que la fecha y hora no sea futura (simplificado)
    const fechaSeleccionada = new Date(fechaDevolucion);
    const ahora = new Date();
    
    if (fechaSeleccionada > ahora) {
      setErrorMessage('La fecha y hora de devolución no puede ser futura');
      return false;
    }

    // ✅ VALIDACIÓN MEJORADA DE PRODUCTOS A DEVOLVER
    for (const item of productosADevolver) {
      const cantidadNum = parseInt(item.cantidad);
      
      if (!item.cantidad || cantidadNum <= 0) {
        setErrorMessage('La cantidad a devolver debe ser mayor a 0');
        return false;
      }
      
      if (cantidadNum > item.producto.cantidad) {
        setErrorMessage(`No puede devolver más de ${item.producto.cantidad} unidades de ${item.producto.productoId.nombre}`);
        return false;
      }

      // ✅ VALIDACIÓN ADICIONAL: Verificar que la cantidad sea un número entero válido
      if (isNaN(cantidadNum) || cantidadNum !== parseFloat(item.cantidad)) {
        setErrorMessage('La cantidad debe ser un número entero válido');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    clearError();
    
    if (!validarDevolucion()) return;

    // Confirmar si el motivo es corto
    if (motivo.length < 10) {
      const continuar = window.confirm('Se recomienda proporcionar una descripción más detallada del motivo. ¿Desea continuar de todos modos?');
      if (!continuar) {
        return;
      }
    }

    try {
      // Preparar datos para envío usando utilidades unificadas
      const devolucionData = {
        ventaId: venta._id,
        productos: productosADevolver.map(item => ({
          productoId: item.producto.productoId._id, // Solo el ID del producto
          cantidadDevuelta: parseInt(item.cantidad),
          montoDevolucion: item.montoDevolucion
        })),
        motivo,
        fechaDevolucion: convertLocalDateTimeToISO(fechaDevolucion) // Convertir a ISO usando utilidad unificada
      };

      console.log('🔍 QuickDevolucionModal - Enviando datos:', {
        ...devolucionData,
        fechaOriginal: fechaDevolucion,
        fechaConvertida: devolucionData.fechaDevolucion
      });

      // Si hay callback, usar el callback (VentaList manejará el envío)
      // Si no hay callback, usar el servicio unificado directamente
      if (onSubmit) {
        await onSubmit(devolucionData);
      } else {
        const resultado = await procesarDevolucion(devolucionData);
        console.log('✅ QuickDevolucionModal - Resultado del servicio:', resultado);
        
        // Si el servicio retornó una venta actualizada, podríamos notificar al padre
        // Pero como no hay callback, no hay forma de comunicar la actualización
        // Este caso se da cuando el modal se usa independientemente
      }
      
      limpiarForm();
      onClose();
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      setErrorMessage(error.message || 'Error al procesar la devolución');
    }
  };

  const modalContent = (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-60" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>Devolución Rápida</span>
                  <button
                    type="button"
                    onClick={() => {
                      limpiarForm();
                      onClose();
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-white/80 p-1.5 rounded-xl transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                
                <div className="mt-4">
                  {/* Productos de la venta */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Productos disponibles para devolución:</h4>
                    <div className="space-y-2">
                      {venta?.productos.map(producto => (
                        <button
                          key={producto.productoId._id}
                          onClick={() => agregarProducto(producto)}
                          disabled={productosADevolver.some(p => p.producto.productoId._id === producto.productoId._id)}
                          className={`w-full text-left p-2.5 rounded-xl border ${
                            productosADevolver.some(p => p.producto.productoId._id === producto.productoId._id)
                              ? 'bg-gray-50 border-gray-200'
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{producto.productoId.nombre}</span>
                            <span className="text-sm text-gray-500">
                              Cant. original: {producto.cantidad}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Productos seleccionados para devolución */}
                  {productosADevolver.length > 0 && (
                    <div className="mt-4 space-y-4">
                      <h4 className="text-sm font-medium text-gray-900">Productos a devolver:</h4>
                      {productosADevolver.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-xl">
                          <div className="flex-1">
                            <div className="font-medium">{item.producto.productoId.nombre}</div>
                            <div className="text-sm text-gray-500">
                              S/. {item.producto.precioUnitario || item.producto.precio || 0} x {item.cantidad || 0} = ${item.montoDevolucion}
                            </div>
                          </div>
                          <input
                            type="number"
                            min="1"
                            max={item.producto.cantidad}
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(index, e.target.value)}
                            className="w-20 border border-gray-200 rounded-xl p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cant."
                          />
                          <button
                            onClick={() => eliminarProducto(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <MinusCircle className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fecha y hora de devolución */}
                  <div className="mt-4">
                    <label htmlFor="fechaDevolucion" className="block text-sm font-medium text-gray-700">
                      Fecha y hora de devolución *
                    </label>
                    <input
                      type="datetime-local"
                      id="fechaDevolucion"
                      value={fechaDevolucion}
                      onChange={(e) => setFechaDevolucion(e.target.value)}
                      max={getLocalDateTimeString()}
                      className="mt-1 block w-full rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm px-3 py-2"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Fecha y hora local. Se inicializa automáticamente con la hora actual
                    </p>
                  </div>

                  {/* Motivo de la devolución */}                  <div className="mt-4">
                    <label htmlFor="motivo" className="block text-sm font-medium text-gray-700">
                      Motivo de la devolución
                      <span className="text-sm text-gray-500 ml-2">(Se recomienda al menos 10 caracteres)</span>
                    </label>
                    <textarea
                      id="motivo"
                      rows={3}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className={`mt-1 block w-full rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm px-3 py-2 border ${
                        motivo.length > 0 && motivo.length < 10 
                          ? 'border-yellow-300' 
                          : 'border-gray-200'
                      }`}
                      placeholder="Ingrese el motivo de la devolución"
                    />
                    {motivo.length > 0 && motivo.length < 10 && (
                      <p className="text-yellow-600 text-sm mt-1">
                        Recomendamos escribir una descripción más detallada ({motivo.length}/10 caracteres)
                      </p>
                    )}
                  </div>

                  {(errorMessage || cantidadError) && (
                    <div className="mt-2 text-red-600 text-sm">{errorMessage || cantidadError}</div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        limpiarForm();
                        onClose();
                      }}
                      className="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || cantidadLoading}
                      className={`inline-flex justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                        (isSubmitting || cantidadLoading)
                          ? 'text-blue-400 bg-blue-50 border-blue-200 cursor-not-allowed opacity-60'
                          : 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {(isSubmitting || cantidadLoading) ? 'Procesando...' : 'Confirmar Devolución'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // Usar portal para renderizar el modal fuera del contenedor limitado
  return createPortal(modalContent, document.body);
}

export default QuickDevolucionModal;
