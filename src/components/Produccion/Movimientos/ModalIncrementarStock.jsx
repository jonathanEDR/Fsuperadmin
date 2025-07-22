import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { produccionService } from '../../../services/produccionService';
import { ingredienteService } from '../../../services/ingredienteService';
import { recetaService } from '../../../services/recetaService';

const ModalIncrementarStock = ({ isOpen, onClose, producto, onSuccess }) => {
  const [formData, setFormData] = useState({
    cantidadAgregar: 1,
    motivo: '',
    operador: '',
    ingredientesUtilizados: [], // Siempre disponible para producción
    recetasUtilizadas: [], // Siempre disponible para producción
    consumirRecursos: true // Siempre true para producción real
  });
  
  // Estados para recursos (solo cuando es producción real)
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [loadingRecursos, setLoadingRecursos] = useState(false);
  
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Cargar recursos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarRecursos();
    }
  }, [isOpen]);

  const cargarRecursos = async () => {
    try {
      setLoadingRecursos(true);
      
      // Cargar ingredientes con datos completos
      const ingredientesResponse = await ingredienteService.obtenerIngredientes({ activo: true });
      setIngredientesDisponibles(ingredientesResponse.data || []);
      
      // Cargar recetas con ingredientes populados (esto es clave para calcular precios)
      const recetasResponse = await recetaService.obtenerRecetas({ activo: true });
      setRecetasDisponibles(recetasResponse.data || []);
      
      console.log('🔍 Recetas cargadas con ingredientes:', recetasResponse.data?.[0]);
      
    } catch (error) {
      console.error('❌ Error al cargar recursos:', error);
      setError('Error al cargar ingredientes y recetas disponibles');
    } finally {
      setLoadingRecursos(false);
    }
  };

  const resetearFormulario = () => {
    setFormData({
      cantidadAgregar: 1,
      motivo: '',
      operador: '',
      ingredientesUtilizados: [],
      recetasUtilizadas: [],
      consumirRecursos: true
    });
    setError('');
  };

  // Funciones para manejar ingredientes
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

  // Funciones para manejar recetas
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

  // Funciones auxiliares
  const obtenerIngredienteInfo = (ingredienteId) => {
    return ingredientesDisponibles.find(ing => ing._id === ingredienteId);
  };

  const obtenerRecetaInfo = (recetaId) => {
    return recetasDisponibles.find(rec => rec._id === recetaId);
  };

  const calcularCostoTotal = () => {
    const costoIngredientes = formData.ingredientesUtilizados.reduce((total, item) => {
      return total + (item.cantidadUtilizada * (item.costoUnitario || 0));
    }, 0);

    const costoRecetas = formData.recetasUtilizadas.reduce((total, item) => {
      return total + (item.cantidadUtilizada * (item.costoUnitario || 0));
    }, 0);

    return costoIngredientes + costoRecetas;
  };

  const validarFormulario = () => {
    if (!formData.cantidadAgregar || formData.cantidadAgregar <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return false;
    }
    
    if (!formData.operador.trim()) {
      setError('El operador es requerido');
      return false;
    }

    // Siempre requiere al menos un ingrediente o receta para producción
    if (formData.ingredientesUtilizados.length === 0 && formData.recetasUtilizadas.length === 0) {
      setError('Se requiere al menos un ingrediente o receta para producir');
      return false;
    }

    // Validar ingredientes
    for (let i = 0; i < formData.ingredientesUtilizados.length; i++) {
      const item = formData.ingredientesUtilizados[i];
      if (!item.ingrediente) {
        setError(`Selecciona un ingrediente en la posición ${i + 1}`);
        return false;
      }
      if (!item.cantidadUtilizada || item.cantidadUtilizada <= 0) {
        setError(`La cantidad del ingrediente en posición ${i + 1} debe ser mayor a 0`);
        return false;
      }

      // Verificar stock disponible
      const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
      const disponible = (ingredienteInfo?.cantidad || 0) - (ingredienteInfo?.procesado || 0);
      if (item.cantidadUtilizada > disponible) {
        setError(`Stock insuficiente para ${ingredienteInfo?.nombre}. Disponible: ${disponible}, requerido: ${item.cantidadUtilizada}`);
        return false;
      }
    }

    // Validar recetas
    for (let i = 0; i < formData.recetasUtilizadas.length; i++) {
      const item = formData.recetasUtilizadas[i];
      if (!item.receta) {
        setError(`Selecciona una receta en la posición ${i + 1}`);
        return false;
      }
      if (!item.cantidadUtilizada || item.cantidadUtilizada <= 0) {
        setError(`La cantidad de la receta en posición ${i + 1} debe ser mayor a 0`);
        return false;
      }

      // Verificar stock disponible
      const recetaInfo = obtenerRecetaInfo(item.receta);
      const disponible = recetaInfo?.inventario?.cantidadProducida || 0;
      if (item.cantidadUtilizada > disponible) {
        setError(`Stock insuficiente para receta ${recetaInfo?.nombre}. Disponible: ${disponible}, requerido: ${item.cantidadUtilizada}`);
        return false;
      }
    }
    
    return true;
  };

  const puedeEnviar = () => {
    return !enviando && 
           formData.cantidadAgregar > 0 && 
           formData.operador.trim() && 
           (formData.ingredientesUtilizados.length > 0 || formData.recetasUtilizadas.length > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setEnviando(true);
      setError('');

      // Siempre usar producción real con consumo de ingredientes/recetas
      const datosMovimiento = {
        tipoProducto: 'produccion',
        productoId: producto._id,
        cantidad: parseInt(formData.cantidadAgregar),
        motivo: formData.motivo || `Producción: ${producto.nombre}`,
        operador: formData.operador.trim(),
        consumirIngredientes: formData.consumirRecursos,
        ingredientesUtilizados: formData.ingredientesUtilizados.map(ing => ({
          ingrediente: ing.ingrediente,
          cantidadUtilizada: ing.cantidadUtilizada,
          precioUnitario: ing.costoUnitario || 0
        })),
        recetasUtilizadas: formData.recetasUtilizadas.map(rec => ({
          receta: rec.receta,
          cantidadUtilizada: rec.cantidadUtilizada,
          precioUnitario: rec.costoUnitario || 0
        })),
        costoTotal: calcularCostoTotal(),
        observaciones: `Producción con ${formData.ingredientesUtilizados.length} ingredientes y ${formData.recetasUtilizadas.length} recetas`
      };

      console.log('📤 Enviando datos de producción:', datosMovimiento);
      const response = await movimientoUnificadoService.agregarCantidad(datosMovimiento);
      console.log('✅ Producción completada:', response);

      // Notificar éxito y cerrar modal
      onSuccess && onSuccess({
        mensaje: `Producción completada exitosamente. +${formData.cantidadAgregar} ${producto.unidadMedida || 'unidades'} (Costo: S/.${calcularCostoTotal().toFixed(2)})`,
        producto: response.data?.producto || response.produccion?.catalogoProducto || producto,
        cantidadAgregada: formData.cantidadAgregar,
        esProduccionReal: true,
        costoTotal: calcularCostoTotal()
      });

      resetearFormulario();
      onClose();

    } catch (error) {
      console.error('❌ Error al procesar operación:', error);
      setError(error.message || 'Error al procesar la operación');
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    if (!enviando) {
      resetearFormulario();
      onClose();
    }
  };

  if (!isOpen || !producto) {
    return null;
  }

  // Trabajar únicamente con cantidad producida
  const cantidadActual = producto.cantidadProducida || 0;
  
  // La cantidad final será la cantidad actual + cantidad a agregar
  const cantidadFinal = cantidadActual + (parseInt(formData.cantidadAgregar) || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏭</span>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Producir Stock
              </h3>
              <p className="text-sm text-gray-500">
                {producto.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
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

        {/* Formulario principal con layout de dos columnas */}
        <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
          {/* Columna Izquierda */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Información del Producto */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <div className="text-sm font-medium text-gray-500">Cantidad Actual</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {cantidadActual}
                  </div>
                  <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidades'}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <div className="text-sm font-medium text-gray-500">A Producir</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{formData.cantidadAgregar}
                  </div>
                  <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidades'}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center col-span-2">
                  <div className="text-sm font-medium text-gray-500">Cantidad Final</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {cantidadFinal}
                  </div>
                  <div className="text-xs text-gray-400">{producto.unidadMedida || 'unidades'}</div>
                </div>
              </div>
              
              {/* Información contextual */}
              <div className="p-3 bg-white/50 rounded-lg">
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Producto:</strong> {producto.nombre} (Ref: {producto.codigo || 'N/A'})</p>
                  <p><strong>Cantidad actual producida:</strong> {cantidadActual} {producto.unidadMedida || 'unidades'}</p>
                  <p><strong>Nueva cantidad a producir:</strong> {formData.cantidadAgregar} {producto.unidadMedida || 'unidades'}</p>
                </div>
              </div>
            </div>

            {/* Formulario básico */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              
              {/* Información de Producción */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start space-x-3">
                  <div className="text-xl text-purple-500">🏭</div>
                  <div>
                    <h4 className="text-sm font-medium text-purple-900 mb-1">Producción con Recursos</h4>
                    <ul className="text-xs text-purple-700 space-y-1">
                      <li>• Se consumirán los ingredientes y recetas especificados</li>
                      <li>• Se calculará el costo real de producción</li>
                      <li>• Se registrará como movimiento de producción</li>
                      <li>• Se validará la disponibilidad de recursos</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cantidad a Producir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a Producir *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.cantidadAgregar}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    cantidadAgregar: parseInt(e.target.value) || 1 
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg"
                  disabled={enviando}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Especifica cuántas unidades deseas producir
                </p>
              </div>

              {/* Operador Responsable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operador Responsable *
                </label>
                <input
                  type="text"
                  value={formData.operador}
                  onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del operador"
                  disabled={enviando}
                  required
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo (Opcional)
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Razón para realizar la producción..."
                  disabled={enviando}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="border-t px-6 py-4 bg-gray-50">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={enviando}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !puedeEnviar()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Produciendo...</span>
                    </>
                  ) : (
                    <>
                      <span>🏭</span>
                      <span>Producir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Recursos para Producción */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">🏭 Recursos para Producción</h4>
                {loadingRecursos && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Cargando recursos...</span>
                  </div>
                )}
              </div>

              {/* Checkbox para consumir recursos */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consumirRecursos"
                    checked={formData.consumirRecursos}
                    onChange={(e) => setFormData(prev => ({ ...prev, consumirRecursos: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    disabled={enviando}
                  />
                  <label htmlFor="consumirRecursos" className="text-sm text-yellow-800 font-medium">
                    Consumir ingredientes y recetas del inventario
                  </label>
                </div>
                {!formData.consumirRecursos && (
                  <p className="text-xs text-yellow-700 mt-1 ml-6">
                    ⚠️ Los recursos no se descontarán del inventario (solo para simulación)
                  </p>
                )}
              </div>
            </div>

            {/* Contenido scrolleable de recursos */}
            <div className="flex-1 overflow-y-auto">
                {/* Botones para agregar recursos */}
                <div className="p-4 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="px-4 py-3 text-sm font-medium bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
                      onClick={agregarIngrediente}
                      disabled={enviando}
                    >
                      <span>🥬</span>
                      <span>+ Ingrediente ({formData.ingredientesUtilizados.length})</span>
                    </button>
                    <button
                      type="button"
                      className="px-4 py-3 text-sm font-medium bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                      onClick={agregarReceta}
                      disabled={enviando}
                    >
                      <span>📋</span>
                      <span>+ Receta ({formData.recetasUtilizadas.length})</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Ingredientes */}
                {formData.ingredientesUtilizados.length > 0 && (
                  <div className="p-4 border-b">
                    <h5 className="text-sm font-medium text-gray-800 mb-3">🥬 Ingredientes Utilizados</h5>
                    <div className="space-y-3">
                      {formData.ingredientesUtilizados.map((item, index) => {
                        const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
                        const disponible = (ingredienteInfo?.cantidad || 0) - (ingredienteInfo?.procesado || 0);
                        const stockInsuficiente = formData.consumirRecursos && item.cantidadUtilizada > disponible;
                        
                        return (
                          <div key={index} className={`p-3 border rounded-lg ${stockInsuficiente ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                            <div className="space-y-2">
                              <select
                                value={item.ingrediente}
                                onChange={(e) => {
                                  actualizarIngrediente(index, 'ingrediente', e.target.value);
                                  const ing = obtenerIngredienteInfo(e.target.value);
                                  console.log('🥬 Ingrediente seleccionado:', ing);
                                  if (ing) {
                                    console.log(`💰 Precio unitario: S/.${ing.precioUnitario || 0}`);
                                    actualizarIngrediente(index, 'costoUnitario', ing.precioUnitario || 0);
                                  }
                                }}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                disabled={enviando}
                                required
                              >
                                <option value="">Seleccionar ingrediente...</option>
                                {ingredientesDisponibles.map(ing => (
                                  <option key={ing._id} value={ing._id}>
                                    {ing.nombre} (Disp: {(ing.cantidad || 0) - (ing.procesado || 0)})
                                  </option>
                                ))}
                              </select>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.cantidadUtilizada}
                                  onChange={(e) => actualizarIngrediente(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Cantidad"
                                  disabled={enviando}
                                  required
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.costoUnitario}
                                  onChange={(e) => actualizarIngrediente(index, 'costoUnitario', parseFloat(e.target.value) || 0)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Costo S/."
                                  disabled={enviando}
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  Total: S/.{((item.cantidadUtilizada || 0) * (item.costoUnitario || 0)).toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => eliminarIngrediente(index)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  disabled={enviando}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                            {stockInsuficiente && (
                              <p className="text-xs text-red-600 mt-2">
                                ⚠️ Stock insuficiente: disponible {disponible}, necesario {item.cantidadUtilizada}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lista de Recetas */}
                {formData.recetasUtilizadas.length > 0 && (
                  <div className="p-4 border-b">
                    <h5 className="text-sm font-medium text-gray-800 mb-3">📋 Recetas Utilizadas</h5>
                    <div className="space-y-3">
                      {formData.recetasUtilizadas.map((item, index) => {
                        const recetaInfo = obtenerRecetaInfo(item.receta);
                        const disponible = recetaInfo?.inventario?.cantidadProducida || 0;
                        const stockInsuficiente = formData.consumirRecursos && item.cantidadUtilizada > disponible;
                        
                        return (
                          <div key={index} className={`p-3 border rounded-lg ${stockInsuficiente ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                            <div className="space-y-2">
                              <select
                                value={item.receta}
                                onChange={(e) => {
                                  actualizarReceta(index, 'receta', e.target.value);
                                  const rec = obtenerRecetaInfo(e.target.value);
                                  let precio = 0;
                                  console.log('🔍 Receta seleccionada:', rec);
                                  
                                  if (rec && rec.ingredientes && rec.ingredientes.length > 0 && rec.rendimiento?.cantidad > 0) {
                                    let costoTotal = 0;
                                    console.log('📋 Ingredientes de la receta:', rec.ingredientes);
                                    console.log('📏 Rendimiento:', rec.rendimiento);
                                    
                                    for (const ing of rec.ingredientes) {
                                      if (ing.ingrediente && typeof ing.ingrediente.precioUnitario === 'number') {
                                        const costoIngrediente = (Number(ing.cantidad) || 0) * (Number(ing.ingrediente.precioUnitario) || 0);
                                        costoTotal += costoIngrediente;
                                        console.log(`💰 ${ing.ingrediente.nombre}: ${ing.cantidad} x S/.${ing.ingrediente.precioUnitario} = S/.${costoIngrediente}`);
                                      }
                                    }
                                    precio = costoTotal / Number(rec.rendimiento.cantidad);
                                    console.log(`🎯 Precio calculado: S/.${costoTotal} ÷ ${rec.rendimiento.cantidad} = S/.${precio}`);
                                  } else {
                                    console.log('⚠️ No se pudo calcular precio - datos faltantes');
                                  }
                                  
                                  actualizarReceta(index, 'costoUnitario', precio);
                                }}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                disabled={enviando}
                                required
                              >
                                <option value="">Seleccionar receta...</option>
                                {recetasDisponibles.map(rec => (
                                  <option key={rec._id} value={rec._id}>
                                    {rec.nombre} (Disp: {rec.inventario?.cantidadProducida || 0})
                                  </option>
                                ))}
                              </select>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.cantidadUtilizada}
                                  onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Cantidad"
                                  disabled={enviando}
                                  required
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.costoUnitario}
                                  onChange={(e) => actualizarReceta(index, 'costoUnitario', parseFloat(e.target.value) || 0)}
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Costo S/."
                                  disabled={enviando}
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  Total: S/.{((item.cantidadUtilizada || 0) * (item.costoUnitario || 0)).toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => eliminarReceta(index)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  disabled={enviando}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                            {stockInsuficiente && (
                              <p className="text-xs text-red-600 mt-2">
                                ⚠️ Stock insuficiente: disponible {disponible}, necesario {item.cantidadUtilizada}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resumen de costos para producción real */}
                {(formData.ingredientesUtilizados.length > 0 || formData.recetasUtilizadas.length > 0) && (
                  <div className="p-4 bg-purple-50 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-purple-800">💰 Costo Total de Producción:</span>
                      <span className="text-lg font-bold text-purple-600">S/.{calcularCostoTotal().toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Costo por unidad: S/.{(calcularCostoTotal() / formData.cantidadAgregar).toFixed(2)}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalIncrementarStock;
