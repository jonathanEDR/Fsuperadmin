import React, { useState, useEffect } from 'react';
import { produccionService } from '../../../services/produccionService';
import { ingredienteService } from '../../../services/ingredienteService';
import { recetaService } from '../../../services/recetaService';
import { catalogoProduccionService } from '../../../services/catalogoProduccionService';

console.log('🔍 Debug - catalogoProduccionService importado:', catalogoProduccionService);

const NuevaProduccion = ({ onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    cantidadProducida: 1,
    unidadMedida: 'unidades',
    observaciones: '',
    ingredientesUtilizados: [],
    recetasUtilizadas: [],
    operador: '',
    // ✨ NUEVO: Campo para producto del catálogo
    productoDelCatalogo: null
  });

  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  // ✨ NUEVO: Estado para productos del catálogo de producción
  const [productosProduccion, setProductosProduccion] = useState([]);
  const [mostrarSelectorCatalogo, setMostrarSelectorCatalogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ingredientesResponse, recetasResponse, productosResponse] = await Promise.all([
        ingredienteService.obtenerIngredientes({ activo: true }),
        recetaService.obtenerRecetas({ activo: true }),
        // ✨ NUEVO: Cargar productos del catálogo de producción usando filtro por módulo
        catalogoProduccionService.obtenerProductosPorModulo({ 
          moduloSistema: 'produccion', 
          activo: true 
        })
      ]);

      setIngredientesDisponibles(ingredientesResponse.data);
      setRecetasDisponibles(recetasResponse.data);
      // ✨ NUEVO: Debug - ver qué devuelve la API
      console.log('🔍 Respuesta de productos de producción:', productosResponse);
      
      // ✨ NUEVO: Establecer productos del catálogo - manejo defensivo de la respuesta
      if (Array.isArray(productosResponse)) {
        setProductosProduccion(productosResponse);
      } else if (productosResponse && Array.isArray(productosResponse.data)) {
        setProductosProduccion(productosResponse.data);
      } else if (productosResponse && Array.isArray(productosResponse.productos)) {
        setProductosProduccion(productosResponse.productos);
      } else {
        setProductosProduccion([]);
        console.warn('Respuesta de productos no es un array válido:', productosResponse);
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

  // ✅ CORRECTO: Solo elimina del formulario temporal, NO afecta el stock
  // El stock se actualiza cuando se guarda toda la producción
  const eliminarIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredientesUtilizados: prev.ingredientesUtilizados.filter((_, i) => i !== index)
    }));
  };

  // ✅ CORRECTO: Solo elimina del formulario temporal, NO afecta el stock  
  // El stock se actualiza cuando se guarda toda la producción
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

  // ✨ NUEVAS FUNCIONES PARA CATÁLOGO
  const seleccionarProductoDelCatalogo = (producto) => {
    setFormData(prev => ({
      ...prev,
      productoDelCatalogo: producto,
      nombre: producto.nombre, // Auto-llenar el nombre
      unidadMedida: producto.unidadMedida || 'unidades' // Auto-llenar unidad de medida si está disponible
    }));
    setMostrarSelectorCatalogo(false);
  };

  const limpiarSeleccionCatalogo = () => {
    setFormData(prev => ({
      ...prev,
      productoDelCatalogo: null,
      nombre: '' // Limpiar el nombre también
    }));
  };

  const validarFormulario = () => {
    if (!formData.productoDelCatalogo) {
      setError('Debe seleccionar un producto del catálogo de producción');
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
        // Usar el nombre del producto seleccionado del catálogo
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
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Producción</h3>
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
          )}
          {/* Información sobre Producción Manual */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚡</span>
              <div>
                <h3 className="text-lg font-medium text-blue-900">Producción Manual</h3>
                <p className="text-sm text-blue-700">Especifica manualmente los ingredientes básicos y recetas preparadas que utilizarás para crear el producto final.</p>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
          <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto">
            {/* Columna Izquierda: Información del Producto */}
            <div className="md:w-1/2 w-full flex-shrink-0 flex flex-col">
              <div className="bg-white p-4 rounded-lg border mb-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Información del Producto</h4>

                <div className="grid grid-cols-1 gap-4">
                  {/* ✨ SELECTOR DEL CATÁLOGO INTEGRADO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏭 Producto del Catálogo (Requerido) *
                    </label>
                    {formData.productoDelCatalogo ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">{formData.productoDelCatalogo.nombre}</p>
                            <p className="text-sm text-green-600">Código: {formData.productoDelCatalogo.codigo}</p>
                            {formData.productoDelCatalogo.descripcion && (
                              <p className="text-xs text-green-500 mt-1">{formData.productoDelCatalogo.descripcion}</p>
                            )}
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
                          <span className="font-medium">Seleccionar Producto del Catálogo</span>
                        </div>
                        <p className="text-sm text-blue-500 mt-1">
                          Requerido: Elige un producto del catálogo de producción
                        </p>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Producida *</label>
                    <input type="number" min="1" step="1" value={formData.cantidadProducida} onChange={(e) => setFormData(prev => ({ ...prev, cantidadProducida: parseInt(e.target.value) || 1 }))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
                    <select value={formData.unidadMedida} onChange={(e) => setFormData(prev => ({ ...prev, unidadMedida: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                      <option value="unidades">Unidades</option>
                      <option value="kg">Kilogramos</option>
                      <option value="litros">Litros</option>
                      <option value="porciones">Porciones</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operador Responsable *</label>
                    <input type="text" value={formData.operador} onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Nombre del operador" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea value={formData.observaciones} onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Observaciones adicionales (opcional)" />
                  </div>
                </div>
              </div>
            </div>
            {/* Columna Derecha: Ingredientes y Recetas */}
            <div className="md:w-1/2 w-full flex flex-col gap-4">
              {/* Ingredientes Básicos Utilizados */}
              <div className="bg-white p-4 rounded-lg border flex-1 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">🥬 Ingredientes Básicos Utilizados</h4>
                  <button type="button" onClick={agregarIngrediente} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">+ Agregar Ingrediente</button>
                </div>
                {formData.ingredientesUtilizados.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay ingredientes agregados. Haz clic en "Agregar Ingrediente" para comenzar.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.ingredientesUtilizados.map((item, index) => {
                      const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <select value={item.ingrediente} onChange={(e) => {actualizarIngrediente(index, 'ingrediente', e.target.value);const ing = obtenerIngredienteInfo(e.target.value);if (ing) {actualizarIngrediente(index, 'costoUnitario', ing.precioUnitario || 0);}}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                              <option value="">Seleccionar ingrediente...</option>
                              {ingredientesDisponibles.filter(ingrediente => (ingrediente.cantidad - (ingrediente.procesado || 0)) > 0).map(ingrediente => (
                                <option key={ingrediente._id} value={ingrediente._id}>{ingrediente.nombre} - Disponible: {ingrediente.cantidad - (ingrediente.procesado || 0)} {ingrediente.unidadMedida}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-32">
                            <input type="number" step="0.01" min="0" value={item.cantidadUtilizada} onChange={(e) => actualizarIngrediente(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)} placeholder="Cantidad" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            <div className="text-xs text-gray-500 mt-1">{ingredienteInfo?.unidadMedida || 'Unidad'}</div>
                          </div>
                          <div className="w-32">
                            <input type="number" step="0.01" min="0" value={ingredienteInfo?.precioUnitario || 0} disabled placeholder="Costo unitario" className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 focus:ring-blue-500 focus:border-blue-500" />
                            <div className="text-xs text-gray-500 mt-1">S/. por {ingredienteInfo?.unidadMedida || 'unidad'}</div>
                          </div>
                          <div className="w-24 text-center">
                            <div className="font-medium text-gray-900">S/.{(item.cantidadUtilizada * (ingredienteInfo?.precioUnitario || 0)).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                          <button type="button" onClick={() => eliminarIngrediente(index)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded">🗑️</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Recetas Preparadas Utilizadas */}
              <div className="bg-white p-4 rounded-lg border flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">📋 Recetas Preparadas Utilizadas</h4>
                  <button type="button" onClick={agregarRecetaPreparada} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">+ Agregar Receta Preparada</button>
                </div>
                {formData.recetasUtilizadas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay recetas preparadas agregadas. Haz clic en "Agregar Receta Preparada" para agregar recetas ya elaboradas como masa, salsa, etc.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.recetasUtilizadas.map((item, index) => {
                      const recetaInfo = obtenerRecetaInfo(item.receta);
                      let precioUnitario = 0;
                      if (recetaInfo && recetaInfo.ingredientes && recetaInfo.ingredientes.length > 0 && recetaInfo.rendimiento?.cantidad > 0) {
                        let costoTotal = 0;
                        for (const ing of recetaInfo.ingredientes) {
                          if (ing.ingrediente && typeof ing.ingrediente.precioUnitario === 'number' && ing.ingrediente.precioUnitario > 0) {
                            costoTotal += (Number(ing.cantidad) || 0) * (Number(ing.ingrediente.precioUnitario) || 0);
                          }
                        }
                        precioUnitario = costoTotal / Number(recetaInfo.rendimiento.cantidad);
                      }
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg bg-blue-50">
                          <div className="flex-1">
                            <select value={item.receta} onChange={(e) => {actualizarReceta(index, 'receta', e.target.value);const rec = obtenerRecetaInfo(e.target.value);let precio = 0;if (rec && rec.ingredientes && rec.ingredientes.length > 0 && rec.rendimiento?.cantidad > 0) {let costoTotal = 0;for (const ing of rec.ingredientes) {if (ing.ingrediente && typeof ing.ingrediente.precioUnitario === 'number' && ing.ingrediente.precioUnitario > 0) {costoTotal += (Number(ing.cantidad) || 0) * (Number(ing.ingrediente.precioUnitario) || 0);}}precio = costoTotal / Number(rec.rendimiento.cantidad);}actualizarReceta(index, 'costoUnitario', precio);}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                              <option value="">Seleccionar receta preparada...</option>
                              {recetasDisponibles.filter(receta => {const producido = receta.inventario?.cantidadProducida || 0;const utilizado = receta.inventario?.cantidadUtilizada || 0;const disponible = producido - utilizado;return disponible > 0;}).map(receta => {const producido = receta.inventario?.cantidadProducida || 0;const utilizado = receta.inventario?.cantidadUtilizada || 0;const disponible = producido - utilizado;return (<option key={receta._id} value={receta._id}>{receta.nombre} - Disponible: {disponible} {receta.rendimiento?.unidadMedida || ''}</option>);})}
                            </select>
                          </div>
                          <div className="w-32">
                            <input type="number" step="0.01" min="0" value={item.cantidadUtilizada} onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)} placeholder="Cantidad" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            <div className="text-xs text-gray-500 mt-1">{recetaInfo?.rendimiento?.unidadMedida || 'Unidad'}</div>
                          </div>
                          <div className="w-32">
                            <input type="number" step="0.01" min="0" value={precioUnitario} disabled placeholder="Costo unitario" className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 focus:ring-blue-500 focus:border-blue-500" />
                            <div className="text-xs text-gray-500 mt-1">S/. por {recetaInfo?.rendimiento?.unidadMedida || 'unidad'}</div>
                          </div>
                          <div className="w-24 text-center">
                            <div className="font-medium text-gray-900">S/.{(item.cantidadUtilizada * precioUnitario).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                          <button type="button" onClick={() => eliminarReceta(index)} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded">🗑️</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Resumen de Costos (abajo, fuera del scroll principal) */}
          <div className="bg-gray-50 p-4 rounded-lg border mt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-3">💰 Resumen de Costos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-green-600">S/.{formData.ingredientesUtilizados.reduce((total, item) => total + (item.cantidadUtilizada * item.costoUnitario), 0).toFixed(2)}</div>
                <div className="text-sm text-gray-600">Costo Ingredientes</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-blue-600">S/.{formData.recetasUtilizadas.reduce((total, item) => total + (item.cantidadUtilizada * item.costoUnitario), 0).toFixed(2)}</div>
                <div className="text-sm text-gray-600">Costo Recetas</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-purple-600">S/.{calcularCostoTotal().toFixed(2)}</div>
                <div className="text-sm text-gray-600">Costo Total</div>
              </div>
            </div>
          </div>
          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-4">
            <button type="button" onClick={onCancelar} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors" disabled={enviando}>Cancelar</button>
            <button type="submit" disabled={enviando} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">{enviando ? 'Creando...' : 'Crear Producción'}</button>
          </div>
        </form>

        {/* ✨ MODAL OPTIMIZADO: Selector del Catálogo */}
        {mostrarSelectorCatalogo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
              
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    🏭 Catálogo de Producción
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecciona un producto para continuar con la producción
                  </p>
                </div>
                <button
                  onClick={() => setMostrarSelectorCatalogo(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del Modal */}
              <div className="flex-1 overflow-y-auto p-6">
                {productosProduccion.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-300 text-6xl mb-4">📦</div>
                    <h4 className="text-lg font-medium text-gray-700 mb-2">
                      No hay productos disponibles
                    </h4>
                    <p className="text-gray-500 mb-4">
                      No se encontraron productos de producción en el catálogo.
                    </p>
                    <button
                      onClick={() => setMostrarSelectorCatalogo(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continuar sin selección
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Contador de productos */}
                    <div className="mb-4 text-center">
                      <span className="text-sm text-gray-500">
                        {productosProduccion.length} producto{productosProduccion.length !== 1 ? 's' : ''} disponible{productosProduccion.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Grid de productos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productosProduccion.map(producto => (
                        <div
                          key={producto._id}
                          onClick={() => seleccionarProductoDelCatalogo(producto)}
                          className="group border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all duration-200 bg-gradient-to-br from-white to-blue-50/20"
                        >
                          {/* Header del producto */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {producto.nombre}
                              </h4>
                              <p className="text-sm text-gray-500 font-mono">
                                {producto.codigo}
                              </p>
                            </div>
                            <div className="text-blue-500 text-2xl group-hover:scale-110 transition-transform">
                              🏭
                            </div>
                          </div>
                          
                          {/* Descripción */}
                          {producto.descripcion && (
                            <p className="text-sm text-gray-600 mb-3 overflow-hidden" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {producto.descripcion}
                            </p>
                          )}
                          
                          {/* Footer del producto */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                              {producto.unidadMedida || 'Unidad'}
                            </span>
                            {producto.costoEstimado > 0 && (
                              <span className="text-green-600 font-semibold text-sm">
                                S/.{producto.costoEstimado.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          {/* Indicador de acción */}
                          <div className="mt-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                              Clic para seleccionar
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Footer del Modal */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    💡 Tip: Al seleccionar un producto, se auto-completará la información básica
                  </div>
                  <button
                    onClick={() => setMostrarSelectorCatalogo(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
