import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: API_URL, // Solo el URL base, sin '/api' aquí
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true   // Permite enviar cookies junto con cada petición
});

// Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(  async config => {
    try {
      // Logs deshabilitados para reducir ruido en consola
      // console.log('🔍 API Request:', config.method?.toUpperCase(), config.url);
      
      // Obtener el token y la sesión de Clerk
      const token = await window.Clerk?.session?.getToken();
      const user = window.Clerk?.user;
      
      if (!token || !user) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ No hay sesión activa');
        }
        throw new Error('No hay sesión activa');
      }

      // Agregar token a los headers
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Agregar información del usuario a los headers
      config.headers['X-User-Email'] = user.primaryEmailAddress?.emailAddress;
      config.headers['X-User-Name'] = `${user.firstName} ${user.lastName}`.trim();
      config.headers['X-User-Id'] = user.id;
      
      // Headers estándar
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json';
      
    } catch (error) {
      console.error('❌ Error en la configuración de la petición:', error);
      return Promise.reject(error);
    }
    return config;
  },
  error => {
    console.error('❌ Error en el interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export default api;

// Obtener todos los productos (inventario)
export const getProductos = async () => {
  try {
    const response = await api.get('/api/productos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

// Crear un nuevo producto (registrar producto)
export const createProducto = async (producto) => {
  try {
    const response = await api.post('/api/productos', producto);
    return response.data;
  } catch (error) {
    console.error('Error al agregar producto:', error);
    throw error;
  }
};


// Obtener todas las ventas
export const getVentas = async () => {
  try {
    const response = await api.get('/api/ventas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    throw error;
  }
};

// Crear una nueva venta
export const createVenta = async (venta) => {
  try {
    // Usar la instancia api configurada en lugar de axios directamente
    const response = await api.post('/api/ventas', venta);
    
    // Verificar si la respuesta contiene datos
    if (!response.data) {
      throw new Error('No se recibieron datos del servidor');
    }
    
    // Verificar si los datos de la venta están completos
    if (!response.data.colaboradorId || !response.data.productoId) {
      throw new Error('Los datos de la venta están incompletos');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error al agregar venta:', error.message);
    throw new Error(`Error al crear la venta: ${error.message}`);
  }
};

// Obtener todas las devoluciones
export const getDevoluciones = async () => {
  try {
    const response = await api.get('/api/devoluciones');
    return response.data;
  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    throw error;
  }
};

// Crear una nueva devolución
export const createDevolucion = async (devolucion) => {
  try {
    const response = await api.post('/api/devoluciones', {
      ventaId: devolucion.ventaId,
      productos: devolucion.productos.map(item => ({
        productoId: item.producto.productoId._id,
        cantidadDevuelta: parseInt(item.cantidad),
        montoDevolucion: parseFloat(item.montoDevolucion)
      })),
      motivo: devolucion.motivo,
      fechaDevolucion: devolucion.fechaDevolucion
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    console.error('Error al crear devolución:', error);
    throw error;
  }
};

// Eliminar una devolución
export const deleteDevolucion = async (id) => {
  try {
    const response = await api.delete(`/api/devoluciones/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar devolución:', error);
    throw error;
  }
};


// Función para crear un cobro
export const createCobro = async (cobro) => {
  try {
    // Format the data before sending
    const formattedCobro = {
      userId: cobro.userId,
      ventasId: cobro.ventasId,
      yape: Number(cobro.yape || 0),
      efectivo: Number(cobro.efectivo || 0),
      gastosImprevistos: Number(cobro.gastosImprevistos || 0),
      montoPagado: Number(cobro.montoPagado),
      estadoPago: cobro.estadoPago.toLowerCase(),
      fechaPago: cobro.fechaPago    };
    
    const response = await api.post('/cobros', formattedCobro);
    return response;
  } catch (error) {
    console.error('Error detallado:', error.response?.data);
    throw error;
  }
};

// Obtener todos los cobros
export const getCobros = async () => {
  try {
    const response = await api.get('/api/cobros');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los cobros:', error);
    throw error;
  }
};

// Obtener información de deuda por usuario
export const getDebtInfo = async () => {
  try {
    const response = await api.get('/api/cobros/debt');
    return response.data;
  } catch (error) {
    console.error('Error al obtener información de deuda:', error);
    throw error;
  }
};

// Obtener ventas pendientes de pago por usuario
export const getPendingVentas = async () => {
  try {
    const response = await api.get('/api/cobros/ventas-pendientes');
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas pendientes:', error);
    throw error;
  }
};

// Obtener información de deuda pendiente para un usuario
export const getUserDebtInfo = async () => {
  try {
    const response = await api.get('/cobros/debt');
    return response.data;
  } catch (error) {
    console.error('Error al obtener información de deuda:', error);
    throw error;
  }
};

// Obtener ventas pendientes para un usuario
export const getPendingVentasForUser = async () => {
  try {
    const response = await api.get('/cobros/ventas-pendientes');
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas pendientes:', error);
    throw error;
  }
};

// Obtener historial de pagos para un usuario
export const getPaymentHistory = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/api/cobros/history?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    throw error;
  }
};

// Crear un nuevo pago
export const createPayment = async (paymentData) => {
  try {
    const response = await api.post('/cobros', {
      ...paymentData,
      montoPagado: Number(paymentData.montoPagado),
      yape: Number(paymentData.yape || 0),
      efectivo: Number(paymentData.efectivo || 0),
      gastosImprevistos: Number(paymentData.gastosImprevistos || 0),
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear pago:', error);
    throw error;
  }
};

// PAGOS REALIZADOS
export const getPagosRealizados = async () => {
  try {
    const response = await api.get('/api/pagos-realizados');
    return response.data;
  } catch (error) {
    console.error('Error al obtener pagos realizados:', error);
    throw error;
  }
};

export const createPagoRealizado = async (pago) => {
  try {
    const response = await api.post('/api/pagos-realizados', pago);
    return response.data;
  } catch (error) {
    console.error('Error al crear pago realizado:', error);
    throw error;
  }
};

export const deletePagoRealizado = async (id) => {
  try {
    const response = await api.delete(`/api/pagos-realizados/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar pago realizado:', error);
    throw error;
  }
};
