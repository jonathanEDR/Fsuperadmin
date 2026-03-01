import React, { useState, useEffect } from 'react';
import { X, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { residuoService } from '../../../services/residuoService';

const FormularioResiduo = ({ onResiduoRegistrado, onCerrar }) => {
  const [formData, setFormData] = useState({
    tipoProducto: '',
    productoId: '',
    cantidadPerdida: '',
    motivo: '',
    observaciones: ''
  });
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const motivos = [
    { value: 'vencido', label: 'Vencido/Caducado' },
    { value: 'dañado', label: 'Dañado/Defectuoso' },
    { value: 'merma', label: 'Merma' },
    { value: 'error_proceso', label: 'Error en Proceso' },
    { value: 'otros', label: 'Otros' }
  ];

  // Cargar productos cuando cambia el tipo
  useEffect(() => {
    if (formData.tipoProducto) {
      cargarProductos(formData.tipoProducto);
    } else {
      setProductos([]);
      setProductoSeleccionado(null);
    }
  }, [formData.tipoProducto]);

  const cargarProductos = async (tipoProducto) => {
    try {
      setLoading(true);
      const response = await residuoService.obtenerProductosPorTipo(tipoProducto);
      // Asegurar que siempre tengamos un array
      const productosData = response?.data || response || [];
      setProductos(Array.isArray(productosData) ? productosData : []);
      setError('');
    } catch (err) {
      setError('Error al cargar productos: ' + err.message);
      setProductos([]); // Asegurar que productos sea un array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Si cambió el producto seleccionado, actualizar la información
    if (campo === 'productoId') {
      const producto = productos.find(p => p._id === valor);
      setProductoSeleccionado(producto);
    }

    // Si cambió el tipo de producto, limpiar el producto seleccionado
    if (campo === 'tipoProducto') {
      setFormData(prev => ({
        ...prev,
        productoId: ''
      }));
      setProductoSeleccionado(null);
    }
  };

  const obtenerStockDisponible = (producto) => {
    if (!producto) return 0;
    
    switch (formData.tipoProducto) {
      case 'ingrediente':
        return (producto.cantidad || 0) - (producto.procesado || 0);
      case 'material':
        return (producto.cantidad || 0) - (producto.consumido || 0);
      case 'receta':
        return (producto.inventario?.cantidadProducida || 0) - (producto.inventario?.cantidadUtilizada || 0);
      case 'produccion':
        return producto.cantidadProducida || 0;
      default:
        return 0;
    }
  };

  const obtenerUnidadMedida = (producto) => {
    if (!producto) return '';
    
    switch (formData.tipoProducto) {
      case 'ingrediente':
      case 'material':
        return producto.unidadMedida || '';
      case 'receta':
        return producto.rendimiento?.unidadMedida || '';
      case 'produccion':
        return producto.unidadMedida || '';
      default:
        return '';
    }
  };

  const validarFormulario = () => {
    if (!formData.tipoProducto) {
      setError('Debe seleccionar un tipo de producto');
      return false;
    }
    if (!formData.productoId) {
      setError('Debe seleccionar un producto');
      return false;
    }
    if (!formData.cantidadPerdida || parseFloat(formData.cantidadPerdida) <= 0) {
      setError('Debe ingresar una cantidad válida mayor a 0');
      return false;
    }
    if (!formData.motivo) {
      setError('Debe seleccionar un motivo');
      return false;
    }

    const stockDisponible = obtenerStockDisponible(productoSeleccionado);
    if (parseFloat(formData.cantidadPerdida) > stockDisponible) {
      setError(`La cantidad excede el stock disponible (${stockDisponible})`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validarFormulario()) {
      setLoading(false);
      return;
    }

    try {
      const datosResiduo = {
        ...formData,
        cantidadPerdida: parseFloat(formData.cantidadPerdida)
      };

      await residuoService.registrarResiduo(datosResiduo);
      onResiduoRegistrado();
    } catch (error) {
      console.error('Error al registrar residuo:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto border w-11/12 md:w-2/3 lg:w-1/2 shadow-xl rounded-2xl bg-white border-gray-100">
        <div>
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trash2 size={20} className="text-red-500" /> Registrar Residuo o Producto Malogrado
            </h3>
            <button
              onClick={onCerrar}
              className="p-1.5 hover:bg-white/80 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {/* Tipo de Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Producto *
              </label>
              <select
                value={formData.tipoProducto}
                onChange={(e) => handleInputChange('tipoProducto', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Seleccionar tipo...</option>
                <option value="ingrediente">Ingrediente</option>
                <option value="material">Material</option>
                <option value="receta">Receta</option>
                <option value="produccion">Producción</option>
              </select>
            </div>

            {/* Selector de Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto Específico *
              </label>
              {loading ? (
                <div className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <span className="text-gray-500">Cargando productos...</span>
                </div>
              ) : (
                <select
                  value={formData.productoId}
                  onChange={(e) => handleInputChange('productoId', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={!formData.tipoProducto}
                  required
                >
                  <option value="">
                    {formData.tipoProducto ? 'Seleccionar producto...' : 'Primero seleccione el tipo'}
                  </option>
                  {(productos || []).map((producto) => (
                    <option key={producto._id} value={producto._id}>
                      {producto.nombre} - Stock: {obtenerStockDisponible(producto)} {obtenerUnidadMedida(producto)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Información del Producto Seleccionado */}
            {productoSeleccionado && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <h4 className="font-medium text-blue-900 mb-2">Información del Producto:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Producto:</span> {productoSeleccionado.nombre}
                  </div>
                  <div>
                    <span className="font-medium">Stock Disponible:</span> {obtenerStockDisponible(productoSeleccionado)} {obtenerUnidadMedida(productoSeleccionado)}
                  </div>
                </div>
              </div>
            )}

            {/* Cantidad Perdida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Perdida *
              </label>
              <div className="flex">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={productoSeleccionado ? obtenerStockDisponible(productoSeleccionado) : undefined}
                  value={formData.cantidadPerdida}
                  onChange={(e) => handleInputChange('cantidadPerdida', e.target.value)}
                  className="flex-1 p-3 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                  required
                />
                <div className="px-3 py-3 bg-gray-50 border border-l-0 border-gray-200 rounded-r-xl text-sm text-gray-700">
                  {obtenerUnidadMedida(productoSeleccionado) || 'unidad'}
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de la Pérdida *
              </label>
              <select
                value={formData.motivo}
                onChange={(e) => handleInputChange('motivo', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Seleccionar motivo...</option>
                {motivos.map((motivo) => (
                  <option key={motivo.value} value={motivo.value}>
                    {motivo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
                placeholder="Descripción adicional sobre la pérdida (opcional)..."
                maxLength="500"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.observaciones.length}/500 caracteres
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCerrar}
                className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Registrando...</> : <><Trash2 size={16} /> Registrar Pérdida</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioResiduo;
