// Servicio del catálogo de producción - Conexión real al backend con fallback
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Datos simulados como fallback - ahora con módulos
const modulosSimulados = [
  { id: 'ingredientes', nombre: 'Ingredientes', descripcion: 'Productos para gestión de ingredientes', icono: '�', color: '#10B981' },
  { id: 'materiales', nombre: 'Materiales', descripcion: 'Productos para gestión de materiales', icono: '🧱', color: '#F59E0B' },
  { id: 'recetas', nombre: 'Recetas', descripcion: 'Productos para gestión de recetas', icono: '📝', color: '#8B5CF6' },
  { id: 'produccion', nombre: 'Producción', descripcion: 'Productos para gestión de producción', icono: '�', color: '#3B82F6' }
];

const productosSimulados = [
  { _id: '1', codigo: 'ING-001', nombre: 'Tomate', descripcion: 'Tomate fresco', moduloSistema: 'ingredientes', activo: true },
  { _id: '2', codigo: 'MAT-001', nombre: 'Envase Plástico', descripcion: 'Envase para productos', moduloSistema: 'materiales', activo: true },
  { _id: '3', codigo: 'REC-001', nombre: 'Salsa Base', descripcion: 'Receta de salsa base', moduloSistema: 'recetas', activo: true },
  { _id: '4', codigo: 'PRO-001', nombre: 'Pizza Margarita', descripcion: 'Pizza clásica italiana', moduloSistema: 'produccion', activo: true }
];

// Configurar axios con interceptores para manejar errores
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000 // 5 segundos timeout
});

// Variable para determinar si usar backend o simulado
let useBackend = true;

// Interceptor para incluir token de autenticación de Clerk
api.interceptors.request.use(
  async (config) => {
    try {
      // Obtener token de Clerk si está disponible
      if (window.Clerk && window.Clerk.session) {
        const token = await window.Clerk.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('No se pudo obtener token de Clerk:', error.message);
      // Continuar sin token, el backend usará modo simulado
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    useBackend = true; // Si llegamos aquí, el backend funciona
    return response;
  },
  (error) => {
    console.warn('Error de backend, usando datos simulados:', error.message);
    useBackend = false; // Cambiar a modo simulado
    return Promise.reject(error);
  }
);

const catalogoProduccionService = {
  // ==================== DIAGNÓSTICO ====================
  
  testConexion: async function() {
    try {
      const response = await axios.get(`${API_BASE_URL}/catalogo-produccion/test`);
      return {
        success: true,
        data: response.data,
        backend: true
      };
    } catch (error) {
      return {
        success: true,
        data: { message: 'Usando datos simulados', timestamp: new Date().toISOString() },
        backend: false
      };
    }
  },

  // ==================== MÓDULOS DEL SISTEMA ====================
  
  obtenerModulosDisponibles: async function() {
    try {
      const response = await api.get('/catalogo-produccion/modulos');
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      return { data: modulosSimulados };
    }
  },

  // ==================== PRODUCTOS DEL CATÁLOGO ====================

  obtenerProductosCatalogo: async function(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.moduloSistema) params.append('moduloSistema', filtros.moduloSistema);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      
      const response = await api.get(`/catalogo-produccion?${params}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      let productos = [...productosSimulados];
      if (filtros.activo !== undefined) {
        productos = productos.filter(p => p.activo === filtros.activo);
      }
      if (filtros.moduloSistema) {
        productos = productos.filter(p => p.moduloSistema === filtros.moduloSistema);
      }
      if (filtros.buscar) {
        productos = productos.filter(p => 
          p.nombre.toLowerCase().includes(filtros.buscar.toLowerCase()) ||
          p.codigo.toLowerCase().includes(filtros.buscar.toLowerCase()) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(filtros.buscar.toLowerCase()))
        );
      }
      return { data: productos };
    }
  },

  // Función específica para obtener productos por módulo
  obtenerProductosPorModulo: async function(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.buscar) params.append('buscar', filtros.buscar);
      if (filtros.moduloSistema) params.append('moduloSistema', filtros.moduloSistema);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      
      const response = await api.get(`/catalogo-produccion/modulo?${params}`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.warn('Backend no disponible, usando datos simulados para productos por módulo:', error.message);
      let productos = [...productosSimulados];
      
      // Aplicar filtros
      if (filtros.activo !== undefined) {
        productos = productos.filter(p => p.activo === filtros.activo);
      }
      if (filtros.moduloSistema) {
        productos = productos.filter(p => p.moduloSistema === filtros.moduloSistema);
      }
      if (filtros.buscar) {
        const busqueda = filtros.buscar.toLowerCase();
        productos = productos.filter(p => 
          p.nombre.toLowerCase().includes(busqueda) ||
          p.codigo.toLowerCase().includes(busqueda) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(busqueda))
        );
      }
      return productos;
    }
  },

  crearProductoCatalogo: async function(datos) {
    try {
      const response = await api.post('/catalogo-produccion', datos);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      // Simular creación local
      const nuevoProducto = {
        _id: Date.now().toString(),
        codigo: datos.codigo || `PRD-${Date.now()}`,
        nombre: datos.nombre,
        descripcion: datos.descripcion || '',
        moduloSistema: datos.moduloSistema || 'produccion',
        unidadMedida: datos.unidadMedida || 'unidad',
        activo: true,
        createdAt: new Date().toISOString()
      };
      
      productosSimulados.push(nuevoProducto);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      return { data: nuevoProducto };
    }
  },

  // Función específica para crear producto por módulo
  crearProductoPorModulo: async function(datos) {
    try {
      const response = await api.post('/catalogo-produccion/modulo', datos);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Backend no disponible, creando producto simulado:', error.message);
      // Simular creación local
      const nuevoProducto = {
        _id: Date.now().toString(),
        codigo: datos.codigo || `${datos.moduloSistema?.toUpperCase().substring(0,3)}-${Date.now()}`,
        nombre: datos.nombre,
        descripcion: datos.descripcion || '',
        moduloSistema: datos.moduloSistema || 'produccion',
        unidadMedida: datos.unidadMedida || 'unidad',
        activo: true,
        createdAt: new Date().toISOString()
      };
      
      productosSimulados.push(nuevoProducto);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      return nuevoProducto;
    }
  },

  actualizarProductoCatalogo: async function(id, datos) {
    try {
      console.log('🔄 Intentando actualizar producto en backend...');
      const response = await api.put(`/catalogo-produccion/${id}`, datos);
      console.log('✅ Producto actualizado en backend:', response.data);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      console.warn('⚠️ Backend no disponible, simulando actualización de producto');
      const index = productosSimulados.findIndex(p => p._id === id);
      if (index !== -1) {
        productosSimulados[index] = {
          ...productosSimulados[index],
          ...datos,
          updatedAt: new Date().toISOString()
        };
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: productosSimulados[index] };
      }
      throw new Error('Producto no encontrado');
    }
  },

  desactivarProductoCatalogo: async function(id) {
    try {
      // Usar DELETE /:id según la ruta del backend
      const response = await api.delete(`/catalogo-produccion/${id}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      console.warn('Error al conectar con el backend, usando datos simulados:', error.message);
      // Fallback a datos simulados
      const index = productosSimulados.findIndex(p => p._id === id);
      if (index !== -1) {
        productosSimulados[index].activo = false;
        productosSimulados[index].updatedAt = new Date().toISOString();
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: productosSimulados[index] };
      }
      throw new Error('Producto no encontrado');
    }
  },

  activarProductoCatalogo: async function(id) {
    try {
      const response = await api.patch(`/catalogo-produccion/${id}/activar`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      const index = productosSimulados.findIndex(p => p._id === id);
      if (index !== -1) {
        productosSimulados[index].activo = true;
        productosSimulados[index].updatedAt = new Date().toISOString();
        await new Promise(resolve => setTimeout(resolve, 300));
        return { data: productosSimulados[index] };
      }
      throw new Error('Producto no encontrado');
    }
  },

  obtenerEstadisticasCatalogo: async function() {
    try {
      const response = await api.get('/catalogo-produccion/estadisticas');
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        data: {
          totalProductos: productosSimulados.length,
          productosActivos: productosSimulados.filter(p => p.activo).length,
          productosInactivos: productosSimulados.filter(p => !p.activo).length,
          tiposProduccion: tiposSimulados.filter(t => t.activo).length
        }
      };
    }
  },

  generarCodigoAutomatico: async function(moduloSistema) {
    try {
      // Intentar generar código desde el backend 
      const response = await api.get(`/catalogo-produccion/generar-codigo/${moduloSistema}`);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      // Fallback: generar código local
      const prefijos = {
        ingredientes: 'ING',
        materiales: 'MAT', 
        recetas: 'REC',
        produccion: 'PRO'
      };
      const prefijo = prefijos[moduloSistema] || 'GEN';
      const numero = String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0');
      return { data: { codigo: `${prefijo}-${numero}` } };
    }
  },

  // ==================== MÉTODOS ESPECÍFICOS POR MÓDULO ====================

  obtenerProductosParaIngredientes: async function() {
    try {
      const response = await api.get('/catalogo-produccion/ingredientes');
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      return this.obtenerProductosCatalogo({ moduloSistema: 'ingredientes', activo: true });
    }
  },

  obtenerProductosParaMateriales: async function() {
    try {
      const response = await api.get('/catalogo-produccion/materiales');
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      return this.obtenerProductosCatalogo({ moduloSistema: 'materiales', activo: true });
    }
  },

  obtenerProductosParaRecetas: async function() {
    try {
      const response = await api.get('/catalogo-produccion/recetas');
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      return this.obtenerProductosCatalogo({ moduloSistema: 'recetas', activo: true });
    }
  },

  obtenerProductosParaProduccion: async function() {
    try {
      const response = await api.get('/catalogo-produccion/produccion');
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      return this.obtenerProductosCatalogo({ moduloSistema: 'produccion', activo: true });
    }
  },

  // ==================== FUNCIONES DE GESTIÓN DE PRODUCTOS ====================

  actualizarProducto: async function(id, datos) {
    try {
      const response = await api.put(`/catalogo-produccion/${id}`, datos);
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Backend no disponible, actualizando producto simulado:', error.message);
      // Simular actualización local
      const index = productosSimulados.findIndex(p => p._id === id);
      if (index !== -1) {
        productosSimulados[index] = { ...productosSimulados[index], ...datos };
        await new Promise(resolve => setTimeout(resolve, 300));
        return productosSimulados[index];
      }
      throw new Error('Producto no encontrado');
    }
  },

  eliminarProducto: async function(id) {
    try {
      const response = await api.delete(`/catalogo-produccion/${id}`);
      return response.data;
    } catch (error) {
      console.warn('Backend no disponible, eliminando producto simulado:', error.message);
      // Simular eliminación local
      const index = productosSimulados.findIndex(p => p._id === id);
      if (index !== -1) {
        productosSimulados.splice(index, 1);
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true };
      }
      throw new Error('Producto no encontrado');
    }
  },

  toggleActivoProducto: async function(id, activo) {
    try {
      const response = await api.patch(`/catalogo-produccion/${id}/toggle-activo`, { activo });
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Backend no disponible, actualizando estado simulado:', error.message);
      // Simular toggle local
      const index = productosSimulados.findIndex(p => p._id === id);
      if (index !== -1) {
        productosSimulados[index].activo = activo;
        await new Promise(resolve => setTimeout(resolve, 300));
        return productosSimulados[index];
      }
      throw new Error('Producto no encontrado');
    }
  }
};

export default catalogoProduccionService;
