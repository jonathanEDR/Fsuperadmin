import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NetworkErrorPage = ({ error, onRetry }) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error de Conexión
          </h1>
          <p className="text-gray-600">
            No se pudo conectar con el servidor. Esto puede deberse a:
          </p>
        </div>

        <div className="text-left mb-6 space-y-2">
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Problemas de conexión a internet</li>
            <li>El servidor está temporalmente no disponible</li>
            <li>Problemas de configuración de red</li>
          </ul>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>Error técnico:</strong> {error.message}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir al Inicio
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Si el problema persiste, contacta al administrador del sistema.
        </div>
      </div>
    </div>
  );
};

export default NetworkErrorPage;
