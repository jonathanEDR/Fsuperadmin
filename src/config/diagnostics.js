// Función para verificar la configuración de la aplicación
export const verifyAppConfig = () => {
  const config = {
    environment: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
    backendUrl: import.meta.env.VITE_BACKEND_URL,
    clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  };

  console.log('🔍 App Configuration:', config);

  // Verificaciones básicas
  const issues = [];

  if (!config.clerkPublishableKey) {
    issues.push('❌ VITE_CLERK_PUBLISHABLE_KEY is not defined');
  }

  if (!config.isProduction && !config.backendUrl) {
    issues.push('⚠️ VITE_BACKEND_URL is not defined (development)');
  }

  if (config.isProduction && config.backendUrl) {
    issues.push('⚠️ VITE_BACKEND_URL should not be needed in production (using Vercel rewrites)');
  }

  if (issues.length > 0) {
    console.warn('Configuration Issues Found:', issues);
  } else {
    console.log('✅ Configuration looks good!');
  }

  return { config, issues };
};

// Función para verificar la conectividad con el backend
export const verifyBackendConnectivity = async () => {
  try {
    const { getFullApiUrl, safeFetch } = await import('./api');
    const testUrl = getFullApiUrl('/health');

    console.log('🔗 Testing backend connectivity to:', testUrl);

    const response = await safeFetch(testUrl, {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend connectivity: OK', data);
      return { success: true, data };
    } else {
      console.warn('⚠️ Backend responded with status:', response.status);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error('❌ Backend connectivity failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Llamar automáticamente en desarrollo
if (import.meta.env.DEV) {
  verifyAppConfig();
}
