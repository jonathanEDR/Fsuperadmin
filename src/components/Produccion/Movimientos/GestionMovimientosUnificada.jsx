import React, { useState, useEffect, useCallback } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import { produccionService } from '../../../services/produccionService';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import BreadcrumbProduccion from '../BreadcrumbProduccion';
import SelectorTipoProducto from './SelectorTipoProducto';
import ModalAgregarCantidad from './ModalAgregarCantidad';
import ModalProducirRecetaNuevo from './ModalProducirRecetaNuevo';
import ModalProducirProducto from './ModalProducirProducto';
import ModalIncrementarStock from './ModalIncrementarStock';
import HistorialProduccion from './HistorialProduccion';
import TransferenciasSucursales from './TransferenciasSucursales';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { Carrot, Package, ClipboardList, Factory, Store, RefreshCw, AlertTriangle, BarChart3, TrendingUp, TrendingDown, Zap, Loader2, ChevronDown, Trash2, User, Search, ArrowLeft, Plus, Check } from 'lucide-react';

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
          icono: <Carrot size={24} />,
          color: 'green'
        },
        {
          id: 'materiales',
          nombre: 'Materiales',
          descripcion: 'Materiales de producción',
          icono: <Package size={24} />,
          color: 'blue'
        },
        {
          id: 'recetas',
          nombre: 'Recetas',
          descripcion: 'Productos con recetas definidas',
          icono: <ClipboardList size={24} />,
          color: 'purple'
        },
        {
          id: 'produccion',
          nombre: 'Producción',
          descripcion: 'Productos del catálogo de producción',
          icono: <Factory size={24} />,
          color: 'orange'
        },
        {
          id: 'sucursales',
          nombre: 'Sucursales',
          descripcion: 'Transferir materiales a sucursales',
          icono: <Store size={24} />,
          color: 'teal'
        }
      ]
    : [
        // Admin y User ven recetas, producción y sucursales
        {
          id: 'recetas',
          nombre: 'Recetas',
          descripcion: 'Productos con recetas definidas',
          icono: <ClipboardList size={24} />,
          color: 'purple'
        },
        {
          id: 'produccion',
          nombre: 'Producción',
          descripcion: 'Productos del catálogo de producción',
          icono: <Factory size={24} />,
          color: 'orange'
        },
        {
          id: 'sucursales',
          nombre: 'Sucursales',
          descripcion: 'Transferir materiales a sucursales',
          icono: <Store size={24} />,
          color: 'teal'
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
  const [modalRecetaNuevoOpen, setModalRecetaNuevoOpen] = useState(false);
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

  // Paginación real del servidor
  const LIMITE_POR_PAGINA = isSuperAdmin ? 20 : 10;
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargandoMasHistorial, setCargandoMasHistorial] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarHistorial(1, true);
    cargarEstadisticas();
  }, []);

  // Cargar productos cuando cambia el tipo seleccionado
  useEffect(() => {
    // No cargar productos si el tipo es 'sucursales' (tiene su propio componente)
    if (tipoSeleccionado && tipoSeleccionado !== 'sucursales') {
      cargarProductos();
    }
  }, [tipoSeleccionado]);

  // Recargar historial cuando cambian los filtros o tipo seleccionado
  useEffect(() => {
    setHistorial([]);
    setPaginaHistorial(1);
    cargarHistorial(1, true);
  }, [filtros.tipoMovimiento, filtros.fechaInicio, filtros.fechaFin, tipoSeleccionado]);

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
   * Cargar historial de movimientos con paginación real del servidor
   * @param {number} pagina - Página a cargar
   * @param {boolean} esNuevaBusqueda - true para reemplazar, false para append
   */
  const cargarHistorial = useCallback(async (pagina = 1, esNuevaBusqueda = false) => {
    if (esNuevaBusqueda) {
      setCargandoHistorial(true);
    } else {
      setCargandoMasHistorial(true);
    }
    
    try {
      const filtrosHistorial = {
        ...filtros,
        limite: LIMITE_POR_PAGINA,
        pagina,
        tipoProducto: tipoSeleccionado || undefined
      };
      
      const response = await movimientoUnificadoService.obtenerHistorial(filtrosHistorial);
      const historialData = response.data || {};
      
      // VALIDACIÓN: Asegurar que movimientos es un array
      const movimientos = historialData.movimientos;
      if (!Array.isArray(movimientos)) {
        if (esNuevaBusqueda) setHistorial([]);
        return;
      }
      
      if (esNuevaBusqueda) {
        setHistorial(movimientos);
      } else {
        // Append: agregar nuevos registros sin duplicados
        setHistorial(prev => {
          const idsExistentes = new Set(prev.map(m => m._id));
          const sinDuplicados = movimientos.filter(m => !idsExistentes.has(m._id));
          return [...prev, ...sinDuplicados];
        });
      }
      
      // Actualizar metadatos de paginación
      setTotalRegistros(historialData.total || 0);
      setTotalPaginas(historialData.totalPaginas || 0);
      setPaginaHistorial(pagina);
      
    } catch (error) {
      console.error('Error al cargar historial:', error);
      if (esNuevaBusqueda) setHistorial([]);
    } finally {
      setCargandoHistorial(false);
      setCargandoMasHistorial(false);
    }
  }, [filtros, tipoSeleccionado, LIMITE_POR_PAGINA]);

  /**
   * Cargar más registros del servidor (siguiente página)
   */
  const cargarMasHistorial = () => {
    if (paginaHistorial < totalPaginas && !cargandoMasHistorial) {
      cargarHistorial(paginaHistorial + 1, false);
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
    
    // Si es una receta, abrir directamente el nuevo modal flexible
    if (tipoSeleccionado === 'recetas') {
      setModalRecetaNuevoOpen(true);
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
        cargarHistorial(1, true),
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
      cargarHistorial(1, true);
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

  // Helper para obtener icono Lucide por tipo de producto
  const obtenerIconoLucide = (tipo) => {
    const iconos = {
      'ingredientes': <Carrot size={20} className="text-green-600" />,
      'materiales': <Package size={20} className="text-blue-600" />,
      'recetas': <ClipboardList size={20} className="text-purple-600" />,
      'produccion': <Factory size={20} className="text-orange-600" />,
      'sucursales': <Store size={20} className="text-teal-600" />
    };
    return iconos[tipo] || <Package size={20} className="text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbProduccion />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <RefreshCw size={28} className="text-blue-600" /> Gestión de Movimientos Unificada
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
                className="px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-2 shadow-sm"
              >
                <span><ArrowLeft size={16} /></span>
                <span>Volver</span>
              </button>
            )}
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <AlertTriangle size={16} className="text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* 🎯 OPTIMIZADO: Estadísticas compactas para móvil */}
        {estadisticas.totalMovimientos > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-blue-50 rounded-xl border border-blue-100">
                  <BarChart3 size={18} className="text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-gray-500">Total Movimientos</p>
                  <p className="text-sm sm:text-lg font-semibold">{estadisticas.totalMovimientos}</p>
                </div>
              </div>
            </div>
            
            {estadisticas.porTipoMovimiento?.map((item, index) => (
              <div key={item._id} className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className={`p-1.5 sm:p-2 rounded-xl border ${
                    item._id === 'entrada' ? 'bg-green-50 border-green-100' :
                    item._id === 'salida' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
                  }`}>
                    {item._id === 'entrada' ? <TrendingUp size={18} className="text-green-600" /> :
                     item._id === 'salida' ? <TrendingDown size={18} className="text-red-600" /> : 
                     <Zap size={18} className="text-blue-600" />}
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
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <TransferenciasSucursales />
              </div>
            ) : (
              <>
                {/* Panel de productos - Ancho completo */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                        {obtenerIconoLucide(tipoSeleccionado)}
                        Catálogo de {tipoSeleccionado.charAt(0).toUpperCase() + tipoSeleccionado.slice(1)}
                      </h2>
                      <span className="text-sm text-gray-500 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-100">
                        {productos.length} productos
                      </span>
                    </div>
                    
                    {/* Buscador con icono */}
                    <div className="mt-3 relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={filtros.buscar}
                        onChange={(e) => handleBusqueda(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
              
              {/* Contenido del catálogo */}
              <div className="p-4 sm:p-6">
                {cargandoProductos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-500">Cargando productos...</span>
                  </div>
                ) : productos.length > 0 ? (
                  <>
                    {/* VISTA MÓVIL: Cards compactas */}
                    <div className="md:hidden space-y-2">
                      {productos.map((producto) => (
                        <div key={`m-${producto._id}-${producto._lastUpdated || ''}`} className={`border rounded-xl p-3 ${
                          tipoSeleccionado === 'recetas'
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-gray-200 bg-white'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-2">
                              <h3 className="font-medium text-gray-800 text-sm truncate">
                                {producto.nombre}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-sm font-semibold ${
                                  obtenerCantidadProducto(producto) > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {obtenerCantidadProducto(producto)} {producto.unidadMedida || 'u'}
                                </span>
                                {tipoSeleccionado === 'recetas' && (
                                  <span className="text-xs text-gray-400">
                                    R: {producto.rendimiento?.cantidad || 0}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => abrirModalAgregar(producto)}
                                className={`p-2 rounded-xl transition-colors ${
                                  tipoSeleccionado === 'recetas'
                                    ? 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
                                    : 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
                                }`}
                              >
                                <Plus size={16} />
                              </button>
                              {tipoSeleccionado === 'produccion' && (
                                <button
                                  onClick={() => abrirHistorialProduccion(producto)}
                                  className="p-2 text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl transition-colors"
                                  title="Ver historial"
                                >
                                  <BarChart3 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* VISTA DESKTOP: Tabla profesional */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Referencia</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                            {tipoSeleccionado === 'recetas' && (
                              <>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rendimiento</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producido</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilizado</th>
                              </>
                            )}
                            {canViewPrices && (tipoSeleccionado === 'ingredientes' || tipoSeleccionado === 'materiales') && (
                              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                            )}
                            {canViewPrices && tipoSeleccionado === 'recetas' && (
                              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo Unit.</th>
                            )}
                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {productos.map((producto) => (
                            <tr key={`d-${producto._id}-${producto._lastUpdated || ''}`} className={`hover:bg-gray-50/50 transition-colors ${
                              tipoSeleccionado === 'recetas' ? 'bg-green-50/30' : ''
                            }`}>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 text-sm">{producto.nombre}</span>
                                  {tipoSeleccionado === 'recetas' && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">Receta</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-500">
                                {producto.productoReferencia?.nombre || producto.codigo || '—'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`text-sm font-semibold ${
                                  obtenerCantidadProducto(producto) > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {obtenerCantidadProducto(producto)}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">{producto.unidadMedida || 'u'}</span>
                              </td>
                              {tipoSeleccionado === 'recetas' && (
                                <>
                                  <td className="py-3 px-4 text-right text-sm text-blue-600">
                                    {producto.rendimiento?.cantidad || 0} {producto.rendimiento?.unidadMedida || 'u'}
                                  </td>
                                  <td className="py-3 px-4 text-right text-sm text-blue-600">
                                    {producto.inventario?.cantidadProducida || 0}
                                  </td>
                                  <td className="py-3 px-4 text-right text-sm text-orange-600">
                                    {producto.inventario?.cantidadUtilizada || 0}
                                  </td>
                                </>
                              )}
                              {canViewPrices && (tipoSeleccionado === 'ingredientes' || tipoSeleccionado === 'materiales') && (
                                <td className="py-3 px-4 text-right text-sm text-green-600">
                                  {producto.precio ? `$${producto.precio}` : '—'}
                                </td>
                              )}
                              {canViewPrices && tipoSeleccionado === 'recetas' && (
                                <td className="py-3 px-4 text-right text-sm text-purple-600">
                                  {producto.costoEstimado
                                    ? `$${((producto.costoEstimado || 0) / (producto.rendimiento?.cantidad || 1)).toFixed(2)}`
                                    : '—'}
                                </td>
                              )}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => abrirModalAgregar(producto)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                                      tipoSeleccionado === 'recetas'
                                        ? 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100'
                                        : 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
                                    }`}
                                  >
                                    {tipoSeleccionado === 'recetas' ? 'Producir' : '+ Agregar'}
                                  </button>
                                  {tipoSeleccionado === 'produccion' && (
                                    <button
                                      onClick={() => abrirHistorialProduccion(producto)}
                                      className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl transition-colors"
                                      title="Ver historial de producciones"
                                    >
                                      Historial
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Search size={32} className="mx-auto text-gray-300 mb-2" />
                    <span className="text-gray-500">No se encontraron productos</span>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de historial */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <ClipboardList size={20} className="text-blue-600" /> Historial de Movimientos
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
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <span className="ml-2">Cargando historial...</span>
                  </div>
                ) : historial.length > 0 ? (
                  <>
                    {/* 🎯 VISTA MÓVIL: Tarjetas con "Ver más" */}
                    <div className="md:hidden space-y-3">
                      {historial.map((movimiento) => (
                        <div 
                          key={movimiento._id}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm"
                        >
                          {/* Header: Tipo y Fecha */}
                          <div className="flex justify-between items-start mb-3">
                            <span className={`
                              px-2 py-1 text-xs rounded-full font-medium
                              ${movimientoUnificadoService.obtenerColorTipo(movimiento.tipo)}
                            `}>
                              {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
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
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <User size={12} /> {movimiento.operador}
                            </span>
                            {/* Solo admin puede eliminar movimientos */}
                            {movimiento.tipo === 'entrada' && canDeleteProduccion ? (
                              <button
                                onClick={() => handleEliminarMovimiento(movimiento._id)}
                                className="text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 p-1.5 rounded-xl transition-colors flex items-center gap-1"
                                title="Eliminar movimiento"
                              >
                                <Trash2 size={14} />
                                <span className="text-xs">Eliminar</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">No disponible</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Contador de registros */}
                      {totalRegistros > 0 && (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-500">
                            Mostrando {historial.length} de {totalRegistros} movimientos
                          </span>
                        </div>
                      )}

                      {/* Botón "Cargar más" para móvil - pide siguiente página al servidor */}
                      {paginaHistorial < totalPaginas && (
                        <button
                          onClick={cargarMasHistorial}
                          disabled={cargandoMasHistorial}
                          className="w-full py-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-xl font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cargandoMasHistorial ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            <>
                              <ChevronDown size={20} />
                              Cargar más ({totalRegistros - historial.length} restantes)
                            </>
                          )}
                        </button>
                      )}

                      {/* Indicador cuando se cargaron todos */}
                      {paginaHistorial >= totalPaginas && historial.length > LIMITE_POR_PAGINA && (
                        <p className="text-center text-xs text-gray-500 py-2 flex items-center justify-center gap-1">
                          <Check size={14} className="text-green-500" /> Mostrando todos los {historial.length} movimientos
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
                                    className="text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 p-1 rounded-xl transition-colors"
                                    title="Eliminar movimiento"
                                  >
                                    <Trash2 size={16} />
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
                      
                      {/* Contador registros - Desktop */}
                      {totalRegistros > 0 && (
                        <div className="text-center py-2 bg-gray-50 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            Mostrando {historial.length} de {totalRegistros} movimientos
                          </span>
                        </div>
                      )}
                      
                      {/* Botón Cargar más - Desktop */}
                      {paginaHistorial < totalPaginas && (
                        <div className="flex justify-center py-4 bg-gray-50 border-t border-gray-200">
                          <button
                            onClick={cargarMasHistorial}
                            disabled={cargandoMasHistorial}
                            className="px-6 py-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cargandoMasHistorial ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Cargando...
                              </>
                            ) : (
                              <>
                                <ChevronDown size={20} />
                                Cargar más ({totalRegistros - historial.length} restantes)
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {paginaHistorial >= totalPaginas && historial.length > LIMITE_POR_PAGINA && (
                        <div className="text-center py-3 bg-gray-50 border-t border-gray-200">
                          <span className="text-sm text-gray-600 flex items-center justify-center gap-1">
                            <Check size={14} className="text-green-500" /> Mostrando todos los {historial.length} movimientos
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
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <RefreshCw size={40} className="text-blue-400" />
              </div>
            </div>
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

      {/* Modal para producir recetas - Modal Flexible */}
      {modalRecetaNuevoOpen && (
        <ModalProducirRecetaNuevo
          isOpen={modalRecetaNuevoOpen}
          onClose={() => setModalRecetaNuevoOpen(false)}
          receta={productoSeleccionado}
          onSuccess={handleSuccessAgregar}
        />
      )}

      {/* Modal para producir productos - Roles manejados internamente */}
      {modalProduccionOpen && (
        <ModalProducirProducto
          isOpen={modalProduccionOpen}
          onClose={() => setModalProduccionOpen(false)}
          producto={productoSeleccionado}
          onSuccess={handleSuccessAgregar}
        />
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
