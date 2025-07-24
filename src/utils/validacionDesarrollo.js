/**
 * Middleware de validación para desarrollo
 * Detecta y reporta problemas de datos automáticamente
 * Solo debe usarse en desarrollo
 */

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Interceptor para APIs que maneja respuestas
 */
export const validarRespuestaAPI = (data, endpoint) => {
  if (!isDevelopment) return data;

  console.group(`🔍 Validación API: ${endpoint}`);
  
  try {
    // Validar ventas
    if (data.ventas && Array.isArray(data.ventas)) {
      data.ventas.forEach((venta, index) => {
        if (venta?.productos) {
          const productosNulos = venta.productos.filter(p => p == null);
          if (productosNulos.length > 0) {
            console.warn(`⚠️ Venta ${index + 1} (${venta._id?.slice(-6)}) tiene ${productosNulos.length} productos null/undefined`);
          }

          const productosSinNombre = venta.productos.filter(p => 
            p != null && !p.productoId?.nombre && !p.nombre
          );
          if (productosSinNombre.length > 0) {
            console.warn(`⚠️ Venta ${index + 1} (${venta._id?.slice(-6)}) tiene ${productosSinNombre.length} productos sin nombre`);
            console.warn('Productos problemáticos:', productosSinNombre);
          }
        }
      });
    }

    // Validar productos directos
    if (data.productos && Array.isArray(data.productos)) {
      const productosNulos = data.productos.filter(p => p == null);
      if (productosNulos.length > 0) {
        console.warn(`⚠️ API devolvió ${productosNulos.length} productos null/undefined`);
      }

      const productosSinNombre = data.productos.filter(p => 
        p != null && !p.nombre
      );
      if (productosSinNombre.length > 0) {
        console.warn(`⚠️ API devolvió ${productosSinNombre.length} productos sin nombre`);
        console.warn('Productos problemáticos:', productosSinNombre);
      }
    }

    console.log('✅ Validación completada');
  } catch (error) {
    console.error('❌ Error en validación:', error);
  }
  
  console.groupEnd();
  
  return data;
};

/**
 * Hook para interceptar y validar datos antes del render
 */
export const useValidacionDatos = (data, componentName) => {
  if (!isDevelopment) return data;

  React.useEffect(() => {
    if (!data) return;

    console.group(`🔍 Validación Componente: ${componentName}`);
    
    try {
      // Validar props de productos
      if (data.producto) {
        if (!data.producto) {
          console.warn('⚠️ Prop producto es null/undefined');
        } else if (!data.producto.productoId?.nombre && !data.producto.nombre) {
          console.warn('⚠️ Producto sin nombre:', data.producto);
        }
      }

      // Validar arrays de productos
      if (data.productos && Array.isArray(data.productos)) {
        const problemasEncontrados = data.productos.map((prod, index) => {
          const problemas = [];
          
          if (prod == null) {
            problemas.push('es null/undefined');
          } else {
            if (!prod.productoId?.nombre && !prod.nombre) {
              problemas.push('sin nombre');
            }
            if (!prod.cantidad && prod.cantidad !== 0) {
              problemas.push('sin cantidad');
            }
          }
          
          return problemas.length > 0 ? { index, problemas } : null;
        }).filter(Boolean);

        if (problemasEncontrados.length > 0) {
          console.warn(`⚠️ Encontrados ${problemasEncontrados.length} productos con problemas:`, problemasEncontrados);
        }
      }

      console.log('✅ Validación completada');
    } catch (error) {
      console.error('❌ Error en validación:', error);
    }
    
    console.groupEnd();
  }, [data, componentName]);

  return data;
};

/**
 * Wrapper para fetch que valida automáticamente las respuestas
 */
export const fetchConValidacion = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Validar la respuesta
    validarRespuestaAPI(data, url);
    
    return { ...response, data };
  } catch (error) {
    console.error('❌ Error en fetch con validación:', error);
    throw error;
  }
};

export default {
  validarRespuestaAPI,
  useValidacionDatos,
  fetchConValidacion
};
