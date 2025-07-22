import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';

const ModalProducirProducto = ({ isOpen, onClose, producto, onSuccess }) => {
  const [formData, setFormData] = useState({
    cantidadProducir: 1,
    operador: '',
    observaciones: '',
    ingredientesUtilizados: [],
    recetasUtilizadas: [],
    consumirRecursos: true // Flag para decidir si consumir del inventario
  });
  
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ingredientes');

  useEffect(() => {
    if (isOpen && producto) {
      resetearFormulario();
      cargarRecursos();
    }
  }, [isOpen, producto]);

  const resetearFormulario = () => {
    setFormData({
      cantidadProducir: 1,
      operador: '',
      observaciones: '',
      ingredientesUtilizados: [],
      recetasUtilizadas: [],
      consumirRecursos: true
    });
    setError('');
    setActiveTab('ingredientes');
  };

  const cargarRecursos = async () => {
    try {
      setLoading(true);
      const [ingredientesResponse, recetasResponse] = await Promise.all([
        movimientoUnificadoService.obtenerProductosPorTipo('ingredientes'),
        movimientoUnificadoService.obtenerProductosPorTipo('recetas')
      ]);
      
      // Filtrar solo ingredientes con stock disponible
      const ingredientesConStock = (ingredientesResponse.data || []).filter(
        ing => (ing.cantidad - (ing.procesado || 0)) > 0
      );
      
      // Filtrar solo recetas con stock disponible
      const recetasConStock = (recetasResponse.data || []).filter(
        rec => (rec.inventario?.cantidadProducida || 0) > 0
      );
      
      setIngredientesDisponibles(ingredientesConStock);
      setRecetasDisponibles(recetasConStock);
      
      console.log('✅ Recursos cargados:', {
        ingredientes: ingredientesConStock.length,
        recetas: recetasConStock.length
      });
      
    } catch (error) {
      console.error('Error al cargar recursos:', error);
      setError('Error al cargar ingredientes y recetas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const agregarIngrediente = () => {
    setFormData(prev => ({
      ...prev,
      ingredientesUtilizados: [
        ...prev.ingredientesUtilizados,
        {
          ingrediente: '',
          cantidadUtilizada: 0,
          costoUnitario: 0
        }
      ]
    }));
  };

  const eliminarIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredientesUtilizados: prev.ingredientesUtilizados.filter((_, i) => i !== index)
    }));
  };

  const actualizarIngrediente = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      ingredientesUtilizados: prev.ingredientesUtilizados.map((item, i) => 
        i === index ? { ...item, [campo]: valor } : item
      )
    }));
  };

  const agregarReceta = () => {
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: [
        ...prev.recetasUtilizadas,
        {
          receta: '',
          cantidadUtilizada: 0,
          costoUnitario: 0
        }
      ]
    }));
  };

  const eliminarReceta = (index) => {
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: prev.recetasUtilizadas.filter((_, i) => i !== index)
    }));
  };

  const actualizarReceta = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: prev.recetasUtilizadas.map((item, i) => 
        i === index ? { ...item, [campo]: valor } : item
      )
    }));
  };

  const obtenerIngredienteInfo = (ingredienteId) => {
    return ingredientesDisponibles.find(ing => ing._id === ingredienteId);
  };

  const obtenerRecetaInfo = (recetaId) => {
    return recetasDisponibles.find(rec => rec._id === recetaId);
  };

  const calcularCostoTotal = () => {
    const costoIngredientes = formData.ingredientesUtilizados.reduce((total, item) => {
      const ingrediente = obtenerIngredienteInfo(item.ingrediente);
      return total + (item.cantidadUtilizada * (ingrediente?.precioUnitario || 0));
    }, 0);

    const costoRecetas = formData.recetasUtilizadas.reduce((total, item) => {
      const receta = obtenerRecetaInfo(item.receta);
      let costoReceta = 0;
      if (receta?.ingredientes?.length > 0 && receta.rendimiento?.cantidad > 0) {
        costoReceta = receta.ingredientes.reduce((subtotal, ingredienteReceta) => {
          const ingredienteInfo = ingredientesDisponibles.find(ing => ing._id === ingredienteReceta.ingrediente);
          return subtotal + (ingredienteReceta.cantidad * (ingredienteInfo?.precioUnitario || 0));
        }, 0) / receta.rendimiento.cantidad;
      }
      return total + (item.cantidadUtilizada * costoReceta);
    }, 0);

    return costoIngredientes + costoRecetas;
  };

  const validarFormulario = () => {
    if (formData.cantidadProducir <= 0) {
      setError('La cantidad a producir debe ser mayor a 0');
      return false;
    }

    if (!formData.operador.trim()) {
      setError('El operador responsable es requerido');
      return false;
    }

    if (formData.ingredientesUtilizados.length === 0 && formData.recetasUtilizadas.length === 0) {
      setError('Debe agregar al menos un ingrediente o receta');
      return false;
    }

    // Validar ingredientes
    for (let i = 0; i < formData.ingredientesUtilizados.length; i++) {
      const item = formData.ingredientesUtilizados[i];
      if (!item.ingrediente) {
        setError(`Seleccione un ingrediente en la posición ${i + 1}`);
        return false;
      }
      if (item.cantidadUtilizada <= 0) {
        setError(`La cantidad del ingrediente ${i + 1} debe ser mayor a 0`);
        return false;
      }
      
      // Validar stock disponible solo si se van a consumir recursos
      if (formData.consumirRecursos) {
        const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
        const disponible = (ingredienteInfo?.cantidad || 0) - (ingredienteInfo?.procesado || 0);
        if (item.cantidadUtilizada > disponible) {
          setError(`Stock insuficiente de ${ingredienteInfo?.nombre}. Disponible: ${disponible}`);
          return false;
        }
      }
    }

    // Validar recetas
    for (let i = 0; i < formData.recetasUtilizadas.length; i++) {
      const item = formData.recetasUtilizadas[i];
      if (!item.receta) {
        setError(`Seleccione una receta en la posición ${i + 1}`);
        return false;
      }
      if (item.cantidadUtilizada <= 0) {
        setError(`La cantidad de la receta ${i + 1} debe ser mayor a 0`);
        return false;
      }
      
      // Validar stock disponible solo si se van a consumir recursos
      if (formData.consumirRecursos) {
        const recetaInfo = obtenerRecetaInfo(item.receta);
        const disponible = recetaInfo?.inventario?.cantidadProducida || 0;
        if (item.cantidadUtilizada > disponible) {
          setError(`Stock insuficiente de receta ${recetaInfo?.nombre}. Disponible: ${disponible}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setEnviando(true);
      setError('');

      const datosProduccion = {
        tipoProducto: 'produccion',
        productoId: producto._id,
        cantidad: formData.cantidadProducir,
        motivo: `Producción: ${formData.observaciones?.trim() || 'Producción manual'}`,
        operador: formData.operador?.trim() || 'Usuario',
        observaciones: formData.observaciones?.trim() || '',
        costoTotal: calcularCostoTotal(),
        // Solo incluir ingredientes y recetas si se van a consumir
        ingredientesUtilizados: formData.consumirRecursos ? formData.ingredientesUtilizados : [],
        recetasUtilizadas: formData.consumirRecursos ? formData.recetasUtilizadas : []
      };

      console.log('🚀 Enviando datos de producción:', {
        ...datosProduccion,
        ingredientesUtilizados: datosProduccion.ingredientesUtilizados.map(ing => ({
          ...ing,
          ingredienteInfo: obtenerIngredienteInfo(ing.ingrediente)
        })),
        recetasUtilizadas: datosProduccion.recetasUtilizadas.map(rec => ({
          ...rec,
          recetaInfo: obtenerRecetaInfo(rec.receta)
        }))
      });

      await movimientoUnificadoService.agregarCantidad(datosProduccion);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al producir:', error);
      setError(error.message || 'Error al crear producción');
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen || !producto) return null;

  const costoTotal = calcularCostoTotal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏭</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Producir: {producto.nombre}
              </h3>
              <p className="text-sm text-gray-500">
                Especifica los ingredientes y recetas que se utilizarán
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 flex overflow-hidden">
              
              {/* Columna Izquierda: Información del Producto */}
              <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">Información del Producto</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Código:</span>
                      <p className="font-medium">{producto.codigo}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock Actual:</span>
                      <p className="font-medium">{producto.cantidad || 0} {producto.unidadMedida || 'unidad'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Después de producir:</span>
                      <p className="font-medium text-green-600">
                        {(producto.cantidad || 0) + formData.cantidadProducir} {producto.unidadMedida || 'unidad'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad a Producir *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formData.cantidadProducir}
                      onChange={(e) => setFormData(prev => ({ ...prev, cantidadProducir: parseInt(e.target.value) || 1 }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={enviando}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operador Responsable *
                    </label>
                    <input
                      type="text"
                      value={formData.operador}
                      onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del operador"
                      disabled={enviando}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Observaciones adicionales..."
                      disabled={enviando}
                    />
                  </div>

                  {/* Checkbox para consumir recursos */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="consumirRecursos"
                      checked={formData.consumirRecursos}
                      onChange={(e) => setFormData(prev => ({ ...prev, consumirRecursos: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={enviando}
                    />
                    <label htmlFor="consumirRecursos" className="text-sm text-gray-700">
                      Consumir ingredientes y recetas del inventario
                    </label>
                  </div>
                  {!formData.consumirRecursos && (
                    <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ Los recursos no se descontarán del inventario
                    </p>
                  )}
                </div>

                {/* Resumen de Costos */}
                <div className="bg-green-50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-green-800 mb-2">💰 Costo Total</h4>
                  <div className="text-2xl font-bold text-green-600">
                    S/.{costoTotal.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Costo por unidad: S/.{(costoTotal / formData.cantidadProducir).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Recursos a Utilizar */}
              <div className="flex-1 flex flex-col">
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ingredientes')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'ingredientes' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🥬 Ingredientes ({formData.ingredientesUtilizados.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recetas')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'recetas' 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📋 Recetas ({formData.recetasUtilizadas.length})
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  
                  {/* Tab Ingredientes */}
                  {activeTab === 'ingredientes' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">Ingredientes a Utilizar</h4>
                        <button
                          type="button"
                          onClick={agregarIngrediente}
                          disabled={enviando}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          + Agregar Ingrediente
                        </button>
                      </div>

                      {formData.ingredientesUtilizados.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-4xl mb-4">🥬</div>
                          <p>No hay ingredientes agregados</p>
                          <p className="text-sm">Haz clic en "Agregar Ingrediente" para comenzar</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.ingredientesUtilizados.map((item, index) => {
                            const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
                            const disponible = (ingredienteInfo?.cantidad || 0) - (ingredienteInfo?.procesado || 0);
                            const stockInsuficiente = formData.consumirRecursos && item.cantidadUtilizada > disponible;
                            
                            return (
                              <div key={index} className={`border rounded-lg p-4 ${stockInsuficiente ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                                <div className="grid grid-cols-12 gap-3 items-center">
                                  
                                  {/* Selector de ingrediente */}
                                  <div className="col-span-5">
                                    <select
                                      value={item.ingrediente}
                                      onChange={(e) => {
                                        actualizarIngrediente(index, 'ingrediente', e.target.value);
                                        const ing = obtenerIngredienteInfo(e.target.value);
                                        if (ing) {
                                          actualizarIngrediente(index, 'costoUnitario', ing.precioUnitario || 0);
                                        }
                                      }}
                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                      disabled={enviando}
                                    >
                                      <option value="">Seleccionar...</option>
                                      {ingredientesDisponibles.map(ingrediente => (
                                        <option key={ingrediente._id} value={ingrediente._id}>
                                          {ingrediente.nombre}
                                        </option>
                                      ))}
                                    </select>
                                    {ingredienteInfo && (
                                      <div className={`text-xs mt-1 ${stockInsuficiente ? 'text-red-600' : 'text-gray-500'}`}>
                                        Disponible: {disponible} {ingredienteInfo.unidadMedida}
                                        {stockInsuficiente && ' ❌ Insuficiente'}
                                      </div>
                                    )}
                                  </div>

                                  {/* Cantidad */}
                                  <div className="col-span-3">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.cantidadUtilizada}
                                      onChange={(e) => actualizarIngrediente(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)}
                                      placeholder="Cantidad"
                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                      disabled={enviando}
                                    />
                                    {ingredienteInfo && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {ingredienteInfo.unidadMedida}
                                      </div>
                                    )}
                                  </div>

                                  {/* Costo */}
                                  <div className="col-span-3 text-center">
                                    <div className="font-medium text-gray-900">
                                      S/.{(item.cantidadUtilizada * (ingredienteInfo?.precioUnitario || 0)).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      @ S/.{(ingredienteInfo?.precioUnitario || 0).toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Eliminar */}
                                  <div className="col-span-1">
                                    <button
                                      type="button"
                                      onClick={() => eliminarIngrediente(index)}
                                      disabled={enviando}
                                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab Recetas */}
                  {activeTab === 'recetas' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">Recetas a Utilizar</h4>
                        <button
                          type="button"
                          onClick={agregarReceta}
                          disabled={enviando}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          + Agregar Receta
                        </button>
                      </div>

                      {formData.recetasUtilizadas.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-4xl mb-4">📋</div>
                          <p>No hay recetas agregadas</p>
                          <p className="text-sm">Haz clic en "Agregar Receta" para comenzar</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.recetasUtilizadas.map((item, index) => {
                            const recetaInfo = obtenerRecetaInfo(item.receta);
                            const disponible = recetaInfo?.inventario?.cantidadProducida || 0;
                            const stockInsuficiente = formData.consumirRecursos && item.cantidadUtilizada > disponible;
                            
                            // Calcular costo de la receta
                            let costoReceta = 0;
                            if (recetaInfo?.ingredientes?.length > 0 && recetaInfo.rendimiento?.cantidad > 0) {
                              costoReceta = recetaInfo.ingredientes.reduce((subtotal, ingredienteReceta) => {
                                const ingredienteInfo = ingredientesDisponibles.find(ing => ing._id === ingredienteReceta.ingrediente);
                                return subtotal + (ingredienteReceta.cantidad * (ingredienteInfo?.precioUnitario || 0));
                              }, 0) / recetaInfo.rendimiento.cantidad;
                            }

                            return (
                              <div key={index} className={`border rounded-lg p-4 ${stockInsuficiente ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                                <div className="grid grid-cols-12 gap-3 items-center">
                                  
                                  {/* Selector de receta */}
                                  <div className="col-span-5">
                                    <select
                                      value={item.receta}
                                      onChange={(e) => {
                                        actualizarReceta(index, 'receta', e.target.value);
                                      }}
                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                      disabled={enviando}
                                    >
                                      <option value="">Seleccionar...</option>
                                      {recetasDisponibles.map(receta => (
                                        <option key={receta._id} value={receta._id}>
                                          {receta.nombre}
                                        </option>
                                      ))}
                                    </select>
                                    {recetaInfo && (
                                      <div className={`text-xs mt-1 ${stockInsuficiente ? 'text-red-600' : 'text-gray-500'}`}>
                                        Disponible: {disponible} {recetaInfo.rendimiento?.unidadMedida || 'unidad'}
                                        {stockInsuficiente && ' ❌ Insuficiente'}
                                      </div>
                                    )}
                                  </div>

                                  {/* Cantidad */}
                                  <div className="col-span-3">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.cantidadUtilizada}
                                      onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)}
                                      placeholder="Cantidad"
                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                      disabled={enviando}
                                    />
                                    {recetaInfo && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {recetaInfo.rendimiento?.unidadMedida || 'unidad'}
                                      </div>
                                    )}
                                  </div>

                                  {/* Costo */}
                                  <div className="col-span-3 text-center">
                                    <div className="font-medium text-gray-900">
                                      S/.{(item.cantidadUtilizada * costoReceta).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      @ S/.{costoReceta.toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Eliminar */}
                                  <div className="col-span-1">
                                    <button
                                      type="button"
                                      onClick={() => eliminarReceta(index)}
                                      disabled={enviando}
                                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={enviando}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || (!formData.ingredientesUtilizados.length && !formData.recetasUtilizadas.length)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? 'Produciendo...' : 'Producir'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalProducirProducto;
