// Error handler para manejar errores de producción
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // El servidor respondió con un código de error
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    switch (status) {
      case 503:
        return {
          type: 'SERVICE_UNAVAILABLE',
          message: 'El servicio no está disponible temporalmente. Por favor, intenta más tarde.',
          shouldRetry: true,
          retryAfter: 30000 // 30 segundos
        };
      case 500:
        return {
          type: 'SERVER_ERROR',
          message: 'Error interno del servidor. Por favor, contacta al administrador.',
          shouldRetry: false
        };
      case 404:
        return {
          type: 'NOT_FOUND',
          message: 'El recurso solicitado no fue encontrado.',
          shouldRetry: false
        };
      case 401:
        return {
          type: 'UNAUTHORIZED',
          message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          shouldRetry: false,
          shouldRedirect: true
        };
      case 429:
        return {
          type: 'RATE_LIMIT',
          message: 'Demasiadas solicitudes. Por favor, espera un momento.',
          shouldRetry: true,
          retryAfter: 60000 // 1 minuto
        };
      default:
        return {
          type: 'UNKNOWN_ERROR',
          message: message || 'Error desconocido',
          shouldRetry: false
        };
    }
  } else if (error.request) {
    // La solicitud se hizo pero no hubo respuesta
    return {
      type: 'NETWORK_ERROR',
      message: 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
      shouldRetry: true,
      retryAfter: 5000 // 5 segundos
    };
  } else {
    // Error en la configuración de la solicitud
    return {
      type: 'REQUEST_ERROR',
      message: 'Error en la solicitud: ' + error.message,
      shouldRetry: false
    };
  }
};

// Función para reintentar automáticamente
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      const errorInfo = handleApiError(error);
      
      if (!errorInfo.shouldRetry || i === maxRetries - 1) {
        throw error;
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, errorInfo.retryAfter || delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
};

// Hook para manejar estados de error
export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState(null);
  
  const handleError = (error) => {
    const errorInfo = handleApiError(error);
    setErrorState(errorInfo);
    
    // Auto-limpiar el error después de un tiempo
    setTimeout(() => {
      setErrorState(null);
    }, 10000); // 10 segundos
    
    return errorInfo;
  };
  
  const clearError = () => setErrorState(null);
  
  return { errorState, handleError, clearError };
};
