import React, { useState, useEffect } from 'react';

const FormularioBasicoReceta = ({ 
  receta = null, 
  onGuardar, 
  onCancelar 
}) => {
  const [datos, setDatos] = useState({
    nombre: '',
    tiempoPreparacion: '',
    descripcion: ''
  });

  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Cargar datos de la receta si estamos editando
  useEffect(() => {
    if (receta) {
      setDatos({
        nombre: receta.nombre || '',
        tiempoPreparacion: receta.tiempoPreparacion || '',
        descripcion: receta.descripcion || ''
      });
    }
  }, [receta]);

  const handleInputChange = (campo, valor) => {
    setDatos(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpiar error del campo modificado
    if (errors[campo]) {
      setErrors(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!datos.nombre?.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!datos.tiempoPreparacion || datos.tiempoPreparacion <= 0) {
      nuevosErrores.tiempoPreparacion = 'El tiempo de preparación debe ser mayor a 0';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);
      
      // Preparar datos para envío
      const datosParaGuardar = {
        ...datos,
        tiempoPreparacion: parseInt(datos.tiempoPreparacion)
      };

      await onGuardar(datosParaGuardar);
    } catch (error) {
      console.error('Error al guardar:', error);
      // El error se maneja en el componente padre
    } finally {
      setGuardando(false);
    }
  };

  const titulo = receta ? 'Editar Información Básica' : 'Nueva Receta';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{titulo}</h2>
            <button
              onClick={onCancelar}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Información Básica
              </h3>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={datos.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre de la receta"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                )}
              </div>

              {/* Tiempo de Preparación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo de Preparación (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  value={datos.tiempoPreparacion}
                  onChange={(e) => handleInputChange('tiempoPreparacion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.tiempoPreparacion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.tiempoPreparacion && (
                  <p className="text-red-500 text-xs mt-1">{errors.tiempoPreparacion}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={datos.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Descripción de la receta..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancelar}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
              >
                {guardando ? 'Guardando...' : (receta ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioBasicoReceta;
