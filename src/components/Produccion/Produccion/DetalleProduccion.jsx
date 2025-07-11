import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { produccionService } from '../../../services/produccionService';
import { recetaService } from '../../../services/recetaService';

const DetalleProduccion = ({ produccion: produccionProp, onCerrar, onActualizar }) => {
  const navigate = useNavigate();
  const [produccion, setProduccion] = useState(null);
  const [receta, setReceta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    if (produccionProp) {
      cargarDetalleProduccion();
    }
  }, [produccionProp]);

  const cargarDetalleProduccion = async () => {
    try {
      setLoading(true);
      
      // Si ya tenemos la producción como prop, usar esa
      if (produccionProp) {
        setProduccion(produccionProp);
        
        // Cargar detalles de la receta si existe
        if (produccionProp.receta) {
          let recetaId = produccionProp.receta;
          if (typeof produccionProp.receta === 'object') {
            recetaId = produccionProp.receta._id;
          }
          try {
            const recetaData = await recetaService.obtenerPorId(recetaId);
            setReceta(recetaData);
          } catch (recetaError) {
            console.warn('No se pudo cargar la receta:', recetaError);
            // No es un error crítico, continuar sin la receta
          }
        }
      } else {
        setError('No se proporcionó información de la producción');
      }
    } catch (error) {
      setError('Error al cargar el detalle de la producción');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEjecutarProduccion = async () => {
    try {
      await produccionService.ejecutarProduccion(produccion._id);
      await cargarDetalleProduccion();
      setShowConfirmModal(false);
      alert('Producción ejecutada exitosamente');
      if (onActualizar) onActualizar();
    } catch (error) {
      alert('Error al ejecutar la producción: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelarProduccion = async () => {
    try {
      const motivo = prompt('Ingrese el motivo de cancelación:') || 'Cancelación manual';
      await produccionService.cancelarProduccion(produccion._id, motivo);
      await cargarDetalleProduccion();
      setShowConfirmModal(false);
      alert('Producción cancelada exitosamente');
      if (onActualizar) onActualizar();
    } catch (error) {
      alert('Error al cancelar la producción: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEliminarProduccion = async () => {
    const estadoTexto = produccion.estado === 'completada' ? 'completada' : 
                       produccion.estado === 'cancelada' ? 'cancelada' : 
                       produccion.estado === 'planificada' ? 'planificada' : 
                       'en proceso';
    
    const mensaje = `¿Está seguro de eliminar esta producción ${estadoTexto}?\n\n` +
                   `Producción: ${produccion.nombre}\n` +
                   `Estado: ${produccion.estado}\n` +
                   `Cantidad: ${produccion.cantidadProducida} ${produccion.unidadMedida}\n\n` +
                   `Esta acción no se puede deshacer.`;
    
    if (window.confirm(mensaje)) {
      try {
        console.log(`🗑️ Eliminando producción: ${produccion.nombre} (${produccion.estado})`);
        await produccionService.eliminarProduccion(produccion._id);
        alert('Producción eliminada exitosamente');
        if (onActualizar) onActualizar();
        if (onCerrar) onCerrar();
      } catch (error) {
        console.error('Error al eliminar producción:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
        alert('Error al eliminar la producción: ' + errorMessage);
      }
    }
  };

  const confirmarAccion = (tipo) => {
    setActionType(tipo);
    setShowConfirmModal(true);
  };

  const ejecutarAccion = () => {
    if (actionType === 'ejecutar') {
      handleEjecutarProduccion();
    } else if (actionType === 'cancelar') {
      handleCancelarProduccion();
    }
  };

  const getEstadoBadge = (estado) => {
    const colors = {
      'planificada': 'bg-yellow-100 text-yellow-800',
      'Planificada': 'bg-yellow-100 text-yellow-800',
      'en_proceso': 'bg-blue-100 text-blue-800',
      'En Proceso': 'bg-blue-100 text-blue-800',
      'completada': 'bg-green-100 text-green-800',
      'Completada': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800',
      'Cancelada': 'bg-red-100 text-red-800'
    };
    
    return `px-2 py-1 rounded-full text-sm font-medium ${colors[estado] || 'bg-gray-100 text-gray-800'}`;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('../')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Volver a Producción
        </button>
      </div>
    );
  }

  if (!produccion) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600 mb-4">Producción no encontrada</div>
        <button
          onClick={() => navigate('../')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Volver a Producción
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Detalle de Producción: {produccion.nombre}
          </h1>
          <span className={getEstadoBadge(produccion.estado)}>
            {produccion.estado}
          </span>
        </div>
        
        <div className="flex space-x-2">
          {(produccion.estado === 'planificada' || produccion.estado === 'Planificada') && (
            <button
              onClick={() => confirmarAccion('ejecutar')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Ejecutar Producción
            </button>
          )}
          
          {(produccion.estado === 'planificada' || produccion.estado === 'Planificada' || 
            produccion.estado === 'en_proceso' || produccion.estado === 'En Proceso') && (
            <button
              onClick={() => confirmarAccion('cancelar')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancelar Producción
            </button>
          )}
          
          <button
            onClick={handleEliminarProduccion}
            className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
            title="Eliminar producción"
          >
            Eliminar
          </button>
          
          <button
            onClick={onCerrar}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Volver
          </button>
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Información General</h3>
          <div className="space-y-2">
            <div>
              <span className="font-medium">Fecha de Producción:</span>
              <span className="ml-2">{formatearFecha(produccion.fechaProduccion)}</span>
            </div>
            <div>
              <span className="font-medium">Cantidad Producida:</span>
              <span className="ml-2">{produccion.cantidadProducida} {produccion.unidadMedida}</span>
            </div>
            <div>
              <span className="font-medium">Tipo de Producción:</span>
              <span className="ml-2 capitalize">{produccion.tipo || 'Manual'}</span>
            </div>
            <div>
              <span className="font-medium">Costo Total:</span>
              <span className="ml-2">S/.{(produccion.costoTotal || 0).toFixed(2)}</span>
            </div>
            {produccion.operador && (
              <div>
                <span className="font-medium">Operador:</span>
                <span className="ml-2">{produccion.operador}</span>
              </div>
            )}
          </div>
        </div>

        {receta && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Receta Utilizada</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Nombre:</span>
                <span className="ml-2">{receta.nombre}</span>
              </div>
              <div>
                <span className="font-medium">Descripción:</span>
                <span className="ml-2">{receta.descripcion}</span>
              </div>
              <div>
                <span className="font-medium">Rendimiento:</span>
                <span className="ml-2">{receta.rendimiento} {receta.unidadRendimiento}</span>
              </div>
              <div>
                <span className="font-medium">Tiempo de Preparación:</span>
                <span className="ml-2">{receta.tiempoPreparacion} minutos</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ingredientes Necesarios */}
      {receta && receta.ingredientes && receta.ingredientes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Ingredientes de la Receta</h3>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingrediente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Necesaria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receta.ingredientes.map((ingrediente, index) => {
                  const cantidadTotal = (ingrediente.cantidad * produccion.cantidadProducida) / receta.rendimiento;
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ingrediente.ingrediente?.nombre || 'Ingrediente no encontrado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ingrediente.cantidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ingrediente.unidadMedida}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {cantidadTotal.toFixed(2)} {ingrediente.unidadMedida}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ingredientes Utilizados en la Producción */}
      {produccion.ingredientesUtilizados && produccion.ingredientesUtilizados.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Ingredientes Utilizados</h3>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingrediente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Utilizada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Unitario (S/)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Total (S/)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produccion.ingredientesUtilizados.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.ingrediente?.nombre || 'Ingrediente no encontrado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.cantidadUtilizada}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      S/.{(item.costoUnitario || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      S/.{((item.cantidadUtilizada || 0) * (item.costoUnitario || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recetas Utilizadas en la Producción */}
      {produccion.recetasUtilizadas && produccion.recetasUtilizadas.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Recetas Utilizadas</h3>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Utilizada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Unitario (S/)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Total (S/)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produccion.recetasUtilizadas.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.receta?.nombre || 'Receta no encontrada'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.cantidadUtilizada}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      S/.{(item.costoUnitario || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      S/.{((item.cantidadUtilizada || 0) * (item.costoUnitario || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ingredientes (Compatibilidad sistema anterior) */}
      {produccion.items && produccion.items.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Ingredientes (Sistema Anterior)</h3>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingrediente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Utilizada
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produccion.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.ingrediente?.nombre || 'Ingrediente no encontrado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.cantidadUtilizada}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Observaciones */}
      {produccion.observaciones && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Observaciones</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">{produccion.observaciones}</p>
          </div>
        </div>
      )}

      {/* Historial de Estados */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Historial</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-sm">
                <strong>Creada:</strong> {formatearFecha(produccion.createdAt || produccion.fechaProduccion)}
              </span>
            </div>
            
            {produccion.fechaProduccion && (
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-sm">
                  <strong>Fecha de Producción:</strong> {formatearFecha(produccion.fechaProduccion)}
                </span>
              </div>
            )}
            
            {produccion.updatedAt && produccion.updatedAt !== produccion.createdAt && (
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  produccion.estado === 'completada' ? 'bg-green-500' : 
                  produccion.estado === 'cancelada' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></span>
                <span className="text-sm">
                  <strong>Última actualización:</strong> {formatearFecha(produccion.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative mx-auto border box-border w-full sm:w-11/12 sm:max-w-xl md:max-w-3xl shadow-lg rounded-md bg-white p-4 sm:p-6 h-[70vh] sm:min-h-[350px] max-h-[ 290vh] flex flex-col">
            <div className="mt-3 text-center flex-1 flex flex-col overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar {actionType === 'ejecutar' ? 'Ejecución' : 'Cancelación'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {actionType === 'ejecutar' 
                  ? '¿Está seguro de que desea ejecutar esta producción? Esta acción consumirá los ingredientes del inventario.'
                  : '¿Está seguro de que desea cancelar esta producción? Esta acción no se puede deshacer.'
                }
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={ejecutarAccion}
                  className={`px-4 py-2 text-white rounded ${
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
        </div>
      )}
    </div>
  );
};

export default DetalleProduccion;
