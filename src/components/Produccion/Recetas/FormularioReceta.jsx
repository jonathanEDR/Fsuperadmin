import React, { useState, useEffect } from 'react';
import { ingredienteService } from '../../../services/ingredienteService';
import catalogoProduccionService from '../../../services/catalogoProduccion';

const FormularioReceta = ({ receta, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: receta?.nombre || '',
    productoReferencia: receta?.productoReferencia || '', // Nuevo campo para el producto del catálogo
    descripcion: receta?.descripcion || '',
    tiempoPreparacion: receta?.tiempoPreparacion || 0,
    categoria: receta?.categoria || 'producto_terminado', // Campo requerido por el modelo
    rendimiento: {
      cantidad: receta?.rendimiento?.cantidad || 1,
      unidadMedida: receta?.rendimiento?.unidadMedida || 'unidad'
    },
    ingredientes: receta?.ingredientes || [],
    activo: receta?.activo !== undefined ? receta.activo : true,
    consumirIngredientes: receta ? false : true // Para recetas nuevas, por defecto sí consumir
  });
  
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [loadingIngredientes, setLoadingIngredientes] = useState(true);

  const unidadesMedida = [
    { value: 'kg', label: 'Kilogramos' },
    { value: 'gr', label: 'Gramos' },
    { value: 'lt', label: 'Litros' },
    { value: 'ml', label: 'Mililitros' },
    { value: 'unidad', label: 'Unidades' },
    { value: 'pieza', label: 'Piezas' }
  ];

  useEffect(() => {
    cargarIngredientes();
    cargarProductosCatalogo();
    
    // Inicializar con un ingrediente vacío si no hay ninguno
    if (formData.ingredientes.length === 0) {
      agregarIngrediente();
    }
  }, []);

  // Efecto para manejar la selección del producto del catálogo
  useEffect(() => {
    if (formData.productoReferencia) {
      const producto = productosCatalogo.find(p => p._id === formData.productoReferencia);
      setProductoSeleccionado(producto);
      
      // Auto-completar nombre desde el producto del catálogo
      if (producto) {
        setFormData(prev => ({
          ...prev,
          nombre: producto.nombre
        }));
      }
    } else {
      setProductoSeleccionado(null);
    }
  }, [formData.productoReferencia, productosCatalogo]);

  const cargarIngredientes = async () => {
    try {
      setLoadingIngredientes(true);
      // Obtener ingredientes activos del módulo de ingredientes
      const response = await ingredienteService.obtenerIngredientes({ activo: true });
      setIngredientesDisponibles(response.data || []);
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
      setIngredientesDisponibles([]);
    } finally {
      setLoadingIngredientes(false);
    }
  };

  const cargarProductosCatalogo = async () => {
    try {
      setCargandoProductos(true);
      // Filtrar productos del catálogo específicamente para el módulo de recetas
      const productos = await catalogoProduccionService.obtenerProductosParaRecetas();
      setProductosCatalogo(productos.data || []);
    } catch (error) {
      console.error('Error al cargar productos del catálogo:', error);
      setProductosCatalogo([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  const obtenerIngredienteInfo = (ingredienteId) => {
    return ingredientesDisponibles.find(ing => ing._id === ingredienteId);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.productoReferencia) {
      nuevosErrores.productoReferencia = 'Debe seleccionar un producto del catálogo';
    }

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }

    if (formData.rendimiento.cantidad <= 0) {
      nuevosErrores.rendimiento = 'El rendimiento debe ser mayor a 0';
    }

    // FILTRAR SOLO INGREDIENTES QUE TIENEN DATOS
    const ingredientesConDatos = formData.ingredientes.filter(ing => 
      ing.ingrediente || ing.cantidad > 0
    );

    console.log('🧪 Ingredientes con datos para validar:', ingredientesConDatos);

    if (ingredientesConDatos.length === 0) {
      nuevosErrores.ingredientes = 'Debe agregar al menos un ingrediente a la receta';
    }

    // VALIDAR SOLO INGREDIENTES QUE TIENEN ALGÚN DATO
    ingredientesConDatos.forEach((ingrediente, index) => {
      // Encontrar el índice original en el array completo
      const indiceOriginal = formData.ingredientes.findIndex(ing => ing === ingrediente);
      
      if (!ingrediente.ingrediente) {
        nuevosErrores[`ingrediente_${indiceOriginal}`] = 'Debe seleccionar un ingrediente';
      }
      if (ingrediente.cantidad <= 0) {
        nuevosErrores[`cantidad_${indiceOriginal}`] = 'La cantidad debe ser mayor a 0';
      }
    });

    console.log('🔍 Errores encontrados en validación:', nuevosErrores);
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (campo, valor) => {
    if (campo.includes('.')) {
      const [objetoPadre, campohijo] = campo.split('.');
      setFormData(prev => ({
        ...prev,
        [objetoPadre]: {
          ...prev[objetoPadre],
          [campohijo]: valor
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [campo]: valor
      }));
    }

    // Limpiar error del campo modificado
    if (errores[campo]) {
      setErrores(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  const agregarIngrediente = () => {
    setFormData(prev => ({
      ...prev,
      ingredientes: [
        ...prev.ingredientes,
        {
          ingrediente: '',
          cantidad: 0,
          unidadMedida: 'gr'
        }
      ]
    }));
  };

  const actualizarIngrediente = (index, campo, valor) => {
    const nuevosIngredientes = [...formData.ingredientes];
    
    if (campo === 'cantidad') {
      nuevosIngredientes[index][campo] = parseFloat(valor) || 0;
    } else {
      nuevosIngredientes[index][campo] = valor;
    }
    
    setFormData(prev => ({
      ...prev,
      ingredientes: nuevosIngredientes
    }));

    // Limpiar errores de ese ingrediente específico
    const errorKey = `${campo}_${index}`;
    if (errores[errorKey]) {
      setErrores(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const eliminarIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== index)
    }));
  };

  const calcularCostoTotal = () => {
    return formData.ingredientes.reduce((total, ingrediente) => {
      const info = obtenerIngredienteInfo(ingrediente.ingrediente);
      const precioUnitario = info?.precioUnitario || 0;
      return total + (ingrediente.cantidad * precioUnitario);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando envío del formulario...');
    console.log('📊 Datos del formulario:', formData);
    
    if (!validarFormulario()) {
      console.log('❌ Validación falló');
      return;
    }

    setEnviando(true);

    try {
      // Crear una copia de los datos del formulario
      const datosFormulario = { ...formData };
      
      console.log('🔍 Procesando ingredientes...');
      console.log('📋 Ingredientes originales:', datosFormulario.ingredientes);

      // FILTRAR SOLO INGREDIENTES QUE TIENEN DATOS VÁLIDOS
      const ingredientesValidos = datosFormulario.ingredientes.filter(ing => {
        const esValido = ing.ingrediente && ing.cantidad > 0;
        console.log(`🧪 Ingrediente ${ing.ingrediente || 'sin seleccionar'}: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'} (cantidad: ${ing.cantidad})`);
        return esValido;
      });

      console.log('✅ Ingredientes válidos filtrados:', ingredientesValidos);

      if (ingredientesValidos.length === 0) {
        throw new Error('No hay ingredientes válidos para procesar');
      }

      const datosLimpios = {
        nombre: datosFormulario.nombre,
        productoReferencia: datosFormulario.productoReferencia, // Incluir referencia del producto
        descripcion: datosFormulario.descripcion,
        categoria: datosFormulario.categoria, // Campo requerido por el modelo
        ingredientes: ingredientesValidos.map(ing => ({
          ingrediente: ing.ingrediente,
          cantidad: Number(ing.cantidad),
          unidadMedida: ing.unidadMedida
        })),
        activo: datosFormulario.activo,
        consumirIngredientes: datosFormulario.consumirIngredientes,
        rendimiento: {
          cantidad: Number(datosFormulario.rendimiento.cantidad),
          unidadMedida: datosFormulario.rendimiento.unidadMedida
        },
        tiempoPreparacion: Number(datosFormulario.tiempoPreparacion)
      };

      console.log('🚀 Enviando datos limpios al backend:', datosLimpios);
      console.log('📞 Llamando a onGuardar...');
      
      await onGuardar(datosLimpios);
      console.log('✅ onGuardar completado exitosamente');
      
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      alert(`Error: ${error.message || error}`);
    } finally {
      console.log('🏁 Finalizando envío...');
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="text-xl font-semibold text-gray-900">
              {receta ? 'Editar Receta' : 'Nueva Receta'} 
              <span className="text-xs text-blue-500 ml-2">(v2.0 - Con Selector de Catálogo)</span>
            </h3>
            <button
              type="button"
              onClick={onCancelar}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* COLUMNA IZQUIERDA - Información Básica */}
              <div className="space-y-6 overflow-y-auto pr-2">
                {/* Información Básica */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-4">Información Básica</h4>
                  <div className="space-y-4">
                    
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
                            {producto.codigo} - {producto.nombre}
                          </option>
                        ))}
                      </select>
                      {errores.productoReferencia && (
                        <p className="mt-1 text-sm text-red-600">{errores.productoReferencia}</p>
                      )}

                      {/* Vista previa del producto seleccionado */}
                      {productoSeleccionado && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">📝</span>
                            <div>
                              <div className="font-medium text-blue-800">{productoSeleccionado.nombre}</div>
                              <div className="text-sm text-blue-600">
                                {productoSeleccionado.codigo} • Módulo: Recetas
                              </div>
                              {productoSeleccionado.descripcion && (
                                <div className="text-sm text-blue-600 mt-1">
                                  {productoSeleccionado.descripcion}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiempo de Preparación (minutos)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.tiempoPreparacion}
                        onChange={(e) => handleChange('tiempoPreparacion', parseInt(e.target.value) || 0)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Descripción de la receta (opcional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Rendimiento */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-4">Rendimiento</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.rendimiento.cantidad}
                        onChange={(e) => handleChange('rendimiento.cantidad', parseFloat(e.target.value) || 0)}
                        className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          errores.rendimiento ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errores.rendimiento && (
                        <p className="mt-1 text-sm text-red-600">{errores.rendimiento}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad de Medida *
                      </label>
                      <select
                        value={formData.rendimiento.unidadMedida}
                        onChange={(e) => handleChange('rendimiento.unidadMedida', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {unidadesMedida.map(unidad => (
                          <option key={unidad.value} value={unidad.value}>
                            {unidad.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-white rounded border">
                    <p className="text-sm text-gray-600">
                      <strong>Consumir ingredientes:</strong>{' '}
                      <span className={formData.consumirIngredientes ? 'text-green-600' : 'text-red-600'}>
                        {formData.consumirIngredientes ? 'Sí' : 'No'}
                      </span>
                      <br/>
                      <small className="text-xs text-gray-500">
                        {formData.consumirIngredientes 
                          ? 'Los ingredientes se descontarán del inventario al crear esta receta' 
                          : 'Los ingredientes NO se descontarán del inventario (solo para edición)'
                        }
                      </small>
                    </p>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA - Ingredientes */}
              <div className="space-y-6 overflow-y-auto pr-2">
                <div className="bg-green-50 p-4 rounded-lg h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {formData.ingredientes.filter(ing => ing.ingrediente && ing.cantidad > 0).length}
                      </span>
                      Ingredientes
                    </h4>
                    <button
                      type="button"
                      onClick={agregarIngrediente}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors shadow-sm"
                    >
                      ➕ Agregar
                    </button>
                  </div>

                  {errores.ingredientes && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-lg">
                      <p className="text-sm text-red-800 flex items-center gap-2">
                        ⚠️ {errores.ingredientes}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {formData.ingredientes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🍳</div>
                        <p className="text-sm">No hay ingredientes agregados</p>
                        <p className="text-xs text-gray-400 mt-1">Presiona "Agregar" para comenzar</p>
                      </div>
                    ) : (
                      formData.ingredientes.map((ingrediente, index) => (
                        <div key={index} className="bg-white border-l-4 border-green-400 p-3 rounded-lg shadow-sm">
                          <div className="space-y-3">
                            {/* Selector de ingrediente */}
                            <div>
                              <select
                                value={ingrediente.ingrediente}
                                onChange={(e) => actualizarIngrediente(index, 'ingrediente', e.target.value)}
                                className={`w-full p-2 text-sm border rounded-lg focus:ring-green-500 focus:border-green-500 ${
                                  errores[`ingrediente_${index}`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loadingIngredientes}
                              >
                                <option value="">
                                  {loadingIngredientes ? '⏳ Cargando...' : '🔍 Seleccionar ingrediente'}
                                </option>
                                {ingredientesDisponibles.map(ing => (
                                  <option key={ing._id} value={ing._id}>
                                    🥬 {ing.nombre} ({ing.cantidad} {ing.unidadMedida} disponibles)
                                  </option>
                                ))}
                              </select>
                              {errores[`ingrediente_${index}`] && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                  ❌ {errores[`ingrediente_${index}`]}
                                </p>
                              )}
                            </div>

                            {/* Cantidad y unidad en una sola fila */}
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={ingrediente.cantidad}
                                  onChange={(e) => actualizarIngrediente(index, 'cantidad', e.target.value)}
                                  className={`w-full p-2 text-sm border rounded-lg focus:ring-green-500 focus:border-green-500 ${
                                    errores[`cantidad_${index}`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="0.00"
                                />
                                {errores[`cantidad_${index}`] && (
                                  <p className="mt-1 text-xs text-red-600">❌ {errores[`cantidad_${index}`]}</p>
                                )}
                              </div>
                              
                              <div className="w-20">
                                <select
                                  value={ingrediente.unidadMedida}
                                  onChange={(e) => actualizarIngrediente(index, 'unidadMedida', e.target.value)}
                                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                >
                                  {unidadesMedida.map(unidad => (
                                    <option key={unidad.value} value={unidad.value}>
                                      {unidad.value}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => eliminarIngrediente(index)}
                                className="px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar ingrediente"
                              >
                                🗑️
                              </button>
                            </div>

                            {/* Información del ingrediente */}
                            {ingrediente.ingrediente && (
                              <div className="bg-gray-50 p-2 rounded text-xs">
                                {(() => {
                                  const info = obtenerIngredienteInfo(ingrediente.ingrediente);
                                  const costo = (ingrediente.cantidad * (info?.precioUnitario || 0));
                                  return info ? (
                                    <div className="flex justify-between items-center text-gray-600">
                                      <span>💰 S/.{info.precioUnitario || 0} por {info.unidadMedida}</span>
                                      <span className="font-semibold text-green-600">= S/.{costo.toFixed(2)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">ℹ️ Información no disponible</span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Resumen de costos mejorado */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          💰 <strong>Costo total estimado:</strong>
                        </span>
                        <span className="text-lg font-bold text-green-600">S/.{calcularCostoTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          📊 Costo por unidad:
                        </span>
                        <span className="font-semibold">
                          S/.{formData.rendimiento.cantidad > 0 ? (calcularCostoTotal() / formData.rendimiento.cantidad).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                        🏭 Rendimiento: {formData.rendimiento.cantidad} {formData.rendimiento.unidadMedida}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={onCancelar}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={enviando}
              >
                {enviando ? 'Guardando...' : (receta ? 'Actualizar Receta' : 'Crear Receta')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioReceta;
