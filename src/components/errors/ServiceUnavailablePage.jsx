import React from 'react';
import { Server, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServiceUnavailablePage = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Limpiar el sessionStorage para permitir retry
    sessionStorage.removeItem('roleRedirectCompleted');
    window.location.reload();
  };

  const handleGoToLogin = () => {
    sessionStorage.removeItem('roleRedirectCompleted');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <Server className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Servicio No Disponible
          </h1>
          <p className="text-gray-600">
            El servidor está temporalmente fuera de servicio. Por favor intenta más tarde.
          </p>
        </div>

        <div className="text-left mb-6 space-y-2">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
            <strong>Estado:</strong> Error 503 - Service Unavailable
            <br />
            <strong>Backend:</strong> admincomercial.onrender.com está caído
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
          
          <button
            onClick={handleGoToLogin}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir al Login
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Si el problema persiste, contacta al administrador.
          <br />
          Es posible que el servidor de Render.com esté en sleep mode.
        </div>
      </div>
    </div>
  );
};

export default ServiceUnavailablePage;
