import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';

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
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});

  // Limpiar formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setCantidad('');
      setMotivo('Entrada manual');
      setPrecio('');
      setErrores({});
    }
  }, [isOpen]);

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!cantidad || isNaN(cantidad) || parseFloat(cantidad) <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser un número mayor a 0';
    }

    if (precio && (isNaN(precio) || parseFloat(precio) < 0)) {
      nuevosErrores.precio = 'El precio debe ser un número mayor o igual a 0';
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
      const resultado = await movimientoUnificadoService.agregarCantidad({
        tipoProducto,
        productoId: producto._id,
        cantidad: parseFloat(cantidad),
        motivo: motivo || 'Entrada manual',
        precio: parseFloat(precio) || null
      });

      console.log('✅ Cantidad agregada exitosamente:', resultado);
      
      if (onSuccess) {
        onSuccess(resultado.data);
      }
      
      onClose();
      
    } catch (error) {
      console.error('❌ Error al agregar cantidad:', error);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{icono}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Agregar Cantidad
              </h2>
              <p className="text-sm text-gray-600">
                {movimientoUnificadoService.formatearTipoItem(`${tipoProducto.charAt(0).toUpperCase()}${tipoProducto.slice(1).slice(0, -1)}`)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Información del producto */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-2">{infoProducto.nombre}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Cantidad Actual:</span>
              <p className="font-medium text-gray-800">
                {infoProducto.cantidadActual} {infoProducto.unidad}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Referencia:</span>
              <p className="font-medium text-gray-800">{infoProducto.referencia}</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error general */}
          {errores.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errores.general}</p>
            </div>
          )}

          {/* Campo Cantidad */}
          <div className="mb-4">
            <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-2">
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
                  w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
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

          {/* Campo Precio (para ingredientes y materiales) */}
          {(tipoProducto === 'ingredientes' || tipoProducto === 'materiales') && (
            <div className="mb-4">
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">
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
                    w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2
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
          <div className="mb-6">
            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
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
                w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-none
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
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Nueva cantidad total:</span> 
                {' '}{(infoProducto.cantidadActual + parseFloat(cantidad)).toFixed(2)} {infoProducto.unidad}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ({infoProducto.cantidadActual} + {parseFloat(cantidad).toFixed(2)})
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className={`
                px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md
                transition-colors
                ${enviando 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500'
                }
              `}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !cantidad || parseFloat(cantidad) <= 0}
              className={`
                px-4 py-2 text-sm font-medium text-white rounded-md
                transition-colors
                ${enviando || !cantidad || parseFloat(cantidad) <= 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }
              `}
            >
              {enviando ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Agregando...
                </div>
              ) : (
                'Agregar Cantidad'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAgregarCantidad;
