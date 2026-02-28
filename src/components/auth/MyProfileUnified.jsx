import React, { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { User, Mail, Shield, CheckCircle, Camera, Loader2 } from 'lucide-react';
import UserGestionPersonal from '../personal/UserGestionPersonal';
import ProgresoMetasSucursales from '../perfil/ProgresoMetasSucursales';
import SucursalAsignada from '../perfil/SucursalAsignada';
import UbicacionPerfil from '../perfil/UbicacionPerfil';
import api from '../../services/api';

function MyProfileUnified() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Load DB avatar on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await api.get('/api/auth/my-profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.user?.avatar?.url) {
          setAvatarUrl(res.data.user.avatar.url);
        }
      } catch {
        // fallback to Clerk avatar
      }
    };
    if (user) fetchProfile();
  }, [user, getToken]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userInfo = {
    email: user.emailAddresses?.[0]?.emailAddress || 'No disponible',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario',
    businessName: user.unsafeMetadata?.nombre_negocio || 'No especificado',
    role: user.unsafeMetadata?.role || 'user',
    isActive: user.unsafeMetadata?.is_active !== false
  };

  const initials = ((userInfo.firstName?.[0] || '') + (userInfo.lastName?.[0] || '')).toUpperCase() || '?';

  // The final avatar to display: DB avatar → Clerk avatar → initials
  const displayAvatar = avatarUrl || user.imageUrl || null;

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Administrador';
      case 'admin': return 'Administrador';
      default: return 'Usuario';
    }
  };

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no puede superar 5MB');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess(false);

      const token = await getToken();
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.put('/api/auth/update-avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.avatar?.url) {
        setAvatarUrl(res.data.avatar.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      // Clear the input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* ── Header con avatar ──────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

          {/* Avatar interactivo */}
          <div className="relative flex-shrink-0">
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="group relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 transition-shadow"
              title="Cambiar foto de perfil"
            >
              {/* Imagen o iniciales */}
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={userInfo.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}

              {/* Overlay hover */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity rounded-full ${
                uploading ? 'bg-black bg-opacity-50 opacity-100' : 'bg-black bg-opacity-40 opacity-0 group-hover:opacity-100'
              }`}>
                {uploading ? (
                  <Loader2 className="text-white animate-spin" size={24} />
                ) : (
                  <>
                    <Camera className="text-white" size={20} />
                    <span className="text-white text-[10px] font-medium mt-1">Cambiar</span>
                  </>
                )}
              </div>
            </button>

            {/* Input file oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Badge de cámara */}
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow"
              title="Cambiar foto"
            >
              <Camera size={13} className="text-white" />
            </button>
          </div>

          {/* Nombre y role */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{userInfo.fullName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{userInfo.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(userInfo.role)}`}>
                {getRoleName(userInfo.role)}
              </span>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                userInfo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {userInfo.isActive ? '✓ Cuenta activa' : '✗ Inactiva'}
              </span>
            </div>

            {/* Feedback de upload */}
            <div className="mt-3">
              {uploadSuccess && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle size={15} /> Foto actualizada correctamente
                </p>
              )}
              {uploadError && (
                <p className="text-sm text-red-500 font-medium">{uploadError}</p>
              )}
              {!uploadSuccess && !uploadError && (
                <p className="text-xs text-gray-400">
                  Haz clic en la foto para cambiarla · JPG, PNG, WebP · Máx. 5MB
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Información Personal ───────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Información Personal</h2>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="text-gray-500" size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Nombre Completo</p>
              <p className="text-gray-900 font-medium">{userInfo.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Mail className="text-gray-500" size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Correo Electrónico</p>
              <p className="text-gray-900 font-medium">{userInfo.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Nombre del Negocio</p>
              <p className="text-gray-900 font-medium">{userInfo.businessName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Shield className="text-gray-500" size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Rol</p>
              <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getRoleColor(userInfo.role)}`}>
                {getRoleName(userInfo.role)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sucursal Asignada + Tareas */}
      <SucursalAsignada />

      {/* Metas */}
      <ProgresoMetasSucursales />

      {/* Ubicación */}
      <UbicacionPerfil />

      {/* Gestión Personal Financiera */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <UserGestionPersonal />
      </div>

      {/* Cerrar sesión */}
      <div className="flex justify-end">
        <button
          onClick={() => signOut()}
          className="px-6 py-2.5 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition-colors w-full sm:w-auto"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default MyProfileUnified;
