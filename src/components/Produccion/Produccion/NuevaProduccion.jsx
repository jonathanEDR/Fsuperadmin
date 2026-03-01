import React, { useState, useEffect } from 'react';
import { X, Loader2, Factory, FileText, Plus, Trash2, AlertTriangle, Zap, RefreshCw, Package } from 'lucide-react';
import { produccionService } from '../../../services/produccionService';
import { ingredienteService } from '../../../services/ingredienteService';
import { recetaService } from '../../../services/recetaService';
import catalogoProduccionService from '../../../services/catalogoProduccion';

const NuevaProduccion = ({ onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    cantidadProducida: 1,
    unidadMedida: 'unidades',
    observaciones: '',
    recetasUtilizadas: [], // Solo recetas - ingredientes removidos
    operador: '',
    productoDelCatalogo: null
  });

  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [productosProduccion, setProductosProduccion] = useState([]);
  const [mostrarSelectorCatalogo, setMostrarSelectorCatalogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [validandoNombre, setValidandoNombre] = useState(false);
  const [nombreDisponible, setNombreDisponible] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Solo cargar recetas y productos - ingredientes removidos
      const [recetasResponse, productosResponse] = await Promise.all([
        recetaService.obtenerRecetas({ activo: true }),
        catalogoProduccionService.obtenerProductosPorModulo({ 
          moduloSistema: 'produccion', 
          activo: true 
        })
      ]);

      setRecetasDisponibles(recetasResponse.data);
      
      if (Array.isArray(productosResponse)) {
        setProductosProduccion(productosResponse);
      } else if (productosResponse && Array.isArray(productosResponse.data)) {
        setProductosProduccion(productosResponse.data);
      } else if (productosResponse && Array.isArray(productosResponse.productos)) {
        setProductosProduccion(productosResponse.productos);
      } else {
        setProductosProduccion([]);
      }
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // REMOVIDO: agregarIngrediente - ya no se usa
  
  const agregarRecetaPreparada = () => {
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

  // REMOVIDO: eliminarIngrediente - ya no se usa
  
  const eliminarReceta = (index) => {
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: prev.recetasUtilizadas.filter((_, i) => i !== index)
    }));
  };

  // REMOVIDO: actualizarIngrediente - ya no se usa

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

  // Calcular costo solo con recetas - ingredientes removidos
  const calcularCostoTotal = () => {
    return formData.recetasUtilizadas.reduce((total, item) => {
      return total + (item.cantidadUtilizada * item.costoUnitario);
    }, 0);
  };

  const seleccionarProductoDelCatalogo = (producto) => {
    setFormData(prev => ({
      ...prev,
      productoDelCatalogo: producto,
      nombre: producto.nombre,
      unidadMedida: producto.unidadMedida || 'unidades'
    }));
    
    validarNombreProduccion(producto.nombre);
    setMostrarSelectorCatalogo(false);
  };

  const limpiarSeleccionCatalogo = () => {
    setFormData(prev => ({
      ...prev,
      productoDelCatalogo: null,
      nombre: ''
    }));
    
    setNombreDisponible(null);
    setError('');
  };

  const validarNombreProduccion = async (nombre) => {
    if (!nombre.trim()) {
      setNombreDisponible(null);
      return;
    }

    setValidandoNombre(true);
    try {
      const response = await produccionService.verificarNombreDisponible(nombre);
      setNombreDisponible(response.disponible);
      
      if (!response.disponible) {
        setError('Ya existe una producción activa con este nombre.');
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Error al validar nombre:', error);
      setNombreDisponible(null);
    } finally {
      setValidandoNombre(false);
    }
  };

  const validarFormulario = () => {
    if (!formData.productoDelCatalogo) {
      setError('Debe seleccionar un producto del catálogo de producción');
      return false;
    }

    if (!formData.nombre.trim()) {
      setError('El nombre de la producción es requerido');
      return false;
    }

    if (nombreDisponible === false) {
      setError('Ya existe una producción activa con este nombre.');
      return false;
    }

    if (formData.cantidadProducida <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return false;
    }

    if (!formData.operador.trim()) {
      setError('El operador responsable es requerido');
      return false;
    }

    // Solo validar recetas - ingredientes removidos
    if (formData.recetasUtilizadas.length === 0) {
      setError('Debe agregar al menos una receta preparada');
      return false;
    }

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
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);
    try {
      const datosProduccion = {
        ...formData,
        nombre: formData.productoDelCatalogo.nombre,
        costoTotal: calcularCostoTotal(),
        tipo: 'manual'
      };

      await produccionService.crearProduccionManual(datosProduccion);
      onGuardar();
    } catch (err) {
      setError('Error al crear producción: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-xl rounded-2xl bg-white border-gray-100">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-0 sm:p-4">
      <div className="relative sm:top-2 mx-auto p-0 w-full sm:w-[95%] max-w-6xl shadow-xl sm:rounded-2xl bg-white h-full sm:h-auto sm:max-h-[95vh] flex flex-col border border-gray-100">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-4 sm:px-5 py-4 rounded-t-2xl flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Nueva Producción
            </h3>
            <button
              type="button"
              onClick={onCancelar}
              className="p-1.5 hover:bg-white/80 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mx-4 sm:mx-5 mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}
          
          {/* Información sobre Producción Manual - Oculta en móvil */}
          <div className="hidden sm:flex mx-4 sm:mx-5 mt-3 bg-blue-50/60 border border-blue-100 rounded-xl p-3 items-center gap-3">
            <Zap size={20} className="text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Producción Manual</h4>
              <p className="text-xs text-blue-700">Especifica ingredientes y recetas para crear el producto final.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-3">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
              {/* COLUMNA IZQUIERDA - Información del Producto */}
              <div className="space-y-2 sm:space-y-3 lg:overflow-y-auto lg:pr-2">
                <div className="bg-gray-50/60 p-2 sm:p-3 rounded-xl border border-gray-100">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">Información del Producto</h4>

                  <div className="space-y-2 sm:space-y-3">
                    {/* Selector del Catálogo */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Factory size={14} className="text-gray-400" /> Producto del Catálogo *
                      </label>
                      {formData.productoDelCatalogo ? (
                        <div className={`p-2 sm:p-3 border rounded-xl ${
                          nombreDisponible === true ? 'bg-green-50 border-green-200' :
                          nombreDisponible === false ? 'bg-red-50 border-red-200' : 
                          'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className={`font-medium ${
                                  nombreDisponible === false ? 'text-red-800' : 'text-green-800'
                                }`}>
                                  {formData.productoDelCatalogo.nombre}
                                </p>
                                {validandoNombre && (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                )}
                                {!validandoNombre && nombreDisponible === true && (
                                  <span className="text-green-500 text-lg">✓</span>
                                )}
                                {!validandoNombre && nombreDisponible === false && (
                                  <span className="text-red-500 text-lg">✗</span>
                                )}
                              </div>
                              <p className={`text-sm ${
                                nombreDisponible === false ? 'text-red-600' : 'text-green-600'
                              }`}>
                                Código: {formData.productoDelCatalogo.codigo}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={limpiarSeleccionCatalogo}
                              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded-xl"
                              title="Cambiar producto"
                            >
                              <RefreshCw size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMostrarSelectorCatalogo(true)}
                          className="w-full p-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <FileText size={20} className="text-blue-400" />
                            <span className="font-medium">Seleccionar Producto</span>
                          </div>
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cantidad Producida *</label>
                      <input 
                        type="number" 
                        min="1" 
                        step="1" 
                        value={formData.cantidadProducida} 
                        onChange={(e) => setFormData(prev => ({ ...prev, cantidadProducida: parseInt(e.target.value) || 1 }))} 
                        className="w-full p-2 sm:p-3 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
                      <select 
                        value={formData.unidadMedida} 
                        onChange={(e) => setFormData(prev => ({ ...prev, unidadMedida: e.target.value }))} 
                        className="w-full p-2 sm:p-3 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="unidades">Unidades</option>
                        <option value="kg">Kilogramos</option>
                        <option value="litros">Litros</option>
                        <option value="porciones">Porciones</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Operador Responsable *</label>
                      <input 
                        type="text" 
                        value={formData.operador} 
                        onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))} 
                        className="w-full p-2 sm:p-3 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Nombre del operador" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea 
                        value={formData.observaciones} 
                        onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))} 
                        rows={2} 
                        className="w-full p-2 sm:p-3 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Observaciones adicionales (opcional)" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* COLUMNA DERECHA - Ingredientes y Recetas */}
              <div className="space-y-2 sm:space-y-3 lg:overflow-y-auto lg:pl-2">
                {/* Sección de Ingredientes Básicos REMOVIDA - Solo se usan recetas */}
                  

                {/* Recetas Preparadas */}
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-xl text-xs font-semibold">
                        {formData.recetasUtilizadas.filter(rec => rec.receta && rec.cantidadUtilizada > 0).length}
                      </span>
                      <FileText size={16} className="text-blue-500" /> Recetas Preparadas
                    </h4>
                  </div>
                  
                  <div className="mb-3">
                    <button 
                      type="button" 
                      onClick={agregarRecetaPreparada} 
                      className="w-full py-2 px-3 flex items-center justify-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors text-sm font-medium"
                    >
                      <Plus size={16} /> Agregar Receta
                    </button>
                  </div>

                  {formData.recetasUtilizadas.length === 0 ? (
                    <div className="text-center py-3 text-gray-500 text-sm bg-white rounded-xl border border-dashed border-gray-300">
                      No hay recetas agregadas
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.recetasUtilizadas.map((item, index) => {
                        const recetaInfo = obtenerRecetaInfo(item.receta);
                        // 🎯 FIX: Usar el costoUnitario guardado en item o del backend
                        // Ya no calculamos localmente porque el backend lo hace correctamente
                        // incluyendo sub-recetas anidadas
                        const precioUnitario = item.costoUnitario || recetaInfo?.costoUnitario || 0;
                        return (
                          <div key={index} className="bg-blue-50/60 p-2 rounded-xl border border-blue-100 text-xs">
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-5">
                                <select 
                                  value={item.receta} 
                                  onChange={(e) => {
                                    actualizarReceta(index, 'receta', e.target.value);
                                    const rec = obtenerRecetaInfo(e.target.value);
                                    // 🎯 FIX: Usar costoUnitario del backend (ya incluye sub-recetas)
                                    let precio = 0;
                                    if (rec) {
                                      // El backend ahora retorna costoUnitario pre-calculado
                                      precio = rec.costoUnitario || 0;
                                    }
                                    actualizarReceta(index, 'costoUnitario', precio);
                                  }} 
                                  className="w-full p-1 text-xs border border-gray-200 rounded-xl"
                                >
                                  <option value="">Seleccionar...</option>
                                  {recetasDisponibles.filter(receta => {
                                    const producido = receta.inventario?.cantidadProducida || 0;
                                    const utilizado = receta.inventario?.cantidadUtilizada || 0;
                                    return (producido - utilizado) > 0;
                                  }).map(receta => {
                                    const producido = receta.inventario?.cantidadProducida || 0;
                                    const utilizado = receta.inventario?.cantidadUtilizada || 0;
                                    const disponible = producido - utilizado;
                                    
                                    return (
                                      <option key={receta._id} value={receta._id}>
                                        {receta.nombre.substring(0, 15)}{receta.nombre.length > 15 ? '...' : ''} (Stock: {disponible})
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <div className="col-span-2">
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  value={item.cantidadUtilizada} 
                                  onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)} 
                                  className="w-full p-1 text-xs border border-gray-200 rounded-xl" 
                                />
                              </div>
                              <div className="col-span-2 text-center text-gray-600">
                                {recetaInfo?.rendimiento?.unidadMedida || 'unid'}
                              </div>
                              <div className="col-span-2 text-center font-medium text-blue-700">
                                S/.{(item.cantidadUtilizada * precioUnitario).toFixed(2)}
                              </div>
                              <div className="col-span-1 text-center">
                                <button 
                                  type="button" 
                                  onClick={() => eliminarReceta(index)} 
                                  className="p-1 text-red-600 hover:bg-red-50 rounded-xl"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Resumen de costos compacto */}
                  <div className="mt-2 sm:mt-3 lg:mt-4 p-2 bg-white rounded-xl border border-gray-100">
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs text-center">
                      <div>
                        <div className="font-bold text-gray-400">
                          S/.0.00
                        </div>
                        <div className="text-gray-400">Ingredientes</div>
                      </div>
                      <div>
                        <div className="font-bold text-blue-600">
                          S/.{formData.recetasUtilizadas.reduce((total, item) => 
                            total + (item.cantidadUtilizada * item.costoUnitario), 0).toFixed(2)}
                        </div>
                        <div className="text-gray-600">Recetas</div>
                      </div>
                      <div>
                        <div className="font-bold text-purple-600">
                          S/.{calcularCostoTotal().toFixed(2)}
                        </div>
                        <div className="text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 border-t border-gray-200 bg-gray-50/60 -mx-3 -mb-3 px-3 pb-3 rounded-b-xl">
                    <div className="flex gap-2 sm:gap-3">
                      <button 
                        type="button" 
                        onClick={onCancelar} 
                        className="flex-1 px-3 sm:px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors text-sm sm:text-base font-medium" 
                        disabled={enviando}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={enviando} 
                        className="flex-1 px-3 sm:px-4 py-2 flex items-center justify-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
                      >
                        {enviando ? <><Loader2 size={16} className="animate-spin" /> Creando...</> : 'Crear Producción'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Selector del Catálogo */}
        {mostrarSelectorCatalogo && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white sm:rounded-2xl shadow-xl border border-gray-100 w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[85vh] flex flex-col">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-4 sm:px-5 py-4 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2"><Factory size={20} className="text-blue-500" /> Catálogo de Producción</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Selecciona un producto para continuar</p>
                </div>
                <button
                  onClick={() => setMostrarSelectorCatalogo(false)}
                  className="p-1.5 hover:bg-white/80 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {productosProduccion.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">No hay productos disponibles</h4>
                    <p className="text-gray-500 mb-4">No se encontraron productos de producción en el catálogo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productosProduccion.map(producto => (
                      <div
                        key={producto._id}
                        onClick={() => seleccionarProductoDelCatalogo(producto)}
                        className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{producto.nombre}</h4>
                            <p className="text-sm text-gray-500">{producto.codigo}</p>
                          </div>
                          <div className="text-blue-500 text-2xl"><Factory size={24} /></div>
                        </div>
                        
                        {producto.descripcion && (
                          <p className="text-sm text-gray-600 mb-3">{producto.descripcion}</p>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-xl text-xs">
                            {producto.unidadMedida || 'Unidad'}
                          </span>
                          {producto.costoEstimado > 0 && (
                            <span className="text-green-600 font-semibold text-sm">
                              S/.{producto.costoEstimado.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t px-6 py-4 bg-gray-50/60 rounded-b-2xl">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Al seleccionar un producto, se auto-completará la información básica
                  </div>
                  <button
                    onClick={() => setMostrarSelectorCatalogo(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NuevaProduccion;
