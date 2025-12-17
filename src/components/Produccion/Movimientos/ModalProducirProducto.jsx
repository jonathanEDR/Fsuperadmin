// Modal Producir Stock - Optimizado para móviles v3.0 - Layout Vertical Completo
import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';

const ModalProducirProducto = ({ isOpen, onClose, producto, onSuccess }) => {
  const [formData, setFormData] = useState({
    cantidadProducir: 1,
    operador: '',
    observaciones: '',
    fechaProduccion: '', // NUEVO: Campo para fecha de producción
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
  
  // Estados para acordeones en móvil
  const [mostrarIngredientes, setMostrarIngredientes] = useState(true);
  const [mostrarRecetas, setMostrarRecetas] = useState(false);
  const [mostrarInfoProducto, setMostrarInfoProducto] = useState(true);

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
      fechaProduccion: getLocalDateTimeString(), // Inicializar con fecha/hora actual
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
        fechaProduccion: formData.fechaProduccion, // NUEVO: Enviar fecha de producción
        costoTotal: calcularCostoTotal(),
        // Solo incluir ingredientes y recetas si se van a consumir
        ingredientesUtilizados: formData.consumirRecursos ? formData.ingredientesUtilizados : [],
        recetasUtilizadas: formData.consumirRecursos ? formData.recetasUtilizadas : []
      };

      console.log('📅 ModalProducirProducto - Enviando fecha:', formData.fechaProduccion);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white sm:rounded-xl shadow-2xl w-full h-full sm:h-auto sm:max-w-xl lg:max-w-3xl sm:max-h-[95vh] flex flex-col">
        
        {/* Header - Más compacto en móvil */}
        <div className="flex items-center justify-between p-2 sm:p-4 lg:p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl lg:text-3xl">🏭</span>
            <div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 line-clamp-1">
                {producto.nombre}
              </h3>
              <p className="text-xs text-gray-500 hidden sm:block">
                Especifica los ingredientes y recetas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error - Más compacto en móvil */}
        {error && (
          <div className="mx-2 sm:mx-4 lg:mx-6 mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* Contenedor principal con scroll único */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              
              {/* Costo Total - Sticky en móvil, arriba para visibilidad */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 sm:p-3 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800 text-xs sm:text-sm">💰 Costo Total</h4>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                      S/.{costoTotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600">Por unidad</p>
                    <p className="text-sm sm:text-base font-semibold text-green-700">
                      S/.{(costoTotal / formData.cantidadProducir).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Cantidades - Más visual y compacta */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Cantidad Actual</div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                      {producto.cantidad || 0}
                    </div>
                    <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidad'}</div>
                  </div>
                  <div className="text-center border-x border-blue-200">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">A Producir</div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">
                      +{formData.cantidadProducir}
                    </div>
                    <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidad'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Cantidad Final</div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {(producto.cantidad || 0) + formData.cantidadProducir}
                    </div>
                    <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidad'}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 text-center">
                  <div className="text-xs text-gray-600">Producto: <span className="font-semibold">{producto.codigo}</span></div>
                </div>
              </div>

              {/* Formulario de Producción - Vertical */}
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Cantidad a Producir *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.cantidadProducir}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const rounded = Math.round(value * 100) / 100;
                      setFormData(prev => ({ ...prev, cantidadProducir: rounded }));
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value) || 0.01;
                      const rounded = Math.max(0.01, Math.round(value * 100) / 100);
                      setFormData(prev => ({ ...prev, cantidadProducir: rounded }));
                    }}
                    className="w-full p-2 sm:p-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={enviando}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Operador Responsable *
                  </label>
                  <input
                    type="text"
                    value={formData.operador}
                    onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))}
                    className="w-full p-2 sm:p-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del operador"
                    disabled={enviando}
                    required
                  />
                </div>

                {/* Fecha y Hora de Producción */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    📅 Fecha y Hora de Producción
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fechaProduccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaProduccion: e.target.value }))}
                    max={getLocalDateTimeString()}
                    step="1"
                    className="w-full p-2 sm:p-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={enviando}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona cuándo se realizó la producción
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={2}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base sm:text-sm"
                    placeholder="Observaciones adicionales..."
                    disabled={enviando}
                  />
                </div>

                {/* Checkbox para consumir recursos */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="consumirRecursos"
                      checked={formData.consumirRecursos}
                      onChange={(e) => setFormData(prev => ({ ...prev, consumirRecursos: e.target.checked }))}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
                      disabled={enviando}
                    />
                    <div className="flex-1">
                      <label htmlFor="consumirRecursos" className="text-sm sm:text-base font-semibold text-gray-900 cursor-pointer block">
                        🏭 Consumir ingredientes y recetas del inventario
                      </label>
                      <p className="text-xs sm:text-sm text-gray-700 mt-1">
                        {formData.consumirRecursos 
                          ? '✅ Los recursos se descontarán automáticamente' 
                          : '⚠️ No se modificará el inventario de recursos'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acordeón: Ingredientes */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMostrarIngredientes(!mostrarIngredientes)}
                  className="w-full bg-green-50 p-2 sm:p-3 flex items-center justify-between hover:bg-green-100 transition-colors"
                >
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base flex items-center gap-2">
                    🥬 Ingredientes ({formData.ingredientesUtilizados.length})
                  </h4>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform ${mostrarIngredientes ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {mostrarIngredientes && (
                  <div className="p-2 sm:p-3 bg-white space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-gray-600">Ingredientes para producir</p>
                      <button
                        type="button"
                        onClick={agregarIngrediente}
                        disabled={enviando}
                        className="px-2 sm:px-3 py-1.5 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>

                    {formData.ingredientesUtilizados.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-3xl mb-2">🥬</div>
                        <p className="text-sm">No hay ingredientes</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {formData.ingredientesUtilizados.map((item, index) => {
                          const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
                          const disponible = (ingredienteInfo?.cantidad || 0) - (ingredienteInfo?.procesado || 0);
                          const stockInsuficiente = formData.consumirRecursos && item.cantidadUtilizada > disponible;
                          
                          return (
                            <div key={index} className={`border rounded-lg p-2 sm:p-3 ${stockInsuficiente ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Ingrediente</label>
                                    <select
                                      value={item.ingrediente}
                                      onChange={(e) => {
                                        actualizarIngrediente(index, 'ingrediente', e.target.value);
                                        const ing = obtenerIngredienteInfo(e.target.value);
                                        if (ing) {
                                          actualizarIngrediente(index, 'costoUnitario', ing.precioUnitario || 0);
                                        }
                                      }}
                                      className="w-full p-1.5 sm:p-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
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
                                      <div className={`text-xs mt-0.5 ${stockInsuficiente ? 'text-red-600' : 'text-gray-500'}`}>
                                        Disponible: {disponible} {ingredienteInfo.unidadMedida}
                                        {stockInsuficiente && ' ❌'}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => eliminarIngrediente(index)}
                                    disabled={enviando}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                  >
                                    🗑️
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.cantidadUtilizada}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        const rounded = Math.round(value * 100) / 100;
                                        actualizarIngrediente(index, 'cantidadUtilizada', rounded);
                                      }}
                                      placeholder="0"
                                      className="w-full p-1.5 sm:p-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                                      disabled={enviando}
                                    />
                                    {ingredienteInfo && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {ingredienteInfo.unidadMedida}
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Costo</label>
                                    <div className="p-1.5 sm:p-2 bg-gray-100 border border-gray-200 rounded text-xs sm:text-sm">
                                      <div className="font-semibold text-gray-900">
                                        S/.{(item.cantidadUtilizada * (ingredienteInfo?.precioUnitario || 0)).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        @ S/.{(ingredienteInfo?.precioUnitario || 0).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
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

              {/* Acordeón: Recetas */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMostrarRecetas(!mostrarRecetas)}
                  className="w-full bg-blue-50 p-2 sm:p-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
                >
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base flex items-center gap-2">
                    📋 Recetas ({formData.recetasUtilizadas.length})
                  </h4>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform ${mostrarRecetas ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {mostrarRecetas && (
                  <div className="p-2 sm:p-3 bg-white space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-gray-600">Recetas para producir</p>
                      <button
                        type="button"
                        onClick={agregarReceta}
                        disabled={enviando}
                        className="px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>

                    {formData.recetasUtilizadas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-sm">No hay recetas</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
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
                            <div key={index} className={`border rounded-lg p-2 sm:p-3 ${stockInsuficiente ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Receta</label>
                                    <select
                                      value={item.receta}
                                      onChange={(e) => {
                                        actualizarReceta(index, 'receta', e.target.value);
                                      }}
                                      className="w-full p-1.5 sm:p-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
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
                                      <div className={`text-xs mt-0.5 ${stockInsuficiente ? 'text-red-600' : 'text-gray-500'}`}>
                                        Disponible: {disponible} {recetaInfo.rendimiento?.unidadMedida || 'u'}
                                        {stockInsuficiente && ' ❌'}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => eliminarReceta(index)}
                                    disabled={enviando}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                  >
                                    🗑️
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.cantidadUtilizada}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        const rounded = Math.round(value * 100) / 100;
                                        actualizarReceta(index, 'cantidadUtilizada', rounded);
                                      }}
                                      placeholder="0"
                                      className="w-full p-1.5 sm:p-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                                      disabled={enviando}
                                    />
                                    {recetaInfo && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {recetaInfo.rendimiento?.unidadMedida || 'unidad'}
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Costo</label>
                                    <div className="p-1.5 sm:p-2 bg-gray-100 border border-gray-200 rounded text-xs sm:text-sm">
                                      <div className="font-semibold text-gray-900">
                                        S/.{(item.cantidadUtilizada * costoReceta).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        @ S/.{costoReceta.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
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

            {/* Footer con botones - Sticky */}
            <div className="border-t border-gray-200 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 bg-white sticky bottom-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={enviando}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || (!formData.ingredientesUtilizados.length && !formData.recetasUtilizadas.length)}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {enviando ? 'Produciendo...' : '🏭 Producir'}
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
