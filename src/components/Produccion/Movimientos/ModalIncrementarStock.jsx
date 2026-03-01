import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { produccionService } from '../../../services/produccionService';
import { ingredienteService } from '../../../services/ingredienteService';
import { recetaService } from '../../../services/recetaService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { X, Factory, Loader2, AlertCircle, BarChart3, Plus, Calendar, Carrot, ClipboardList, Trash2, AlertTriangle, DollarSign, Package } from 'lucide-react';

const ModalIncrementarStock = ({ isOpen, onClose, producto, onSuccess }) => {
  const [formData, setFormData] = useState({
    cantidadAgregar: 1,
    motivo: '',
    operador: '',
    fechaProduccion: '', // NUEVO: Campo para fecha de producción
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
      fechaProduccion: getLocalDateTimeString(), // Inicializar con fecha/hora actual
      ingredientesUtilizados: [],
      recetasUtilizadas: [],
      consumirRecursos: true
    });
    setError('');
  };

  // Inicializar fecha cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        fechaProduccion: getLocalDateTimeString()
      }));
    }
  }, [isOpen]);

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
      const producido = recetaInfo?.inventario?.cantidadProducida || 0;
      const utilizado = recetaInfo?.inventario?.cantidadUtilizada || 0;
      const disponible = producido - utilizado;
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
        fechaProduccion: formData.fechaProduccion, // NUEVO: Enviar fecha de producción
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

      console.log('📅 ModalIncrementarStock - Enviando fecha:', formData.fechaProduccion);

      const response = await movimientoUnificadoService.agregarCantidad(datosMovimiento);

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

  // Calcular costo total para mostrar en header
  const costoTotal = calcularCostoTotal();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full h-full sm:h-auto sm:max-w-xl lg:max-w-3xl sm:max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header con Cantidad Final y Costo Total */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
              <Factory size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
                Producir Stock
              </h3>
              <p className="text-xs text-gray-500 line-clamp-1">
                {producto.nombre}
              </p>
            </div>
          </div>
          
          {/* Cantidad Final y Costo Total en Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cantidad Final */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 min-w-[90px] text-center">
              <div className="text-xs text-blue-700 font-medium flex items-center justify-center gap-1"><Package size={12} /> Final</div>
              <div className="text-base sm:text-lg font-bold text-blue-600">
                {cantidadFinal}
              </div>
              <div className="text-xs text-blue-500">{producto.unidadMedida || 'u'}</div>
            </div>
            
            {/* Costo Total */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 min-w-[90px] text-center">
              <div className="text-xs text-green-700 font-medium flex items-center justify-center gap-1"><DollarSign size={12} /> Costo</div>
              <div className="text-base sm:text-lg font-bold text-green-600 truncate">
                S/.{costoTotal.toFixed(2)}
              </div>
            </div>
            
            <button
              onClick={handleClose}
              disabled={enviando}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-2 sm:mx-4 lg:mx-6 mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Formulario principal - Vertical en móvil, 2 columnas en desktop */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Columna Izquierda - Full width en móvil */}
          <div className="w-full lg:w-1/2 lg:border-r border-gray-200 flex flex-col overflow-y-auto">
            {/* Información del Producto */}
            <div className="p-2 sm:p-2.5 lg:p-3 bg-gray-50/60 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-xl shadow-sm text-center border border-gray-100">
                  <div className="text-xs sm:text-sm font-medium text-gray-500 flex items-center justify-center gap-1"><BarChart3 size={14} className="text-purple-500" /> Cantidad Actual</div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    {cantidadActual}
                  </div>
                  <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidades'}</div>
                </div>
                <div className="bg-white p-2 rounded-xl shadow-sm text-center border border-gray-100">
                  <div className="text-xs sm:text-sm font-medium text-gray-500 flex items-center justify-center gap-1"><Plus size={14} className="text-green-500" /> A Producir</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    +{formData.cantidadAgregar}
                  </div>
                  <div className="text-xs text-gray-500">{producto.unidadMedida || 'unidades'}</div>
                </div>
              </div>
            </div>

            {/* Formulario básico */}
            <div className="flex-1 p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-2.5 lg:space-y-3 overflow-y-auto">
              {/* Cantidad a Producir */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base sm:text-sm"
                />
              </div>

              {/* Operador Responsable */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Operador Responsable *
                </label>
                <input
                  type="text"
                  value={formData.operador}
                  onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base sm:text-sm"
                  placeholder="Nombre del operador"
                  disabled={enviando}
                  required
                />
              </div>

              {/* Fecha y Hora de Producción */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" /> Fecha y Hora de Producción
                </label>
                <input
                  type="datetime-local"
                  value={formData.fechaProduccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaProduccion: e.target.value }))}
                  max={getLocalDateTimeString()}
                  step="1"
                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base sm:text-sm"
                  disabled={enviando}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona cuándo se realizó la producción
                </p>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  rows={2}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-base sm:text-sm"
                  placeholder="Observaciones adicionales..."
                  disabled={enviando}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={enviando}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !puedeEnviar()}
                  className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {enviando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Produciendo...</span>
                    </>
                  ) : (
                    <>
                      <Factory size={16} />
                      <span>Producir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Recursos para Producción */}
          <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto lg:overflow-visible">
            <div className="p-2 sm:p-3 lg:p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 flex items-center gap-2"><Factory size={18} className="text-purple-500" /> Recursos para Producción</h4>
                {loadingRecursos && (
                  <div className="flex items-center space-x-1 sm:space-x-2 text-blue-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs sm:text-sm">Cargando...</span>
                  </div>
                )}
              </div>

              {/* Checkbox para consumir recursos */}
              <div className="mt-2 p-2 sm:p-2.5 bg-amber-50/60 rounded-xl border border-amber-200">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <input
                    type="checkbox"
                    id="consumirRecursos"
                    checked={formData.consumirRecursos}
                    onChange={(e) => setFormData(prev => ({ ...prev, consumirRecursos: e.target.checked }))}
                    className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
                    disabled={enviando}
                  />
                  <div className="flex-1">
                    <label htmlFor="consumirRecursos" className="text-xs sm:text-sm font-semibold text-gray-900 cursor-pointer block">
                      Consumir ingredientes y recetas del inventario
                    </label>
                    {!formData.consumirRecursos && (
                      <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Los recursos no se descontarán del inventario
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido scrolleable de recursos */}
            <div className="flex-1 overflow-y-auto">
                {/* Botones para agregar recursos */}
                <div className="p-2 sm:p-2.5 lg:p-3 bg-gray-50/60 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl transition-colors flex items-center justify-center space-x-1 sm:space-x-2"
                      onClick={agregarIngrediente}
                      disabled={enviando}
                    >
                      <Carrot size={16} />
                      <span className="hidden sm:inline">+ Ingrediente</span>
                      <span className="sm:hidden">+</span>
                      <span>({formData.ingredientesUtilizados.length})</span>
                    </button>
                    <button
                      type="button"
                      className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center space-x-1 sm:space-x-2"
                      onClick={agregarReceta}
                      disabled={enviando}
                    >
                      <ClipboardList size={16} />
                      <span className="hidden sm:inline">+ Receta</span>
                      <span className="sm:hidden">+</span>
                      <span>({formData.recetasUtilizadas.length})</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Ingredientes */}
                {formData.ingredientesUtilizados.length > 0 && (
                  <div className="p-2 sm:p-3 border-b bg-green-50/60">
                    <h5 className="text-xs sm:text-sm font-medium text-gray-800 mb-2 flex items-center gap-1.5"><Carrot size={14} className="text-green-600" /> Ingredientes ({formData.ingredientesUtilizados.length})</h5>
                    <div className="space-y-2">
                      {formData.ingredientesUtilizados.map((item, index) => {
                        const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
                        const disponible = (ingredienteInfo?.cantidad || 0) - (ingredienteInfo?.procesado || 0);
                        const stockInsuficiente = formData.consumirRecursos && item.cantidadUtilizada > disponible;
                        
                        return (
                          <div key={index} className={`p-2 border rounded-xl ${stockInsuficiente ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                            <div className="space-y-1.5">
                              <select
                                value={item.ingrediente}
                                onChange={(e) => {
                                  actualizarIngrediente(index, 'ingrediente', e.target.value);
                                  const ing = obtenerIngredienteInfo(e.target.value);
                                  if (ing) {
                                    actualizarIngrediente(index, 'costoUnitario', ing.precioUnitario || 0);
                                  }
                                }}
                                className="w-full p-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                disabled={enviando}
                                required
                              >
                                <option value="">Seleccionar ingrediente...</option>
                                {ingredientesDisponibles.map(ing => (
                                  <option key={ing._id} value={ing._id}>
                                    {ing.nombre} (Disp: {((ing.cantidad || 0) - (ing.procesado || 0)).toFixed(2)})
                                  </option>
                                ))}
                              </select>
                              <div className="grid grid-cols-3 gap-1.5">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={Math.round(item.cantidadUtilizada * 100) / 100}
                                  onChange={(e) => actualizarIngrediente(index, 'cantidadUtilizada', Math.round((parseFloat(e.target.value) || 0) * 100) / 100)}
                                  className="w-full p-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                  placeholder="Cant."
                                  disabled={enviando}
                                  required
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={Math.round(item.costoUnitario * 100) / 100}
                                  onChange={(e) => actualizarIngrediente(index, 'costoUnitario', Math.round((parseFloat(e.target.value) || 0) * 100) / 100)}
                                  className="w-full p-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                  placeholder="S/."
                                  disabled={enviando}
                                />
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-semibold text-green-600">
                                    S/.{((item.cantidadUtilizada || 0) * (item.costoUnitario || 0)).toFixed(2)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => eliminarIngrediente(index)}
                                    className="p-1 text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 rounded-full transition-colors"
                                    disabled={enviando}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            {stockInsuficiente && (
                              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                <AlertTriangle size={12} /> Stock insuficiente: disponible {disponible}, necesario {item.cantidadUtilizada}
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
                  <div className="p-2 sm:p-3 bg-blue-50/60">
                    <h5 className="text-xs sm:text-sm font-medium text-gray-800 mb-2 flex items-center gap-1.5"><ClipboardList size={14} className="text-blue-600" /> Recetas ({formData.recetasUtilizadas.length})</h5>
                    <div className="space-y-2">
                      {formData.recetasUtilizadas.map((item, index) => {
                        const recetaInfo = obtenerRecetaInfo(item.receta);
                        const producido = recetaInfo?.inventario?.cantidadProducida || 0;
                        const utilizado = recetaInfo?.inventario?.cantidadUtilizada || 0;
                        const disponible = producido - utilizado;
                        const stockInsuficiente = formData.consumirRecursos && item.cantidadUtilizada > disponible;
                        
                        return (
                          <div key={index} className={`p-2 border rounded-xl ${stockInsuficiente ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                            <div className="space-y-1.5">
                              <select
                                value={item.receta}
                                onChange={(e) => {
                                  actualizarReceta(index, 'receta', e.target.value);
                                  const rec = obtenerRecetaInfo(e.target.value);
                                  let precio = 0;
                                  
                                  if (rec && rec.ingredientes && rec.ingredientes.length > 0 && rec.rendimiento?.cantidad > 0) {
                                    let costoTotal = 0;
                                    
                                    for (const ing of rec.ingredientes) {
                                      if (ing.ingrediente && typeof ing.ingrediente.precioUnitario === 'number') {
                                        const costoIngrediente = (Number(ing.cantidad) || 0) * (Number(ing.ingrediente.precioUnitario) || 0);
                                        costoTotal += costoIngrediente;
                                      }
                                    }
                                    precio = costoTotal / Number(rec.rendimiento.cantidad);
                                  }
                                  
                                  actualizarReceta(index, 'costoUnitario', precio);
                                }}
                                className="w-full p-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                disabled={enviando}
                                required
                              >
                                <option value="">Seleccionar receta...</option>
                                {recetasDisponibles.filter(rec => {
                                  const producido = rec.inventario?.cantidadProducida || 0;
                                  const utilizado = rec.inventario?.cantidadUtilizada || 0;
                                  return (producido - utilizado) > 0;
                                }).map(rec => {
                                  const producido = rec.inventario?.cantidadProducida || 0;
                                  const utilizado = rec.inventario?.cantidadUtilizada || 0;
                                  const disponible = producido - utilizado;
                                  
                                  return (
                                    <option key={rec._id} value={rec._id}>
                                      {rec.nombre} (Disp: {disponible.toFixed(2)})
                                    </option>
                                  );
                                })}
                              </select>
                              <div className="grid grid-cols-3 gap-1.5">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={Math.round(item.cantidadUtilizada * 100) / 100}
                                  onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', Math.round((parseFloat(e.target.value) || 0) * 100) / 100)}
                                  className="w-full p-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                  placeholder="Cant."
                                  disabled={enviando}
                                  required
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={Math.round(item.costoUnitario * 100) / 100}
                                  onChange={(e) => actualizarReceta(index, 'costoUnitario', Math.round((parseFloat(e.target.value) || 0) * 100) / 100)}
                                  className="w-full p-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                  placeholder="S/."
                                  disabled={enviando}
                                />
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-semibold text-blue-600">
                                    S/.{((item.cantidadUtilizada || 0) * (item.costoUnitario || 0)).toFixed(2)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => eliminarReceta(index)}
                                    className="p-1 text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 rounded-full transition-colors"
                                    disabled={enviando}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            {stockInsuficiente && (
                              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                <AlertTriangle size={12} /> Stock insuficiente: disponible {disponible}, necesario {item.cantidadUtilizada}
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
                  <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800 flex items-center gap-1.5"><DollarSign size={16} className="text-purple-600" /> Costo Total de Producción:</span>
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
