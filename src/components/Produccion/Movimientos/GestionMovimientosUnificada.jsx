import React, { useState, useEffect } from 'react';
import { movimientoUnificadoService } from '../../../services/movimientoUnificadoService';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import SelectorTipoProducto from './SelectorTipoProducto';
import ModalAgregarCantidad from './ModalAgregarCantidad';
import ModalProducirReceta from './ModalProducirReceta';
import ModalProducirProducto from './ModalProducirProducto';

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
    if (!tipoSeleccionado) return;
    
    setCargandoProductos(true);
    setError('');
    
    try {
      const response = await movimientoUnificadoService.obtenerProductosPorTipo(tipoSeleccionado);
      const productosData = response.data || [];
      
      setProductos(productosData);
      setProductosOriginales(productosData);
      console.log(`✅ ${productosData.length} productos cargados para ${tipoSeleccionado}`);
      
    } catch (error) {
      console.error('Error al cargar productos:', error);
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
    // Si es producción, abrir el modal específico para producción
    else if (tipoSeleccionado === 'produccion') {
      setModalProduccionOpen(true);
    } 
    else {
      setModalOpen(true);
    }
  };

  /**
   * Manejar éxito al agregar cantidad
   */
  const handleSuccessAgregar = (resultado) => {
    console.log('✅ Cantidad agregada exitosamente:', resultado);
    
    // Recargar productos y historial
    cargarProductos();
    cargarHistorial();
    cargarEstadisticas();
    
    // Mostrar mensaje de éxito (opcional)
    // setMensajeExito('Cantidad agregada exitosamente');
  };

  /**
   * Manejar eliminación de movimiento
   */
  const handleEliminarMovimiento = async (movimientoId) => {
    // Buscar el movimiento en el historial para mostrar información en la confirmación
    const movimiento = historial.find(m => m._id === movimientoId);
    
    const confirmacion = window.confirm(
      `¿Está seguro de eliminar este movimiento?\n\n` +
      `Producto: ${movimiento?.item?.nombre || 'Producto no identificado'}\n` +
      `Cantidad: ${movimiento?.cantidad || 0} unidades\n` +
      `Motivo: ${movimiento?.motivo || 'Sin motivo'}\n\n` +
      `Esta acción revertirá el stock agregado y no se puede deshacer.`
    );
    
    if (!confirmacion) return;
    
    try {
      setError('');
      const resultado = await movimientoUnificadoService.eliminarMovimiento(movimientoId);
      
      console.log('✅ Movimiento eliminado:', resultado);
      
      // Recargar datos
      cargarProductos();
      cargarHistorial();
      cargarEstadisticas();
      
      // Mensaje de confirmación
      alert(`✅ Movimiento eliminado exitosamente.\nSe revirtió ${resultado.data.cantidadRevertida} unidades del stock.`);
      
    } catch (error) {
      console.error('❌ Error al eliminar movimiento:', error);
      setError('Error al eliminar movimiento: ' + error.message);
      alert('❌ Error al eliminar movimiento: ' + error.message);
    }
  };

  /**
   * Obtener información de cantidad por tipo de producto
   */
  const obtenerCantidad = (producto) => {
    switch (tipoSeleccionado) {
      case 'ingredientes':
        return {
          cantidad: producto.cantidad || 0, // Cambié de procesado a cantidad
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
          cantidad: producto.cantidad || 0,
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
                      <div key={producto._id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
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
    </div>
  );
};

export default GestionMovimientosUnificada;
