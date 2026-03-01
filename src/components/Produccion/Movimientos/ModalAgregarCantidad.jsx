import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';

const ModalAgregarCantidad = ({ 
  isOpen, 
  onClose, 
  producto, 
  tipoProducto,
  onSuccess 
}) => {
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [precio, setPrecio] = useState('');
  const [fechaProduccion, setFechaProduccion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});

  // Limpiar formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setCantidad('');
      setMotivo('Entrada manual');
      setPrecio('');
      setFechaProduccion(getLocalDateTimeString()); // Fecha y hora actual por defecto
      setErrores({});
    }
  }, [isOpen]);

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!cantidad || isNaN(cantidad) || parseFloat(cantidad) <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser un nÃºmero mayor a 0';
    }

    if (precio && (isNaN(precio) || parseFloat(precio) < 0)) {
      nuevosErrores.precio = 'El precio debe ser un nÃºmero mayor o igual a 0';
    }

    if (motivo && motivo.length > 500) {
      nuevosErrores.motivo = 'El motivo no puede exceder 500 caracteres';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);
    
    try {
      console.log('ðŸ“… ModalAgregarCantidad - Enviando fecha:', fechaProduccion);
      
      const resultado = await movimientoUnificadoService.agregarCantidad({
        tipoProducto,
        productoId: producto._id,
        cantidad: parseFloat(cantidad),
        motivo: motivo || 'Entrada manual',
        precio: parseFloat(precio) || null,
        fechaProduccion: fechaProduccion // Enviar la fecha seleccionada
      });

      if (onSuccess) {
        onSuccess(resultado.data);
      }
      
      onClose();
      
    } catch (error) {
      console.error('âŒ Error al agregar cantidad:', error);
      setErrores({ 
        general: error.message || 'Error al agregar cantidad'
      });
    } finally {
      setEnviando(false);
    }
  };

  const obtenerInformacionProducto = () => {
    if (!producto) return {};

    switch (tipoProducto) {
      case 'ingredientes':
        // Calcular stock disponible: cantidad total - cantidad procesada
        const stockDisponibleIngrediente = (producto.cantidad || 0) - (producto.procesado || 0);
        return {
          nombre: producto.nombre,
          cantidadActual: stockDisponibleIngrediente,
          unidad: producto.unidadMedida || 'unidad',
          referencia: producto.productoReferencia?.nombre || 'N/A'
        };
      case 'materiales':
        return {
          nombre: producto.nombre,
          cantidadActual: producto.cantidad || 0,
          unidad: producto.unidadMedida || 'unidad',
          referencia: producto.productoReferencia?.nombre || 'N/A'
        };
      case 'recetas':
        return {
          nombre: producto.nombre,
          cantidadActual: producto.inventario?.cantidadProducida || 0,
          unidad: producto.unidadMedida || 'unidad',
          referencia: producto.productoReferencia?.nombre || 'N/A'
        };
      case 'produccion':
        return {
          nombre: producto.nombre,
          cantidadActual: producto.cantidad || 0,
          unidad: producto.unidadMedida || 'unidad',
          referencia: producto.codigo || 'N/A'
        };
      default:
        return {
          nombre: producto.nombre || 'Producto',
          cantidadActual: 0,
          unidad: 'unidad',
          referencia: 'N/A'
        };
    }
  };

  if (!isOpen || !producto) return null;

  const infoProducto = obtenerInformacionProducto();
  const icono = movimientoUnificadoService.obtenerIconoTipo(tipoProducto);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
              <Plus size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Agregar Cantidad</h2>
              <p className="text-xs text-gray-500">
                {movimientoUnificadoService.formatearTipoItem(`${tipoProducto.charAt(0).toUpperCase()}${tipoProducto.slice(1).slice(0, -1)}`)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
        {/* InformaciÃ³n del producto */}
        <div className="mx-5 mt-4 p-3 bg-gray-50/60 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">{infoProducto.nombre}</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Cantidad Actual:</span>
              <p className="font-medium text-gray-800">
                {infoProducto.cantidadActual} {infoProducto.unidad}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Referencia:</span>
              <p className="font-medium text-gray-800 truncate" title={infoProducto.referencia}>{infoProducto.referencia}</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form id="agregar-form" onSubmit={handleSubmit} className="p-5">
          {/* Error general */}
          {errores.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{errores.general}</p>
            </div>
          )}

          {/* Campo Cantidad */}
          <div className="mb-3 sm:mb-4">
            <label htmlFor="cantidad" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Cantidad a Agregar *
            </label>
            <div className="relative">
              <input
                type="number"
                id="cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                disabled={enviando}
                className={`
                  w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2
                  ${errores.cantidad 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }
                  ${enviando ? 'bg-gray-100 cursor-not-allowed' : ''}
                `}
              />
              <span className="absolute right-3 top-2 text-sm text-gray-500">
                {infoProducto.unidad}
              </span>
            </div>
            {errores.cantidad && (
              <p className="mt-1 text-sm text-red-600">{errores.cantidad}</p>
            )}
          </div>

          {/* Campo Fecha de ProducciÃ³n */}
          <div className="mb-3 sm:mb-4">
            <label htmlFor="fechaProduccion" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 flex items-center gap-1">
              <Calendar size={13} /> Fecha y Hora de ProducciÃ³n
            </label>
            <input
              type="datetime-local"
              id="fechaProduccion"
              value={fechaProduccion}
              onChange={(e) => setFechaProduccion(e.target.value)}
              max={getLocalDateTimeString()} // No permitir fechas futuras
              step="1" // Incluir segundos
              disabled={enviando}
              className={`
                w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2
                ${errores.fechaProduccion 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
                }
                ${enviando ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            />
            {errores.fechaProduccion && (
              <p className="mt-1 text-sm text-red-600">{errores.fechaProduccion}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Selecciona la fecha y hora en que se realizÃ³ la producciÃ³n
            </p>
          </div>

          {/* Campo Precio (para ingredientes y materiales) */}
          {(tipoProducto === 'ingredientes' || tipoProducto === 'materiales') && (
            <div className="mb-3 sm:mb-4">
              <label htmlFor="precio" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Precio Unitario (Referencial)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-gray-500">S/.</span>
                <input
                  type="number"
                  id="precio"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  disabled={enviando}
                  className={`
                    w-full pl-10 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2
                    ${errores.precio 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                    }
                    ${enviando ? 'bg-gray-100 cursor-not-allowed' : ''}
                  `}
                />
              </div>
              {errores.precio && (
                <p className="mt-1 text-sm text-red-600">{errores.precio}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Opcional: Para registrar el precio de referencia del ingrediente
              </p>
            </div>
          )}

          {/* Campo Motivo */}
          <div className="mb-4 sm:mb-6">
            <label htmlFor="motivo" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Motivo
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Motivo del movimiento (opcional)"
              disabled={enviando}
              maxLength={500}
              className={`
                w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 resize-none
                ${errores.motivo 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
                }
                ${enviando ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            />
            {errores.motivo && (
              <p className="mt-1 text-sm text-red-600">{errores.motivo}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {motivo.length}/500 caracteres
            </p>
          </div>

          {/* Preview del resultado */}
          {cantidad && !isNaN(cantidad) && parseFloat(cantidad) > 0 && (
            <div className="mb-4 sm:mb-6 p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
              <p className="text-xs sm:text-sm text-blue-800">
                <span className="font-medium">Nueva cantidad total:</span> 
                {' '}{(infoProducto.cantidadActual + parseFloat(cantidad)).toFixed(2)} {infoProducto.unidad}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ({infoProducto.cantidadActual} + {parseFloat(cantidad).toFixed(2)})
              </p>
            </div>
          )}

          </form>
        </div>

          {/* Footer con botones */}
          <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 rounded-b-2xl flex-shrink-0">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                className="px-4 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="agregar-form"
                disabled={enviando || !cantidad || parseFloat(cantidad) <= 0}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-xl border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? (
                  <><Loader2 size={14} className="animate-spin" /> Agregando...</>
                ) : (
                  <><Plus size={14} /> Agregar Cantidad</>
                )}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ModalAgregarCantidad;
