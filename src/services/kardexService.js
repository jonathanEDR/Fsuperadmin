import api from './api';

/**
 * Servicio Frontend para el API Kardex
 * Conecta con /api/kardex/* del backend
 * 
 * Provee acceso a:
 * - Tarjeta Kardex (historial contable de un item)
 * - Costo PEPS actual de ingredientes/recetas/materiales
 * - Simulación de costo de producción
 * - Resumen general de inventario valorizado
 * - Disponibilidad de stock por lotes
 * - Configuración de método de valuación
 * - Alertas de vencimiento de lotes
 */
export const kardexService = {

  // ========================================
  // CONSULTAS PRINCIPALES
  // ========================================

  /**
   * Obtener la tarjeta Kardex completa de un item
   * Muestra todas las entradas/salidas con saldos
   * 
   * @param {string} tipoItem - 'Ingrediente' | 'Material' | 'RecetaProducto'
   * @param {string} itemId - ID del item
   * @param {Object} opciones - { fechaInicio, fechaFin, pagina, limite }
   */
  async obtenerTarjetaKardex(tipoItem, itemId, opciones = {}) {
    const params = new URLSearchParams();
    if (opciones.fechaInicio) params.append('fechaInicio', opciones.fechaInicio);
    if (opciones.fechaFin) params.append('fechaFin', opciones.fechaFin);
    if (opciones.pagina) params.append('pagina', opciones.pagina);
    if (opciones.limite) params.append('limite', opciones.limite);

    const queryString = params.toString();
    const url = `/api/kardex/tarjeta/${tipoItem}/${itemId}${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener el costo PEPS actual de un item
   * (precio al que saldría la próxima unidad consumida)
   */
  async obtenerCostoPeps(tipoItem, itemId) {
    const response = await api.get(`/api/kardex/costo-peps/${tipoItem}/${itemId}`);
    return response.data;
  },

  /**
   * Simular el costo de producción de una receta sin consumir inventario
   * Devuelve desglose PEPS por cada ingrediente/sub-receta
   * 
   * @param {string} recetaId - ID de la receta
   * @param {number} cantidadAProducir - Cantidad de lotes a producir (default: 1)
   */
  async simularCostoProduccion(recetaId, cantidadAProducir = 1) {
    const response = await api.post('/api/kardex/simular-costo', {
      recetaId,
      cantidadAProducir
    });
    return response.data;
  },

  /**
   * Obtener resumen general del inventario con valuación
   * @param {string|null} tipoItem - Filtrar por tipo (opcional)
   */
  async obtenerResumen(tipoItem = null) {
    const params = tipoItem ? `?tipoItem=${tipoItem}` : '';
    const response = await api.get(`/api/kardex/resumen${params}`);
    return response.data;
  },

  /**
   * Verificar disponibilidad de stock de un item en el Kardex
   * @param {string} tipoItem 
   * @param {string} itemId 
   * @param {number} cantidadRequerida - Cantidad a verificar
   */
  async verificarDisponibilidad(tipoItem, itemId, cantidadRequerida = 0) {
    const params = cantidadRequerida ? `?cantidad=${cantidadRequerida}` : '';
    const response = await api.get(`/api/kardex/disponibilidad/${tipoItem}/${itemId}${params}`);
    return response.data;
  },

  // ========================================
  // ENTRADAS Y SALIDAS
  // ========================================

  /**
   * Registrar entrada de lote al Kardex
   */
  async registrarEntrada(datos) {
    const response = await api.post('/api/kardex/entrada', datos);
    return response.data;
  },

  /**
   * Registrar salida del Kardex (consume lotes por PEPS)
   */
  async registrarSalida(datos) {
    const response = await api.post('/api/kardex/salida', datos);
    return response.data;
  },

  /**
   * Revertir una salida previamente registrada
   */
  async revertirSalida(movimientoId, motivo = '') {
    const response = await api.post(`/api/kardex/revertir/${movimientoId}`, { motivo });
    return response.data;
  },

  // ========================================
  // CONFIGURACIÓN
  // ========================================

  /**
   * Obtener configuración actual del Kardex
   */
  async obtenerConfiguracion() {
    const response = await api.get('/api/kardex/configuracion');
    return response.data;
  },

  /**
   * Actualizar configuración del Kardex
   */
  async actualizarConfiguracion(datos) {
    const response = await api.put('/api/kardex/configuracion', datos);
    return response.data;
  },

  /**
   * Inicializar configuración por defecto (PEPS)
   */
  async inicializarConfiguracion() {
    const response = await api.post('/api/kardex/configuracion/inicializar');
    return response.data;
  },

  // ========================================
  // ALERTAS
  // ========================================

  /**
   * Obtener lotes próximos a vencer
   * @param {number} dias - Días de anticipación (default: 7)
   */
  async obtenerAlertasVencimiento(dias = 7) {
    const response = await api.get(`/api/kardex/alertas/vencimiento?dias=${dias}`);
    return response.data;
  }
};

export default kardexService;
