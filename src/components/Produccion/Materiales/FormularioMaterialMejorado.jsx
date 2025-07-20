import React, { useState, useEffect } from 'react';
import { materialService } from '../../../services/materialService';
import catalogoProduccionService from '../../../services/catalogoProduccion';

const FormularioMaterialMejorado = ({ material, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: material?.nombre || '',
    productoReferencia: material?.productoReferencia?._id || '',
    tipoMaterial: 'catalogo', // Siempre catálogo
    unidadMedida: material?.unidadMedida || 'kg',
    cantidad: material?.cantidad || 0,
    stockMinimo: material?.stockMinimo || 0,
    precioUnitario: material?.precioUnitario || 0,
    activo: material?.activo !== undefined ? material.activo : true
  });
  
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const unidadesMedida = [
    { value: 'kg', label: 'Kilogramos' },
    { value: 'gr', label: 'Gramos' },
    { value: 'lt', label: 'Litros' },
    { value: 'ml', label: 'Mililitros' },
    { value: 'unidad', label: 'Unidades' },
    { value: 'pieza', label: 'Piezas' }
  ];

  // Cargar productos del catálogo al montar el componente
  useEffect(() => {
    cargarProductosCatalogo();
  }, []);

  // Actualizar producto seleccionado cuando cambia la referencia
  useEffect(() => {
    if (formData.productoReferencia) {
      const producto = productosCatalogo.find(p => p._id === formData.productoReferencia);
      setProductoSeleccionado(producto);
      
      // Auto-completar campos desde el producto del catálogo
      if (producto) {
        setFormData(prev => ({
          ...prev,
          nombre: producto.nombre,
          unidadMedida: producto.unidadMedida || prev.unidadMedida
        }));
      }
    } else {
      setProductoSeleccionado(null);
    }
  }, [formData.productoReferencia, productosCatalogo]);

  const cargarProductosCatalogo = async () => {
    try {
      setCargandoProductos(true);
      // Filtrar productos del catálogo específicamente para el módulo de materiales
      const productos = await catalogoProduccionService.obtenerProductosPorModulo({ 
        moduloSistema: 'materiales',
        activo: true 
      });
      setProductosCatalogo(productos || []);
    } catch (error) {
      console.error('Error al cargar productos del catálogo:', error);
      setProductosCatalogo([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }

    if (!formData.productoReferencia) {
      nuevosErrores.productoReferencia = 'Debe seleccionar un producto del catálogo';
    }

    if (formData.cantidad < 0) {
      nuevosErrores.cantidad = 'La cantidad no puede ser negativa';
    }

    if (formData.stockMinimo < 0) {
      nuevosErrores.stockMinimo = 'El stock mínimo no puede ser negativo';
    }

    if (formData.precioUnitario < 0) {
      nuevosErrores.precioUnitario = 'El precio no puede ser negativo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpiar error del campo modificado
    if (errores[campo]) {
      setErrores(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);
    try {
      let resultado;
      if (material) {
        resultado = await materialService.actualizarMaterial(material._id, formData);
      } else {
        resultado = await materialService.crearMaterial(formData);
      }

      if (resultado.success) {
        onGuardar(resultado.data);
      } else {
        throw new Error(resultado.message || 'Error al guardar el material');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setErrores({ general: error.message || 'Error al guardar el material' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {material ? 'Editar Material' : 'Crear Nuevo Material'}
            </h2>
            <button
              onClick={onCancelar}
              disabled={enviando}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error general */}
              {errores.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {errores.general}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Información del Material
                  </h3>

                  {/* Producto del catálogo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Producto del Catálogo *
                    </label>
                    <select
                      value={formData.productoReferencia}
                      onChange={(e) => handleChange('productoReferencia', e.target.value)}
                      disabled={cargandoProductos || enviando}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.productoReferencia ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">
                        {cargandoProductos ? 'Cargando productos...' : 'Seleccionar producto'}
                      </option>
                      {productosCatalogo.map((producto) => (
                        <option key={producto._id} value={producto._id}>
                          {producto.nombre} - {producto.tipoProducto}
                        </option>
                      ))}
                    </select>
                    {errores.productoReferencia && (
                      <p className="text-red-500 text-sm mt-1">{errores.productoReferencia}</p>
                    )}
                  </div>

                  {/* Nombre del material */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Material *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      disabled={!!productoSeleccionado || enviando}
                      placeholder="Se autocompletará al seleccionar un producto"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.nombre ? 'border-red-300' : 'border-gray-300'
                      } ${productoSeleccionado ? 'bg-gray-100' : ''}`}
                    />
                    {errores.nombre && (
                      <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>
                    )}
                  </div>

                  {/* Unidad de medida */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida *
                    </label>
                    <select
                      value={formData.unidadMedida}
                      onChange={(e) => handleChange('unidadMedida', e.target.value)}
                      disabled={enviando}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {unidadesMedida.map((unidad) => (
                        <option key={unidad.value} value={unidad.value}>
                          {unidad.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Inventario y Precios
                  </h3>

                  {/* Cantidad inicial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cantidad}
                      onChange={(e) => handleChange('cantidad', parseFloat(e.target.value) || 0)}
                      disabled={enviando}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.cantidad ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errores.cantidad && (
                      <p className="text-red-500 text-sm mt-1">{errores.cantidad}</p>
                    )}
                  </div>

                  {/* Stock mínimo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Mínimo *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.stockMinimo}
                      onChange={(e) => handleChange('stockMinimo', parseFloat(e.target.value) || 0)}
                      disabled={enviando}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.stockMinimo ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errores.stockMinimo && (
                      <p className="text-red-500 text-sm mt-1">{errores.stockMinimo}</p>
                    )}
                  </div>

                  {/* Precio unitario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Unitario ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.precioUnitario}
                      onChange={(e) => handleChange('precioUnitario', parseFloat(e.target.value) || 0)}
                      disabled={enviando}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.precioUnitario ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errores.precioUnitario && (
                      <p className="text-red-500 text-sm mt-1">{errores.precioUnitario}</p>
                    )}
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => handleChange('activo', e.target.checked)}
                        disabled={enviando}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Material activo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Resumen del producto seleccionado */}
              {productoSeleccionado && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Producto Seleccionado:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                    <div><strong>Nombre:</strong> {productoSeleccionado.nombre}</div>
                    <div><strong>Tipo:</strong> {productoSeleccionado.tipoProducto}</div>
                    <div><strong>Código:</strong> {productoSeleccionado.codigo}</div>
                    <div><strong>Categoría:</strong> {productoSeleccionado.categoria}</div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={onCancelar}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {enviando ? 'Guardando...' : (material ? 'Actualizar' : 'Crear Material')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioMaterialMejorado;