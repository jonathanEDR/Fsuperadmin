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
  const [validandoNombre, setValidandoNombre] = useState(false);
  const [nombreDisponible, setNombreDisponible] = useState(null);

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

        // Validar el nombre autocompletado
        validarNombreIngrediente(producto.nombre);
      }
    } else {
      setProductoSeleccionado(null);
      setNombreDisponible(null);
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

  // Validar nombre de ingrediente en tiempo real
  const validarNombreIngrediente = async (nombre) => {
    if (!nombre.trim()) {
      setNombreDisponible(null);
      return;
    }

    setValidandoNombre(true);
    try {
      const response = await ingredienteService.verificarNombreDisponible(
        nombre, 
        ingrediente?._id
      );
      setNombreDisponible(response.disponible);
      
      if (!response.disponible) {
        setErrores(prev => ({
          ...prev,
          nombre: 'Este nombre ya está en uso. Por favor, elija un nombre diferente.'
        }));
      } else {
        setErrores(prev => {
          const nuevosErrores = { ...prev };
          delete nuevosErrores.nombre;
          return nuevosErrores;
        });
      }
    } catch (error) {
      console.error('Error al validar nombre:', error);
      setNombreDisponible(null);
    } finally {
      setValidandoNombre(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    } else if (nombreDisponible === false) {
      nuevosErrores.nombre = 'Este nombre ya está en uso. Por favor, elija un nombre diferente.';
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

    // Validar nombre en tiempo real cuando sea manual
    if (campo === 'nombre' && !formData.productoReferencia) {
      // Esperar un poco antes de validar para evitar demasiadas peticiones
      clearTimeout(window.validacionTimeout);
      window.validacionTimeout = setTimeout(() => {
        validarNombreIngrediente(valor);
      }, 500);
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
      <div className="relative top-4 mx-auto p-6 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 shadow-lg rounded-md bg-white max-h-[95vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {ingrediente ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LADO IZQUIERDO - Selector y Botones */}
              <div className="space-y-6">
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
                </div>

                {/* Vista previa del producto seleccionado */}
                {productoSeleccionado && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">Producto Seleccionado</h4>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-2xl">{productoSeleccionado.tipoProduccion?.icono}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{productoSeleccionado.nombre}</div>
                        <div className="text-sm text-gray-600">
                          Código: {productoSeleccionado.codigo}
                        </div>
                        <div className="text-sm text-gray-600">
                          Unidad: {productoSeleccionado.unidadMedida}
                        </div>
                        {productoSeleccionado.descripcion && (
                          <div className="text-sm text-gray-500 mt-1">
                            {productoSeleccionado.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado del ingrediente */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => handleChange('activo', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 w-4 h-4"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Ingrediente activo
                    </span>
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    Los ingredientes inactivos no aparecerán en las listas de selección
                  </p>
                </div>

                {/* Error general */}
                {errores.general && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">⚠️</span>
                      {errores.general}
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="space-y-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {enviando ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </span>
                    ) : (
                      ingrediente ? 'Actualizar Ingrediente' : 'Crear Ingrediente'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelar}
                    className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    disabled={enviando}
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* LADO DERECHO - Inputs de datos */}
              <div className="space-y-6">
                {/* Nombre del Ingrediente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Ingrediente *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                        errores.nombre ? 'border-red-500' : 
                        nombreDisponible === true ? 'border-green-500' :
                        nombreDisponible === false ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Se completará automáticamente al seleccionar el producto"
                      disabled={formData.productoReferencia}
                      readOnly={formData.productoReferencia}
                    />
                    
                    {/* Indicadores de validación */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {validandoNombre && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      )}
                      {!validandoNombre && nombreDisponible === true && !formData.productoReferencia && (
                        <span className="text-green-500 text-xl">✓</span>
                      )}
                      {!validandoNombre && nombreDisponible === false && (
                        <span className="text-red-500 text-xl">✗</span>
                      )}
                    </div>
                  </div>
                  
                  {errores.nombre && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errores.nombre}
                    </p>
                  )}
                  {!errores.nombre && nombreDisponible === true && !formData.productoReferencia && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <span className="mr-1">✅</span>
                      Este nombre está disponible
                    </p>
                  )}
                  {!formData.productoReferencia && !errores.nombre && !nombreDisponible && (
                    <p className="mt-1 text-sm text-gray-500">
                      💡 Seleccione un producto del catálogo para autocompletar el nombre
                    </p>
                  )}
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de Medida *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={unidadesMedida.find(u => u.value === formData.unidadMedida)?.label || formData.unidadMedida}
                      className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 pl-10"
                      disabled
                      readOnly
                      placeholder="Se autocompletará desde el producto"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">📏</span>
                    </div>
                  </div>
                  {!formData.productoReferencia && (
                    <p className="mt-1 text-sm text-gray-500">
                      Se establecerá automáticamente desde el producto seleccionado
                    </p>
                  )}
                </div>

                {/* Cantidad y Precio en grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cantidad Inicial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad Inicial
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cantidad}
                        onChange={(e) => handleChange('cantidad', parseFloat(e.target.value) || 0)}
                        className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 pl-10 ${
                          errores.cantidad ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">📦</span>
                      </div>
                    </div>
                    {errores.cantidad && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errores.cantidad}
                      </p>
                    )}
                  </div>

                  {/* Precio Unitario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Unitario (S/)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precioUnitario}
                        onChange={(e) => handleChange('precioUnitario', parseFloat(e.target.value) || 0)}
                        className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 pl-10 ${
                          errores.precioUnitario ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">💰</span>
                      </div>
                    </div>
                    {errores.precioUnitario && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errores.precioUnitario}
                      </p>
                    )}
                  </div>
                </div>

                {/* Información adicional */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">📋 Información</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Los ingredientes se vinculan directamente con productos del catálogo</li>
                    <li>• El nombre y unidad de medida se toman automáticamente del producto</li>
                    <li>• La cantidad inicial representa el stock disponible actual</li>
                    <li>• El precio unitario se usa para cálculos de costos en recetas</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioIngredienteMejorado;
