import React, { useState, useEffect } from 'react';
import { ingredienteService } from '../../../services/ingredienteService';

const FormularioReceta = ({ receta, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: receta?.nombre || '',
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
    
    // Inicializar con un ingrediente vacío si no hay ninguno
    if (formData.ingredientes.length === 0) {
      agregarIngrediente();
    }
  }, []);

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

  const obtenerIngredienteInfo = (ingredienteId) => {
    return ingredientesDisponibles.find(ing => ing._id === ingredienteId);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

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
      const [padre, hijo] = campo.split('.');
      setFormData(prev => ({
        ...prev,
        [padre]: {
          ...prev[padre],
          [hijo]: valor
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [campo]: valor
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

  const actualizarIngredienteNuevo = (campo, valor) => {
    setFormData(prev => {
      const nuevosIngredientes = [...prev.ingredientes];
      const ultimoIndex = nuevosIngredientes.length - 1;
      
      if (ultimoIndex >= 0) {
        nuevosIngredientes[ultimoIndex] = {
          ...nuevosIngredientes[ultimoIndex],
          [campo]: valor
        };
      }
      
      return {
        ...prev,
        ingredientes: nuevosIngredientes
      };
    });
  };

  const confirmarIngrediente = () => {
    const ultimoIngrediente = formData.ingredientes[formData.ingredientes.length - 1];
    
    if (!ultimoIngrediente.ingrediente || ultimoIngrediente.cantidad <= 0) {
      alert('Por favor selecciona un ingrediente y una cantidad válida');
      return;
    }

    // LIMPIAR INGREDIENTES VACÍOS DEL ARRAY
    const ingredientesLimpios = formData.ingredientes.filter(ing => 
      ing.ingrediente && ing.cantidad > 0
    );
    
    // ACTUALIZAR CON INGREDIENTES LIMPIOS
    setFormData(prev => ({
      ...prev,
      ingredientes: ingredientesLimpios
    }));

    // Limpiar errores relacionados con el último ingrediente
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      const ultimoIndex = formData.ingredientes.length - 1;
      delete nuevosErrores[`ingrediente_${ultimoIndex}`];
      delete nuevosErrores[`cantidad_${ultimoIndex}`];
      return nuevosErrores;
    });

    console.log('✅ Ingrediente confirmado y array limpiado:', ingredientesLimpios);
  };

  const cancelarUltimoIngrediente = () => {
    // REMOVER TODOS LOS INGREDIENTES VACÍOS, NO SOLO EL ÚLTIMO
    const ingredientesLimpios = formData.ingredientes.filter(ing => 
      ing.ingrediente && ing.cantidad > 0
    );
    
    setFormData(prev => ({
      ...prev,
      ingredientes: ingredientesLimpios
    }));

    console.log('🗑️ Ingredientes vacíos eliminados, ingredientes restantes:', ingredientesLimpios);
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
    console.log('🎯 handleSubmit iniciado');
    e.preventDefault();
    
    // LIMPIAR INGREDIENTES VACÍOS ANTES DE LA VALIDACIÓN
    const ingredientesLimpios = formData.ingredientes.filter(ing => 
      ing.ingrediente && ing.cantidad > 0
    );
    
    console.log('🧹 Ingredientes después de limpiar:', ingredientesLimpios);
    
    // ACTUALIZAR EL FORM DATA CON INGREDIENTES LIMPIOS
    const formDataLimpio = {
      ...formData,
      ingredientes: ingredientesLimpios
    };
    
    console.log('📋 FormData limpio:', formDataLimpio);
    
    // MOSTRAR DETALLES DEL FORM DATA
    console.log('🔍 DETALLES DEL FORMULARIO:');
    console.log('  - Nombre:', `"${formDataLimpio.nombre}"`);
    console.log('  - Descripción:', `"${formDataLimpio.descripcion}"`);
    console.log('  - Categoría:', formDataLimpio.categoria);
    console.log('  - Ingredientes:', formDataLimpio.ingredientes);
    console.log('  - Rendimiento:', formDataLimpio.rendimiento);
    console.log('  - Tiempo de preparación:', formDataLimpio.tiempoPreparacion);
    
    // TEMPORALMENTE ACTUALIZAR EL STATE PARA LA VALIDACIÓN
    setFormData(formDataLimpio);
    
    // ESPERAR UN TICK PARA QUE SE ACTUALICE EL STATE
    setTimeout(() => {
      const validacionExitosa = validarFormulario();
      console.log('✅ Validación exitosa:', validacionExitosa);
      console.log('❌ Errores de validación:', errores);
      
      // MOSTRAR LOS ERRORES ESPECÍFICOS EN DETALLE
      if (Object.keys(errores).length > 0) {
        console.log('🔍 ERRORES ESPECÍFICOS:');
        Object.entries(errores).forEach(([campo, mensaje]) => {
          console.log(`  - ${campo}: ${mensaje}`);
        });
      }
      
      if (!validacionExitosa) {
        console.log('🚫 Validación falló, deteniendo envío');
        alert(`❌ Errores de validación encontrados:\n${Object.entries(errores).map(([campo, mensaje]) => `- ${mensaje}`).join('\n')}`);
        return;
      }

      procesarEnvio(formDataLimpio);
    }, 10);
  };

  const procesarEnvio = async (datosFormulario) => {
    setEnviando(true);
    console.log('📤 Iniciando envío...');
    
    try {
      // Filtrar ingredientes válidos (redundante pero seguro)
      const ingredientesValidos = datosFormulario.ingredientes.filter(ing => 
        ing.ingrediente && 
        ing.cantidad > 0 && 
        ing.unidadMedida
      );

      console.log('🧪 Ingredientes válidos finales:', ingredientesValidos);

      if (ingredientesValidos.length === 0) {
        alert('Debe agregar al menos un ingrediente válido');
        setEnviando(false);
        return;
      }

      const datosLimpios = {
        nombre: datosFormulario.nombre.trim(),
        descripcion: datosFormulario.descripcion.trim(),
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
              <span className="text-xs text-blue-500 ml-2">(v2.0 - Sin Categorías)</span>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                        className={`w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
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
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-4">Rendimiento</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.rendimiento.cantidad}
                        onChange={(e) => handleChange('rendimiento', {
                          ...formData.rendimiento,
                          cantidad: parseFloat(e.target.value) || 1
                        })}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad de Medida *
                      </label>
                      <select
                        value={formData.rendimiento.unidadMedida}
                        onChange={(e) => handleChange('rendimiento', {
                          ...formData.rendimiento,
                          unidadMedida: e.target.value
                        })}
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

                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      id="consumirIngredientes"
                      checked={formData.consumirIngredientes}
                      onChange={(e) => handleChange('consumirIngredientes', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="consumirIngredientes" className="ml-2 text-sm text-gray-700">
                      Consumir ingredientes del inventario al crear la receta
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Los ingredientes se descontarán del inventario y se agregará la cantidad producida al inventario de la receta
                  </p>
                </div>
              </div>

              {/* COLUMNA DERECHA - Ingredientes */}
              <div className="space-y-6 overflow-y-auto pr-2">
                <div className="bg-green-50 p-4 rounded-lg h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-700">Ingredientes</h4>
                    <span className="text-sm text-gray-500">
                      {formData.ingredientes.filter(ing => ing.ingrediente && ing.cantidad > 0).length} ingredientes agregados
                    </span>
                  </div>

                  {errores.ingredientes && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{errores.ingredientes}</p>
                    </div>
                  )}

                  {/* FORMULARIO PARA AGREGAR NUEVO INGREDIENTE */}
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-green-300 mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar Ingrediente
                    </h5>
                    
                    {loadingIngredientes ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent"></div>
                        <span className="ml-2 text-gray-600 text-sm">Cargando ingredientes...</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Selector de ingrediente */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Ingrediente *
                          </label>
                          <select
                            value={formData.ingredientes[formData.ingredientes.length - 1]?.ingrediente || ''}
                            onChange={(e) => actualizarIngredienteNuevo('ingrediente', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            disabled={loadingIngredientes}
                          >
                            <option value="">Seleccionar ingrediente...</option>
                            {ingredientesDisponibles.map(ingredienteItem => (
                              <option key={ingredienteItem._id} value={ingredienteItem._id}>
                                {ingredienteItem.nombre} ({ingredienteItem.cantidad} {ingredienteItem.unidadMedida} disponibles)
                              </option>
                            ))}
                          </select>
                          {ingredientesDisponibles.length === 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                              ⚠️ No hay ingredientes disponibles. Primero debe crear ingredientes.
                            </p>
                          )}
                        </div>

                        {/* Cantidad y Unidad */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.ingredientes[formData.ingredientes.length - 1]?.cantidad || 0}
                              onChange={(e) => actualizarIngredienteNuevo('cantidad', parseFloat(e.target.value) || 0)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Unidad
                            </label>
                            <select
                              value={formData.ingredientes[formData.ingredientes.length - 1]?.unidadMedida || 'gr'}
                              onChange={(e) => actualizarIngredienteNuevo('unidadMedida', e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            >
                              {unidadesMedida.map(unidad => (
                                <option key={unidad.value} value={unidad.value}>
                                  {unidad.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Botones de acción para el nuevo ingrediente */}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={confirmarIngrediente}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={cancelarUltimoIngrediente}
                            className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                            title="Cancelar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TABLA DE INGREDIENTES AGREGADOS */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Lista de Ingredientes
                    </h5>

                    <div className="flex-1 overflow-y-auto">
                      {formData.ingredientes.filter(ing => ing.ingrediente && ing.cantidad > 0).length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                          <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-sm">No hay ingredientes agregados</p>
                          <p className="text-xs text-gray-400">Los ingredientes aparecerán aquí una vez agregados</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-700">Ingrediente</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700">Cantidad</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700">Unidad</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {formData.ingredientes
                                .map((ingrediente, index) => {
                                  const ingredienteInfo = obtenerIngredienteInfo(ingrediente.ingrediente);
                                  if (!ingrediente.ingrediente || ingrediente.cantidad <= 0) return null;
                                  
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-600">
                                        {formData.ingredientes.filter((ing, i) => i <= index && ing.ingrediente && ing.cantidad > 0).length}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="flex flex-col">
                                          <span className="font-medium text-gray-900">
                                            {ingredienteInfo?.nombre || 'Ingrediente no encontrado'}
                                          </span>
                                          {ingredienteInfo && (
                                            <span className="text-xs text-gray-500">
                                              {ingredienteInfo.cantidad} {ingredienteInfo.unidadMedida} disponibles
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <span className="font-medium text-gray-900">
                                          {ingrediente.cantidad}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <span className="text-gray-600">
                                          {unidadesMedida.find(u => u.value === ingrediente.unidadMedida)?.label || ingrediente.unidadMedida}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => eliminarIngrediente(index)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                          title="Eliminar ingrediente"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                                .filter(Boolean)}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Botón para agregar otro ingrediente */}
                    <div className="mt-4 pt-3 border-t border-green-200">
                      <button
                        type="button"
                        onClick={agregarIngrediente}
                        disabled={loadingIngredientes || (formData.ingredientes.length > 0 && (!formData.ingredientes[formData.ingredientes.length - 1]?.ingrediente || formData.ingredientes[formData.ingredientes.length - 1]?.cantidad <= 0))}
                        className="w-full bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar Otro Ingrediente
                      </button>
                    </div>
                  </div>
                  
                  {/* Botones de acción principal */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-green-200">
                    <button
                      type="button"
                      onClick={onCancelar}
                      disabled={enviando}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {enviando ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {receta ? 'Actualizar Receta' : 'Crear Receta'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioReceta;
