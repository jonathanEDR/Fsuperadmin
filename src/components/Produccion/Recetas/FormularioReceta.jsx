import React, { useState, useEffect } from 'react';
import '../../../styles/modal-protection.css';
import { ingredienteService } from '../../../services/ingredienteService';
import catalogoProduccionService from '../../../services/catalogoProduccion';

// 🎯 NUEVO: Componente de buscador de ingredientes
const BuscadorIngredientes = ({ 
  ingredientesDisponibles, 
  onAgregar, 
  loadingIngredientes,
  ingredientesSeleccionados = [] 
}) => {
  const [termino, setTermino] = useState('');
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('gr');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  
  const unidadesMedida = [
    { value: 'kg', label: 'kg' },
    { value: 'gr', label: 'gr' },
    { value: 'lt', label: 'lt' },
    { value: 'ml', label: 'ml' },
    { value: 'unidad', label: 'un' },
    { value: 'pieza', label: 'pz' }
  ];

  // Filtrar ingredientes disponibles que no están ya seleccionados
  const ingredientesFiltrados = ingredientesDisponibles.filter(ing => {
    const yaSeleccionado = ingredientesSeleccionados.some(selected => selected.ingrediente === ing._id);
    const coincideTermino = ing.nombre.toLowerCase().includes(termino.toLowerCase());
    return !yaSeleccionado && (termino === '' || coincideTermino);
  }).slice(0, 5); // Solo mostrar 5 sugerencias

  const seleccionarIngrediente = (ingrediente) => {
    setIngredienteSeleccionado(ingrediente._id);
    setTermino(ingrediente.nombre);
    setMostrarSugerencias(false);
  };

  const agregarIngrediente = () => {
    if (ingredienteSeleccionado && cantidad && parseFloat(cantidad) > 0) {
      onAgregar({
        ingrediente: ingredienteSeleccionado,
        cantidad: parseFloat(cantidad),
        unidadMedida: unidad
      });
      
      // Limpiar formulario
      setTermino('');
      setIngredienteSeleccionado('');
      setCantidad('');
      setUnidad('gr');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (ingredientesFiltrados.length === 1 && !ingredienteSeleccionado) {
        seleccionarIngrediente(ingredientesFiltrados[0]);
      } else if (ingredienteSeleccionado && cantidad) {
        agregarIngrediente();
      }
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        🔍 Agregar Ingrediente
      </h5>
      
      <div className="grid grid-cols-12 gap-3 items-end">
        {/* Buscador de ingrediente */}
        <div className="col-span-6 relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">Ingrediente</label>
          <input
            type="text"
            value={termino}
            onChange={(e) => {
              setTermino(e.target.value);
              setMostrarSugerencias(true);
              if (e.target.value === '') {
                setIngredienteSeleccionado('');
              }
            }}
            onFocus={() => setMostrarSugerencias(true)}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 bg-white"
            placeholder={loadingIngredientes ? "Cargando..." : "Buscar ingrediente..."}
            disabled={loadingIngredientes}
          />
          
          {/* Sugerencias mejoradas */}
          {mostrarSugerencias && ingredientesFiltrados.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-40 overflow-y-auto">
              {ingredientesFiltrados.map(ingrediente => (
                <button
                  key={ingrediente._id}
                  type="button"
                  onClick={() => seleccionarIngrediente(ingrediente)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900">{ingrediente.nombre}</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        💰 S/.{ingrediente.precioUnitario || 0} por {ingrediente.unidadMedida}
                      </p>
                    </div>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {ingrediente.cantidad} {ingrediente.unidadMedida}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cantidad */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* Unidad */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          >
            {unidadesMedida.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>

        {/* Botón agregar */}
        <div className="col-span-2">
          <button
            type="button"
            onClick={agregarIngrediente}
            disabled={!ingredienteSeleccionado || !cantidad || parseFloat(cantidad) <= 0}
            className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            ➕ Agregar
          </button>
        </div>
      </div>
      
      {/* Ingrediente seleccionado preview */}
      {ingredienteSeleccionado && termino && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700">
            ✅ <strong>{termino}</strong> seleccionado
            {cantidad && ` - ${cantidad} ${unidad}`}
          </p>
        </div>
      )}
    </div>
  );
};

// 🎯 NUEVO: Lista compacta de ingredientes
const ListaIngredientesCompacta = ({ 
  ingredientes, 
  ingredientesDisponibles, 
  onEliminar, 
  onActualizar 
}) => {
  const obtenerIngredienteInfo = (ingredienteId) => {
    return ingredientesDisponibles.find(ing => ing._id === ingredienteId);
  };

  const calcularCostoTotal = () => {
    return ingredientes.reduce((total, ing) => {
      const info = obtenerIngredienteInfo(ing.ingrediente);
      return total + (ing.cantidad * (info?.precioUnitario || 0));
    }, 0);
  };

  if (ingredientes.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
        <div className="text-3xl mb-2">🍳</div>
        <p className="text-sm">No hay ingredientes agregados</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ingredientes.map((ingrediente, index) => {
        const info = obtenerIngredienteInfo(ingrediente.ingrediente);
        const costo = ingrediente.cantidad * (info?.precioUnitario || 0);
        
        return (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-2 flex items-center gap-2">
            {/* Nombre del ingrediente */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {info?.nombre || 'Ingrediente no encontrado'}
              </p>
              <p className="text-xs text-gray-500">
                Disponible: {info?.cantidad || 0} {info?.unidadMedida}
              </p>
            </div>

            {/* Cantidad editable */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={ingrediente.cantidad}
                onChange={(e) => onActualizar(index, 'cantidad', parseFloat(e.target.value) || 0)}
                className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                step="0.01"
                min="0"
              />
              <span className="text-xs text-gray-600 w-8">{ingrediente.unidadMedida}</span>
            </div>

            {/* Costo */}
            <div className="text-right">
              <p className="text-xs font-medium text-green-600">
                S/.{costo.toFixed(2)}
              </p>
            </div>

            {/* Botón eliminar */}
            <button
              type="button"
              onClick={() => onEliminar(index)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        );
      })}
      
      {/* Total */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-700">
            Costo total estimado:
          </span>
          <span className="text-sm font-bold text-green-800">
            S/.{calcularCostoTotal().toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-green-600">Costo por unidad:</span>
          <span className="text-xs text-green-700">S/.{(calcularCostoTotal() / Math.max(1, ingredientes.length)).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

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
    consumirIngredientes: receta ? false : true // 🎯 CORRECCIÓN: Nueva receta SÍ consume, editar NO
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
    
    // 🎯 REMOVIDO: Ya no agregamos ingrediente vacío automáticamente
    // El usuario ahora usa el buscador para agregar ingredientes
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

  // 🎯 NUEVO: Función para agregar ingrediente desde el buscador
  const agregarIngredienteDesdeBuscador = (nuevoIngrediente) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: [...prev.ingredientes, nuevoIngrediente]
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center h-full w-full z-50 p-2 sm:p-4">
      {/* 🎯 PROTECCIÓN: Container con centrado perfecto y tamaños responsivos */}
      <div 
        className="modal-protection recipe-modal-protection bg-white shadow-lg rounded-md overflow-hidden border"
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          position: 'static',
          top: 'auto',
          maxHeight: '95vh'
        }}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900 m-0">
              {receta ? 'Editar Receta' : 'Nueva Receta'} 
              <span className="text-xs text-blue-500 ml-2 hidden sm:inline">(v2.0 - Con Selector de Catálogo)</span>
            </h3>
            <button
              type="button"
              onClick={onCancelar}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              style={{ fontSize: '24px', lineHeight: '1' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* COLUMNA IZQUIERDA - Información Básica (1/2 del espacio) */}
              <div className="space-y-4 overflow-y-auto pr-2">
                {/* Información Básica */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Información Básica</h4>
                  <div className="space-y-3">
                    
                    {/* Selector de Producto del Catálogo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Producto del Catálogo *
                      </label>
                      <select
                        value={formData.productoReferencia}
                        onChange={(e) => handleChange('productoReferencia', e.target.value)}
                        className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
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
                        <div className="mt-2 p-2 bg-blue-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">📝</span>
                            <div>
                              <div className="font-medium text-blue-800 text-sm">{productoSeleccionado.nombre}</div>
                              <div className="text-xs text-blue-600">
                                {productoSeleccionado.codigo} • Módulo: Recetas
                              </div>
                              {productoSeleccionado.descripcion && (
                                <div className="text-xs text-blue-600 mt-1">
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Descripción de la receta (opcional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Rendimiento */}
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Rendimiento</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-xs text-gray-600">
                      <strong>Consumir ingredientes:</strong>{' '}
                      <span className={formData.consumirIngredientes ? 'text-green-600' : 'text-red-600'}>
                        {formData.consumirIngredientes ? 'Sí' : 'No'}
                      </span>
                      <br/>
                      <small className="text-xs text-gray-500">
                        {formData.consumirIngredientes 
                          ? 'Los ingredientes se descontarán del inventario' 
                          : 'Los ingredientes NO se descontarán (solo edición)'
                        }
                      </small>
                    </p>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA - Ingredientes (1/2 del espacio) */}
              <div className="space-y-4 overflow-y-auto pl-2">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {formData.ingredientes.filter(ing => ing.ingrediente && ing.cantidad > 0).length}
                      </span>
                      Ingredientes
                    </h4>
                  </div>

                  {errores.ingredientes && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-400 rounded-lg">
                      <p className="text-xs text-red-800 flex items-center gap-2">
                        ⚠️ {errores.ingredientes}
                      </p>
                    </div>
                  )}

                  {/* Nuevo buscador compacto */}
                  <BuscadorIngredientes
                    ingredientesDisponibles={ingredientesDisponibles}
                    onAgregar={agregarIngredienteDesdeBuscador}
                    loadingIngredientes={loadingIngredientes}
                    ingredientesSeleccionados={formData.ingredientes}
                  />

                  {/* Lista compacta de ingredientes */}
                  <div className="max-h-64 overflow-y-auto">
                    <ListaIngredientesCompacta
                      ingredientes={formData.ingredientes}
                      ingredientesDisponibles={ingredientesDisponibles}
                      onEliminar={eliminarIngrediente}
                      onActualizar={actualizarIngrediente}
                    />
                  </div>

                              {/* Botones de acción - Movidos debajo de ingredientes */}
            <div className="mt-6 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancelar}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  disabled={enviando}
                >
                  {enviando ? 'Guardando...' : (receta ? 'Actualizar Receta' : 'Crear Receta')}
                </button>
              </div>
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
