import React, { useState, useEffect } from 'react';
import catalogoProduccionService from '../../../services/catalogoProduccion';

const FormularioCatalogoProducto = ({ producto, tiposProduccion = [], onGuardar, onCancelar }) => {
  // Validación de props al inicio
  if (!tiposProduccion) {
    console.error('⚠️ FormularioCatalogoProducto: tiposProduccion no está definido');
  }
  
  console.log('📋 FormularioCatalogoProducto props:', { 
    producto, 
    tiposProduccion: tiposProduccion?.length || 0, 
    onGuardar: typeof onGuardar, 
    onCancelar: typeof onCancelar 
  });

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipoProduccion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  useEffect(() => {
    if (producto) {
      console.log('🔍 Producto recibido para editar:', producto);
      
      setFormData({
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        // Mapear moduloSistema a tipoProduccion para la edición
        tipoProduccion: producto.moduloSistema || producto.tipoProduccion?._id || producto.tipoProduccion || ''
      });
      
      console.log('📝 FormData inicializado para edición:', {
        moduloSistema: producto.moduloSistema,
        tipoProduccionMapeado: producto.moduloSistema || producto.tipoProduccion?._id || producto.tipoProduccion || ''
      });
    }
  }, [producto]);

  const handleInputChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const generarCodigoAutomatico = async () => {
    if (!formData.tipoProduccion) {
      setError('Primero selecciona un tipo de producción');
      return;
    }

    try {
      setGenerandoCodigo(true);
      const response = await catalogoProduccionService.generarCodigoAutomatico(formData.tipoProduccion);
      handleInputChange('codigo', response.data.codigo);
      setError('');
    } catch (err) {
      setError('Error al generar código: ' + err.message);
    } finally {
      setGenerandoCodigo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🎯 FormularioCatalogoProducto - handleSubmit iniciado');
    console.log('📋 FormData actual:', formData);
    
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    
    if (!formData.tipoProduccion) {
      setError('El tipo de producción es requerido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Enviando datos:', formData);
      
      await onGuardar(formData);
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTipoSeleccionado = () => {
    if (!tiposProduccion || !Array.isArray(tiposProduccion)) {
      return null;
    }
    return tiposProduccion.find(t => (t._id || t.id) === formData.tipoProduccion);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {producto ? 'Editar Producto' : 'Nuevo Producto'} - Catálogo de Producción
          </h3>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-4">📋 Información Básica</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => handleInputChange('codigo', e.target.value.toUpperCase())}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder="Ej: ING0001"
                  />
                  <button
                    type="button"
                    onClick={generarCodigoAutomatico}
                    disabled={generandoCodigo || !formData.tipoProduccion}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                  >
                    {generandoCodigo ? '⏳' : '🔄'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Producción *
                </label>
                <select
                  value={formData.tipoProduccion}
                  onChange={(e) => handleInputChange('tipoProduccion', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposProduccion && tiposProduccion.length > 0 ? (
                    tiposProduccion.map(tipo => (
                      <option key={tipo._id || tipo.id} value={tipo._id || tipo.id}>
                        {tipo.icono ? `${tipo.icono} ` : ''}{tipo.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay tipos de producción disponibles</option>
                  )}
                </select>
                {getTipoSeleccionado() && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getTipoSeleccionado().descripcion}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre descriptivo del producto"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                rows="2"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción opcional del producto"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioCatalogoProducto;
