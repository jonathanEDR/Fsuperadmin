import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

const SinAcceso = () => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-red-100/40 to-orange-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-100/40 to-yellow-100/40 rounded-full blur-3xl"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative w-full max-w-md mx-auto">
        {/* Tarjeta principal */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-200/50 overflow-hidden">
          {/* Header con icono de advertencia */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Acceso Restringido
            </h1>
            <p className="text-red-100 text-sm">
              Tu cuenta está dada de baja
            </p>
          </div>

          {/* Contenido */}
          <div className="p-6 text-center">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                No tienes acceso al sistema
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Tu cuenta ha sido dada de baja y no puedes acceder a ninguna funcionalidad del sistema.
              </p>
              
              {/* Información de contacto */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      ¿Necesitas ayuda?
                    </h4>
                    <p className="text-xs text-blue-800">
                      Si crees que esto es un error o necesitas reactivar tu cuenta, contacta al administrador del sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de cerrar sesión */}
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg py-3 px-4 font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            Si necesitas asistencia, contacta al equipo de soporte
          </p>
        </div>
      </div>
    </div>
  );
};

export default SinAcceso;
