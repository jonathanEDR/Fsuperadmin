// Configuración de la API para desarrollo y producción
export const getApiConfig = () => {
  // En producción, usar la URL de Vercel
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    // En producción, usar la configuración de Vercel que redirige /api/* al backend
    return {
      baseURL: '', // Usar URL relativa para aprovechar las rewrites de Vercel
      apiPrefix: '/api'
    };
  } else {
    // En desarrollo, usar la URL del backend local
    return {
      baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
      apiPrefix: '/api'
    };
  }
};

export const getFullApiUrl = (endpoint) => {
  const config = getApiConfig();
  const baseUrl = config.baseURL || window.location.origin;
  return `${baseUrl}${config.apiPrefix}${endpoint}`;
};

// Función para hacer peticiones con mejor manejo de errores
export const safeFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - La solicitud tardó demasiado en responder');
    }
    throw error;
  }
};
