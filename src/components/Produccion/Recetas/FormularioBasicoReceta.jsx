import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import '../../../styles/modal-protection.css';

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="modal-protection small-modal-protection bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          position: 'static',
          transform: 'none',
          top: 'auto'
        }}
      >
        <div className="overflow-y-auto max-h-[95vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 m-0">{titulo}</h2>
              <button
                onClick={onCancelar}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-white/80 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
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
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.nombre ? 'border-red-500' : 'border-gray-200'
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
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.tiempoPreparacion ? 'border-red-500' : 'border-gray-200'
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Descripción de la receta..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancelar}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {guardando ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : (receta ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioBasicoReceta;
