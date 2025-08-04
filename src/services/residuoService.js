import { useAuth } from '@clerk/clerk-react';

class ResiduoService {
  constructor() {
    this.baseURL = '/api/residuos';
  }

  // Obtener token de autenticación usando el patrón correcto
  async getAuthToken() {
    try {
      if (typeof window !== 'undefined' && window.Clerk) {
        const token = await window.Clerk.session?.getToken();
        if (!token) {
          throw new Error('No hay sesión activa');
        }
        return token;
      }
      throw new Error('Clerk no está disponible');
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      throw new Error('No se pudo obtener el token de autenticación');
    }
  }

  // Headers base para las peticiones
  async getHeaders() {
    const token = await this.getAuthToken();
    const user = window.Clerk?.user;
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(user?.primaryEmailAddress?.emailAddress && {
        'X-User-Email': user.primaryEmailAddress.emailAddress
      })
    };
  }

  // Registrar nuevo residuo
  async registrarResiduo(datosResiduo) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(datosResiduo)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      // Extraer data del wrapper {success: true, data: {...}}
      return result.data || result;
      
    } catch (error) {
      console.error('Error en registrarResiduo:', error);
      throw error;
    }
  }

  // Obtener lista de residuos
  async obtenerResiduos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      // Agregar filtros a los parámetros
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== undefined && filtros[key] !== null && filtros[key] !== '') {
          params.append(key, filtros[key]);
        }
      });

      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseURL}?${params.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      // Extraer data del wrapper {success: true, data: {...}}
      return result.data || result;
      
    } catch (error) {
      console.error('❌ Error en obtenerResiduos:', error);
      throw error;
    }
  }

  // Obtener productos por tipo
  async obtenerProductosPorTipo(tipoProducto) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseURL}/productos/${tipoProducto}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      // Extraer data del wrapper {success: true, data: [...]}
      return result.data || result;
      
    } catch (error) {
      console.error('❌ Error en obtenerProductosPorTipo:', error);
      throw error;
    }
  }

  // Eliminar residuo
  async eliminarResiduo(residuoId) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseURL}/${residuoId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      // Extraer data del wrapper {success: true, data: {...}}
      return result.data || result;
      
    } catch (error) {
      console.error('❌ Error en eliminarResiduo:', error);
      throw error;
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas() {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseURL}/estadisticas`, {
        method: 'GET',
        headers
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener estadísticas');
      }

      return data;
    } catch (error) {
      console.error('❌ Error en obtenerEstadisticas:', error);
      throw error;
    }
  }

  // Obtener residuo específico
  async obtenerResiduoPorId(residuoId) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseURL}/${residuoId}`, {
        method: 'GET',
        headers
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener residuo');
      }

      return data;
    } catch (error) {
      console.error('❌ Error en obtenerResiduoPorId:', error);
      throw error;
    }
  }

  // Utilidades para formatear datos
  formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearMoneda(monto) {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }

  // Obtener etiquetas amigables para los tipos
  obtenerEtiquetaTipo(tipo) {
    const etiquetas = {
      'ingrediente': 'Ingrediente',
      'material': 'Material',
      'receta': 'Receta',
      'produccion': 'Producción'
    };
    return etiquetas[tipo] || tipo;
  }

  // Obtener etiquetas amigables para los motivos
  obtenerEtiquetaMotivo(motivo) {
    const etiquetas = {
      'vencido': 'Vencido/Caducado',
      'dañado': 'Dañado/Defectuoso',
      'merma': 'Merma',
      'error_proceso': 'Error en Proceso',
      'otros': 'Otros'
    };
    return etiquetas[motivo] || motivo;
  }

  // Obtener color para el tipo de producto
  obtenerColorTipo(tipo) {
    const colores = {
      'ingrediente': 'bg-green-100 text-green-800',
      'material': 'bg-yellow-100 text-yellow-800',
      'receta': 'bg-blue-100 text-blue-800',
      'produccion': 'bg-purple-100 text-purple-800'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
  }

  // Obtener color para el motivo
  obtenerColorMotivo(motivo) {
    const colores = {
      'vencido': 'bg-red-100 text-red-800',
      'dañado': 'bg-orange-100 text-orange-800',
      'merma': 'bg-yellow-100 text-yellow-800',
      'error_proceso': 'bg-purple-100 text-purple-800',
      'otros': 'bg-gray-100 text-gray-800'
    };
    return colores[motivo] || 'bg-gray-100 text-gray-800';
  }
}

// Crear instancia única del servicio
export const residuoService = new ResiduoService();
