import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText, RefreshCw } from 'lucide-react';
import catalogoProduccionService from '../../../services/catalogoProduccion.js';

const FormularioCatalogoProducto = ({ producto, tiposProduccion = [], onGuardar, onCancelar }) => {
  // Validación de props al inicio
  if (!tiposProduccion) {
    console.error('FormularioCatalogoProducto: tiposProduccion no está definido');
  }
  
  console.log('FormularioCatalogoProducto props:', { 
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
      console.log('Producto recibido para editar:', producto);
      
      setFormData({
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        // Mapear moduloSistema a tipoProduccion para la edición
        tipoProduccion: producto.moduloSistema || producto.tipoProduccion?._id || producto.tipoProduccion || ''
      });
      
      console.log('FormData inicializado para edición:', {
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
    
    console.log('FormularioCatalogoProducto - handleSubmit iniciado');
    console.log('FormData actual:', formData);
    
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
      
      console.log('Enviando datos:', formData);
      
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-gray-100 w-11/12 max-w-4xl shadow-xl rounded-2xl bg-white">
        <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl -mx-5 -mt-5">
          <h3 className="text-lg font-medium text-gray-900">
            {producto ? 'Editar Producto' : 'Nuevo Producto'} - Catálogo de Producción
          </h3>
          <button
            onClick={onCancelar}
            className="p-1.5 hover:bg-white/80 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Información Básica</h4>
            
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
                    className="flex-1 p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="Ej: ING0001"
                  />
                  <button
                    type="button"
                    onClick={generarCodigoAutomatico}
                    disabled={generandoCodigo || !formData.tipoProduccion}
                    className="px-3 py-2 text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 text-sm transition-colors"
                  >
                    {generandoCodigo ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
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
                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Descripción opcional del producto"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              className="px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {loading ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Guardando...</span> : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioCatalogoProducto;
