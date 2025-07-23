import React, { useState } from 'react';
import { getLocalDateTimeString, formatLocalDate, convertLocalDateTimeToISO } from '../../utils/fechaHoraUtils';

function DevolucionModal({
  isVisible,
  ventas,
  selectedVenta,
  fechaDevolucion,
  motivo,
  onClose,
  onVentaSelect,
  onFechaChange,
  onMotivoChange,
  onSubmit,
  isSubmitting
}) {
  const [productosADevolver, setProductosADevolver] = useState([]);
  
  const agregarProducto = (producto) => {
    // Ensure the product isn't already in the list
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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-60">
      <div className="modal-overlay absolute inset-0 bg-black opacity-50"></div>
      <div className="modal-content bg-white p-4 sm:p-6 rounded-lg shadow-xl z-50 w-[95vw] max-w-[800px] max-h-[95vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-6">Registrar Devolución</h3>
        
        {/* Selección de Venta */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Venta:
          </label>
          <select
            value={selectedVenta?._id || ''}
            onChange={(e) => {
              const venta = ventas.find(v => v._id === e.target.value);
              onVentaSelect(venta);
              setProductosADevolver([]); // Limpiar productos al cambiar de venta
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione una venta</option>
            {ventas.map(venta => (
              <option key={venta._id} value={venta._id}>
                {`Venta #${venta._id.slice(-6)} - ${formatLocalDate(venta.fechadeVenta, { hour12: false })}`}
              </option>
            ))}
          </select>
        </div>

        {/* Selección de Productos */}
        {selectedVenta && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Productos a devolver:
              </label>
              <select
                onChange={(e) => {
                  const producto = selectedVenta.productos.find(p => p.productoId._id === e.target.value);
                  if (producto) {
                    agregarProducto(producto);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Agregar producto</option>
                {selectedVenta.productos
                  .filter(p => !productosADevolver.some(pd => pd.producto.productoId._id === p.productoId._id))
                  .map(producto => (
                    <option key={producto.productoId._id} value={producto.productoId._id}>
                      {`${producto.productoId.nombre} - Disponible: ${producto.cantidad}`}
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Lista de productos seleccionados */}
            <div className="space-y-4">
              {productosADevolver.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{item.producto.productoId.nombre}</p>
                    <p className="text-sm text-gray-600">
                      Precio unitario: S/ {item.producto.precioUnitario.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidad(index, e.target.value)}
                      min="1"
                      max={item.producto.cantidad}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Cantidad"
                    />
                  </div>
                  <div className="w-32 text-right">
                    <p className="font-medium">
                      S/ {item.montoDevolucion.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarProducto(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fecha de devolución */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y hora de devolución:
          </label>
          <input
            type="datetime-local"
            value={fechaDevolucion}
            onChange={(e) => onFechaChange(e.target.value)}
            max={getLocalDateTimeString()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Fecha y hora local. Editable según cuando se realizó la devolución (no puede ser en el futuro)
          </p>
        </div>

        {/* Motivo */}
        <div className="mb-6">          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo de la devolución:
            <span className="text-sm text-gray-500 ml-2">(Se recomienda al menos 10 caracteres)</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => onMotivoChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              motivo.length > 0 && motivo.length < 10 
                ? 'border-yellow-300' 
                : 'border-gray-300'
            }`}
            rows="3"
            placeholder="Explique detalladamente el motivo de la devolución..."
          />
          {motivo.length > 0 && motivo.length < 10 && (
            <p className="text-yellow-600 text-sm mt-1">
              Recomendamos escribir una descripción más detallada ({motivo.length}/10 caracteres)
            </p>
          )}
        </div>

        {/* Total de la devolución */}
        {productosADevolver.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-lg font-medium">
              Total a devolver: S/ {productosADevolver.reduce((sum, item) => sum + item.montoDevolucion, 0).toFixed(2)}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              // Validate products and quantities
              const invalidProduct = productosADevolver.find(item => 
                !item.cantidad || 
                parseInt(item.cantidad) <= 0 || 
                parseInt(item.cantidad) > item.producto.cantidad
              );

              if (invalidProduct) {
                alert(`Cantidad inválida para el producto ${invalidProduct.producto.productoId.nombre}`);
                return;
              }

              // Validate fecha de devolución
              if (!fechaDevolucion) {
                alert('Por favor, seleccione la fecha y hora de la devolución');
                return;
              }

              // Validar que la fecha no sea futura
              const fechaSeleccionada = new Date(fechaDevolucion);
              const ahora = new Date();
              // Agregar margen de 1 minuto para evitar problemas de sincronización
              ahora.setMinutes(ahora.getMinutes() + 1);
              
              if (fechaSeleccionada > ahora) {
                alert('La fecha y hora de devolución no puede ser en el futuro');
                return;
              }

              // Validate motivo
              if (!motivo || motivo.length < 1) {
                alert('Por favor, ingrese un motivo para la devolución');
                return;
              }
              
              if (motivo.length < 10) {
                const continuar = window.confirm('Se recomienda proporcionar una descripción más detallada del motivo. ¿Desea continuar de todos modos?');
                if (!continuar) {
                  return;
                }
              }

              // Submit data
              onSubmit(productosADevolver);
            }}
            disabled={
              isSubmitting ||              !selectedVenta || 
              productosADevolver.length === 0 || 
              !motivo || 
              motivo.length < 1 || 
              !fechaDevolucion ||
              productosADevolver.some(item => 
                !item.cantidad || 
                parseInt(item.cantidad) <= 0 || 
                parseInt(item.cantidad) > item.producto.cantidad
              )
            }
            className={`px-4 py-2 ${
              isSubmitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-md transition-colors`}
          >
            {isSubmitting ? 'Procesando...' : 'Registrar Devolución'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DevolucionModal;
