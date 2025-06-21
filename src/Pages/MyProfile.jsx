import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Shield, Mail, Building2, User } from 'lucide-react';

const MyProfile = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre_negocio: '',
    email: ''
  });

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/auth/my-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditForm({
          nombre_negocio: data.user.nombre_negocio || '',
          email: data.user.email || ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar el perfil');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      nombre_negocio: profile.nombre_negocio || '',
      email: profile.email || ''
    });
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/auth/update-my-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.user);
        setIsEditing(false);
        setError('success:' + result.message);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <User className="text-blue-600" />
          Mi Perfil
        </h2>

        {error && (
          <div className={`px-4 py-3 rounded mb-4 ${
            error.startsWith('success:')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {error.startsWith('success:') ? error.replace('success:', '') : error}
          </div>
        )}

        {profile && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {profile.nombre_negocio?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {isEditing ? (
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-3 py-1"
                      value={editForm.nombre_negocio}
                      onChange={(e) => setEditForm({ ...editForm, nombre_negocio: e.target.value })}
                      placeholder="Nombre del negocio"
                    />
                  ) : (
                    profile.nombre_negocio
                  )}
                </h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  {isEditing ? (
                    <input
                      type="email"
                      className="border border-gray-300 rounded px-3 py-1"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                    />
                  ) : (
                    profile.email
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Shield size={16} />
                  <span className="font-semibold">Rol</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                  profile.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.role === 'super_admin' ? 'Super Administrador' :
                   profile.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Building2 size={16} />
                  <span className="font-semibold">Estado de la cuenta</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar cambios
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar perfil
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
