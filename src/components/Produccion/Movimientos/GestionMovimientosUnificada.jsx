import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { produccionService } from '../../../services/produccionService';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import BreadcrumbProduccion from '../BreadcrumbProduccion';
import SelectorTipoProducto from './SelectorTipoProducto';
import ModalAgregarCantidad from './ModalAgregarCantidad';
import ModalProducirReceta from './ModalProducirReceta';
import ModalProducirRecetaAjustable from './ModalProducirRecetaAjustable';
import ModalProducirProducto from './ModalProducirProducto';
import ModalProducirCantidadSimple from './ModalProducirCantidadSimple';
import ModalIncrementarStock from './ModalIncrementarStock';
import HistorialProduccion from './HistorialProduccion';
import TransferenciasSucursales from './TransferenciasSucursales';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

const GestionMovimientosUnificada = ({ onVolver }) => {
  // Hook de permisos para control de roles
  const { 
    canViewPrices, 
    canAdjustInventory,
    canDeleteProduccion,
    isSuperAdmin
  } = useQuickPermissions();

  // Definir tipos de producto filtrados según rol
  // Solo super_admin puede ver ingredientes y materiales (tienen precios directos)
  const tiposProductoPermitidos = canViewPrices 
    ? [
        {
          id: 'ingredientes',
          nombre: 'Ingredientes',
          descripcion: 'Materias primas para producción',
          icono: '🥕',
          color: 'bg-green-500'
        },
        {
          id: 'materiales',
          nombre: 'Materiales',
          descripcion: 'Materiales de producción',
          icono: '📦',
          color: 'bg-blue-500'
        },
        {
          id: 'recetas',
          nombre: 'Recetas',
          descripcion: 'Productos con recetas definidas',
          icono: '📋',
          color: 'bg-purple-500'
        },
        {
          id: 'produccion',
          nombre: 'Producción',
          descripcion: 'Productos del catálogo de producción',
          icono: '🏭',
          color: 'bg-orange-500'
        },
        {
          id: 'sucursales',
          nombre: 'Sucursales',
          descripcion: 'Transferir materiales a sucursales',
          icono: '🏪',
          color: 'bg-teal-500'
        }
      ]
    : [
        // Admin y User ven recetas, producción y sucursales
        {
          id: 'recetas',
          nombre: 'Recetas',
          descripcion: 'Productos con recetas definidas',
          icono: '📋',
          color: 'bg-purple-500'
        },
        {
          id: 'produccion',
          nombre: 'Producción',
          descripcion: 'Productos del catálogo de producción',
          icono: '🏭',
          color: 'bg-orange-500'
        },
        {
          id: 'sucursales',
          nombre: 'Sucursales',
          descripcion: 'Transferir materiales a sucursales',
          icono: '🏪',
          color: 'bg-teal-500'
        }
      ];

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
  const [modalRecetaAjustableOpen, setModalRecetaAjustableOpen] = useState(false);
  const [modalProduccionOpen, setModalProduccionOpen] = useState(false);
  const [modalIncrementarOpen, setModalIncrementarOpen] = useState(false);
  const [historialProduccionOpen, setHistorialProduccionOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarSelectorModal, setMostrarSelectorModal] = useState(false);
  
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

  // Estados de paginación para historial móvil basada en roles
  const limiteInicial = isSuperAdmin ? 20 : 5;
  const incrementoPagina = isSuperAdmin ? 20 : 5;
  const [itemsHistorialVisibles, setItemsHistorialVisibles] = useState(limiteInicial);

  // Cargar datos iniciales
  useEffect(() => {
    cargarHistorial();
    cargarEstadisticas();
  }, []);

  // Cargar productos cuando cambia el tipo seleccionado
  useEffect(() => {
    // No cargar productos si el tipo es 'sucursales' (tiene su propio componente)
    if (tipoSeleccionado && tipoSeleccionado !== 'sucursales') {
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
    if (!tipoSeleccionado || tipoSeleccionado === 'sucursales') {
      return;
    }
    
    setCargandoProductos(true);
    setError('');
    
    try {
      const response = await movimientoUnificadoService.obtenerProductosPorTipo(tipoSeleccionado);
      const productosData = response.data || [];
      
      // FORZAR NUEVA REFERENCIA - SOLUCION DEL BUG
      const productosConNuevasReferencias = productosData.map(producto => ({
        ...producto,
        // Forzar que React detecte el cambio agregando timestamp
        _lastUpdated: Date.now()
      }));
      
      setProductos(productosConNuevasReferencias);
      setProductosOriginales(productosConNuevasReferencias);
      
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
      
      const response = await movimientoUnificadoService.obtenerHistorial(filtrosHistorial);
      const historialData = response.data || {};
      
      // VALIDACIÓN: Asegurar que movimientos es un array
      const movimientos = historialData.movimientos;
      if (!Array.isArray(movimientos)) {
        setHistorial([]);
        return;
      }
      
      setHistorial(movimientos);
      
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
    
    // Si es una receta, mostrar selector de tipo de modal
    if (tipoSeleccionado === 'recetas') {
      setMostrarSelectorModal(true);
    } 
    // Si es producción, abrir el modal de producción (el componente decidirá cuál modal renderizar según el rol)
    else if (tipoSeleccionado === 'produccion') {
      setModalProduccionOpen(true);
    } 
    else {
      setModalOpen(true);
    }
  };

  /**
   * Abrir modal de receta (básico)
   */
  const abrirModalRecetaBasico = () => {
    setMostrarSelectorModal(false);
    setModalRecetaOpen(true);
  };

  /**
   * Abrir modal de receta ajustable
   */
  const abrirModalRecetaAjustable = () => {
    setMostrarSelectorModal(false);
    setModalRecetaAjustableOpen(true);
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
    try {
      // Forzar recarga completa de todos los datos
      // Pequeño delay para asegurar que la DB se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Esperar a que se complete la recarga de productos
      await cargarProductos();
      
      // Recargar historial y estadísticas en paralelo
      await Promise.all([
        cargarHistorial(),
        cargarEstadisticas()
      ]);
      
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
        throw new Error(
          `No se pudo identificar la producción asociada al movimiento.\n\n` +
          `Motivo del movimiento: "${movimiento.motivo}"\n\n` +
          `Por favor, elimine este movimiento manualmente usando la opción "Eliminar solo movimiento" ` +
          `o contacte al administrador del sistema.`
        );
      }
      
      // Eliminar la producción completa usando el servicio importado
      const resultado = await produccionService.eliminarProduccion(produccionId);
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
    
    // SOLUCIÓN: Buscar patrones como "ID: XXXXX" al final del motivo
    // Esto funciona con el nuevo formato: "Producción: observación - ID: 64f1234567890abcdef12345"
    const idMatches = motivo.match(/ID:\s*([a-fA-F0-9]{24})/);
    if (idMatches) {
      return idMatches[1];
    }
    
    // Mantener compatibilidad con el formato anterior: "Producción: XXXXX" 
    const legacyMatches = motivo.match(/[Pp]roducción[:\s]*([a-fA-F0-9]{24})/);
    if (legacyMatches) {
      return legacyMatches[1];
    }
    
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
        const resultado = await movimientoUnificadoService.eliminarMovimiento(movimientoId);
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
            
            // Mostrar mensaje detallado de reversión
            let mensajeReversion = `✅ Movimiento eliminado exitosamente.\n\n`;
            mensajeReversion += `📦 Stock del producto: -${resultado.data.cantidadRevertida || movimiento.cantidad} unidades\n`;
            
            if (resultado.data.recetasRevertidas > 0) {
              mensajeReversion += `🍳 Recetas repuestas: ${resultado.data.recetasRevertidas}\n`;
            }
            if (resultado.data.ingredientesRevertidos > 0) {
              mensajeReversion += `🥬 Ingredientes repuestos: ${resultado.data.ingredientesRevertidos}\n`;
            }
            
            mensajeReversion += `\n✅ Todo el inventario ha sido revertido correctamente.`;
            
            alert(mensajeReversion);
          } else {
            // Si no quiere eliminar solo el movimiento, relanzar el error
            throw error;
          }
        }
      } else {
        // 📝 MOVIMIENTO MANUAL: Eliminar solo el movimiento
        const resultado = await movimientoUnificadoService.eliminarMovimiento(movimientoId);
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
        // Calcular stock disponible: cantidad total - cantidad procesada
        const stockDisponible = (producto.cantidad || 0) - (producto.procesado || 0);
        return {
          cantidad: stockDisponible,
          unidad: producto.unidadMedida || 'unidad'
        };
      case 'materiales':
        // Calcular stock disponible: cantidad total - cantidad consumida/transferida
        const stockDisponibleMaterial = (producto.cantidad || 0) - (producto.consumido || 0);
        return {
          cantidad: stockDisponibleMaterial,
          unidad: producto.unidadMedida || 'unidad'
        };
      case 'recetas':
        // Usar cantidadDisponible que ya viene calculada del backend
        // o calcular manualmente (cantidadProducida - cantidadUtilizada)
        const cantidadDisponible = producto.cantidadDisponible || 
          (producto.inventario?.cantidadProducida || 0) - (producto.inventario?.cantidadUtilizada || 0);
        
        return {
          cantidad: cantidadDisponible,
          unidad: producto.unidadMedida || producto.rendimiento?.unidadMedida || 'unidad'
        };
      case 'produccion':
        return {
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
      minute: '2-digit',
      second: '2-digit', // Agregar segundos
      timeZone: 'America/Lima' // Usar zona horaria de Perú
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbProduccion />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔄 Gestión de Movimientos Unificada
              </h1>
              <p className="text-gray-600">
                {canViewPrices 
                  ? 'Administra el inventario de ingredientes, materiales, recetas, producción y transferencias a sucursales desde un solo lugar'
                  : 'Administra el inventario de recetas y producción desde un solo lugar'
                }
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

        {/* 🎯 OPTIMIZADO: Estadísticas compactas para móvil */}
        {estadisticas.totalMovimientos > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded">
                  <span className="text-blue-600 text-sm sm:text-base">📊</span>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-gray-500">Total Movimientos</p>
                  <p className="text-sm sm:text-lg font-semibold">{estadisticas.totalMovimientos}</p>
                </div>
              </div>
            </div>
            
            {estadisticas.porTipoMovimiento?.map((item, index) => (
              <div key={item._id} className="bg-white p-3 sm:p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className={`p-1.5 sm:p-2 rounded ${
                    item._id === 'entrada' ? 'bg-green-100' :
                    item._id === 'salida' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <span className="text-sm sm:text-base">{
                      item._id === 'entrada' ? '📈' :
                      item._id === 'salida' ? '📉' : '⚡'
                    }</span>
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm text-gray-500 capitalize">{item._id}</p>
                    <p className="text-sm sm:text-lg font-semibold">{item.total}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selector de tipo de producto - filtrado por rol */}
        <SelectorTipoProducto
          tipoSeleccionado={tipoSeleccionado}
          onTipoSeleccionado={handleTipoSeleccionado}
          tipos={tiposProductoPermitidos}
          disabled={cargandoProductos}
        />

        {/* Contenido principal */}
        {tipoSeleccionado && (
          <div className="space-y-6">
            
            {/* Mostrar componente especial para Sucursales */}
            {tipoSeleccionado === 'sucursales' ? (
              <div className="bg-white rounded-lg shadow p-6">
                <TransferenciasSucursales />
              </div>
            ) : (
              <>
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
                  /* 🎯 OPTIMIZADO: Grid responsivo para catálogo */
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {productos.map((producto) => (
                      <div key={`${producto._id}-${producto.cantidad}-${producto._lastUpdated || Date.now()}`} className={`border rounded-lg p-2 sm:p-4 hover:shadow-md transition-shadow ${
                        tipoSeleccionado === 'recetas'
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}>
                        {/* Nombre del producto */}
                        <div className="mb-2 sm:mb-3">
                          <h3 className="font-medium text-gray-800 text-xs sm:text-sm leading-tight truncate">
                            {producto.nombre}
                          </h3>
                          {tipoSeleccionado === 'recetas' && (
                            <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full mt-1">
                              Receta
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5 sm:space-y-1 text-xs text-gray-600">
                          <div className="hidden sm:block">
                            <span className="font-medium">Ref:</span> {' '}
                            {producto.productoReferencia?.nombre || producto.codigo || 'N/A'}
                          </div>
                          {/* Stock con botón + al lado */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">Stock:</span> {' '}
                              <span className={`font-semibold ${
                                obtenerCantidadProducto(producto) > 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {obtenerCantidadProducto(producto)} {producto.unidadMedida || 'u'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => abrirModalAgregar(producto)}
                                className={`px-1.5 sm:px-2 py-1 text-white text-xs rounded transition-colors flex-shrink-0 ${
                                  tipoSeleccionado === 'recetas'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                {tipoSeleccionado === 'recetas' ? (
                                  <span className="hidden sm:inline">🧑‍🍳 Producir</span>
                                ) : (
                                  <span className="hidden sm:inline">+ Agregar</span>
                                )}
                                <span className="sm:hidden">+</span>
                              </button>

                              {/* Botón de historial solo para productos de producción */}
                              {tipoSeleccionado === 'produccion' && (
                                <button
                                  onClick={() => abrirHistorialProduccion(producto)}
                                  className="px-1.5 sm:px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors flex-shrink-0"
                                  title="Ver historial de producciones"
                                >
                                  <span className="hidden sm:inline">📊 Historial</span>
                                  <span className="sm:hidden">📊</span>
                                </button>
                              )}
                            </div>
                          </div>
                          {tipoSeleccionado === 'recetas' && (
                            <>
                              <div className="hidden sm:block">
                                <span className="font-medium">Rendimiento:</span> {' '}
                                <span className="text-blue-600">
                                  {producto.rendimiento?.cantidad || 0} {producto.rendimiento?.unidadMedida || 'u'}
                                </span>
                              </div>
                              <div className="sm:hidden">
                                <span className="font-medium">R:</span> {producto.rendimiento?.cantidad || 0}
                                {' | '}
                                <span className="font-medium">P:</span> <span className="text-blue-600">{producto.inventario?.cantidadProducida || 0}</span>
                              </div>
                              <div className="hidden sm:block">
                                <span className="font-medium">Producido:</span> {' '}
                                <span className="text-blue-600">{producto.inventario?.cantidadProducida || 0}</span>
                                {' | '}
                                <span className="font-medium">Utilizado:</span> {' '}
                                <span className="text-orange-600">{producto.inventario?.cantidadUtilizada || 0}</span>
                              </div>
                              {/* Solo super_admin ve costos */}
                              {canViewPrices && producto.costoEstimado && (
                                <div className="hidden sm:block">
                                  <span className="font-medium">Costo Unit.:</span> {' '}
                                  <span className="text-purple-600">
                                    ${((producto.costoEstimado || 0) / (producto.rendimiento?.cantidad || 1)).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          {/* Solo super_admin ve precio de referencia */}
                          {canViewPrices && producto.precio && (
                            <div className="hidden sm:block">
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
                  <>
                    {/* 🎯 VISTA MÓVIL: Tarjetas con "Ver más" */}
                    <div className="md:hidden space-y-3">
                      {historial.slice(0, itemsHistorialVisibles).map((movimiento) => (
                        <div 
                          key={movimiento._id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          {/* Header: Tipo y Fecha */}
                          <div className="flex justify-between items-start mb-3">
                            <span className={`
                              px-2 py-1 text-xs rounded-full font-medium
                              ${movimientoUnificadoService.obtenerColorTipo(movimiento.tipo)}
                            `}>
                              {movimiento.tipo === 'entrada' ? '📈 Entrada' : '📉 Salida'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(movimiento.fecha).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Producto */}
                          <div className="mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {movimiento.item?.nombre || 'Producto eliminado'}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {movimientoUnificadoService.formatearTipoItem(movimiento.tipoItem)}
                            </span>
                          </div>

                          {/* Cantidad y Precio */}
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="text-xs text-gray-500">Cantidad: </span>
                              <span className="font-bold text-blue-600">{movimiento.cantidad} u</span>
                            </div>
                            {/* Solo super_admin ve precios */}
                            {canViewPrices && (filtros.tipoProducto === 'ingredientes' || filtros.tipoProducto === 'materiales') && (
                              <div>
                                <span className="text-xs text-gray-500">Precio: </span>
                                <span className="font-medium text-gray-700">
                                  {movimiento.precio 
                                    ? `S/. ${movimiento.precio.toFixed(2)}` 
                                    : (movimiento.item?.precioUnitario 
                                        ? `S/. ${movimiento.item.precioUnitario.toFixed(2)}` 
                                        : '-'
                                      )
                                  }
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Motivo */}
                          {movimiento.motivo && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-500">Motivo: </span>
                              <span className="text-xs text-gray-700">{movimiento.motivo}</span>
                            </div>
                          )}

                          {/* Footer: Usuario y Acción */}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">
                              👤 {movimiento.operador}
                            </span>
                            {/* Solo admin puede eliminar movimientos */}
                            {movimiento.tipo === 'entrada' && canDeleteProduccion ? (
                              <button
                                onClick={() => handleEliminarMovimiento(movimiento._id)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1.5 rounded transition-colors flex items-center gap-1"
                                title="Eliminar movimiento"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="text-xs">Eliminar</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">No disponible</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Botón "Ver más" para móvil */}
                      {itemsHistorialVisibles < historial.length && (
                        <button
                          onClick={() => setItemsHistorialVisibles(prev => prev + incrementoPagina)}
                          className="w-full py-3 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Ver más {incrementoPagina} ({historial.length - itemsHistorialVisibles} restantes)
                        </button>
                      )}

                      {/* Indicador cuando se muestran todos */}
                      {itemsHistorialVisibles >= historial.length && historial.length > limiteInicial && (
                        <p className="text-center text-xs text-gray-500 py-2">
                          ✓ Mostrando todos los {historial.length} movimientos
                        </p>
                      )}
                    </div>

                    {/* 🎯 VISTA DESKTOP: Tabla completa */}
                    <div className="hidden md:block overflow-x-auto">
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
                            {/* Solo super_admin ve columna de precio */}
                            {canViewPrices && (filtros.tipoProducto === 'ingredientes' || filtros.tipoProducto === 'materiales') && (
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
                          {historial.slice(0, itemsHistorialVisibles).map((movimiento) => (
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
                                  {movimiento.cantidad} u
                                </span>
                              </td>
                              {/* Solo super_admin ve celda de precio */}
                              {canViewPrices && (filtros.tipoProducto === 'ingredientes' || filtros.tipoProducto === 'materiales') && (
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
                                {/* Solo admin puede eliminar movimientos */}
                                {movimiento.tipo === 'entrada' && canDeleteProduccion && (
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
                                {(movimiento.tipo !== 'entrada' || !canDeleteProduccion) && (
                                  <span className="text-gray-400 text-xs">No disponible</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Botón Ver más - Desktop */}
                      {itemsHistorialVisibles < historial.length && (
                        <div className="flex justify-center py-4 bg-gray-50 border-t border-gray-200">
                          <button
                            onClick={() => setItemsHistorialVisibles(prev => prev + incrementoPagina)}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Ver más {incrementoPagina}
                          </button>
                        </div>
                      )}
                      {historial.length > limiteInicial && itemsHistorialVisibles >= historial.length && (
                        <div className="text-center py-3 bg-gray-50 border-t border-gray-200">
                          <span className="text-sm text-gray-600">
                            ✓ Mostrando todos los {historial.length} movimientos
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-gray-500">No hay movimientos registrados</span>
                  </div>
                )}
              </div>
            </div>
              </>
            )}
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

      {/* Modal selector de tipo de producción */}
      {mostrarSelectorModal && productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              🎯 Tipo de Producción
            </h3>
            <p className="text-gray-600 mb-6">
              Selecciona cómo deseas producir <strong>{productoSeleccionado.nombre}</strong>:
            </p>
            
            <div className="space-y-3">
              {/* Opción: Producción Rápida */}
              <button
                onClick={abrirModalRecetaBasico}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-start">
                  <span className="text-3xl mr-4">⚡</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 group-hover:text-blue-700">
                      Producción Rápida
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Produce en lotes fijos según la receta original. <strong>Rápido y sencillo.</strong>
                    </p>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1">
                      <li>✓ Cantidades automáticas</li>
                      <li>✓ Validación de stock</li>
                      <li>✓ Proceso simplificado</li>
                    </ul>
                  </div>
                </div>
              </button>

              {/* Opción: Producción Ajustable */}
              <button
                onClick={abrirModalRecetaAjustable}
                className="w-full p-4 border-2 border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group bg-green-50"
              >
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🔧</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 group-hover:text-green-700">
                      Producción Ajustable
                      <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">NUEVO</span>
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Control total: ajusta ingredientes, registra mermas, bonificaciones. <strong>Máxima flexibilidad.</strong>
                    </p>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1">
                      <li>✓ Ajuste de cantidades por ingrediente</li>
                      <li>✓ Rendimiento real vs planeado</li>
                      <li>✓ Registro de diferencias y motivos</li>
                      <li>✓ Historial completo de producciones</li>
                    </ul>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setMostrarSelectorModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal para producir recetas (básico) */}
      <ModalProducirReceta
        isOpen={modalRecetaOpen}
        onClose={() => setModalRecetaOpen(false)}
        receta={productoSeleccionado}
        onSuccess={handleSuccessAgregar}
      />

      {/* Modal para producir recetas - TODOS usan el modal ajustable */}
      {modalRecetaAjustableOpen && (
        <ModalProducirRecetaAjustable
          isOpen={modalRecetaAjustableOpen}
          onClose={() => setModalRecetaAjustableOpen(false)}
          receta={productoSeleccionado}
          onSuccess={handleSuccessAgregar}
        />
      )}

      {/* Modal para producir productos - Renderizado según rol */}
      {modalProduccionOpen && (
        isSuperAdmin ? (
          // Modal avanzado con costos y recursos para super_admin
          <ModalProducirProducto
            isOpen={modalProduccionOpen}
            onClose={() => setModalProduccionOpen(false)}
            producto={productoSeleccionado}
            onSuccess={handleSuccessAgregar}
          />
        ) : (
          // Modal simple solo con cantidades para admin/user
          <ModalProducirCantidadSimple
            isOpen={modalProduccionOpen}
            onClose={() => setModalProduccionOpen(false)}
            producto={productoSeleccionado}
            onSuccess={handleSuccessAgregar}
          />
        )
      )}

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
