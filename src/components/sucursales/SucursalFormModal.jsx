import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Plus, Edit2, Trash2, Building2, CheckCircle, XCircle, Map, Save, Loader2, AlertCircle } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { createSucursal, updateSucursal } from '../../services/sucursalService';

// Carga lazy del mapa para no bloquear la UI
const MapaPicker = lazy(() => import('../mapa/MapaPicker'));

/**
 * SucursalFormModal - Modal profesional para crear/editar sucursales
 * Incluye integración con mapa para seleccionar coordenadas exactas
 */
const SucursalFormModal = ({ isOpen, onClose, onSaved, sucursalEditar = null }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    descripcion: '',
    referenciaDireccion: ''
  });
  const [coordenadas, setCoordenadas] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Inicializar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      if (sucursalEditar) {
        setFormData({
          nombre: sucursalEditar.nombre || '',
          ubicacion: sucursalEditar.ubicacion || '',
          descripcion: sucursalEditar.descripcion || '',
          referenciaDireccion: sucursalEditar.referenciaDireccion || ''
        });
        // Si tiene coordenadas configuradas, cargarlas
        if (sucursalEditar.coordenadasConfiguradas && sucursalEditar.coordenadas?.coordinates) {
          setCoordenadas({
            lat: sucursalEditar.coordenadas.coordinates[1],
            lng: sucursalEditar.coordenadas.coordinates[0]
          });
        } else {
          setCoordenadas(null);
        }
      } else {
        setFormData({ nombre: '', ubicacion: '', descripcion: '', referenciaDireccion: '' });
        setCoordenadas(null);
      }
      setShowMap(false);
      setError('');
    }
  }, [isOpen, sucursalEditar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.ubicacion.trim()) {
      setError('Nombre y dirección son requeridos');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...formData,
        ...(coordenadas ? {
          lat: coordenadas.lat,
          lng: coordenadas.lng
        } : {})
      };

      if (sucursalEditar) {
        await updateSucursal(sucursalEditar._id, payload);
      } else {
        await createSucursal(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar sucursal');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="text-blue-600" size={20} />
            {sucursalEditar ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Sede Central, Local Miraflores"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Av. Principal 123, Lima"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia de dirección
              </label>
              <input
                type="text"
                value={formData.referenciaDireccion}
                onChange={(e) => setFormData({ ...formData, referenciaDireccion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Frente al parque, 2do piso..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Información adicional sobre la sucursal..."
                rows={2}
              />
            </div>

            {/* Sección de mapa */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                  showMap ? 'bg-blue-50 text-blue-700' : 'bg-gray-50/60 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Map size={16} />
                  Ubicación en mapa
                  {coordenadas && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle size={11} /> Marcada
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500">{showMap ? 'Ocultar' : 'Mostrar'}</span>
              </button>

              {showMap && (
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-2">
                    Haz click en el mapa o usa el buscador para marcar la ubicación exacta de la sucursal.
                  </p>
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
                      <Loader2 size={28} className="animate-spin text-blue-500" />
                    </div>
                  }>
                    <MapaPicker
                      initialPosition={coordenadas}
                      onLocationChange={setCoordenadas}
                      height="280px"
                      editable={true}
                      showSearch={true}
                      showMyLocation={true}
                    />
                  </Suspense>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Guardando...' : sucursalEditar ? 'Actualizar' : 'Crear Sucursal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SucursalFormModal;
