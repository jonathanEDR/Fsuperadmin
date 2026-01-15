import React, { useState, useEffect } from 'react';
import '../../../styles/modal-protection.css';
import { ingredienteService } from '../../../services/ingredienteService';
import { recetaService } from '../../../services/recetaService';
import catalogoProduccionService from '../../../services/catalogoProduccion';

// 🎯 MEJORADO: Componente de buscador de ingredientes Y recetas
const BuscadorIngredientesYRecetas = ({
  ingredientesDisponibles,
  recetasDisponibles = [],
  onAgregar,
  loadingIngredientes,
  loadingRecetas = false,
  itemsSeleccionados = [],
  recetaActualId = null // Para evitar agregar la receta que estamos editando
}) => {
  const [tipoItem, setTipoItem] = useState('ingrediente'); // 'ingrediente' o 'receta'
  const [termino, setTermino] = useState('');
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
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

  // Filtrar items según el tipo seleccionado
  const itemsFiltrados = tipoItem === 'ingrediente'
    ? ingredientesDisponibles.filter(ing => {
        const yaSeleccionado = itemsSeleccionados.some(
          selected => selected.tipo === 'ingrediente' && selected.ingrediente === ing._id
        );
        const coincideTermino = ing.nombre.toLowerCase().includes(termino.toLowerCase());
        return !yaSeleccionado && (termino === '' || coincideTermino);
      }).slice(0, 5)
    : recetasDisponibles.filter(rec => {
        // Excluir la receta actual para evitar ciclos
        if (recetaActualId && rec._id === recetaActualId) return false;
        const yaSeleccionado = itemsSeleccionados.some(
          selected => selected.tipo === 'receta' && selected.receta === rec._id
        );
        const coincideTermino = rec.nombre.toLowerCase().includes(termino.toLowerCase());
        return !yaSeleccionado && (termino === '' || coincideTermino);
      }).slice(0, 5);

  // Cambiar unidad por defecto según el tipo
  const handleTipoChange = (nuevoTipo) => {
    setTipoItem(nuevoTipo);
    setTermino('');
    setItemSeleccionado(null);
    setCantidad('');
    setUnidad(nuevoTipo === 'receta' ? 'unidad' : 'gr');
  };

  const seleccionarItem = (item) => {
    setItemSeleccionado(item);
    setTermino(item.nombre);
    setMostrarSugerencias(false);
    // Sugerir unidad de medida del item
    if (tipoItem === 'ingrediente' && item.unidadMedida) {
      setUnidad(item.unidadMedida);
    } else if (tipoItem === 'receta' && item.rendimiento?.unidadMedida) {
      setUnidad(item.rendimiento.unidadMedida);
    }
  };

  const agregarItem = () => {
    if (itemSeleccionado && cantidad && parseFloat(cantidad) > 0) {
      const nuevoItem = {
        tipo: tipoItem,
        cantidad: parseFloat(cantidad),
        unidadMedida: unidad
      };

      if (tipoItem === 'ingrediente') {
        nuevoItem.ingrediente = itemSeleccionado._id;
      } else {
        nuevoItem.receta = itemSeleccionado._id;
      }

      onAgregar(nuevoItem);

      // Limpiar formulario
      setTermino('');
      setItemSeleccionado(null);
      setCantidad('');
      setUnidad(tipoItem === 'receta' ? 'unidad' : 'gr');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (itemsFiltrados.length === 1 && !itemSeleccionado) {
        seleccionarItem(itemsFiltrados[0]);
      } else if (itemSeleccionado && cantidad) {
        agregarItem();
      }
    }
  };

  const isLoading = tipoItem === 'ingrediente' ? loadingIngredientes : loadingRecetas;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        🔍 Agregar Ingrediente o Receta
      </h5>

      {/* Selector de tipo */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => handleTipoChange('ingrediente')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${tipoItem === 'ingrediente'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          🥬 Ingrediente
        </button>
        <button
          type="button"
          onClick={() => handleTipoChange('receta')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${tipoItem === 'receta'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          📋 Receta
        </button>
      </div>

      <div className="grid grid-cols-12 gap-3 items-end">
        {/* Buscador */}
        <div className="col-span-6 relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {tipoItem === 'ingrediente' ? 'Ingrediente' : 'Receta'}
          </label>
          <input
            type="text"
            value={termino}
            onChange={(e) => {
              setTermino(e.target.value);
              setMostrarSugerencias(true);
              if (e.target.value === '') {
                setItemSeleccionado(null);
              }
            }}
            onFocus={() => setMostrarSugerencias(true)}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
            onKeyDown={handleKeyDown}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 bg-white
              ${tipoItem === 'ingrediente'
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : 'border-purple-300 focus:ring-purple-500 focus:border-purple-500'}`}
            placeholder={isLoading ? "Cargando..." : `Buscar ${tipoItem}...`}
            disabled={isLoading}
          />

          {/* Sugerencias */}
          {mostrarSugerencias && itemsFiltrados.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {itemsFiltrados.map(item => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => seleccionarItem(item)}
                  className={`w-full px-3 py-2 text-left text-sm border-b border-gray-100 last:border-b-0 transition-colors
                    ${tipoItem === 'ingrediente' ? 'hover:bg-green-50' : 'hover:bg-purple-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-900 flex items-center gap-1">
                        {tipoItem === 'ingrediente' ? '🥬' : '📋'} {item.nombre}
                      </span>
                      {tipoItem === 'ingrediente' ? (
                        <p className="text-xs text-gray-500 mt-0.5">
                          S/.{item.precioUnitario || 0} por {item.unidadMedida}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Rinde: {item.rendimiento?.cantidad || 0} {item.rendimiento?.unidadMedida || 'un'}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded
                      ${tipoItem === 'ingrediente' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {tipoItem === 'ingrediente'
                        ? `${item.cantidad || 0} ${item.unidadMedida}`
                        : `Disp: ${(item.inventario?.cantidadProducida || 0) - (item.inventario?.cantidadUtilizada || 0)}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensaje si no hay items */}
          {mostrarSugerencias && termino && itemsFiltrados.length === 0 && !isLoading && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl p-3">
              <p className="text-sm text-gray-500 text-center">
                No se encontraron {tipoItem === 'ingrediente' ? 'ingredientes' : 'recetas'}
              </p>
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
            onKeyDown={handleKeyDown}
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
            onClick={agregarItem}
            disabled={!itemSeleccionado || !cantidad || parseFloat(cantidad) <= 0}
            className={`w-full py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1
              ${tipoItem === 'ingrediente' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Item seleccionado preview */}
      {itemSeleccionado && termino && (
        <div className={`mt-3 p-2 rounded-lg border
          ${tipoItem === 'ingrediente' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'}`}>
          <p className={`text-xs ${tipoItem === 'ingrediente' ? 'text-green-700' : 'text-purple-700'}`}>
            {tipoItem === 'ingrediente' ? '🥬' : '📋'} <strong>{termino}</strong> seleccionado
            {cantidad && ` - ${cantidad} ${unidad}`}
          </p>
        </div>
      )}
    </div>
  );
};

// 🎯 MEJORADO: Lista compacta de ingredientes Y recetas
const ListaItemsCompacta = ({
  items = [],
  ingredientesDisponibles = [],
  recetasDisponibles = [],
  onEliminar,
  onActualizar,
  rendimientoCantidad = 1
}) => {
  const obtenerIngredienteInfo = (ingredienteId) => {
    return ingredientesDisponibles.find(ing => ing._id === ingredienteId);
  };

  const obtenerRecetaInfo = (recetaId) => {
    return recetasDisponibles.find(rec => rec._id === recetaId);
  };

  const calcularCostoItem = (item) => {
    if (item.tipo === 'receta') {
      // Estimación simple: el costo de la receta anidada se calculará en backend
      // Aquí mostramos "Por calcular" o un valor aproximado si tenemos historial
      return null; // Se calculará dinámicamente
    } else {
      const info = obtenerIngredienteInfo(item.ingrediente);
      return item.cantidad * (info?.precioUnitario || 0);
    }
  };

  const calcularCostoTotalIngredientes = () => {
    return items.reduce((total, item) => {
      if (item.tipo !== 'receta') {
        const info = obtenerIngredienteInfo(item.ingrediente);
        return total + (item.cantidad * (info?.precioUnitario || 0));
      }
      return total;
    }, 0);
  };

  const contarPorTipo = () => {
    const ingredientes = items.filter(i => i.tipo !== 'receta').length;
    const recetas = items.filter(i => i.tipo === 'receta').length;
    return { ingredientes, recetas };
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
        <div className="text-3xl mb-2">🍳</div>
        <p className="text-sm">No hay ingredientes agregados</p>
      </div>
    );
  }

  const conteo = contarPorTipo();

  return (
    <div className="space-y-2">
      {/* Contadores */}
      <div className="flex gap-2 mb-2">
        {conteo.ingredientes > 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            🥬 {conteo.ingredientes} ingrediente{conteo.ingredientes !== 1 ? 's' : ''}
          </span>
        )}
        {conteo.recetas > 0 && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            📋 {conteo.recetas} receta{conteo.recetas !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {items.map((item, index) => {
        const esReceta = item.tipo === 'receta';
        const info = esReceta
          ? obtenerRecetaInfo(item.receta)
          : obtenerIngredienteInfo(item.ingrediente);
        const costo = calcularCostoItem(item);

        return (
          <div
            key={index}
            className={`bg-white border rounded-lg p-2 flex items-center gap-2
              ${esReceta ? 'border-purple-200' : 'border-gray-200'}`}
          >
            {/* Icono de tipo */}
            <span className="text-lg" title={esReceta ? 'Receta' : 'Ingrediente'}>
              {esReceta ? '📋' : '🥬'}
            </span>

            {/* Nombre del item */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate
                ${esReceta ? 'text-purple-900' : 'text-gray-900'}`}>
                {info?.nombre || (esReceta ? 'Receta no encontrada' : 'Ingrediente no encontrado')}
              </p>
              <p className="text-xs text-gray-500">
                {esReceta
                  ? `Rinde: ${info?.rendimiento?.cantidad || 0} ${info?.rendimiento?.unidadMedida || 'un'}`
                  : `Disponible: ${info?.cantidad || 0} ${info?.unidadMedida || ''}`}
              </p>
            </div>

            {/* Cantidad editable */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={item.cantidad}
                onChange={(e) => onActualizar(index, 'cantidad', parseFloat(e.target.value) || 0)}
                className={`w-16 px-1 py-1 text-xs border rounded focus:ring-2
                  ${esReceta
                    ? 'border-purple-300 focus:ring-purple-500 focus:border-purple-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                step="0.01"
                min="0"
              />
              <span className="text-xs text-gray-600 w-8">{item.unidadMedida}</span>
            </div>

            {/* Costo */}
            <div className="text-right min-w-[60px]">
              {esReceta ? (
                <p className="text-xs text-purple-600 italic">Sub-receta</p>
              ) : (
                <p className="text-xs font-medium text-green-600">
                  S/.{(costo || 0).toFixed(2)}
                </p>
              )}
            </div>

            {/* Botón eliminar */}
            <button
              type="button"
              onClick={() => onEliminar(index)}
              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
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
            Costo ingredientes:
          </span>
          <span className="text-sm font-bold text-green-800">
            S/.{calcularCostoTotalIngredientes().toFixed(2)}
          </span>
        </div>
        {conteo.recetas > 0 && (
          <p className="text-xs text-purple-600 mt-1">
            + Costo de {conteo.recetas} sub-receta{conteo.recetas !== 1 ? 's' : ''} (calculado al guardar)
          </p>
        )}
        <div className="flex justify-between items-center mt-1 pt-1 border-t border-green-200">
          <span className="text-xs text-green-600">Costo por unidad (aprox):</span>
          <span className="text-xs text-green-700">
            S/.{(calcularCostoTotalIngredientes() / Math.max(1, rendimientoCantidad)).toFixed(2)}
          </span>
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
  const [recetasDisponibles, setRecetasDisponibles] = useState([]); // 🎯 NUEVO: Recetas para anidar
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [loadingIngredientes, setLoadingIngredientes] = useState(true);
  const [loadingRecetas, setLoadingRecetas] = useState(true); // 🎯 NUEVO

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
    cargarRecetasDisponibles(); // 🎯 NUEVO: Cargar recetas para anidar
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

  // 🎯 NUEVO: Cargar recetas disponibles para anidar
  const cargarRecetasDisponibles = async () => {
    try {
      setLoadingRecetas(true);
      // Obtener recetas activas que pueden ser usadas como sub-recetas
      const response = await recetaService.obtenerRecetas({ activo: true });
      // Filtrar la receta actual si estamos editando (para evitar ciclos)
      const recetasFiltradas = (response.data || []).filter(r => {
        // Si estamos editando, excluir la receta actual
        if (receta?._id && r._id === receta._id) return false;
        // Solo incluir recetas que tengan inventario o estén completadas
        return true;
      });
      setRecetasDisponibles(recetasFiltradas);
    } catch (error) {
      console.error('Error al cargar recetas disponibles:', error);
      setRecetasDisponibles([]);
    } finally {
      setLoadingRecetas(false);
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

    // 🎯 MEJORADO: Filtrar items (ingredientes o recetas) que tienen datos válidos
    const itemsConDatos = formData.ingredientes.filter(item => {
      const tipoItem = item.tipo || 'ingrediente';
      if (tipoItem === 'receta') {
        return item.receta || item.cantidad > 0;
      }
      return item.ingrediente || item.cantidad > 0;
    });

    console.log('🧪 Items con datos para validar:', itemsConDatos);

    if (itemsConDatos.length === 0) {
      nuevosErrores.ingredientes = 'Debe agregar al menos un ingrediente o receta';
    }

    // 🎯 MEJORADO: Validar cada item según su tipo
    itemsConDatos.forEach((item) => {
      const indiceOriginal = formData.ingredientes.findIndex(ing => ing === item);
      const tipoItem = item.tipo || 'ingrediente';

      if (tipoItem === 'receta') {
        if (!item.receta) {
          nuevosErrores[`receta_${indiceOriginal}`] = 'Debe seleccionar una receta';
        }
      } else {
        if (!item.ingrediente) {
          nuevosErrores[`ingrediente_${indiceOriginal}`] = 'Debe seleccionar un ingrediente';
        }
      }

      if (item.cantidad <= 0) {
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

  // 🎯 Función para agregar item (ingrediente o receta) desde el buscador
  const agregarIngredienteDesdeBuscador = (nuevoItem) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: [...prev.ingredientes, nuevoItem]
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

      console.log('🔍 Procesando items (ingredientes y recetas)...');
      console.log('📋 Items originales:', datosFormulario.ingredientes);

      // 🎯 MEJORADO: Filtrar items válidos (ingredientes O recetas)
      const itemsValidos = datosFormulario.ingredientes.filter(item => {
        const tipoItem = item.tipo || 'ingrediente';
        if (tipoItem === 'receta') {
          const esValido = item.receta && item.cantidad > 0;
          console.log(`📋 Receta ${item.receta || 'sin seleccionar'}: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'} (cantidad: ${item.cantidad})`);
          return esValido;
        } else {
          const esValido = item.ingrediente && item.cantidad > 0;
          console.log(`🥬 Ingrediente ${item.ingrediente || 'sin seleccionar'}: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'} (cantidad: ${item.cantidad})`);
          return esValido;
        }
      });

      console.log('✅ Items válidos filtrados:', itemsValidos);

      if (itemsValidos.length === 0) {
        throw new Error('No hay ingredientes o recetas válidas para procesar');
      }

      // 🎯 MEJORADO: Mapear items con su tipo correspondiente
      const datosLimpios = {
        nombre: datosFormulario.nombre,
        productoReferencia: datosFormulario.productoReferencia,
        descripcion: datosFormulario.descripcion,
        categoria: datosFormulario.categoria,
        ingredientes: itemsValidos.map(item => {
          const tipoItem = item.tipo || 'ingrediente';
          const itemLimpio = {
            tipo: tipoItem,
            cantidad: Number(item.cantidad),
            unidadMedida: item.unidadMedida,
            notas: item.notas || ''
          };

          if (tipoItem === 'receta') {
            itemLimpio.receta = item.receta;
          } else {
            itemLimpio.ingrediente = item.ingrediente;
          }

          return itemLimpio;
        }),
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

              {/* COLUMNA DERECHA - Ingredientes y Recetas (1/2 del espacio) */}
              <div className="space-y-4 overflow-y-auto pl-2">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {formData.ingredientes.filter(item => {
                          const tipo = item.tipo || 'ingrediente';
                          return tipo === 'receta' ? (item.receta && item.cantidad > 0) : (item.ingrediente && item.cantidad > 0);
                        }).length}
                      </span>
                      Ingredientes y Recetas
                    </h4>
                  </div>

                  {errores.ingredientes && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-400 rounded-lg">
                      <p className="text-xs text-red-800 flex items-center gap-2">
                        ⚠️ {errores.ingredientes}
                      </p>
                    </div>
                  )}

                  {/* 🎯 MEJORADO: Buscador de ingredientes Y recetas */}
                  <BuscadorIngredientesYRecetas
                    ingredientesDisponibles={ingredientesDisponibles}
                    recetasDisponibles={recetasDisponibles}
                    onAgregar={agregarIngredienteDesdeBuscador}
                    loadingIngredientes={loadingIngredientes}
                    loadingRecetas={loadingRecetas}
                    itemsSeleccionados={formData.ingredientes}
                    recetaActualId={receta?._id}
                  />

                  {/* 🎯 MEJORADO: Lista compacta de ingredientes Y recetas */}
                  <div className="max-h-64 overflow-y-auto">
                    <ListaItemsCompacta
                      items={formData.ingredientes}
                      ingredientesDisponibles={ingredientesDisponibles}
                      recetasDisponibles={recetasDisponibles}
                      onEliminar={eliminarIngrediente}
                      onActualizar={actualizarIngrediente}
                      rendimientoCantidad={formData.rendimiento.cantidad}
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
