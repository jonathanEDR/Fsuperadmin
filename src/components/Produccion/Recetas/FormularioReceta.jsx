import React, { useState, useEffect } from 'react';
import { ingredienteService } from '../../../services/ingredienteService';

const FormularioReceta = ({ receta, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: receta?.nombre || '',
    descripcion: receta?.descripcion || '',
    categoria: receta?.categoria || 'producto_terminado',
    tiempoPreparacion: receta?.tiempoPreparacion || 0,
    rendimiento: {
      cantidad: receta?.rendimiento?.cantidad || 1,
      unidadMedida: receta?.rendimiento?.unidadMedida || 'unidad'
    },
    ingredientes: receta?.ingredientes || [],
    activo: receta?.activo !== undefined ? receta.activo : true,
    consumirIngredientes: receta ? false : true // Para recetas nuevas, por defecto sí consumir
  });
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [loadingIngredientes, setLoadingIngredientes] = useState(true);

  const categorias = [
    { value: 'producto_terminado', label: 'Producto Terminado' },
    { value: 'producto_intermedio', label: 'Producto Intermedio' },
    { value: 'preparado', label: 'Preparado' }
  ];

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
  }, []);

  const cargarIngredientes = async () => {
    try {
      setLoadingIngredientes(true);
      const response = await ingredienteService.obtenerIngredientes({ activo: true });
      setIngredientesDisponibles(response.data);
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
    } finally {
      setLoadingIngredientes(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }

    if (formData.rendimiento.cantidad <= 0) {
      nuevosErrores.rendimiento = 'El rendimiento debe ser mayor a 0';
    }

    if (formData.ingredientes.length === 0) {
      nuevosErrores.ingredientes = 'Debe agregar al menos un ingrediente';
    }

    // Validar ingredientes
    formData.ingredientes.forEach((ingrediente, index) => {
      if (!ingrediente.ingrediente) {
        nuevosErrores[`ingrediente_${index}`] = 'Seleccione un ingrediente';
      }
      if (ingrediente.cantidad <= 0) {
        nuevosErrores[`cantidad_${index}`] = 'La cantidad debe ser mayor a 0';
      }
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (campo, valor) => {
    if (campo.includes('.')) {
      const [parent, child] = campo.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: valor
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
          unidadMedida: 'kg'
        }
      ]
    }));
  };

  const eliminarIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== index)
    }));
  };

  const actualizarIngrediente = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.map((ingrediente, i) => 
        i === index 
          ? { ...ingrediente, [campo]: valor }
          : ingrediente
      )
    }));

    // Limpiar errores relacionados
    const errorKey = `${campo}_${index}`;
    if (errores[errorKey]) {
      setErrores(prev => ({
        ...prev,
        [errorKey]: ''
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
      // Limpiar y preparar los datos antes de enviar
      const datosLimpios = {
        ...formData,
        ingredientes: formData.ingredientes.map(ingrediente => ({
          ingrediente: typeof ingrediente.ingrediente === 'object' 
            ? ingrediente.ingrediente._id 
            : ingrediente.ingrediente,
          cantidad: Number(ingrediente.cantidad),
          unidadMedida: ingrediente.unidadMedida
        })),
        rendimiento: {
          cantidad: Number(formData.rendimiento.cantidad),
          unidadMedida: formData.rendimiento.unidadMedida
        },
        tiempoPreparacion: Number(formData.tiempoPreparacion)
      };

      console.log('📝 Datos del formulario preparados:', datosLimpios);
      
      await onGuardar(datosLimpios);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setEnviando(false);
    }
  };

  const obtenerIngredienteInfo = (ingredienteId) => {
    return ingredientesDisponibles.find(ing => ing._id === ingredienteId);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[450vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {receta ? 'Editar Receta' : 'Nueva Receta'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Información Básica */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Información Básica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        errores.nombre ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nombre de la receta"
                    />
                    {errores.nombre && (
                      <p className="mt-1 text-sm text-red-600">{errores.nombre}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => handleChange('categoria', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categorias.map(categoria => (
                        <option key={categoria.value} value={categoria.value}>
                          {categoria.label}
                        </option>
                      ))}
                    </select>
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => handleChange('activo', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Activa</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => handleChange('descripcion', e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción de la receta (opcional)"
                  />
                </div>
              </div>

              {/* Rendimiento */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Rendimiento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.rendimiento.cantidad}
                      onChange={(e) => handleChange('rendimiento.cantidad', parseFloat(e.target.value) || 0)}
                      className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      {unidadesMedida.map(unidad => (
                        <option key={unidad.value} value={unidad.value}>
                          {unidad.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Opción para consumir ingredientes - solo para recetas nuevas */}
                {!receta && (
                  <div className="mt-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.consumirIngredientes}
                        onChange={(e) => handleChange('consumirIngredientes', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Consumir ingredientes del inventario al crear la receta
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.consumirIngredientes 
                        ? 'Los ingredientes se descontarán del inventario y se agregará la cantidad producida al inventario de la receta'
                        : 'Los ingredientes no se consumirán. Útil para recetas de prueba o plantillas'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Ingredientes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Ingredientes</h4>
                  <button
                    type="button"
                    onClick={agregarIngrediente}
                    disabled={loadingIngredientes}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    + Agregar Ingrediente
                  </button>
                </div>

                {errores.ingredientes && (
                  <p className="mb-3 text-sm text-red-600">{errores.ingredientes}</p>
                )}

                {loadingIngredientes ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.ingredientes.map((ingrediente, index) => {
                      const ingredienteInfo = obtenerIngredienteInfo(ingrediente.ingrediente);
                      return (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ingrediente *
                              </label>
                              <select
                                value={ingrediente.ingrediente}
                                onChange={(e) => actualizarIngrediente(index, 'ingrediente', e.target.value)}
                                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                                  errores[`ingrediente_${index}`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              >
                                <option value="">Seleccionar...</option>
                                {ingredientesDisponibles
                                  .filter(ing => (ing.cantidad - ing.procesado) > 0)
                                  .map(ing => (
                                    <option key={ing._id} value={ing._id}>
                                      {ing.nombre} ({ing.unidadMedida}) - Disponible: {ing.cantidad - ing.procesado}
                                    </option>
                                  ))}
                              </select>
                              {errores[`ingrediente_${index}`] && (
                                <p className="mt-1 text-sm text-red-600">{errores[`ingrediente_${index}`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={ingrediente.cantidad}
                                onChange={(e) => actualizarIngrediente(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                                  errores[`cantidad_${index}`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                              {errores[`cantidad_${index}`] && (
                                <p className="mt-1 text-sm text-red-600">{errores[`cantidad_${index}`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unidad
                              </label>
                              <input
                                type="text"
                                value={ingredienteInfo?.unidadMedida || ingrediente.unidadMedida}
                                readOnly
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                              />
                            </div>

                            <div>
                              <button
                                type="button"
                                onClick={() => eliminarIngrediente(index)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {ingredienteInfo && (
                            <div className="mt-2 text-xs text-gray-500">
                              Disponible: {ingredienteInfo.cantidad - ingredienteInfo.procesado} {ingredienteInfo.unidadMedida}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {formData.ingredientes.length === 0 && !loadingIngredientes && (
                  <div className="text-center py-8 text-gray-500">
                    No hay ingredientes agregados. Haz clic en "Agregar Ingrediente" para comenzar.
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 mt-6">
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
                disabled={enviando || loadingIngredientes}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {enviando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioReceta;
