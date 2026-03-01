import React, { useState, useEffect } from 'react';
import { X, Loader2, FlaskConical, CheckCircle, Rocket, Plus, Trash2 } from 'lucide-react';
import { ingredienteService } from '../../../services/ingredienteService';

const ModalAvanzarFase = ({ 
  receta, 
  onConfirmar, 
  onCancelar, 
  isOpen 
}) => {
  const [formData, setFormData] = useState({
    notas: '',
    notasNuevaFase: '',
    ingredientesAdicionales: []
  });
  
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarIngredientes();
      // Reset form data when modal opens
      setFormData({
        notas: '',
        notasNuevaFase: '',
        ingredientesAdicionales: []
      });
    }
  }, [isOpen]);

  const cargarIngredientes = async () => {
    try {
      setLoading(true);
      const response = await ingredienteService.obtenerIngredientes({ activo: true });
      setIngredientesDisponibles(response.data || []);
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Normalizar categoría para comparaciones internas
  const normalizarCategoria = (categoria) => {
    const mapeoNormalizacion = {
      'preparado': 'preparado',
      'intermedio': 'intermedio',
      'producto_intermedio': 'intermedio', 
      'terminado': 'terminado',
      'producto_terminado': 'terminado'
    };
    return mapeoNormalizacion[categoria] || 'preparado';
  };

  const obtenerSiguienteFase = () => {
    const categoriaOriginal = receta?.categoria || 'preparado'; // 🎯 CORRECCIÓN: Usar categoria directamente
    const faseNormalizada = normalizarCategoria(categoriaOriginal);
    const fases = ['preparado', 'intermedio', 'terminado'];
    const indiceActual = fases.indexOf(faseNormalizada);
    
    if (indiceActual >= 0 && indiceActual < fases.length - 1) {
      const siguienteFaseNormalizada = fases[indiceActual + 1];
      // Convertir de vuelta a la nomenclatura original
      const mapeoInverso = {
        'preparado': 'preparado',
        'intermedio': 'producto_intermedio',
        'terminado': 'producto_terminado'
      };
      return mapeoInverso[siguienteFaseNormalizada] || siguienteFaseNormalizada;
    }
    return null;
  };

  const agregarIngredienteVacio = () => {
    setFormData(prev => ({
      ...prev,
      ingredientesAdicionales: [
        ...prev.ingredientesAdicionales,
        {
          ingrediente: '',
          cantidad: 0,
          unidadMedida: 'gr',
          motivo: 'mejora'
        }
      ]
    }));
  };

  const actualizarIngrediente = (index, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      ingredientesAdicionales: prev.ingredientesAdicionales.map((ing, i) =>
        i === index ? { ...ing, [campo]: valor } : ing
      )
    }));
  };

  const eliminarIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredientesAdicionales: prev.ingredientesAdicionales.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filtrar ingredientes válidos
    const ingredientesValidos = formData.ingredientesAdicionales.filter(
      ing => ing.ingrediente && ing.cantidad > 0
    );
    
    setEnviando(true);
    
    try {
      await onConfirmar({
        notas: formData.notas,
        notasNuevaFase: formData.notasNuevaFase,
        ingredientesAdicionales: ingredientesValidos
      });
    } catch (error) {
      console.error('Error al avanzar fase:', error);
    } finally {
      setEnviando(false);
    }
  };

  const obtenerTituloFase = (fase) => {
    switch (fase) {
      case 'intermedio':
      case 'producto_intermedio': 
        return 'Proceso Intermedio';
      case 'terminado':
      case 'producto_terminado': 
        return 'Producto Terminado';
      default: return 'Nueva Fase';
    }
  };

  const obtenerDescripcionFase = (fase) => {
    switch (fase) {
      case 'intermedio':
      case 'producto_intermedio': 
        return 'En esta fase puedes refinar el producto y agregar ingredientes adicionales';
      case 'terminado':
      case 'producto_terminado': 
        return 'Fase final donde el producto quedará listo para su uso o venta';
      default: return 'Continúa con el proceso de producción';
    }
  };

  const obtenerIconoPorFase = (fase, size = 20) => {
    switch (fase) {
      case 'intermedio':
      case 'producto_intermedio': 
        return <FlaskConical size={size} className="text-yellow-600" />;
      case 'terminado':
      case 'producto_terminado': 
        return <CheckCircle size={size} className="text-green-600" />;
      default: return <Rocket size={size} className="text-blue-600" />;
    }
  };

  if (!isOpen || !receta) return null;

  const siguienteFase = obtenerSiguienteFase();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-0 w-11/12 max-w-4xl shadow-xl rounded-2xl bg-white max-h-[90vh] overflow-hidden border border-gray-100">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  {obtenerIconoPorFase(siguienteFase)}
                  Avanzar a: {obtenerTituloFase(siguienteFase)}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {obtenerDescripcionFase(siguienteFase)}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancelar}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-white/80 rounded-xl"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              
              {/* Columna izquierda: Resumen y notas */}
              <div className="space-y-6 overflow-y-auto pr-2">
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-medium text-gray-700 mb-3">Resumen de Transición</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Receta:</span>
                      <span className="font-medium">{receta.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fase actual:</span>
                      <span className="font-medium capitalize">
                        {receta.faseActual || receta.categoria || 'preparado'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nueva fase:</span>
                      <span className="font-medium text-blue-600 capitalize">
                        {siguienteFase}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className={`font-medium ${
                        receta.estadoProceso === 'en_proceso' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {(receta.estadoProceso || 'borrador').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-medium text-gray-700 mb-3">
                    Notas de la Fase Actual ({receta.faseActual || receta.categoria || 'preparado'})
                  </h4>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData(prev => ({...prev, notas: e.target.value}))}
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={`¿Cómo resultó la fase ${receta.faseActual || receta.categoria || 'preparado'}? Observaciones, cambios realizados, etc.`}
                  />
                </div>

                <div className="bg-green-50/60 p-4 rounded-xl border border-green-100">
                  <h4 className="font-medium text-gray-700 mb-3">
                    Instrucciones para la Nueva Fase ({siguienteFase})
                  </h4>
                  <textarea
                    value={formData.notasNuevaFase}
                    onChange={(e) => setFormData(prev => ({...prev, notasNuevaFase: e.target.value}))}
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder={`Instrucciones específicas para la fase ${siguienteFase}...`}
                  />
                </div>
              </div>

              {/* Columna derecha: Ingredientes adicionales */}
              <div className="space-y-6 overflow-y-auto pr-2">
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-700">Ingredientes Adicionales</h4>
                    <button
                      type="button"
                      onClick={agregarIngredienteVacio}
                      className="text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1 rounded-xl text-sm transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Agregar
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 mb-4">
                    Agrega ingredientes que necesites para la nueva fase (opcional)
                  </p>

                  <div className="flex-1 overflow-y-auto space-y-3">
                    {formData.ingredientesAdicionales.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-amber-200 rounded-xl">
                        <p className="text-sm">No hay ingredientes adicionales</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Si necesitas agregar ingredientes para esta fase, presiona "Agregar"
                        </p>
                      </div>
                    ) : (
                      formData.ingredientesAdicionales.map((ingrediente, index) => (
                        <div key={index} className="bg-white p-3 rounded-xl border border-amber-200">
                          <div className="space-y-2">
                            <select
                              value={ingrediente.ingrediente}
                              onChange={(e) => actualizarIngrediente(index, 'ingrediente', e.target.value)}
                              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                              disabled={loading}
                            >
                              <option value="">Seleccionar ingrediente...</option>
                              {ingredientesDisponibles.map(ing => (
                                <option key={ing._id} value={ing._id}>
                                  {ing.nombre} ({ing.cantidad} {ing.unidadMedida} disponibles)
                                </option>
                              ))}
                            </select>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={ingrediente.cantidad}
                                onChange={(e) => actualizarIngrediente(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                className="p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="Cantidad"
                              />
                              
                              <select
                                value={ingrediente.unidadMedida}
                                onChange={(e) => actualizarIngrediente(index, 'unidadMedida', e.target.value)}
                                className="p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                              >
                                <option value="kg">kg</option>
                                <option value="gr">gr</option>
                                <option value="lt">lt</option>
                                <option value="ml">ml</option>
                                <option value="unidad">unidad</option>
                                <option value="pieza">pieza</option>
                              </select>
                              
                              <button
                                type="button"
                                onClick={() => eliminarIngrediente(index)}
                                className="text-red-500 hover:text-red-700 text-sm transition-colors flex items-center justify-center"
                                title="Eliminar ingrediente"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <select
                              value={ingrediente.motivo}
                              onChange={(e) => actualizarIngrediente(index, 'motivo', e.target.value)}
                              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                            >
                              <option value="mejora">Mejora del producto</option>
                              <option value="ajuste">Ajuste de receta</option>
                              <option value="sabor">Modificación de sabor</option>
                              <option value="textura">Modificación de textura</option>
                              <option value="conservante">Conservante</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onCancelar}
                disabled={enviando}
                className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || enviando}
                className="px-6 py-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {enviando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {obtenerIconoPorFase(siguienteFase, 16)}
                    Avanzar a {obtenerTituloFase(siguienteFase)}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalAvanzarFase;
