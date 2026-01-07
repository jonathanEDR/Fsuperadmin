import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { recetaService } from '../../../services/recetaService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { getFullApiUrl, safeFetch } from '../../../config/api';
import { useAuth } from '@clerk/clerk-react';

/**
 * Modal simplificado para producir recetas (admin/user)
 * Solo permite especificar cantidad de lotes a producir sin mostrar costos
 * El backend calculará los costos automáticamente
 */
const ModalProducirRecetaSimple = ({ receta, isOpen, onClose, onSuccess }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isSuperAdmin } = useQuickPermissions();
  
  const [formData, setFormData] = useState({
    cantidadLotes: 1,
    operador: '',
    fechaProduccion: getLocalDateTimeString(),
    observaciones: ''
    // consumirIngredientes eliminado - SIEMPRE se consume automáticamente
  });

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen && receta) {
      // Obtener nombre del usuario actual para autocompletar
      const nombreUsuario = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || '';
      
      setFormData({
        cantidadLotes: 1,
        operador: isSuperAdmin ? '' : nombreUsuario, // Autocompletar para admin/user
        fechaProduccion: getLocalDateTimeString(),
        observaciones: ''
        // consumirIngredientes eliminado - SIEMPRE se consume automáticamente
      });
      setError('');
      
      // Si es super_admin, cargar lista de usuarios
      if (isSuperAdmin) {
        cargarUsuarios();
      }
    }
  }, [isOpen, receta, user, isSuperAdmin]);

  // Cargar lista de usuarios (solo para super_admin)
  const cargarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const token = await getToken();
      const response = await safeFetch(getFullApiUrl('/admin/users?limit=100'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.users || []);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleInputChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const validarFormulario = () => {
    if (!formData.cantidadLotes || formData.cantidadLotes <= 0) {
      setError('La cantidad de lotes debe ser mayor a 0');
      return false;
    }

    if (!formData.operador?.trim()) {
      setError('El operador responsable es obligatorio');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setEnviando(true);
      setError('');

      const datosProduccion = {
        cantidadLotes: formData.cantidadLotes,
        operador: formData.operador?.trim(),
        motivo: `Producción de receta: ${receta.nombre} (${formData.cantidadLotes} lote${formData.cantidadLotes > 1 ? 's' : ''})`,
        observaciones: formData.observaciones?.trim() || '',
        consumirIngredientes: true, // SIEMPRE consumir automáticamente
        fechaProduccion: formData.fechaProduccion
      };

      console.log('📦 Modal Simple Recetas - Produciendo:', datosProduccion);

      await recetaService.producirReceta(receta._id, datosProduccion);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al producir receta:', error);
      setError(error.message || 'Error al producir receta');
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen || !receta) return null;

  const rendimientoPorLote = receta.rendimiento?.cantidad || 1;
  const unidadesProducidas = formData.cantidadLotes * rendimientoPorLote;
  const stockActual = receta.inventario?.cantidadProducida || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📝</span>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Producir Receta
              </h3>
              <p className="text-sm text-gray-500">
                {receta.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Información de Rendimiento */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">📊 Stock Actual</div>
                  <div className="text-xl font-bold text-purple-600">
                    {stockActual}
                  </div>
                  <div className="text-xs text-gray-500">{receta.rendimiento?.unidadMedida || 'und'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">➕ A Producir</div>
                  <div className="text-xl font-bold text-green-600">
                    +{unidadesProducidas}
                  </div>
                  <div className="text-xs text-gray-500">{receta.rendimiento?.unidadMedida || 'und'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">🎯 Stock Final</div>
                  <div className="text-xl font-bold text-indigo-600">
                    {stockActual + unidadesProducidas}
                  </div>
                  <div className="text-xs text-gray-500">{receta.rendimiento?.unidadMedida || 'und'}</div>
                </div>
              </div>
              
              {/* Detalle de Lotes */}
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="text-center">
                  <div className="text-xs text-gray-600">
                    {formData.cantidadLotes} lote{formData.cantidadLotes > 1 ? 's' : ''} × {rendimientoPorLote} unidades/lote
                  </div>
                </div>
              </div>
            </div>

            {/* Cantidad de Lotes a Producir */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de Lotes a Producir *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.cantidadLotes}
                onChange={(e) => handleInputChange('cantidadLotes', parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-blue-500 focus:border-blue-500"
                disabled={enviando}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Cada lote rinde {rendimientoPorLote} {receta.rendimiento?.unidadMedida || 'unidades'}
              </p>
            </div>

            {/* Mensaje informativo: consumo automático */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    🏭 Los ingredientes se descontarán automáticamente del inventario
                  </div>
                  <div className="text-xs text-gray-600">
                    Al producir, todos los ingredientes de la receta se consumirán automáticamente según la cantidad especificada.
                  </div>
                </div>
              </div>
            </div>

            {/* Operador Responsable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operador Responsable *
              </label>
              {isSuperAdmin ? (
                // Super Admin: Selector de usuarios
                <select
                  value={formData.operador}
                  onChange={(e) => handleInputChange('operador', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  disabled={enviando || loadingUsuarios}
                  required
                >
                  <option value="">Seleccionar operador...</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario._id} value={usuario.nombre_negocio || usuario.email}>
                      {usuario.nombre_negocio || usuario.email} ({usuario.role})
                    </option>
                  ))}
                </select>
              ) : (
                // Admin/User: Campo readonly con su nombre autocompletado
                <input
                  type="text"
                  value={formData.operador}
                  readOnly
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  title="Tu nombre se completa automáticamente"
                />
              )}
              {!isSuperAdmin && (
                <p className="text-xs text-gray-500 mt-1">
                  ✓ Tu nombre se completa automáticamente
                </p>
              )}
            </div>

            {/* Fecha y Hora de Producción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Fecha y Hora de Producción
              </label>
              <input
                type="datetime-local"
                value={formData.fechaProduccion}
                onChange={(e) => handleInputChange('fechaProduccion', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={enviando}
              />
              <p className="text-xs text-gray-500 mt-1">
                Selecciona cuándo se realizó la producción
              </p>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (Opcional)
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={enviando}
              />
            </div>

          </div>

          {/* Footer con botones */}
          <div className="border-t border-gray-200 px-4 sm:px-6 py-4 bg-white">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {enviando ? 'Produciendo...' : '📝 Producir'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalProducirRecetaSimple;
