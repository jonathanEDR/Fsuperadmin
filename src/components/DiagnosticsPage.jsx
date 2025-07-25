import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { verifyAppConfig, verifyBackendConnectivity } from '../config/diagnostics';

const DiagnosticsPage = () => {
  const [config, setConfig] = useState(null);
  const [issues, setIssues] = useState([]);
  const [backendStatus, setBackendStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const runDiagnostics = async () => {
    setIsLoading(true);
    
    // Verificar configuración
    const { config: appConfig, issues: configIssues } = verifyAppConfig();
    setConfig(appConfig);
    setIssues(configIssues);

    // Verificar conectividad del backend
    const backendResult = await verifyBackendConnectivity();
    setBackendStatus(backendResult);

    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status) => {
    if (status === null) return <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />;
    if (status.success || status === true) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            Diagnósticos del Sistema
          </h1>
          <p className="text-gray-600">
            Verificación de configuración y conectividad del backend
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuración */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Configuración</h2>
            
            {config && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Entorno:</span>
                  <span className="font-mono text-sm">{config.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span>Producción:</span>
                  <span className="font-mono text-sm">{config.isProduction ? 'Sí' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backend URL:</span>
                  <span className="font-mono text-sm">{config.backendUrl || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clerk Key:</span>
                  <span className="font-mono text-sm">
                    {config.clerkPublishableKey ? '✅ Configurado' : '❌ No configurado'}
                  </span>
                </div>
              </div>
            )}

            {issues.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold text-red-800 mb-2">Problemas encontrados:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Backend Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {getStatusIcon(backendStatus)}
              Estado del Backend
            </h2>

            {isLoading ? (
              <div className="text-gray-500">Verificando conectividad...</div>
            ) : backendStatus ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className={`font-semibold ${
                    backendStatus.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {backendStatus.success ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                
                {backendStatus.data && (
                  <>
                    <div className="flex justify-between">
                      <span>Base de datos:</span>
                      <span className="font-mono text-sm">{backendStatus.data.database}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono text-sm">{Math.round(backendStatus.data.uptime)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timezone:</span>
                      <span className="font-mono text-sm">{backendStatus.data.timezone}</span>
                    </div>
                  </>
                )}

                {backendStatus.status && (
                  <div className="flex justify-between">
                    <span>HTTP Status:</span>
                    <span className="font-mono text-sm">{backendStatus.status}</span>
                  </div>
                )}

                {backendStatus.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <span className="text-red-700 text-sm">{backendStatus.error}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">Error al verificar backend</div>
            )}
          </div>
        </div>

        {/* URLs de prueba */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">URLs de Prueba</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>Frontend: <a href="https://fsuperadmin.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://fsuperadmin.vercel.app</a></div>
            <div>Backend: <a href="https://admincomercial.onrender.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://admincomercial.onrender.com</a></div>
            <div>Health Check: <a href="https://admincomercial.onrender.com/api/health" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://admincomercial.onrender.com/api/health</a></div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={runDiagnostics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Ejecutar Diagnósticos
          </button>
          
          <button
            onClick={() => {
              sessionStorage.clear();
              window.location.href = '/login';
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Limpiar y Ir al Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsPage;
