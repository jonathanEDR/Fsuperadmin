import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import catalogoProduccionService from '../../../services/catalogoProduccion';

const ModalTipoProduccion = ({ isOpen, onClose, onTipoCreado }) => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState({
    nombre: '',
    descripcion: ''
  });
  const [conexionBackend, setConexionBackend] = useState(null); // null: no probado, true: conectado, false: desconectado

  useEffect(() => {
    if (isOpen) {
      cargarTipos();
      // Resetear formulario cuando se abre el modal
      setNuevoTipo({ nombre: '', descripcion: '' });
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const cargarTipos = async () => {
    try {
      setLoading(true);
      const response = await catalogoProduccionService.obtenerTiposProduccion();
      setTipos(response.data || []);
      setConexionBackend(true); // Backend funcionando
    } catch (err) {
      console.error('Error al cargar tipos:', err);
      setError('Error al cargar tipos de producción');
      setConexionBackend(false); // Backend no disponible
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (campo, valor) => {
    setNuevoTipo(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nuevoTipo.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      
      console.log('Enviando datos al backend:', nuevoTipo);
      const response = await catalogoProduccionService.crearTipoProduccion(nuevoTipo);
      console.log('Respuesta del backend:', response);
      
      // Verificar que la respuesta tenga datos
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      // Actualizar la lista de tipos en el modal
      setTipos(prev => [...prev, response.data]);
      
      // Resetear formulario
      setNuevoTipo({ nombre: '', descripcion: '' });
      
      // Notificar al componente padre
      if (onTipoCreado) {
        onTipoCreado(response.data);
      }
      
      setError('');
      let mensaje = `¡Tipo "${response.data.nombre}" creado exitosamente!`;
      
      // Verificar si se guardó en base de datos o es simulado
      if (response.data._id && response.data._id.toString().length > 10) {
        mensaje += ' Guardado en base de datos.';
      } else {
        mensaje += ' Modo simulado (backend no disponible).';
      }
      
      setSuccess(mensaje);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error al crear tipo:', err);
      let errorMessage = 'Error al crear tipo de producción';
      
      if (err.message.includes('Network Error')) {
        errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
      } else if (err.message.includes('401')) {
        errorMessage = 'No tienes permisos. Inicia sesión nuevamente.';
      } else if (err.message.includes('400')) {
        errorMessage = 'Datos inválidos. Verifica la información ingresada.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id, activo) => {
    try {
      if (activo) {
        await catalogoProduccionService.desactivarTipoProduccion(id);
      } else {
        await catalogoProduccionService.activarTipoProduccion(id);
      }
      cargarTipos();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('Error al cambiar el estado del tipo');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Gestión de Tipos de Producción</h2>
          <div className="flex items-center gap-4">
            {/* Indicador de estado de conexión */}
            {conexionBackend !== null && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                conexionBackend 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  conexionBackend ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                {conexionBackend ? 'Backend' : 'Local'}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/80 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Formulario para nuevo tipo */}
          <form onSubmit={handleSubmit} className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Nuevo Tipo de Producción</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nuevoTipo.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Bebidas, Comidas, Postres..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={nuevoTipo.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del tipo de producción"
                  rows="2"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="flex-shrink-0" />
                {success}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creando...
                  </>
                ) : (
                  'CREAR'
                )}
              </button>
            </div>
          </form>

          {/* Lista de tipos existentes */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Tipos de Producción Existentes</h3>
            
            {loading && (tipos || []).length === 0 ? (
              <div className="text-center py-4">
                <Loader2 className="inline-block h-6 w-6 animate-spin text-blue-600" />
                <p className="mt-2 text-gray-600">Cargando tipos...</p>
              </div>
            ) : (tipos || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay tipos de producción registrados</p>
                <p className="text-sm">Comienza creando tu primer tipo</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(tipos || []).map((tipo) => (
                      <tr key={tipo._id} className={!tipo.activo ? 'bg-gray-50 opacity-75' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {tipo.nombre}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {tipo.descripcion || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            tipo.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tipo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleToggleActivo(tipo._id, tipo.activo)}
                            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium ${
                              tipo.activo
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {tipo.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-100 px-6 py-3 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTipoProduccion;
