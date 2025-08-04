import React, { useState, useEffect } from 'react';
import api from '../services/api';

function TestConnection() {
  const [status, setStatus] = useState('testing');
  const [result, setResult] = useState('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('testing');
      console.log('🔍 Probando conexión a:', api.defaults.baseURL);
      
      // Probar endpoint de test
      const response = await api.get('/finanzas/test');
      console.log('✅ Respuesta:', response.data);
      
      setStatus('success');
      setResult(`Conexión exitosa: ${response.data.message}`);
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setStatus('error');
      setResult(`Error: ${error.message} - URL: ${api.defaults.baseURL}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Test de Conexión API</h3>
      <div className="mb-2">
        <strong>URL Base:</strong> {api.defaults.baseURL}
      </div>
      <div className="mb-2">
        <strong>Estado:</strong> 
        <span className={`ml-2 px-2 py-1 rounded text-sm ${
          status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status === 'testing' ? 'Probando...' : 
           status === 'success' ? 'Exitoso' : 'Error'}
        </span>
      </div>
      <div className="mb-4">
        <strong>Resultado:</strong> {result}
      </div>
      <button 
        onClick={testConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Probar Conexión
      </button>
    </div>
  );
}

export default TestConnection;
