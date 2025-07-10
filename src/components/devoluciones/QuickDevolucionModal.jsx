import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, MinusCircle } from 'lucide-react';

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

  // Inicializar fecha con la fecha actual cuando se abre el modal
  useEffect(() => {
    if (isOpen && !fechaDevolucion) {
      const hoy = new Date().toISOString().split('T')[0];
      setFechaDevolucion(hoy);
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
        const cantidadNum = Number(cantidad) || 0;
        return {
          ...item,
          cantidad: cantidad,
          montoDevolucion: item.producto.precioUnitario * cantidadNum
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

    // Validar que la fecha no sea futura
    const fechaSeleccionada = new Date(fechaDevolucion);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    
    if (fechaSeleccionada > hoy) {
      setErrorMessage('La fecha de devolución no puede ser futura');
      return false;
    }

    for (const item of productosADevolver) {
      if (!item.cantidad || item.cantidad <= 0) {
        setErrorMessage('La cantidad a devolver debe ser mayor a 0');
        return false;
      }
      
      if (item.cantidad > item.producto.cantidad) {
        setErrorMessage(`No puede devolver más de ${item.producto.cantidad} unidades de ${item.producto.productoId.nombre}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!validarDevolucion()) return;

    // Confirmar si el motivo es corto
    if (motivo.length < 10) {
      const continuar = window.confirm('Se recomienda proporcionar una descripción más detallada del motivo. ¿Desea continuar de todos modos?');
      if (!continuar) {
        return;
      }
    }

    try {
      await onSubmit({
        ventaId: venta._id,
        productos: productosADevolver,
        motivo,
        fechaDevolucion: fechaDevolucion
      });
      
      limpiarForm();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || 'Error al procesar la devolución');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                    className="text-gray-400 hover:text-gray-500"
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
                          className={`w-full text-left p-2 rounded border ${
                            productosADevolver.some(p => p.producto.productoId._id === producto.productoId._id)
                              ? 'bg-gray-100 border-gray-200'
                              : 'border-gray-300 hover:bg-gray-50'
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
                        <div key={index} className="flex items-center space-x-4 p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium">{item.producto.productoId.nombre}</div>
                            <div className="text-sm text-gray-500">
                              ${item.producto.precioUnitario} x {item.cantidad || 0} = ${item.montoDevolucion}
                            </div>
                          </div>
                          <input
                            type="number"
                            min="1"
                            max={item.producto.cantidad}
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(index, e.target.value)}
                            className="w-20 border rounded p-1"
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

                  {/* Fecha de devolución */}
                  <div className="mt-4">
                    <label htmlFor="fechaDevolucion" className="block text-sm font-medium text-gray-700">
                      Fecha de devolución *
                    </label>
                    <input
                      type="date"
                      id="fechaDevolucion"
                      value={fechaDevolucion}
                      onChange={(e) => setFechaDevolucion(e.target.value)}
                      max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Seleccione la fecha en que se realizó la devolución
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
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                        motivo.length > 0 && motivo.length < 10 
                          ? 'border-yellow-300 focus:border-yellow-500' 
                          : 'border-gray-300 focus:border-indigo-500'
                      }`}
                      placeholder="Ingrese el motivo de la devolución"
                    />
                    {motivo.length > 0 && motivo.length < 10 && (
                      <p className="text-yellow-600 text-sm mt-1">
                        Recomendamos escribir una descripción más detallada ({motivo.length}/10 caracteres)
                      </p>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="mt-2 text-red-600 text-sm">{errorMessage}</div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        limpiarForm();
                        onClose();
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isSubmitting
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                      }`}
                    >
                      {isSubmitting ? 'Procesando...' : 'Confirmar Devolución'}
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
}

export default QuickDevolucionModal;
