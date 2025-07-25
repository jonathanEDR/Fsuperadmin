import api from './api';

class CatalogoProduccionService {
  
  // ==================== CONEXIÓN Y PRUEBAS ====================
  
  async testConexion() {
    try {
      const response = await api.get('/api/catalogo-produccion/test');
      return { backend: true, message: 'Conexión exitosa', data: response.data };
    } catch (error) {
      console.error('❌ Error en testConexion:', error);
      return { backend: false, message: error.message };
    }
  }

  // ==================== GESTIÓN DE MÓDULOS DEL SISTEMA ====================
  
  async obtenerModulosDisponibles() {
    try {
      const response = await api.get('/api/catalogo-produccion/modulos');
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerModulosDisponibles:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DEL CATÁLOGO ====================
  
  async obtenerProductosCatalogo(filtros = {}) {
    try {
      const response = await api.get('/api/catalogo-produccion', { params: filtros });
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerProductosCatalogo:', error);
      throw error;
    }
  }

  // Método específico para obtener productos por módulo (usado por CatalogoProduccion.jsx)
  async obtenerProductosPorModulo(filtros = {}) {
    try {
      const response = await api.get('/api/catalogo-produccion', { params: filtros });
      
      // Asegurar que retornamos un array
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Error en obtenerProductosPorModulo:', error);
      throw error;
    }
  }

  async crearProductoCatalogo(datosProducto) {
    try {
      const response = await api.post('/api/catalogo-produccion', datosProducto);
      return response.data;
    } catch (error) {
      console.error('❌ Error en crearProductoCatalogo:', error);
      throw error;
    }
  }

  // Método específico para crear producto por módulo (usado por CatalogoProduccion.jsx)
  async crearProductoPorModulo(datosProducto) {
    try {
      const response = await api.post('/api/catalogo-produccion', datosProducto);
      return response.data;
    } catch (error) {
      console.error('❌ Error en crearProductoPorModulo:', error);
      throw error;
    }
  }

  async actualizarProductoCatalogo(id, datosProducto) {
    try {
      const response = await api.put(`/api/catalogo-produccion/${id}`, datosProducto);
      return response.data;
    } catch (error) {
      console.error('❌ Error en actualizarProductoCatalogo:', error);
      throw error;
    }
  }

  // Método específico para actualizar producto (usado por CatalogoProduccion.jsx)
  async actualizarProducto(id, datosProducto) {
    try {
      const response = await api.put(`/api/catalogo-produccion/${id}`, datosProducto);
      return response.data;
    } catch (error) {
      console.error('❌ Error en actualizarProducto:', error);
      throw error;
    }
  }

  async eliminarProductoCatalogo(id) {
    try {
      const response = await api.delete(`/api/catalogo-produccion/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en eliminarProductoCatalogo:', error);
      throw error;
    }
  }

  // Método específico para eliminar producto (usado por CatalogoProduccion.jsx)
  async eliminarProducto(id) {
    try {
      const response = await api.delete(`/api/catalogo-produccion/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en eliminarProducto:', error);
      throw error;
    }
  }

  // ==================== GENERACIÓN DE CÓDIGOS ====================
  
  async generarCodigoAutomatico(moduloSistema) {
    try {
      const response = await api.get(`/api/catalogo-produccion/generar-codigo/${moduloSistema}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en generarCodigoAutomatico:', error);
      throw error;
    }
  }

  // ==================== VALIDACIONES ====================
  
  async validarCodigoUnico(codigo, idProductoExcluir = null) {
    try {
      const params = { codigo };
      if (idProductoExcluir) {
        params.excluir = idProductoExcluir;
      }
      
      const response = await api.get('/api/catalogo-produccion/validar-codigo', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error en validarCodigoUnico:', error);
      throw error;
    }
  }

  // ==================== ESTADÍSTICAS ====================
  
  async obtenerEstadisticasCatalogo() {
    try {
      const response = await api.get('/api/catalogo-produccion/estadisticas');
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerEstadisticasCatalogo:', error);
      throw error;
    }
  }

  // ==================== BÚSQUEDA Y FILTROS ====================
  
  async buscarProductos(termino, filtros = {}) {
    try {
      const params = { busqueda: termino, ...filtros };
      const response = await api.get('/api/catalogo-produccion/buscar', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error en buscarProductos:', error);
      throw error;
    }
  }

  // ==================== EXPORTACIÓN E IMPORTACIÓN ====================
  
  async exportarCatalogo(formato = 'excel', filtros = {}) {
    try {
      const params = { formato, ...filtros };
      const response = await api.get('/api/catalogo-produccion/exportar', { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error en exportarCatalogo:', error);
      throw error;
    }
  }

  async importarCatalogo(archivo) {
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      
      const response = await api.post('/api/catalogo-produccion/importar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error en importarCatalogo:', error);
      throw error;
    }
  }

  // ==================== UTILIDADES ====================
  
  async obtenerProductoPorId(id) {
    try {
      const response = await api.get(`/api/catalogo-produccion/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerProductoPorId:', error);
      throw error;
    }
  }

  async obtenerProductoPorCodigo(codigo) {
    try {
      const response = await api.get(`/api/catalogo-produccion/productos/codigo/${codigo}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtenerProductoPorCodigo:', error);
      throw error;
    }
  }

  // ==================== ACTIVACIÓN/DESACTIVACIÓN ====================
  
  async activarProducto(id) {
    try {
      const response = await api.patch(`/api/catalogo-produccion/${id}/activar`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en activarProducto:', error);
      throw error;
    }
  }

  async desactivarProducto(id) {
    try {
      const response = await api.patch(`/api/catalogo-produccion/${id}/desactivar`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en desactivarProducto:', error);
      throw error;
    }
  }

  // Método específico para alternar el estado activo (usado por CatalogoProduccion.jsx)
  async toggleActivoProducto(id, nuevoEstado) {
    try {
      const endpoint = nuevoEstado ? 'activar' : 'desactivar';
      const response = await api.patch(`/api/catalogo-produccion/${id}/${endpoint}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en toggleActivoProducto:', error);
      throw error;
    }
  }
}

// Crear instancia única del servicio
const catalogoProduccionService = new CatalogoProduccionService();

// Export por defecto para que funcione con el import actual
export default catalogoProduccionService;
