import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { MapPin, Save, Edit3, X, Check, AlertCircle } from 'lucide-react';
import MapaPicker from '../mapa/MapaPicker';
import { ubicacionService } from '../../services/ubicacionService';

/**
 * UbicacionPerfil - Sección de ubicación para el perfil del usuario
 * Permite ver y editar la ubicación personal usando MapaPicker
 */
const UbicacionPerfil = () => {
  const { getToken } = useAuth();
  const [ubicacion, setUbicacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado temporal para edición
  const [editData, setEditData] = useState({
    lat: null,
    lng: null,
    direccion: '',
    referencia: ''
  });

  // Cargar ubicación actual
  const cargarUbicacion = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await ubicacionService.getMyLocation(token);
      setUbicacion(data.ubicacion);
      
      if (data.ubicacion?.configurada) {
        setEditData({
          lat: data.ubicacion.lat,
          lng: data.ubicacion.lng,
          direccion: data.ubicacion.direccion || '',
          referencia: data.ubicacion.referencia || ''
        });
      }
    } catch (err) {
      console.error('Error cargando ubicación:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    cargarUbicacion();
  }, [cargarUbicacion]);

  // Manejar cambio de posición en el mapa
  const handleLocationChange = useCallback((pos) => {
    setEditData(prev => ({
      ...prev,
      lat: pos.lat,
      lng: pos.lng
    }));
  }, []);

  // Guardar ubicación
  const handleSave = async () => {
    if (!editData.lat || !editData.lng) {
      setError('Debes seleccionar una ubicación en el mapa');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = await getToken();
      
      await ubicacionService.updateMyLocation(token, {
        lat: editData.lat,
        lng: editData.lng,
        direccion: editData.direccion,
        referencia: editData.referencia
      });

      setSuccess('Ubicación actualizada correctamente');
      setEditing(false);
      await cargarUbicacion(); // Recargar datos

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar ubicación');
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    setEditing(false);
    setError('');
    if (ubicacion?.configurada) {
      setEditData({
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        direccion: ubicacion.direccion || '',
        referencia: ubicacion.referencia || ''
      });
    } else {
      setEditData({ lat: null, lng: null, direccion: '', referencia: '' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="text-blue-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Mi Ubicación</h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="text-blue-600" size={20} />
          <h2 className="text-xl font-semibold text-gray-900">Mi Ubicación</h2>
          {ubicacion?.configurada && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
              Configurada
            </span>
          )}
        </div>
        
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 size={14} />
            {ubicacion?.configurada ? 'Editar' : 'Configurar'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X size={14} />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editData.lat}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={14} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Contenido */}
      {editing ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            💡 Selecciona tu ubicación haciendo click en el mapa, usando el botón "Mi ubicación" o buscando tu dirección. 
            Tu ubicación será visible para el administrador.
          </p>

          {/* Mapa editable */}
          <MapaPicker
            initialPosition={editData.lat ? { lat: editData.lat, lng: editData.lng } : null}
            onLocationChange={handleLocationChange}
            height="350px"
            editable={true}
            showSearch={true}
            showMyLocation={true}
          />

          {/* Campos de dirección */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Av. Principal 123, Lima"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editData.direccion}
                onChange={(e) => setEditData(prev => ({ ...prev, direccion: e.target.value }))}
                maxLength={300}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Frente al parque, 2do piso"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editData.referencia}
                onChange={(e) => setEditData(prev => ({ ...prev, referencia: e.target.value }))}
                maxLength={200}
              />
            </div>
          </div>
        </div>
      ) : ubicacion?.configurada ? (
        /* Vista de solo lectura cuando está configurada */
        <div className="space-y-4">
          <MapaPicker
            initialPosition={{ lat: ubicacion.lat, lng: ubicacion.lng }}
            height="250px"
            editable={false}
            showSearch={false}
            showMyLocation={false}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {ubicacion.direccion && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="text-sm text-gray-800">{ubicacion.direccion}</p>
                </div>
              </div>
            )}
            {ubicacion.referencia && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Referencia</p>
                  <p className="text-sm text-gray-800">{ubicacion.referencia}</p>
                </div>
              </div>
            )}
          </div>

          {ubicacion.ultimaActualizacion && (
            <p className="text-xs text-gray-400">
              Última actualización: {new Date(ubicacion.ultimaActualizacion).toLocaleString('es-PE')}
            </p>
          )}
        </div>
      ) : (
        /* Estado sin configurar */
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">No has configurado tu ubicación</p>
          <p className="text-sm text-gray-500 mt-1">
            Configura tu ubicación para que el administrador pueda verificar tu dirección
          </p>
          <button
            onClick={() => setEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Configurar ubicación
          </button>
        </div>
      )}
    </div>
  );
};

export default UbicacionPerfil;
