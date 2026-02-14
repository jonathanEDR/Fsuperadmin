import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const BASE_URL = `${API_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
});

// Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(async config => {
  try {
    // Obtener el token y la sesión de Clerk
    const token = await window.Clerk?.session?.getToken();
    const user = window.Clerk?.user;
    
    if (!token || !user) {
      throw new Error('No hay sesión activa');
    }

    // Agregar token a los headers
    config.headers['Authorization'] = `Bearer ${token}`;
    
    // Agregar información del usuario a los headers
    config.headers['X-User-Email'] = user.primaryEmailAddress?.emailAddress;
    config.headers['X-User-Name'] = `${user.firstName} ${user.lastName}`.trim();
    config.headers['X-User-Id'] = user.id;
    
    // Agregar rol del usuario si está disponible
    if (user.publicMetadata?.role) {
      config.headers['X-User-Role'] = user.publicMetadata.role;
    }
    
    return config;
  } catch (error) {
    console.error('Error en interceptor de autenticación:', error);
    return Promise.reject(error);
  }
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Error en respuesta de API:', error);
    
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un código de error
      let errorMessage = 'Error del servidor';
      
      try {
        // Intentar extraer el mensaje de error de forma segura
        if (error.response.data && typeof error.response.data === 'object') {
          errorMessage = error.response.data.message || errorMessage;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } catch (extractionError) {
        console.error('Error al extraer mensaje de error:', extractionError);
        errorMessage = error.message || 'Error desconocido del servidor';
      }
      
      console.error('Error del servidor:', errorMessage);
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // La solicitud se hizo pero no hubo respuesta
      console.error('No se recibió respuesta del servidor');
      return Promise.reject(new Error('No se pudo conectar con el servidor'));
    } else {
      // Error en la configuración de la solicitud
      console.error('Error en la configuración:', error.message);
      return Promise.reject(error);
    }
  }
);

export const movimientoUnificadoService = {
  
  /**
   * Obtener tipos de productos disponibles
   */
  async obtenerTipos() {
    const response = await api.get('/movimientos-unificados/tipos');
    return response.data;
  },

  /**
   * Obtener productos por tipo
   */
  async obtenerProductosPorTipo(tipo) {
    const response = await api.get(`/movimientos-unificados/productos/${tipo}`);
    return response.data;
  },

  /**
   * Agregar cantidad a un producto
   */
  async agregarCantidad({ 
    tipoProducto, 
    productoId, 
    cantidad, 
    motivo = '', 
    precio = null, 
    consumirIngredientes = false, // Nombre antiguo (compatibilidad)
    consumirRecursos = false, // Nombre nuevo
    operador = '',
    observaciones = '',
    costoTotal = 0,
    ingredientesUtilizados = [],
    recetasUtilizadas = [],
    fechaProduccion = null // NUEVO: Campo para la fecha de producción
  }) {
    // Determinar el valor correcto de consumir (priorizar consumirRecursos sobre consumirIngredientes)
    const debeConsumirRecursos = consumirRecursos !== undefined && consumirRecursos !== false ? consumirRecursos : consumirIngredientes;
    
    const data = {
      tipoProducto,
      productoId,
      cantidad,
      motivo
    };
    // Agregar fecha de producción si se proporciona
    if (fechaProduccion) {
      data.fechaProduccion = fechaProduccion;
    }

    // Solo agregar precio si es para ingredientes/materiales y se proporciona
    if ((tipoProducto === 'ingredientes' || tipoProducto === 'materiales') && precio !== null && precio !== undefined) {
      data.precio = precio;
    }

    // Solo agregar consumirIngredientes para recetas
    if (tipoProducto === 'recetas') {
      data.consumirIngredientes = debeConsumirRecursos;
      data.consumirRecursos = debeConsumirRecursos; // Enviar ambos para compatibilidad
    }

    // Para producción, agregar datos adicionales
    if (tipoProducto === 'produccion') {
      data.operador = operador;
      data.observaciones = observaciones;
      data.costoTotal = costoTotal;
      data.ingredientesUtilizados = ingredientesUtilizados;
      data.recetasUtilizadas = recetasUtilizadas;
      data.consumirIngredientes = debeConsumirRecursos; // Enviar consumirIngredientes para backend
      data.consumirRecursos = debeConsumirRecursos; // Enviar también consumirRecursos
    }
    
    const response = await api.post('/movimientos-unificados/agregar-cantidad', data);
    
    return response.data;
  },

  /**
   * Obtener historial de movimientos con filtros
   */
  async obtenerHistorial(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.tipoProducto) params.append('tipoProducto', filtros.tipoProducto);
    if (filtros.tipoMovimiento) params.append('tipoMovimiento', filtros.tipoMovimiento);
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.operador) params.append('operador', filtros.operador);
    if (filtros.limite) params.append('limite', filtros.limite);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    
    const response = await api.get(`/movimientos-unificados/historial?${params}`);
    return response.data;
  },

  /**
   * Eliminar movimiento
   */
  async eliminarMovimiento(movimientoId) {
    const response = await api.delete(`/movimientos-unificados/movimiento/${movimientoId}`);
    return response.data;
  },

  /**
   * Obtener estadísticas de movimientos
   */
  async obtenerEstadisticas(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    
    const response = await api.get(`/movimientos-unificados/estadisticas?${params}`);
    return response.data;
  },

  /**
   * Obtener detalles de un producto específico con su historial
   */
  async obtenerDetalleProducto(tipoProducto, productoId) {
    const response = await api.get(`/movimientos-unificados/producto/${tipoProducto}/${productoId}`);
    return response.data;
  },

  /**
   * Obtener resumen rápido para dashboard
   */
  async obtenerResumen() {
    try {
      // Obtener estadísticas recientes (últimos 30 días)
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);
      
      const estadisticas = await this.obtenerEstadisticas({
        fechaInicio: fechaInicio.toISOString().split('T')[0]
      });
      
      // Obtener historial reciente
      const historial = await this.obtenerHistorial({
        limite: 10,
        pagina: 1
      });
      
      return {
        success: true,
        data: {
          estadisticas: estadisticas.data,
          movimientosRecientes: historial.data.movimientos,
          totalMovimientos: historial.data.total
        }
      };
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      throw error;
    }
  },

  /**
   * Validar datos antes de enviar
   */
  validarDatosMovimiento(tipoProducto, productoId, cantidad, motivo) {
    const errores = [];
    
    if (!tipoProducto) {
      errores.push('El tipo de producto es requerido');
    }
    
    if (!productoId) {
      errores.push('El producto es requerido');
    }
    
    if (!cantidad || cantidad <= 0) {
      errores.push('La cantidad debe ser mayor a 0');
    }
    
    if (motivo && motivo.length > 500) {
      errores.push('El motivo no puede exceder 500 caracteres');
    }
    
    return {
      esValido: errores.length === 0,
      errores
    };
  },

  /**
   * Formatear movimiento para mostrar
   */
  formatearMovimiento(movimiento) {
    return {
      ...movimiento,
      fechaFormateada: new Date(movimiento.fecha).toLocaleString(),
      tipoFormateado: this.formatearTipo(movimiento.tipo),
      tipoItemFormateado: this.formatearTipoItem(movimiento.tipoItem)
    };
  },

  /**
   * Formatear tipo de movimiento
   */
  formatearTipo(tipo) {
    const tipos = {
      'entrada': 'Entrada',
      'salida': 'Salida',
      'ajuste': 'Ajuste',
      'produccion': 'Producción',
      'consumo': 'Consumo'
    };
    
    return tipos[tipo] || tipo;
  },

  /**
   * Formatear tipo de item
   */
  formatearTipoItem(tipoItem) {
    const tipos = {
      'Ingrediente': 'Ingrediente',
      'Material': 'Material',
      'RecetaProducto': 'Receta',
      'CatalogoProduccion': 'Producción'
    };
    
    return tipos[tipoItem] || tipoItem;
  },

  /**
   * Obtener icono para tipo de producto
   */
  obtenerIconoTipo(tipoProducto) {
    const iconos = {
      'ingredientes': '🥕',
      'materiales': '📦',
      'recetas': '📋',
      'produccion': '🏭',
      'sucursales': '🏪'
    };
    
    return iconos[tipoProducto] || '📦';
  },

  /**
   * Obtener color para tipo de movimiento
   */
  obtenerColorTipo(tipo) {
    const colores = {
      'entrada': 'text-green-600 bg-green-50',
      'salida': 'text-red-600 bg-red-50',
      'ajuste': 'text-blue-600 bg-blue-50',
      'produccion': 'text-purple-600 bg-purple-50',
      'consumo': 'text-orange-600 bg-orange-50'
    };
    
    return colores[tipo] || 'text-gray-600 bg-gray-50';
  },
  
  /**
   * Eliminar un movimiento
   */
  async eliminarMovimiento(movimientoId) {
    const response = await api.delete(`/movimientos-unificados/movimiento/${movimientoId}`);
    
    return response.data;
  },

  // ======================================
  // FÓRMULA ESTÁNDAR DE PRODUCCIÓN
  // ======================================

  /**
   * Obtener la fórmula estándar de un producto
   */
  async obtenerFormulaEstandar(productoId) {
    const response = await api.get(`/movimientos-unificados/producto/${productoId}/formula-estandar`);
    return response.data;
  },

  /**
   * Guardar o actualizar la fórmula estándar de un producto
   */
  async guardarFormulaEstandar(productoId, recetas) {
    const response = await api.put(`/movimientos-unificados/producto/${productoId}/formula-estandar`, {
      recetas
    });
    return response.data;
  },

  /**
   * Eliminar la fórmula estándar de un producto
   */
  async eliminarFormulaEstandar(productoId) {
    const response = await api.delete(`/movimientos-unificados/producto/${productoId}/formula-estandar`);
    return response.data;
  }
};
