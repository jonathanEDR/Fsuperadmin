import React, { useState, useEffect } from 'react';
import { produccionService } from '../../../services/produccionService';
import { ingredienteService } from '../../../services/ingredienteService';
import { recetaService } from '../../../services/recetaService';

const NuevaProduccion = ({ onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    cantidadProducida: 1,
    unidadMedida: 'unidades',
    observaciones: '',
    ingredientesUtilizados: [],
    recetasUtilizadas: [],
    operador: ''
  });

  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ingredientesResponse, recetasResponse] = await Promise.all([
        ingredienteService.obtenerIngredientes({ activo: true }),
        recetaService.obtenerRecetas({ activo: true })
      ]);

      setIngredientesDisponibles(ingredientesResponse.data);
      setRecetasDisponibles(recetasResponse.data);
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

  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del producto es requerido');
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
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[ 490vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Nueva Producción
          </h3>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Información sobre Producción Manual */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚡</span>
              <div>
                <h3 className="text-lg font-medium text-blue-900">Producción Manual</h3>
                <p className="text-sm text-blue-700">
                  Especifica manualmente los ingredientes básicos y recetas preparadas que utilizarás para crear el producto final.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Información del Producto */}
            <div className="bg-white p-4 rounded-lg border mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Información del Producto</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Pizza Margherita Especial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Producida *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de Medida *
                  </label>
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
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operador Responsable *
                </label>
                <input
                  type="text"
                  value={formData.operador}
                  onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del operador"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observaciones adicionales (opcional)"
                />
              </div>
            </div>

            {/* Ingredientes Básicos Utilizados */}
            <div className="bg-white p-4 rounded-lg border mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">🥬 Ingredientes Básicos Utilizados</h4>
                <button
                  type="button"
                  onClick={agregarIngrediente}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  + Agregar Ingrediente
                </button>
              </div>

              {formData.ingredientesUtilizados.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay ingredientes agregados. Haz clic en "Agregar Ingrediente" para comenzar.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.ingredientesUtilizados.map((item, index) => {
                    const ingredienteInfo = obtenerIngredienteInfo(item.ingrediente);
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <select
                            value={item.ingrediente}
                            onChange={(e) => {
                              actualizarIngrediente(index, 'ingrediente', e.target.value);
                              const ing = obtenerIngredienteInfo(e.target.value);
                              if (ing) {
                                actualizarIngrediente(index, 'costoUnitario', ing.precioUnitario || 0);
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleccionar ingrediente...</option>
                            {ingredientesDisponibles
                              .filter(ingrediente => (ingrediente.cantidad - (ingrediente.procesado || 0)) > 0)
                              .map(ingrediente => (
                                <option key={ingrediente._id} value={ingrediente._id}>
                                  {ingrediente.nombre} - Disponible: {ingrediente.cantidad - (ingrediente.procesado || 0)} {ingrediente.unidadMedida}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="w-32">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.cantidadUtilizada}
                            onChange={(e) => actualizarIngrediente(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)}
                            placeholder="Cantidad"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {ingredienteInfo?.unidadMedida || 'Unidad'}
                          </div>
                        </div>

                        <div className="w-32">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={ingredienteInfo?.precioUnitario || 0}
                            disabled
                            placeholder="Costo unitario"
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            S/. por {ingredienteInfo?.unidadMedida || 'unidad'}
                          </div>
                        </div>

                        <div className="w-24 text-center">
                          <div className="font-medium text-gray-900">
                            S/.{(item.cantidadUtilizada * (ingredienteInfo?.precioUnitario || 0)).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => eliminarIngrediente(index)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recetas Preparadas Utilizadas */}
            <div className="bg-white p-4 rounded-lg border mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">📋 Recetas Preparadas Utilizadas</h4>
                <button
                  type="button"
                  onClick={agregarRecetaPreparada}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  + Agregar Receta Preparada
                </button>
              </div>

              {formData.recetasUtilizadas.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay recetas preparadas agregadas. Haz clic en "Agregar Receta Preparada" para agregar recetas ya elaboradas como masa, salsa, etc.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.recetasUtilizadas.map((item, index) => {
                    const recetaInfo = obtenerRecetaInfo(item.receta);
                    // Calcular precio unitario de la receta preparada
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
                          <select
                            value={item.receta}
                            onChange={(e) => {
                              actualizarReceta(index, 'receta', e.target.value);
                              const rec = obtenerRecetaInfo(e.target.value);
                              // Calcular y setear el precio unitario automáticamente
                              let precio = 0;
                              if (rec && rec.ingredientes && rec.ingredientes.length > 0 && rec.rendimiento?.cantidad > 0) {
                                let costoTotal = 0;
                                for (const ing of rec.ingredientes) {
                                  if (ing.ingrediente && typeof ing.ingrediente.precioUnitario === 'number' && ing.ingrediente.precioUnitario > 0) {
                                    costoTotal += (Number(ing.cantidad) || 0) * (Number(ing.ingrediente.precioUnitario) || 0);
                                  }
                                }
                                precio = costoTotal / Number(rec.rendimiento.cantidad);
                              }
                              actualizarReceta(index, 'costoUnitario', precio);
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleccionar receta preparada...</option>
                            {recetasDisponibles
                              .filter(receta => {
                                // Calcular disponible correctamente
                                const producido = receta.inventario?.cantidadProducida || 0;
                                const utilizado = receta.inventario?.cantidadUtilizada || 0;
                                const disponible = producido - utilizado;
                                return disponible > 0;
                              })
                              .map(receta => {
                                const producido = receta.inventario?.cantidadProducida || 0;
                                const utilizado = receta.inventario?.cantidadUtilizada || 0;
                                const disponible = producido - utilizado;
                                return (
                                  <option key={receta._id} value={receta._id}>
                                    {receta.nombre} - Disponible: {disponible} {receta.rendimiento?.unidadMedida || ''}
                                  </option>
                                );
                              })}
                          </select>
                        </div>

                        <div className="w-32">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.cantidadUtilizada}
                            onChange={(e) => actualizarReceta(index, 'cantidadUtilizada', parseFloat(e.target.value) || 0)}
                            placeholder="Cantidad"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {recetaInfo?.rendimiento?.unidadMedida || 'Unidad'}
                          </div>
                        </div>

                        <div className="w-32">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={precioUnitario}
                            disabled
                            placeholder="Costo unitario"
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            S/. por {recetaInfo?.rendimiento?.unidadMedida || 'unidad'}
                          </div>
                        </div>

                        <div className="w-24 text-center">
                          <div className="font-medium text-gray-900">
                            S/.{(item.cantidadUtilizada * precioUnitario).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => eliminarReceta(index)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumen de Costos */}
            <div className="bg-gray-50 p-4 rounded-lg border mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">💰 Resumen de Costos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-green-600">
                    S/.{formData.ingredientesUtilizados.reduce((total, item) => total + (item.cantidadUtilizada * item.costoUnitario), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Costo Ingredientes</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-blue-600">
                    S/.{formData.recetasUtilizadas.reduce((total, item) => total + (item.cantidadUtilizada * item.costoUnitario), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Costo Recetas</div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-purple-600">
                    S/.{calcularCostoTotal().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Costo Total</div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancelar}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {enviando ? 'Creando...' : 'Crear Producción'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NuevaProduccion;
