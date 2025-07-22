import React, { useState, useEffect } from 'react';
import { produccionService } from '../../../services/produccionService';
import { ingredienteService } from '../../../services/ingredienteService';
import { recetaService } from '../../../services/recetaService';
import { catalogoProduccionService } from '../../../services/catalogoProduccionService';

const NuevaProduccion = ({ onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    cantidadProducida: 1,
    unidadMedida: 'unidades',
    observaciones: '',
    ingredientesUtilizados: [],
    recetasUtilizadas: [],
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
      const [ingredientesResponse, recetasResponse, productosResponse] = await Promise.all([
        ingredienteService.obtenerIngredientes({ activo: true }),
        recetaService.obtenerRecetas({ activo: true }),
        catalogoProduccionService.obtenerProductosPorModulo({ 
          moduloSistema: 'produccion', 
          activo: true 
        })
      ]);

      setIngredientesDisponibles(ingredientesResponse.data);
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

  const eliminarIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredientesUtilizados: prev.ingredientesUtilizados.filter((_, i) => i !== index)
    }));
  };

  const eliminarReceta = (index) => {
    setFormData(prev => ({
      ...prev,
      recetasUtilizadas: prev.recetasUtilizadas.filter((_, i) => i !== index)
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
      return total + (item.cantidadUtilizada * item.costoUnitario);
    }, 0);

    const costoRecetas = formData.recetasUtilizadas.reduce((total, item) => {
      return total + (item.cantidadUtilizada * item.costoUnitario);
    }, 0);

    return costoIngredientes + costoRecetas;
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

    if (formData.ingredientesUtilizados.length === 0 && formData.recetasUtilizadas.length === 0) {
      setError('Debe agregar al menos un ingrediente o receta preparada');
      return false;
    }

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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-2 mx-auto p-4 border w-[95%] max-w-6xl shadow-lg rounded-md bg-white max-h-[95vh] flex flex-col">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Nueva Producción
              <span className="text-xs text-blue-500 ml-2 hidden sm:inline">(Manual - Con Catálogo)</span>
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

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          )}
          
          {/* Información sobre Producción Manual - Compacta */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚡</span>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Producción Manual</h4>
                <p className="text-xs text-blue-700">Especifica ingredientes y recetas para crear el producto final.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* COLUMNA IZQUIERDA - Información del Producto */}
              <div className="space-y-4 overflow-y-auto pr-2">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Información del Producto</h4>

                  <div className="space-y-3">
                    {/* Selector del Catálogo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🏭 Producto del Catálogo *
                      </label>
                      {formData.productoDelCatalogo ? (
                        <div className={`p-3 border rounded-md ${
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
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
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
                              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-100 rounded"
                              title="Cambiar producto"
                            >
                              🔄
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMostrarSelectorCatalogo(true)}
                          className="w-full p-3 border-2 border-dashed border-blue-300 rounded-md text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-xl">📋</span>
                            <span className="font-medium">Seleccionar Producto</span>
                          </div>
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Producida *</label>
                      <input 
                        type="number" 
                        min="1" 
                        step="1" 
                        value={formData.cantidadProducida} 
                        onChange={(e) => setFormData(prev => ({ ...prev, cantidadProducida: parseInt(e.target.value) || 1 }))} 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
                      <select 
                        value={formData.unidadMedida} 
                        onChange={(e) => setFormData(prev => ({ ...prev, unidadMedida: e.target.value }))} 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="unidades">Unidades</option>
                        <option value="kg">Kilogramos</option>
                        <option value="litros">Litros</option>
                        <option value="porciones">Porciones</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operador Responsable *</label>
                      <input 
                        type="text" 
                        value={formData.operador} 
                        onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))} 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Nombre del operador" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea 
                        value={formData.observaciones} 
                        onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))} 
                        rows={2} 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Observaciones adicionales (opcional)" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* COLUMNA DERECHA - Ingredientes y Recetas */}
              <div className="space-y-4 overflow-y-auto pl-2">
                {/* Ingredientes Básicos */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {formData.ingredientesUtilizados.filter(ing => ing.ingrediente && ing.cantidadUtilizada > 0).length}
                      </span>
                      🥬 Ingredientes Básicos
                    </h4>
                  </div>
                  
                  <div className="mb-3">
                    <button 
                      type="button" 
                      onClick={agregarIngrediente} 
                      className="w-full py-2 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ➕ Agregar Ingrediente
                    </button>
                  </div>

                  {formData.ingredientesUtilizados.length === 0 ? (
                    <div className="text-center py-3 text-gray-500 text-sm bg-white rounded-md border border-dashed border-gray-300">
                      No hay ingredientes agregados
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.ingredientesUtilizados.map((item, index) => {
                        const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
                        return (
                          <div key={index} className="bg-white p-2 rounded-md border text-xs">
                            <div className="grid grid-cols-12 gap-2 items-center">
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
                                  className="w-full p-1 text-xs border border-gray-300 rounded"
                                >
                                  <option value="">Seleccionar...</option>
                                  {ingredientesDisponibles.filter(ingrediente => 
                                    (ingrediente.cantidad - (ingrediente.procesado || 0)) > 0
                                  ).map(ingrediente => (
                                    <option key={ingrediente._id} value={ingrediente._id}>
                                      {ingrediente.nombre.substring(0, 15)}{ingrediente.nombre.length > 15 ? '...' : ''} - {ingrediente.cantidad - (ingrediente.procesado || 0)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-2">
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  value={item.cantidadUtilizada} 
                                  onChange={(e) => actualizarIngrediente(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)} 
                                  className="w-full p-1 text-xs border border-gray-300 rounded" 
                                />
                              </div>
                              <div className="col-span-2 text-center text-gray-600">
                                {ingredienteInfo?.unidadMedida || 'unid'}
                              </div>
                              <div className="col-span-2 text-center font-medium text-green-700">
                                S/.{(item.cantidadUtilizada * (ingredienteInfo?.precioUnitario || 0)).toFixed(2)}
                              </div>
                              <div className="col-span-1 text-center">
                                <button 
                                  type="button" 
                                  onClick={() => eliminarIngrediente(index)} 
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
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

                {/* Recetas Preparadas */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {formData.recetasUtilizadas.filter(rec => rec.receta && rec.cantidadUtilizada > 0).length}
                      </span>
                      📋 Recetas Preparadas
                    </h4>
                  </div>
                  
                  <div className="mb-3">
                    <button 
                      type="button" 
                      onClick={agregarRecetaPreparada} 
                      className="w-full py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      ➕ Agregar Receta
                    </button>
                  </div>

                  {formData.recetasUtilizadas.length === 0 ? (
                    <div className="text-center py-3 text-gray-500 text-sm bg-white rounded-md border border-dashed border-gray-300">
                      No hay recetas agregadas
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {formData.recetasUtilizadas.map((item, index) => {
                        const recetaInfo = obtenerRecetaInfo(item.receta);
                        let precioUnitario = 0;
                        if (recetaInfo && recetaInfo.ingredientes && recetaInfo.ingredientes.length > 0 && recetaInfo.rendimiento?.cantidad > 0) {
                          let costoTotal = 0;
                          for (const ing of recetaInfo.ingredientes) {
                            if (ing.ingrediente && typeof ing.ingrediente.precioUnitario === 'number') {
                              costoTotal += (Number(ing.cantidad) || 0) * (Number(ing.ingrediente.precioUnitario) || 0);
                            }
                          }
                          precioUnitario = costoTotal / Number(recetaInfo.rendimiento.cantidad);
                        }
                        return (
                          <div key={index} className="bg-blue-50 p-2 rounded-md border text-xs">
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-5">
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
                                          costoTotal += (Number(ing.cantidad) || 0) * (Number(ing.ingrediente.precioUnitario) || 0);
                                        }
                                      }
                                      precio = costoTotal / Number(rec.rendimiento.cantidad);
                                    }
                                    actualizarReceta(index, 'costoUnitario', precio);
                                  }} 
                                  className="w-full p-1 text-xs border border-gray-300 rounded"
                                >
                                  <option value="">Seleccionar...</option>
                                  {recetasDisponibles.filter(receta => {
                                    const producido = receta.inventario?.cantidadProducida || 0;
                                    const utilizado = receta.inventario?.cantidadUtilizada || 0;
                                    return (producido - utilizado) > 0;
                                  }).map(receta => (
                                    <option key={receta._id} value={receta._id}>
                                      {receta.nombre.substring(0, 15)}{receta.nombre.length > 15 ? '...' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-2">
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  value={item.cantidadUtilizada} 
                                  onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)} 
                                  className="w-full p-1 text-xs border border-gray-300 rounded" 
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
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
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

                  {/* Resumen de costos compacto */}
                  <div className="mt-4 p-2 bg-white rounded-md border">
                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div>
                        <div className="font-bold text-green-600">
                          S/.{formData.ingredientesUtilizados.reduce((total, item) => 
                            total + (item.cantidadUtilizada * item.costoUnitario), 0).toFixed(2)}
                        </div>
                        <div className="text-gray-600">Ingredientes</div>
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
                  <div className="mt-4 pt-3 border-t border-gray-200 bg-gray-50 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg">
                    <div className="flex justify-end space-x-3">
                      <button 
                        type="button" 
                        onClick={onCancelar} 
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium" 
                        disabled={enviando}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={enviando} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        {enviando ? 'Creando...' : 'Crear Producción'}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🏭 Catálogo de Producción</h3>
                  <p className="text-sm text-gray-500 mt-1">Selecciona un producto para continuar</p>
                </div>
                <button
                  onClick={() => setMostrarSelectorCatalogo(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {productosProduccion.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-300 text-6xl mb-4">📦</div>
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
                          <div className="text-blue-500 text-2xl">🏭</div>
                        </div>
                        
                        {producto.descripcion && (
                          <p className="text-sm text-gray-600 mb-3">{producto.descripcion}</p>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs">
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

              <div className="border-t px-6 py-4 bg-gray-50 rounded-b-xl">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    💡 Al seleccionar un producto, se auto-completará la información básica
                  </div>
                  <button
                    onClick={() => setMostrarSelectorCatalogo(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
