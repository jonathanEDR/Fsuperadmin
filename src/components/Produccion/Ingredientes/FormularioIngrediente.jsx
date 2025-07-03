import React, { useState } from 'react';

const FormularioIngrediente = ({ ingrediente, onGuardar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nombre: ingrediente?.nombre || '',
    unidadMedida: ingrediente?.unidadMedida || 'kg',
    cantidad: ingrediente?.cantidad || 0,
    precioUnitario: ingrediente?.precioUnitario || 0,
    activo: ingrediente?.activo !== undefined ? ingrediente.activo : true
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const unidadesMedida = [
    { value: 'kg', label: 'Kilogramos' },
    { value: 'gr', label: 'Gramos' },
    { value: 'lt', label: 'Litros' },
    { value: 'ml', label: 'Mililitros' },
    { value: 'unidad', label: 'Unidades' },
    { value: 'pieza', label: 'Piezas' }
  ];

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }

    if (formData.cantidad < 0) {
      nuevosErrores.cantidad = 'La cantidad no puede ser negativa';
    }

    if (formData.precioUnitario < 0) {
      nuevosErrores.precioUnitario = 'El precio no puede ser negativo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpiar error del campo modificado
    if (errores[campo]) {
      setErrores(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);
    try {
      await onGuardar(formData);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {ingrediente ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errores.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre del ingrediente"
                />
                {errores.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errores.nombre}</p>
                )}
              </div>

              {/* Unidad de Medida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad de Medida *
                </label>
                <select
                  value={formData.unidadMedida}
                  onChange={(e) => handleChange('unidadMedida', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {unidadesMedida.map(unidad => (
                    <option key={unidad.value} value={unidad.value}>
                      {unidad.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad Inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cantidad}
                  onChange={(e) => handleChange('cantidad', parseFloat(e.target.value) || 0)}
                  className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errores.cantidad ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errores.cantidad && (
                  <p className="mt-1 text-sm text-red-600">{errores.cantidad}</p>
                )}
              </div>

              {/* Precio Unitario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Unitario (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precioUnitario}
                  onChange={(e) => handleChange('precioUnitario', parseFloat(e.target.value) || 0)}
                  className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errores.precioUnitario ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errores.precioUnitario && (
                  <p className="mt-1 text-sm text-red-600">{errores.precioUnitario}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => handleChange('activo', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activo</span>
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 mt-6">
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
                {enviando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioIngrediente;
