import React, { useEffect, useState } from 'react';
import { produccionService } from '../../../services/produccionService';
import { formatearFecha } from '../../../utils/fechaHoraUtils';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

const DetalleProduccion = ({ produccionId, produccion: produccionProp, onClose, onProduccionActualizada, esModal = false }) => {
  // Hook de permisos para control de roles
  const { canViewPrices } = useQuickPermissions();
  
  const [produccion, setProduccion] = useState(produccionProp || null);
  const [loading, setLoading] = useState(!produccionProp);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    if (produccionId && !produccionProp) {
      cargarDetalleProduccion();
    } else if (produccionProp) {
      setProduccion(produccionProp);
      setLoading(false);
    }
  }, [produccionId, produccionProp]);

  const cargarDetalleProduccion = async () => {
    try {
      setLoading(true);
      const id = produccionId || (produccionProp && produccionProp._id);
      if (id) {
        const response = await produccionService.obtenerProduccionPorId(id);
        setProduccion(response.data);
      }
    } catch (err) {
      setError('Error al cargar el detalle de la producción');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ejecutarAccion = async () => {
    try {
      const id = produccionId || (produccion && produccion._id);
      if (actionType === 'ejecutar') {
        await produccionService.ejecutarProduccion(id);
      } else if (actionType === 'cancelar') {
        await produccionService.cancelarProduccion(id);
      }
      
      await cargarDetalleProduccion();
      onProduccionActualizada && onProduccionActualizada();
      setShowConfirmModal(false);
      setActionType(null);
    } catch (err) {
      setError('Error al procesar la acción: ' + err.message);
      console.error(err);
    }
  };

  const handleEjecutarProduccion = () => {
    setActionType('ejecutar');
    setShowConfirmModal(true);
  };

  const handleCancelarProduccion = () => {
    setActionType('cancelar');
    setShowConfirmModal(true);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      planificada: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      planificada: 'Planificada',
      en_proceso: 'En Proceso',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    return labels[estado] || estado;
  };

  // Preparar datos para la tabla unificada
  const prepararDatosTabla = () => {
    if (!produccion) return [];
    
    console.log('🔍 Estructura completa de producción:', produccion);
    
    const datos = [];

    // 1. INFORMACIÓN GENERAL
    datos.push({
      tipo: 'produccion',
      categoria: '📊 Información General',
      concepto: 'Producto Final',
      descripcion: produccion.nombre || 'N/A',
      cantidad: `${produccion.cantidadProducida || 0} ${produccion.unidadMedida || ''}`,
      costo: produccion.costoTotal ? `S/.${produccion.costoTotal.toFixed(2)}` : 'S/.0.00',
      total: produccion.costoTotal ? `S/.${produccion.costoTotal.toFixed(2)}` : 'S/.0.00',
      estado: produccion.estado,
      fecha: formatearFecha(produccion.fechaProduccion),
      operador: produccion.operador || 'N/A'
    });

    // 2. RECETAS UTILIZADAS (si existen)
    if (produccion.recetasUtilizadas && produccion.recetasUtilizadas.length > 0) {
      produccion.recetasUtilizadas.forEach((item, index) => {
        console.log(`🍳 Debug receta ${index + 1}:`, item);
        console.log(`🍳 item.receta:`, item.receta);
        console.log(`🍳 Tipo de item.receta:`, typeof item.receta);
        
        // Mejorar la obtención del nombre de la receta
        let nombreReceta = 'Receta no encontrada';
        
        if (item.receta) {
          // Caso 1: item.receta es un objeto poblado con nombre
          if (typeof item.receta === 'object' && item.receta !== null) {
            nombreReceta = item.receta.nombre || item.receta.name || `Receta ID: ${item.receta._id || 'N/A'}`;
          }
          // Caso 2: item.receta es solo un string (ID sin poblar)
          else if (typeof item.receta === 'string') {
            nombreReceta = `Receta (ID: ${item.receta.substring(0, 8)}...)`;
          }
        }
        
        // También verificar si hay un campo nombreReceta directo en item
        if (item.nombreReceta) {
          nombreReceta = item.nombreReceta;
        }
        
        datos.push({
          tipo: 'receta',
          categoria: '📋 Recetas Utilizadas',
          concepto: nombreReceta,
          descripcion: item.receta?.descripcion || `Preparación #${index + 1}`,
          cantidad: `${item.cantidadUtilizada || 0} porciones`,
          costo: item.costoUnitario ? `S/.${item.costoUnitario.toFixed(2)}` : 'S/.0.00',
          total: item.cantidadUtilizada && item.costoUnitario ? 
                 `S/.${(item.cantidadUtilizada * item.costoUnitario).toFixed(2)}` : 'S/.0.00',
          estado: 'Utilizada',
          fecha: formatearFecha(produccion.fechaProduccion),
          operador: produccion.operador || 'N/A'
        });
      });
    }

    // 3. INGREDIENTES DIRECTOS (si existen)
    if (produccion.ingredientesUtilizados && produccion.ingredientesUtilizados.length > 0) {
      console.log('🥬 Ingredientes directos encontrados:', produccion.ingredientesUtilizados);
      produccion.ingredientesUtilizados.forEach((item, index) => {
        console.log(`🥬 Debug ingrediente ${index + 1}:`, item);
        console.log(`🥬 item.ingrediente:`, item.ingrediente);
        console.log(`🥬 Tipo de item.ingrediente:`, typeof item.ingrediente);

        // Mejorar la obtención del nombre del ingrediente
        let nombreIngrediente = 'Ingrediente no encontrado';
        let unidadMedida = item.unidadMedida || 'unidades';
        
        if (item.ingrediente) {
          // Caso 1: item.ingrediente es un objeto poblado con nombre
          if (typeof item.ingrediente === 'object' && item.ingrediente !== null) {
            nombreIngrediente = item.ingrediente.nombre || item.ingrediente.name || `Ingrediente ID: ${item.ingrediente._id || 'N/A'}`;
            unidadMedida = item.ingrediente.unidadMedida || item.unidadMedida || 'unidades';
          }
          // Caso 2: item.ingrediente es solo un string (ID sin poblar)
          else if (typeof item.ingrediente === 'string') {
            nombreIngrediente = `Ingrediente (ID: ${item.ingrediente.substring(0, 8)}...)`;
          }
        }
        
        // También verificar si hay un campo nombreIngrediente directo en item
        if (item.nombreIngrediente) {
          nombreIngrediente = item.nombreIngrediente;
        }

        datos.push({
          tipo: 'ingrediente',
          categoria: '🥬 Ingredientes Directos',
          concepto: nombreIngrediente,
          descripcion: `${unidadMedida}`,
          cantidad: `${item.cantidadUtilizada || 0} ${unidadMedida}`,
          costo: item.costoUnitario ? `S/.${item.costoUnitario.toFixed(2)}` : 'S/.0.00',
          total: item.cantidadUtilizada && item.costoUnitario ? 
                 `S/.${(item.cantidadUtilizada * item.costoUnitario).toFixed(2)}` : 'S/.0.00',
          estado: 'Consumido',
          fecha: formatearFecha(produccion.fechaProduccion),
          operador: produccion.operador || 'N/A'
        });
      });
    }

    // 4. INGREDIENTES DEL SISTEMA ANTERIOR (si existen)
    if (produccion.items && produccion.items.length > 0) {
      console.log('🔄 Items del sistema anterior encontrados:', produccion.items);
      produccion.items.forEach((item, index) => {
        console.log(`🔄 Debug item ${index + 1}:`, item);
        console.log(`🔄 item.ingrediente:`, item.ingrediente);
        console.log(`🔄 Tipo de item.ingrediente:`, typeof item.ingrediente);

        let nombreItem = 'Item no encontrado';
        if (item.ingrediente) {
          if (typeof item.ingrediente === 'string') {
            // Si es un string (ID), usar un nombre genérico más amigable
            nombreItem = `Item ${index + 1}`;
          } else if (item.ingrediente && item.ingrediente.nombre) {
            nombreItem = item.ingrediente.nombre;
          } else if (item.ingrediente && item.ingrediente._id) {
            nombreItem = `Item ${index + 1}`;
          }
        }

        datos.push({
          tipo: 'item-legacy',
          categoria: '🔄 Items (Sistema Anterior)',
          concepto: nombreItem,
          descripcion: `Item Legacy #${index + 1}`,
          cantidad: `${item.cantidadUtilizada || 0} unidades`,
          costo: 'No disponible',
          total: 'No disponible',
          estado: 'Consumido',
          fecha: formatearFecha(produccion.fechaProduccion),
          operador: produccion.operador || 'N/A'
        });
      });
    }

    console.log('📋 Datos preparados para tabla:', datos);
    return datos;
  };

  // Función para obtener estilos según el tipo de fila
  const obtenerEstilosFila = (tipo) => {
    const estilos = {
      produccion: {
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        border: 'border-l-4 border-blue-500'
      },
      receta: {
        bg: 'bg-green-50',
        text: 'text-green-900',
        border: 'border-l-4 border-green-500'
      },
      ingrediente: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-900',
        border: 'border-l-4 border-yellow-500'
      },
      'item-legacy': {
        bg: 'bg-gray-50',
        text: 'text-gray-900',
        border: 'border-l-4 border-gray-500'
      }
    };
    return estilos[tipo] || estilos.produccion;
  };

  const datos = prepararDatosTabla();

  if (loading) {
    const contenido = (
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Cargando detalle...</span>
        </div>
      </div>
    );
    
    return esModal ? (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        {contenido}
      </div>
    ) : contenido;
  }

  if (error) {
    const contenido = (
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
    
    return esModal ? (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        {contenido}
      </div>
    ) : contenido;
  }

  const datosTabla = prepararDatosTabla();

  const contenidoDetalle = (
    <div className={`${esModal ? 'relative mx-auto border box-border w-full max-w-7xl h-[90vh] shadow-lg rounded-lg bg-white flex flex-col' : 'bg-white rounded-lg shadow-lg border mt-6'}`}>
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className={`${esModal ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-bold text-gray-900`}>
            📋 Detalle de: {produccion?.nombre || 'Producción'}
          </h2>
          {produccion && (
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto ${getEstadoColor(produccion.estado)}`}>
              {getEstadoLabel(produccion.estado)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {produccion && produccion.estado === 'planificada' && (
            <>
              <button
                onClick={handleEjecutarProduccion}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <span className="sm:hidden">🚀</span>
                <span className="hidden sm:inline">🚀 Ejecutar</span>
              </button>
              <button
                onClick={handleCancelarProduccion}
                className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                <span className="sm:hidden">❌</span>
                <span className="hidden sm:inline">❌ Cancelar</span>
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl p-1"
          >
            ×
          </button>
        </div>
      </div>

      {/* Resumen de Producción - Responsive */}
      {produccion && (
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <div className="text-xs sm:text-sm font-medium text-gray-500">Producto</div>
              <div className="text-base sm:text-xl font-bold text-gray-900 truncate">{produccion.nombre}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <div className="text-xs sm:text-sm font-medium text-gray-500">Cantidad</div>
              <div className="text-base sm:text-xl font-bold text-green-600">
                {produccion.cantidadProducida} <span className="text-xs sm:text-sm">{produccion.unidadMedida}</span>
              </div>
            </div>
            {/* Solo super_admin ve el costo total */}
            {canViewPrices && (
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <div className="text-xs sm:text-sm font-medium text-gray-500">Costo Total</div>
                <div className="text-base sm:text-xl font-bold text-blue-600">
                  S/.{(produccion.costoTotal || 0).toFixed(2)}
                </div>
              </div>
            )}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <div className="text-xs sm:text-sm font-medium text-gray-500">Operador</div>
              <div className="text-base sm:text-xl font-bold text-gray-900 truncate">{produccion.operador || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla Unificada de Detalles */}
      <div className={`${esModal ? 'flex-1 overflow-auto' : ''} p-4 sm:p-6`}>
        <h3 className="text-base sm:text-lg font-semibold mb-4">Detalles Completos de Producción</h3>
        
        {/* ========== VISTA MÓVIL: Tarjetas ========== */}
        <div className="md:hidden space-y-3">
          {datosTabla.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin detalles disponibles
              </h3>
              <p className="text-gray-500">
                No se encontraron detalles para esta producción
              </p>
            </div>
          ) : (
            datosTabla.map((item, index) => {
              const estilos = obtenerEstilosFila(item.tipo);
              
              return (
                <div 
                  key={index} 
                  className={`${estilos.bg} ${estilos.border} rounded-xl p-4 hover:shadow-md transition-shadow`}
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <span className={`text-xs font-semibold ${estilos.text} block mb-1`}>
                        {item.categoria}
                      </span>
                      <h4 className={`font-bold text-gray-900 text-base`}>
                        {item.concepto}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.descripcion}
                      </p>
                    </div>
                    {/* Badge de estado */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.estado === 'completada' || item.estado === 'Utilizada' || item.estado === 'Consumido' ? 
                      'bg-green-100 text-green-800' : getEstadoColor(item.estado)
                    }`}>
                      {item.estado}
                    </span>
                  </div>
                  
                  {/* Stats en grid */}
                  <div className={`grid ${canViewPrices ? 'grid-cols-3' : 'grid-cols-1'} gap-2 mb-3`}>
                    <div className="bg-white bg-opacity-60 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-600 font-medium">Cantidad</p>
                      <p className="text-sm font-bold text-gray-800">{item.cantidad}</p>
                    </div>
                    {/* Solo super_admin ve costos */}
                    {canViewPrices && (
                      <>
                        <div className="bg-white bg-opacity-60 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-600 font-medium">Costo U.</p>
                          <p className="text-sm font-bold text-gray-800">{item.costo}</p>
                        </div>
                        <div className="bg-white bg-opacity-60 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-600 font-medium">Total</p>
                          <p className="text-sm font-bold text-blue-600">{item.total || '-'}</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Info adicional */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200 border-opacity-50">
                    <span>📅 {item.fecha}</span>
                    <span>👤 {item.operador}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========== VISTA DESKTOP: Tabla ========== */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  {/* Solo super_admin ve columnas de costo */}
                  {canViewPrices && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo Unit.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operador
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datosTabla.map((item, index) => {
                  const estilos = obtenerEstilosFila(item.tipo);
                  
                  return (
                    <tr key={index} className={`hover:bg-gray-50 ${estilos.bg} ${estilos.border}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-semibold ${estilos.text}`}>
                            {item.categoria}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${estilos.text}`}>
                          {item.concepto}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.cantidad}</div>
                      </td>
                      {/* Solo super_admin ve celdas de costo */}
                      {canViewPrices && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.costo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {item.total || '-'}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.estado === 'completada' || item.estado === 'Utilizada' || item.estado === 'Consumido' ? 
                          'bg-green-100 text-green-800' : getEstadoColor(item.estado)
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.fecha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.operador}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {datosTabla.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin detalles disponibles
              </h3>
              <p className="text-gray-500">
                No se encontraron detalles para esta producción
              </p>
            </div>
          )}
        </div>

        {/* Observaciones */}
        {produccion && produccion.observaciones && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-3 text-gray-700">Observaciones</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{produccion.observaciones}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar {actionType === 'ejecutar' ? 'Ejecución' : 'Cancelación'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {actionType === 'ejecutar' 
                ? '¿Está seguro de que desea ejecutar esta producción? Esta acción consumirá los ingredientes del inventario.'
                : '¿Está seguro de que desea cancelar esta producción? Esta acción no se puede deshacer.'
              }
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarAccion}
                className={`px-4 py-2 text-white rounded transition-colors ${
                  actionType === 'ejecutar' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'ejecutar' ? 'Ejecutar' : 'Cancelar Producción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return esModal ? (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      {contenidoDetalle}
    </div>
  ) : contenidoDetalle;
};

export default DetalleProduccion;
