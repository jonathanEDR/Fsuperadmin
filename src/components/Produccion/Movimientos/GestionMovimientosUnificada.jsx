import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { produccionService } from '../../../services/produccionService';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import SelectorTipoProducto from './SelectorTipoProducto';
import ModalAgregarCantidad from './ModalAgregarCantidad';
import ModalProducirReceta from './ModalProducirReceta';
import ModalProducirProducto from './ModalProducirProducto';
import ModalIncrementarStock from './ModalIncrementarStock';
import HistorialProduccion from './HistorialProduccion';

const GestionMovimientosUnificada = ({ onVolver }) => {
  // Estados principales
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [productos, setProductos] = useState([]);
  const [productosOriginales, setProductosOriginales] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  
  // Estados de loading
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  // Estados del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRecetaOpen, setModalRecetaOpen] = useState(false);
  const [modalProduccionOpen, setModalProduccionOpen] = useState(false);
  const [modalIncrementarOpen, setModalIncrementarOpen] = useState(false);
  const [historialProduccionOpen, setHistorialProduccionOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    buscar: '',
    tipoMovimiento: '',
    fechaInicio: '',
    fechaFin: '',
    limite: 20,
    pagina: 1
  });

  // Estados de error
  const [error, setError] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    cargarHistorial();
    cargarEstadisticas();
  }, []);

  // Cargar productos cuando cambia el tipo seleccionado
  useEffect(() => {
    if (tipoSeleccionado) {
      cargarProductos();
    }
  }, [tipoSeleccionado]);

  // Cargar historial cuando cambian los filtros
  useEffect(() => {
    cargarHistorial();
  }, [filtros, tipoSeleccionado]);

  /**
   * Cargar productos por tipo
   */
  const cargarProductos = async () => {
    if (!tipoSeleccionado) {
      console.log('⚠️ No hay tipo seleccionado, saltando carga de productos');
      return;
    }
    
    setCargandoProductos(true);
    setError('');
    
    try {
      console.log(`🔍 Cargando productos para tipo: ${tipoSeleccionado}`);
      
      const response = await movimientoUnificadoService.obtenerProductosPorTipo(tipoSeleccionado);
      const productosData = response.data || [];
      
      console.log(`📦 Productos recibidos del backend:`, productosData.map(p => ({
        id: p._id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        stock: p.stock
      })));
      
      // FORZAR NUEVA REFERENCIA - SOLUCION DEL BUG
      const productosConNuevasReferencias = productosData.map(producto => ({
        ...producto,
        // Forzar que React detecte el cambio agregando timestamp
        _lastUpdated: Date.now()
      }));
      
      setProductos(productosConNuevasReferencias);
      setProductosOriginales(productosConNuevasReferencias);
      
      console.log(`✅ ${productosData.length} productos cargados y establecidos en el estado`);
      
      // Log específico para producción
      if (tipoSeleccionado === 'produccion') {
        console.log('🏭 Productos de producción actualizados:', productosData.map(p => ({
          id: p._id,
          nombre: p.nombre,
          cantidadActual: p.cantidad,
          moduloSistema: p.moduloSistema,
          catalogoId: p.catalogoProductoId,
          inventarioId: p.inventarioProductoId
        })));
      }
      
    } catch (error) {
      console.error('❌ Error al cargar productos:', error);
      setError(`Error al cargar productos: ${error.message}`);
      setProductos([]);
    } finally {
      setCargandoProductos(false);
    }
  };

  /**
   * Cargar historial de movimientos
   */
  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    
    try {
      const filtrosHistorial = {
        ...filtros,
        tipoProducto: tipoSeleccionado || undefined
      };
      
      console.log('🔍 Cargando historial con filtros:', filtrosHistorial);
      
      const response = await movimientoUnificadoService.obtenerHistorial(filtrosHistorial);
      const historialData = response.data || {};
      
      // VALIDACIÓN: Asegurar que movimientos es un array
      const movimientos = historialData.movimientos;
      if (!Array.isArray(movimientos)) {
        console.error('🚨 PROBLEMA: movimientos no es un array en frontend:', typeof movimientos, movimientos);
        setHistorial([]);
        return;
      }
      
      setHistorial(movimientos);
      console.log(`✅ ${movimientos.length} movimientos cargados para tipo: ${tipoSeleccionado}`);
      
      // Log específico para recetas
      if (tipoSeleccionado === 'recetas') {
        console.log('🧪 Movimientos de recetas en frontend:', historialData.movimientos?.map(m => ({
          id: m._id,
          item: m.item?.nombre,
          tipo: m.tipo,
          cantidad: m.cantidad,
          fecha: m.fecha
        })));
      }
      
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setHistorial([]);
    } finally {
      setCargandoHistorial(false);
    }
  };

  /**
   * Cargar estadísticas
   */
  const cargarEstadisticas = async () => {
    try {
      const response = await movimientoUnificadoService.obtenerEstadisticas();
      setEstadisticas(response.data || {});
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  /**
   * Manejar cambio de tipo de producto
   */
  const handleTipoSeleccionado = (tipo) => {
    setTipoSeleccionado(tipo);
    setProductos([]);
    setError('');
  };

  /**
   * Manejar búsqueda de productos
   */
  const handleBusqueda = (termino) => {
    const filtrados = productosOriginales.filter(producto =>
      producto.nombre?.toLowerCase().includes(termino.toLowerCase()) ||
      producto.productoReferencia?.nombre?.toLowerCase().includes(termino.toLowerCase()) ||
      producto.codigo?.toLowerCase().includes(termino.toLowerCase())
    );
    
    setProductos(filtrados);
    setFiltros(prev => ({ ...prev, buscar: termino }));
  };

  /**
   * Abrir modal para agregar cantidad
   */
  const abrirModalAgregar = (producto) => {
    setProductoSeleccionado(producto);
    
    // Si es una receta, abrir el modal específico para recetas
    if (tipoSeleccionado === 'recetas') {
      setModalRecetaOpen(true);
    } 
    // Si es producción, abrir el modal simple para incrementar stock
    else if (tipoSeleccionado === 'produccion') {
      setModalIncrementarOpen(true);
    } 
    else {
      setModalOpen(true);
    }
  };

  /**
   * Abrir historial de producción
   */
  const abrirHistorialProduccion = (producto) => {
    setProductoSeleccionado(producto);
    setHistorialProduccionOpen(true);
  };

  /**
   * Manejar éxito al agregar cantidad
   */
  const handleSuccessAgregar = async (resultado) => {
    console.log('✅ Cantidad agregada exitosamente:', resultado);
    
    try {
      // Forzar recarga completa de todos los datos
      console.log('🔄 Recargando datos después de agregar cantidad...');
      
      // Pequeño delay para asegurar que la DB se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Esperar a que se complete la recarga de productos
      await cargarProductos();
      
      // Recargar historial y estadísticas en paralelo
      await Promise.all([
        cargarHistorial(),
        cargarEstadisticas()
      ]);
      
      console.log('✅ Datos recargados correctamente');
      
      // Mostrar mensaje de éxito
      alert(`✅ Cantidad agregada exitosamente al producto ${productoSeleccionado?.nombre || 'seleccionado'}`);
      
    } catch (error) {
      console.error('❌ Error al recargar datos:', error);
      setError('Los datos se agregaron correctamente, pero hubo un problema al actualizar la vista. Recargue la página.');
    }
  };

  /**
   * Eliminar producción completa cuando se elimina un movimiento generado por producción
   */
  const eliminarProduccionDesdeMovimiento = async (movimiento) => {
    try {
      // Extraer ID de producción del motivo
      const produccionId = extraerProduccionId(movimiento.motivo);
      
      if (!produccionId) {
        // SOLUCIÓN MEJORADA: Dar más información sobre por qué no se pudo identificar
        console.error('❌ No se pudo extraer el ID de producción del motivo:', movimiento.motivo);
        console.error('📋 Información del movimiento:', {
          id: movimiento._id,
          tipo: movimiento.tipo,
          tipoItem: movimiento.tipoItem,
          motivo: movimiento.motivo,
          operador: movimiento.operador,
          fecha: movimiento.fecha
        });
        
        throw new Error(
          `No se pudo identificar la producción asociada al movimiento.\n\n` +
          `Motivo del movimiento: "${movimiento.motivo}"\n\n` +
          `Por favor, elimine este movimiento manualmente usando la opción "Eliminar solo movimiento" ` +
          `o contacte al administrador del sistema.`
        );
      }
      
      console.log('🔍 Eliminando producción completa:', produccionId);
      
      // Eliminar la producción completa usando el servicio importado
      const resultado = await produccionService.eliminarProduccion(produccionId);
      
      console.log('✅ Producción completa eliminada:', resultado);
      alert(`✅ Producción eliminada exitosamente.\nSe revirtió todo el stock generado por la producción.`);
      
    } catch (error) {
      console.error('❌ Error al eliminar producción desde movimiento:', error);
      throw error;
    }
  };

  /**
   * Extraer ID de producción del motivo del movimiento
   */
  const extraerProduccionId = (motivo) => {
    if (!motivo) return null;
    
    console.log('🔍 Analizando motivo para extraer ID:', motivo);
    
    // SOLUCIÓN: Buscar patrones como "ID: XXXXX" al final del motivo
    // Esto funciona con el nuevo formato: "Producción: observación - ID: 64f1234567890abcdef12345"
    const idMatches = motivo.match(/ID:\s*([a-fA-F0-9]{24})/);
    if (idMatches) {
      console.log('✅ ID encontrado:', idMatches[1]);
      return idMatches[1];
    }
    
    // Mantener compatibilidad con el formato anterior: "Producción: XXXXX" 
    const legacyMatches = motivo.match(/[Pp]roducción[:\s]*([a-fA-F0-9]{24})/);
    if (legacyMatches) {
      console.log('✅ ID encontrado (formato legacy):', legacyMatches[1]);
      return legacyMatches[1];
    }
    
    console.log('❌ No se pudo extraer ID del motivo');
    return null;
  };
  const handleEliminarMovimiento = async (movimientoId) => {
    // Buscar el movimiento en el historial para mostrar información en la confirmación
    const movimiento = historial.find(m => m._id === movimientoId);
    
    if (!movimiento) {
      setError('Movimiento no encontrado');
      return;
    }

    // 🔧 NUEVA LÓGICA: Distinguir entre producción tradicional y producción de receta
    const esMovimientoDeProduccion = movimiento.motivo?.includes('Producción:') || 
                                      movimiento.motivo?.toLowerCase().includes('producción');
    
    const esMovimientoDeReceta = movimiento.motivo?.includes('Producción de receta:') ||
                                 movimiento.tipoItem === 'RecetaProducto';
    
    let confirmacion;
    
    if (esMovimientoDeReceta) {
      // 🍳 Si es un movimiento de RECETA, eliminar solo el movimiento (el backend maneja la reversión)
      confirmacion = window.confirm(
        `🍳 ELIMINACIÓN DE PRODUCCIÓN DE RECETA\n\n` +
        `Producto: ${movimiento?.item?.nombre || 'Receta no identificada'}\n` +
        `Cantidad: ${movimiento?.cantidad || 0} unidades\n` +
        `Motivo: ${movimiento?.motivo || 'Sin motivo'}\n\n` +
        `✅ El sistema revertirá automáticamente:\n` +
        `• Stock de la receta producida\n` +
        `• Ingredientes utilizados en la producción\n\n` +
        `¿Desea continuar con la eliminación?`
      );
    } else if (esMovimientoDeProduccion && !esMovimientoDeReceta) {
      // 🏭 Si es un movimiento de PRODUCCIÓN TRADICIONAL, eliminar la producción completa
      confirmacion = window.confirm(
        `⚠️ ATENCIÓN: Este movimiento fue generado por una PRODUCCIÓN TRADICIONAL.\n\n` +
        `Producto: ${movimiento?.item?.nombre || 'Producto no identificado'}\n` +
        `Cantidad: ${movimiento?.cantidad || 0} unidades\n` +
        `Motivo: ${movimiento?.motivo || 'Sin motivo'}\n\n` +
        `Para mantener la consistencia de datos, se eliminará la PRODUCCIÓN COMPLETA ` +
        `(no solo este movimiento), lo cual revertirá correctamente todo el stock.\n\n` +
        `¿Desea continuar con la eliminación de la PRODUCCIÓN?`
      );
    } else {
      // 📝 Si es un movimiento manual, eliminar solo el movimiento
      confirmacion = window.confirm(
        `¿Está seguro de eliminar este movimiento manual?\n\n` +
        `Producto: ${movimiento?.item?.nombre || 'Producto no identificado'}\n` +
        `Cantidad: ${movimiento?.cantidad || 0} unidades\n` +
        `Motivo: ${movimiento?.motivo || 'Sin motivo'}\n\n` +
        `Esta acción revertirá el stock agregado y no se puede deshacer.`
      );
    }
    
    if (!confirmacion) return;

    try {
      setError('');
      
      if (esMovimientoDeReceta) {
        // 🍳 PRODUCCIÓN DE RECETA: Eliminar solo el movimiento
        // El backend detectará automáticamente que es una receta y usará revertirProduccionReceta
        console.log('🍳 Eliminando movimiento de producción de receta:', movimientoId);
        const resultado = await movimientoUnificadoService.eliminarMovimiento(movimientoId);
        console.log('✅ Movimiento de receta eliminado:', resultado);
        alert(`✅ Producción de receta eliminada exitosamente.\n🔄 Se revirtió correctamente el stock de la receta y los ingredientes utilizados.`);
        
      } else if (esMovimientoDeProduccion && !esMovimientoDeReceta) {
        // 🏭 PRODUCCIÓN TRADICIONAL: Eliminar producción completa
        try {
          await eliminarProduccionDesdeMovimiento(movimiento);
        } catch (error) {
          // Si no se puede identificar la producción, ofrecer eliminar solo el movimiento
          console.error('❌ Error al eliminar producción completa:', error);
          
          const eliminarSoloMovimiento = window.confirm(
            `❌ ${error.message}\n\n` +
            `🔧 OPCIÓN ALTERNATIVA:\n` +
            `¿Desea eliminar SOLO este movimiento en lugar de la producción completa?\n\n` +
            `⚠️ ADVERTENCIA: Esto puede causar inconsistencias en el inventario ` +
            `si la producción tenía múltiples movimientos relacionados.\n\n` +
            `¿Continuar con la eliminación del movimiento únicamente?`
          );
          
          if (eliminarSoloMovimiento) {
            // Eliminar solo el movimiento como plan B
            const resultado = await movimientoUnificadoService.eliminarMovimiento(movimientoId);
            console.log('✅ Movimiento eliminado (solo movimiento):', resultado);
            alert(`✅ Movimiento eliminado exitosamente.\n⚠️ NOTA: Se eliminó solo el movimiento, no la producción completa.\nSe revirtió ${resultado.data.cantidadRevertida} unidades del stock.`);
          } else {
            // Si no quiere eliminar solo el movimiento, relanzar el error
            throw error;
          }
        }
      } else {
        // 📝 MOVIMIENTO MANUAL: Eliminar solo el movimiento
        console.log('📝 Eliminando movimiento manual:', movimientoId);
        const resultado = await movimientoUnificadoService.eliminarMovimiento(movimientoId);
        console.log('✅ Movimiento manual eliminado:', resultado);
        alert(`✅ Movimiento eliminado exitosamente.\nSe revirtió ${resultado.data.cantidadRevertida} unidades del stock.`);
      }
      
      // Recargar datos en todos los casos
      cargarProductos();
      cargarHistorial();
      cargarEstadisticas();
      
    } catch (error) {
      console.error('❌ Error al eliminar:', error);
      setError('Error al eliminar: ' + error.message);
      alert('❌ Error al eliminar: ' + error.message);
    }
  };

  /**
   * Obtener información de cantidad por tipo de producto
   */
  const obtenerCantidad = (producto) => {
    switch (tipoSeleccionado) {
      case 'ingredientes':
        return {
          cantidad: producto.cantidad || 0,
          unidad: producto.unidadMedida || 'unidad'
        };
      case 'materiales':
        return {
          cantidad: producto.cantidad || 0,
          unidad: producto.unidadMedida || 'unidad'
        };
      case 'recetas':
        return {
          cantidad: producto.inventario?.cantidadProducida || 0,
          unidad: producto.unidadMedida || 'unidad'
        };
      case 'produccion':
        return {
          // CORREGIDO: Usar cantidadProducida como el stock base para productos de producción
          // cantidadProducida = total histórico producido
          // stock = disponible actual en inventario
          cantidad: producto.cantidadProducida || producto.stock || producto.cantidad || 0,
          unidad: producto.unidadMedida || 'unidad'
        };
      default:
        return { cantidad: 0, unidad: 'unidad' };
    }
  };

  /**
   * Obtener cantidad del producto para mostrar en el catálogo
   */
  const obtenerCantidadProducto = (producto) => {
    const info = obtenerCantidad(producto);
    return info.cantidad;
  };

  /**
   * Formatear fecha para mostrar
   */
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Accesos Rápidos */}
      <AccesosRapidosProduccion />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔄 Gestión de Movimientos Unificada
              </h1>
              <p className="text-gray-600">
                Administra el inventario de ingredientes, materiales, recetas y producción desde un solo lugar
              </p>
            </div>
            
            {/* Botón de regreso */}
            {onVolver && (
              <button
                onClick={onVolver}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 shadow-sm"
              >
                <span>←</span>
                <span>Volver</span>
              </button>
            )}
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        {estadisticas.totalMovimientos > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded">
                  <span className="text-blue-600">📊</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Total Movimientos</p>
                  <p className="text-lg font-semibold">{estadisticas.totalMovimientos}</p>
                </div>
              </div>
            </div>
            
            {estadisticas.porTipoMovimiento?.map((item, index) => (
              <div key={item._id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className={`p-2 rounded ${
                    item._id === 'entrada' ? 'bg-green-100' :
                    item._id === 'salida' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <span>{
                      item._id === 'entrada' ? '📈' :
                      item._id === 'salida' ? '📉' : '⚡'
                    }</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500 capitalize">{item._id}</p>
                    <p className="text-lg font-semibold">{item.total}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selector de tipo de producto */}
        <SelectorTipoProducto
          tipoSeleccionado={tipoSeleccionado}
          onTipoSeleccionado={handleTipoSeleccionado}
          disabled={cargandoProductos}
        />

        {/* Contenido principal */}
        {tipoSeleccionado && (
          <div className="space-y-6">
            
            {/* Panel de productos - Ancho completo */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {movimientoUnificadoService.obtenerIconoTipo(tipoSeleccionado)} 
                    {' '}Catálogo de {tipoSeleccionado.charAt(0).toUpperCase() + tipoSeleccionado.slice(1)}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {productos.length} productos
                  </span>
                </div>
                
                {/* Buscador */}
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={filtros.buscar}
                    onChange={(e) => handleBusqueda(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Lista de productos en grid responsive */}
              <div className="p-6">
                {cargandoProductos ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Cargando productos...</span>
                  </div>
                ) : productos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {productos.map((producto) => (
                      <div key={`${producto._id}-${producto.cantidad}-${producto._lastUpdated || Date.now()}`} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        tipoSeleccionado === 'recetas' 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 text-sm leading-tight mb-1">
                              {producto.nombre}
                            </h3>
                            {tipoSeleccionado === 'recetas' && (
                              <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Receta
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => abrirModalAgregar(producto)}
                            className={`ml-2 px-2 py-1 text-white text-xs rounded transition-colors flex-shrink-0 ${
                              tipoSeleccionado === 'recetas' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {tipoSeleccionado === 'recetas' ? '🧑‍🍳 Producir' : '+ Agregar'}
                          </button>
                          
                          {/* Botón de historial solo para productos de producción */}
                          {tipoSeleccionado === 'produccion' && (
                            <button
                              onClick={() => abrirHistorialProduccion(producto)}
                              className="ml-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors flex-shrink-0"
                              title="Ver historial de producciones"
                            >
                              📊 Historial
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Ref:</span> {' '}
                            {producto.productoReferencia?.nombre || producto.codigo || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Stock:</span> {' '}
                            <span className={`font-semibold ${
                              obtenerCantidadProducto(producto) > 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {obtenerCantidadProducto(producto)} {producto.unidadMedida || 'unidad'}
                            </span>
                          </div>
                          {tipoSeleccionado === 'recetas' && (
                            <>
                              <div>
                                <span className="font-medium">Rendimiento:</span> {' '}
                                <span className="text-blue-600">{producto.rendimientoTotal || 0} unidades</span>
                              </div>
                              <div>
                                <span className="font-medium">Costo Unit.:</span> {' '}
                                <span className="text-purple-600">
                                  ${((producto.costoEstimado || 0) / (producto.rendimientoTotal || 1)).toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}
                          {producto.precio && (
                            <div>
                              <span className="font-medium">Precio Ref.:</span> {' '}
                              <span className="text-green-600">${producto.precio}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-gray-500">No se encontraron productos</span>
                  </div>
                )}
              </div>
            </div>

        

            {/* Panel de historial */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  📋 Historial de Movimientos
                </h2>
                {tipoSeleccionado && (
                  <p className="text-sm text-gray-500 mt-1">
                    Filtrado por: {tipoSeleccionado}
                  </p>
                )}
              </div>

              <div className="p-4">
                {cargandoHistorial ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Cargando historial...</span>
                  </div>
                ) : historial.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          {(filtros.tipoProducto === 'ingredientes' || filtros.tipoProducto === 'materiales') && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio
                            </th>
                          )}
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Motivo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {historial.map((movimiento) => (
                          <tr key={movimiento._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatearFecha(movimiento.fecha)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`
                                px-2 py-1 text-xs rounded-full font-medium
                                ${movimientoUnificadoService.obtenerColorTipo(movimiento.tipo)}
                              `}>
                                {movimientoUnificadoService.formatearTipo(movimiento.tipo)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {movimiento.item?.nombre || 'Producto eliminado'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {movimientoUnificadoService.formatearTipoItem(movimiento.tipoItem)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <span className="font-medium text-blue-600">
                                {movimiento.cantidad} unidades
                              </span>
                            </td>
                            {(filtros.tipoProducto === 'ingredientes' || filtros.tipoProducto === 'materiales') && (
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {movimiento.precio 
                                  ? `S/. ${movimiento.precio.toFixed(2)}` 
                                  : (movimiento.item?.precioUnitario 
                                      ? `S/. ${movimiento.item.precioUnitario.toFixed(2)}` 
                                      : '-'
                                    )
                                }
                              </td>
                            )}
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                              <div className="truncate" title={movimiento.motivo}>
                                {movimiento.motivo}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {movimiento.operador}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {movimiento.tipo === 'entrada' && (
                                <button
                                  onClick={() => handleEliminarMovimiento(movimiento._id)}
                                  className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                                  title="Eliminar movimiento"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                              {movimiento.tipo !== 'entrada' && (
                                <span className="text-gray-400 text-xs">No disponible</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-gray-500">No hay movimientos registrados</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay tipo seleccionado */}
        {!tipoSeleccionado && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Selecciona un tipo de producto
            </h3>
            <p className="text-gray-500">
              Elige ingredientes, materiales, recetas o producción para comenzar
            </p>
          </div>
        )}
      </div>

      {/* Modal para agregar cantidad */}
      <ModalAgregarCantidad
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={productoSeleccionado}
        tipoProducto={tipoSeleccionado}
        onSuccess={handleSuccessAgregar}
      />

      {/* Modal para producir recetas */}
      <ModalProducirReceta
        isOpen={modalRecetaOpen}
        onClose={() => setModalRecetaOpen(false)}
        receta={productoSeleccionado}
        onSuccess={handleSuccessAgregar}
      />

      {/* Modal para producir productos */}
      <ModalProducirProducto
        isOpen={modalProduccionOpen}
        onClose={() => setModalProduccionOpen(false)}
        producto={productoSeleccionado}
        onSuccess={handleSuccessAgregar}
      />

      {/* Modal para incrementar stock de productos */}
      <ModalIncrementarStock
        isOpen={modalIncrementarOpen}
        onClose={() => setModalIncrementarOpen(false)}
        producto={productoSeleccionado}
        onSuccess={handleSuccessAgregar}
      />

      {/* Modal para historial de producción */}
      <HistorialProduccion
        isOpen={historialProduccionOpen}
        onClose={() => {
          setHistorialProduccionOpen(false);
          setProductoSeleccionado(null);
        }}
        producto={productoSeleccionado}
      />
    </div>
  );
};

export default GestionMovimientosUnificada;
