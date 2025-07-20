import React, { useState, useEffect } from 'react';
import { ingredienteService } from '../../../services/ingredienteService';
import catalogoProduccionService from '../../../services/catalogoProduccion';

const FormularioIngredienteMejorado = ({ ingrediente, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: ingrediente?.nombre || '',
    productoReferencia: ingrediente?.productoReferencia?._id || '',
    tipoIngrediente: 'catalogo', // Siempre catálogo
    unidadMedida: ingrediente?.unidadMedida || 'kg',
    cantidad: ingrediente?.cantidad || 0,
    precioUnitario: ingrediente?.precioUnitario || 0,
    activo: ingrediente?.activo !== undefined ? ingrediente.activo : true
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
      // Filtrar productos del catálogo específicamente para el módulo de ingredientes
      const productos = await catalogoProduccionService.obtenerProductosPorModulo({ 
        moduloSistema: 'ingredientes',
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
      // Preparar datos para enviar
      const datosEnvio = {
        ...formData,
        // Siempre incluir productoReferencia
        productoReferencia: formData.productoReferencia
      };

      await onGuardar(datosEnvio);
    } catch (error) {
      console.error('Error al guardar ingrediente:', error);
      setErrores({ general: 'Error al guardar el ingrediente' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {ingrediente ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de Producto del Catálogo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Producto del Catálogo *
              </label>
              <select
                value={formData.productoReferencia}
                onChange={(e) => handleChange('productoReferencia', e.target.value)}
                className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.productoReferencia ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={cargandoProductos}
              >
                <option value="">
                  {cargandoProductos ? 'Cargando productos...' : 'Seleccionar producto...'}
                </option>
                {productosCatalogo.map(producto => (
                  <option key={producto._id} value={producto._id}>
                    {producto.tipoProduccion?.icono} {producto.codigo} - {producto.nombre}
                  </option>
                ))}
              </select>
              {errores.productoReferencia && (
                <p className="mt-1 text-sm text-red-600">{errores.productoReferencia}</p>
              )}

              {/* Vista previa del producto seleccionado */}
              {productoSeleccionado && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{productoSeleccionado.tipoProduccion?.icono}</span>
                    <div>
                      <div className="font-medium">{productoSeleccionado.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {productoSeleccionado.codigo} • {productoSeleccionado.unidadMedida}
                      </div>
                      {productoSeleccionado.descripcion && (
                        <div className="text-sm text-gray-600 mt-1">
                          {productoSeleccionado.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Nombre del Ingrediente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Ingrediente *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Se completará automáticamente al seleccionar el producto"
                disabled={true} // Siempre deshabilitado ya que se autocompleta
                readOnly
              />
              {errores.nombre && (
                <p className="mt-1 text-sm text-red-600">{errores.nombre}</p>
              )}
              {!formData.productoReferencia && (
                <p className="mt-1 text-sm text-gray-500">
                  Seleccione un producto del catálogo para autocompletar el nombre
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unidad de Medida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad de Medida *
                </label>
                <input
                  type="text"
                  value={unidadesMedida.find(u => u.value === formData.unidadMedida)?.label || formData.unidadMedida}
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                  disabled
                  readOnly
                  placeholder="Se autocompletará desde el producto"
                />
                {!formData.productoReferencia && (
                  <p className="mt-1 text-sm text-gray-500">
                    Se establecerá automáticamente desde el producto seleccionado
                  </p>
                )}
              </div>

              {/* Cantidad Inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cantidad}
                  onChange={(e) => handleChange('cantidad', parseFloat(e.target.value) || 0)}
                  className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errores.cantidad ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errores.cantidad && (
                  <p className="mt-1 text-sm text-red-600">{errores.cantidad}</p>
                )}
              </div>
            </div>

            {/* Precio Unitario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Unitario (S/)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precioUnitario}
                onChange={(e) => handleChange('precioUnitario', parseFloat(e.target.value) || 0)}
                className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errores.precioUnitario ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errores.precioUnitario && (
                <p className="mt-1 text-sm text-red-600">{errores.precioUnitario}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => handleChange('activo', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Ingrediente activo</span>
              </label>
            </div>

            {/* Error general */}
            {errores.general && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {errores.general}
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onCancelar}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {enviando ? 'Guardando...' : (ingrediente ? 'Actualizar' : 'Crear Ingrediente')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioIngredienteMejorado;
