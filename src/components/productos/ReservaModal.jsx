import React, { useState, useEffect } from 'react';
import { X, Package, User, Plus, Minus, Trash2 } from 'lucide-react';

const ReservaModal = ({ isOpen, onClose, onSubmit, productos, isLoading }) => {
  const [formData, setFormData] = useState({
    nombreColaborador: '',
    notas: ''
  });
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [errors, setErrors] = useState({});

  // Función para agregar producto
  const agregarProducto = () => {
    setProductosSeleccionados(prev => [
      ...prev,
      {
        id: Date.now(),
        productoId: '',
        cantidad: 1
      }
    ]);
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nombreColaborador: '',
        notas: ''
      });
      setProductosSeleccionados([]);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && productosSeleccionados.length === 0) {
      agregarProducto();
    }
  }, [isOpen, productosSeleccionados.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const eliminarProducto = (id) => {
    setProductosSeleccionados(prev => prev.filter(p => p.id !== id));
  };

  const actualizarProducto = (id, field, value) => {
    setProductosSeleccionados(prev => 
      prev.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const incrementarCantidad = (id) => {
    setProductosSeleccionados(prev => 
      prev.map(p => 
        p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
      )
    );
  };

  const decrementarCantidad = (id) => {
    setProductosSeleccionados(prev => 
      prev.map(p => 
        p.id === id && p.cantidad > 1 ? { ...p, cantidad: p.cantidad - 1 } : p
      )
    );
  };

  const getProductoInfo = (productoId) => {
    return productos.find(p => p._id === productoId);
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, item) => {
      const producto = getProductoInfo(item.productoId);
      if (producto) {
        return total + (producto.precio * item.cantidad);
      }
      return total;
    }, 0);
  };

  const getStockDisponible = (producto) => {
    return producto.cantidadRestante || (producto.cantidad - (producto.cantidadVendida || 0));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombreColaborador.trim()) {
      newErrors.nombreColaborador = 'El nombre del colaborador es requerido';
    }
    
    if (productosSeleccionados.length === 0) {
      newErrors.productos = 'Debe agregar al menos un producto';
    }

    productosSeleccionados.forEach((item, index) => {
      if (!item.productoId) {
        newErrors[`producto_${index}`] = 'Debe seleccionar un producto';
      }
      if (item.cantidad <= 0) {
        newErrors[`cantidad_${index}`] = 'La cantidad debe ser mayor a 0';
      }
      
      const producto = getProductoInfo(item.productoId);
      if (producto) {
        const stockDisponible = getStockDisponible(producto);
        if (item.cantidad > stockDisponible) {
          newErrors[`cantidad_${index}`] = `Stock insuficiente. Disponible: ${stockDisponible}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Crear una sola reserva con múltiples productos
      const productosData = productosSeleccionados.map(item => ({
        productoId: item.productoId,
        cantidad: item.cantidad
      }));

      await onSubmit({
        nombreColaborador: formData.nombreColaborador.trim(),
        productos: productosData,
        notas: formData.notas
      });
      
      setFormData({
        nombreColaborador: '',
        notas: ''
      });
      setProductosSeleccionados([]);
      setErrors({});
      
    } catch (error) {
      console.error('Error al crear reserva:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Nueva Reserva</h2>
              <p className="text-sm text-gray-600">Reservar productos para colaborador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              <span>Nombre del Colaborador</span>
            </label>
            <input
              type="text"
              name="nombreColaborador"
              value={formData.nombreColaborador}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nombreColaborador ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ingrese el nombre del colaborador"
            />
            {errors.nombreColaborador && (
              <p className="mt-1 text-sm text-red-600">{errors.nombreColaborador}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Package className="w-4 h-4" />
                <span>Productos a Reservar</span>
              </label>
              <button
                type="button"
                onClick={agregarProducto}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Producto</span>
              </button>
            </div>

            {errors.productos && (
              <p className="mb-3 text-sm text-red-600">{errors.productos}</p>
            )}

            <div className="space-y-4">
              {productosSeleccionados.map((item, index) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Producto {index + 1}
                    </span>
                    {productosSeleccionados.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarProducto(item.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto
                      </label>
                      <select
                        value={item.productoId}
                        onChange={(e) => actualizarProducto(item.id, 'productoId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`producto_${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seleccionar producto...</option>
                        {productos.map((producto) => (
                          <option key={producto._id} value={producto._id}>
                            {producto.nombre} - Stock: {getStockDisponible(producto)} - S/ {producto.precio}
                          </option>
                        ))}
                      </select>
                      {errors[`producto_${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`producto_${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => decrementarCantidad(item.id)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarProducto(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                          className={`w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`cantidad_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() => incrementarCantidad(item.id)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {errors[`cantidad_${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`cantidad_${index}`]}</p>
                      )}
                    </div>
                  </div>

                  {item.productoId && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">
                          S/ {(getProductoInfo(item.productoId)?.precio * item.cantidad || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {productosSeleccionados.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Total General:</span>
                  <span className="text-lg font-bold text-green-700">
                    S/ {calcularTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Notas adicionales sobre la reserva..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || productosSeleccionados.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creando...' : 'Crear Reservas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservaModal;
