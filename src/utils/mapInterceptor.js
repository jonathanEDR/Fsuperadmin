/**
 * Interceptor global para Array.prototype.map
 * Protege contra errores de acceso a propiedades de elementos null
 * Solo se ejecuta en modo desarrollo para debugging
 */

const isDevelopment = import.meta.env.MODE === 'development';

// Guardar referencia original del map
const originalMap = Array.prototype.map;

// Función para detectar si un callback está accediendo a .nombre
const detectsNombreAccess = (callback) => {
  const callbackString = callback.toString();
  return callbackString.includes('.nombre') || 
         callbackString.includes('?.nombre') || 
         callbackString.includes('productoId');
};

// Función para limpiar array antes del map
const cleanArrayForMap = (array, callback) => {
  if (!Array.isArray(array)) return array;
  
  const callbackString = callback.toString();
  const isProductoRelated = callbackString.includes('producto') || 
                           callbackString.includes('.nombre') ||
                           callbackString.includes('productoId');
  
  if (!isProductoRelated) return array;
  
  // Filtrar elementos null para callbacks relacionados con productos
  const cleaned = array.filter(item => {
    if (item == null) {
      console.warn('🛡️ MapInterceptor: Elemento null filtrado automáticamente');
      return false;
    }
    return true;
  });
  
  if (cleaned.length !== array.length) {
    console.warn(`🛡️ MapInterceptor: ${array.length - cleaned.length} elementos null filtrados`);
  }
  
  return cleaned;
};

// Interceptor de map mejorado
Array.prototype.map = function(callback, thisArg) {
  try {
    // Solo interceptar en desarrollo o si detectamos acceso a .nombre
    if (isDevelopment || detectsNombreAccess(callback)) {
      const cleanedArray = cleanArrayForMap(this, callback);
      return originalMap.call(cleanedArray, callback, thisArg);
    } else {
      return originalMap.call(this, callback, thisArg);
    }
  } catch (error) {
    // Si hay error, intentar con array limpio
    console.error('🛡️ MapInterceptor: Error detectado, limpiando array:', error);
    
    try {
      const cleanedArray = this.filter(item => item != null);
      return originalMap.call(cleanedArray, callback, thisArg);
    } catch (secondError) {
      console.error('🛡️ MapInterceptor: Error persistente:', secondError);
      return []; // Retornar array vacío como último recurso
    }
  }
};

// Restaurar map original cuando sea necesario
export const restoreOriginalMap = () => {
  Array.prototype.map = originalMap;
};

export default {
  restoreOriginalMap
};
