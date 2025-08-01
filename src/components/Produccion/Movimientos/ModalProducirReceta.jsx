import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { ingredienteService } from '../../../services/ingredienteService';

const ModalProducirReceta = ({ isOpen, onClose, receta, onSuccess }) => {
  const [formData, setFormData] = useState({
    cantidadProducir: 1,
    motivo: 'Producción de receta',
    consumirIngredientes: true
  });
  
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [ingredientesNecesarios, setIngredientesNecesarios] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && receta) {
      resetearFormulario();
      cargarIngredientes();
      calcularIngredientesNecesarios();
    }
  }, [isOpen, receta]);

  const resetearFormulario = () => {
    setFormData({
      cantidadProducir: 1,
      motivo: 'Producción de receta',
      consumirIngredientes: true
    });
    setError('');
  };

  const cargarIngredientes = async () => {
    try {
      setLoading(true);
      const response = await ingredienteService.obtenerIngredientes({ activo: true });
      setIngredientesDisponibles(response.data || []);
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
      setIngredientesDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularIngredientesNecesarios = () => {
    if (!receta || !receta.ingredientes) return;

    const ingredientesCalculados = receta.ingredientes.map(ingredienteReceta => {
      const ingredienteInfo = ingredientesDisponibles.find(
        ing => ing._id === ingredienteReceta.ingrediente
      );
      
      const cantidadNecesaria = ingredienteReceta.cantidad * formData.cantidadProducir;
      const cantidadDisponible = ingredienteInfo?.cantidad || 0;
      const suficiente = cantidadDisponible >= cantidadNecesaria;

      return {
        ...ingredienteReceta,
        nombre: ingredienteInfo?.nombre || 'Ingrediente no encontrado',
        cantidadNecesaria,
        cantidadDisponible,
        suficiente,
        unidadMedida: ingredienteInfo?.unidadMedida || ingredienteReceta.unidadMedida
      };
    });

    setIngredientesNecesarios(ingredientesCalculados);
  };

  useEffect(() => {
    if (ingredientesDisponibles.length > 0 && receta) {
      calcularIngredientesNecesarios();
    }
  }, [formData.cantidadProducir, ingredientesDisponibles, receta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!receta) return;

    // Validar que hay suficientes ingredientes si se van a consumir
    if (formData.consumirIngredientes) {
      const ingredientesFaltantes = ingredientesNecesarios.filter(ing => !ing.suficiente);
      if (ingredientesFaltantes.length > 0) {
        setError(`Ingredientes insuficientes: ${ingredientesFaltantes.map(ing => ing.nombre).join(', ')}`);
        return;
      }
    }

    try {
      setEnviando(true);
      setError('');

      await movimientoUnificadoService.agregarCantidad({
        productoId: receta._id,
        tipoProducto: 'recetas',
        cantidad: formData.cantidadProducir,
        motivo: formData.motivo,
        consumirIngredientes: formData.consumirIngredientes
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al producir receta:', error);
      setError(error.response?.data?.message || 'Error al producir la receta');
    } finally {
      setEnviando(false);
    }
  };

  const handleChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (!isOpen || !receta) return null;

  const todosIngredientesSuficientes = ingredientesNecesarios.every(ing => ing.suficiente);
  const cantidadTotal = (receta.inventario?.cantidadProducida || 0) + formData.cantidadProducir;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📋 Producir Receta
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={enviando}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información de la receta */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">{receta.nombre}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <span className="font-medium">Cantidad Actual:</span> {' '}
                {receta.inventario?.cantidadProducida || 0} {receta.rendimiento?.unidadMedida || 'unidad'}
              </div>
              <div>
                <span className="font-medium">Rendimiento por Producción:</span> {' '}
                {receta.rendimiento?.cantidad || 1} {receta.rendimiento?.unidadMedida || 'unidad'}
              </div>
            </div>
          </div>

          {/* Cantidad a producir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lotes a Producir *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                step="1"
                value={formData.cantidadProducir}
                onChange={(e) => handleChange('cantidadProducir', parseInt(e.target.value) || 1)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={enviando}
                required
              />
              <span className="text-sm text-gray-500">
                lote(s)
              </span>
            </div>
            <div className="text-sm space-y-1 mt-1">
              <div className="text-gray-600">
                Unidades por lote: <span className="font-medium">{receta.rendimiento?.cantidad || 1}</span>
              </div>
              <div className="text-gray-600">
                Total unidades a producir: <span className="font-medium text-blue-600">{(receta.rendimiento?.cantidad || 1) * formData.cantidadProducir}</span>
              </div>
              <div className="text-blue-600">
                Total después de producir: <span className="font-medium">{cantidadTotal + ((receta.rendimiento?.cantidad || 1) * formData.cantidadProducir) - formData.cantidadProducir}</span> unidades
              </div>
            </div>
          </div>

          {/* Ingredientes necesarios */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Ingredientes Necesarios</h4>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              {loading ? (
                <div className="text-sm text-gray-500">Cargando ingredientes...</div>
              ) : ingredientesNecesarios.length > 0 ? (
                <div className="space-y-2">
                  {ingredientesNecesarios.map((ingrediente, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center text-sm ${
                        !ingrediente.suficiente ? 'text-red-600' : 'text-gray-700'
                      }`}
                    >
                      <span>{ingrediente.nombre}</span>
                      <div className="flex items-center space-x-2">
                        <span>
                          {ingrediente.cantidadNecesaria} / {ingrediente.cantidadDisponible} {ingrediente.unidadMedida}
                        </span>
                        {ingrediente.suficiente ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No hay ingredientes definidos para esta receta</div>
              )}
            </div>
          </div>

          {/* Consumir ingredientes */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="consumirIngredientes"
              checked={formData.consumirIngredientes}
              onChange={(e) => handleChange('consumirIngredientes', e.target.checked)}
              className="mr-2"
              disabled={enviando}
            />
            <label htmlFor="consumirIngredientes" className="text-sm text-gray-700">
              Consumir ingredientes del inventario al producir
            </label>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo
            </label>
            <textarea
              value={formData.motivo}
              onChange={(e) => handleChange('motivo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={enviando}
              placeholder="Descripción del motivo de producción..."
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.motivo.length}/500 caracteres
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Advertencia de ingredientes */}
          {formData.consumirIngredientes && !todosIngredientesSuficientes && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <span className="text-yellow-500 mr-2">⚠️</span>
                <span className="text-yellow-700 text-sm">
                  No hay suficientes ingredientes para esta producción
                </span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                enviando || (formData.consumirIngredientes && !todosIngredientesSuficientes)
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={enviando || (formData.consumirIngredientes && !todosIngredientesSuficientes)}
            >
              {enviando ? 'Produciendo...' : 'Producir Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalProducirReceta;
