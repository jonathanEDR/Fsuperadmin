import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Shield, Mail, Building2, User } from 'lucide-react';

const MyProfile = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const response = await fetch('http://localhost:5000/api/auth/user-profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar el perfil');
        }

        const data = await response.json();
        setProfile(data.user);
      } catch (error) {
        setError('Error al cargar el perfil: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start pt-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Mi Perfil</h2>
          
          <div className="space-y-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div className="ml-6">
                <p className="text-sm text-gray-500">Usuario</p>
                <p className="text-base font-medium text-gray-900">
                  {profile?.username || user?.username || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="w-6 h-6 text-gray-400" />
              </div>
              <div className="ml-6">
                <p className="text-sm text-gray-500">Correo Electrónico</p>
                <p className="text-base font-medium text-gray-900">
                  {profile?.email || user?.emailAddresses[0]?.emailAddress || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="w-6 h-6 text-gray-400" />
              </div>
              <div className="ml-6">
                <p className="text-sm text-gray-500">Nombre del Negocio</p>
                <p className="text-base font-medium text-gray-900">
                  {profile?.nombre_negocio || 'No especificado'}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="w-6 h-6 text-gray-400" />
              </div>
              <div className="ml-6">
                <p className="text-sm text-gray-500">Rol</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.role === 'super_admin'
                    ? 'bg-purple-100 text-purple-800'
                    : profile?.role === 'admin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {profile?.role || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
