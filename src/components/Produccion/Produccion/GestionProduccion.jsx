import React, { useState, useEffect } from 'react';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import { produccionService } from '../../../services/produccionService';
import NuevaProduccion from './NuevaProduccion';
import DetalleProduccion from './DetalleProduccion';

const GestionProduccion = () => {
  const [producciones, setProducciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    buscar: '',
    estado: '',
    fechaInicio: '',
    fechaFin: '',
    operador: '',
    limite: 20,
    pagina: 1
  });
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [produccionSeleccionada, setProduccionSeleccionada] = useState(null);

  useEffect(() => {
    cargarProducciones();
  }, [filtros]);

  const cargarProducciones = async () => {
    try {
      setLoading(true);
      // Usar el nuevo método que agrupa por producto y suma cantidades
      const response = await produccionService.obtenerProduccionesAgrupadas(filtros);
      setProducciones(response.data.producciones);
      setTotalPaginas(response.data.totalPaginas);
      setError('');
    } catch (err) {
      setError('Error al cargar producciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      pagina: campo !== 'pagina' ? 1 : valor // Reset página al cambiar otros filtros
    }));
  };

  const handleNuevaProduccion = () => {
    setMostrarNueva(true);
  };

  const handleVerDetalle = (produccion) => {
    setProduccionSeleccionada(produccion);
    setMostrarDetalle(true);
  };

  const handleEjecutarProduccion = async (id) => {
    if (window.confirm('¿Está seguro de ejecutar esta producción? Esta acción consumirá los ingredientes.')) {
      try {
        await produccionService.ejecutarProduccion(id);
        cargarProducciones();
      } catch (err) {
        setError('Error al ejecutar producción: ' + err.message);
      }
    }
  };

  const handleCancelarProduccion = async (id) => {
    const motivo = prompt('Ingrese el motivo de cancelación:');
    if (motivo) {
      try {
        await produccionService.cancelarProduccion(id, motivo);
        cargarProducciones();
      } catch (err) {
        setError('Error al cancelar producción: ' + err.message);
      }
    }
  };

  const handleCerrarDetalle = () => {
    setMostrarDetalle(false);
    setProduccionSeleccionada(null);
  };

  const handleEliminarProduccion = async (id) => {
    if (!id) {
      setError('Error: ID de producción no válido');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar esta producción?\n\n⚠️ IMPORTANTE: Esto revertirá automáticamente:\n• Stock del producto final\n• Inventario de ingredientes consumidos\n• Inventario de recetas utilizadas\n\nEsta acción no se puede deshacer.`)) {
      try {
        const resultado = await produccionService.eliminarProduccion(id);
        
        // Mostrar mensaje de éxito con detalles mejorados
        const mensaje = `✅ Producción eliminada exitosamente\n\n📊 Detalles de la reversión:\n${resultado.inventarioRevertido ? '📉 Stock del producto revertido correctamente\n📦 Ingredientes y recetas repuestos al inventario' : 'ℹ️ Sin cambios de stock necesarios (producción no completada)'}`;
        
        alert(mensaje);
        
        cargarProducciones();
        // Cerrar el modal de detalle si está abierto
        setMostrarDetalle(false);
        setProduccionSeleccionada(null);
      } catch (err) {
        setError('Error al eliminar producción: ' + err.message);
        alert(`❌ Error al eliminar producción:\n\n${err.message}\n\n⚠️ Nota: Si el error persiste, puede que algunos ingredientes/recetas no hayan sido revertidos correctamente. Revise el inventario manualmente.`);
      }
    }
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

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerFechaHoy = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (loading && filtros.pagina === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Producción</h1>
        <button
          onClick={handleNuevaProduccion}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          Nueva Producción
        </button>
      </div>
      <AccesosRapidosProduccion />

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filtros.buscar}
              onChange={(e) => handleFiltroChange('buscar', e.target.value)}
              placeholder="Nombre del producto..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="planificada">Planificada</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
              max={obtenerFechaHoy()}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
              max={obtenerFechaHoy()}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operador
            </label>
            <input
              type="text"
              value={filtros.operador}
              onChange={(e) => handleFiltroChange('operador', e.target.value)}
              placeholder="Nombre del operador..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Por página
            </label>
            <select
              value={filtros.limite}
              onChange={(e) => handleFiltroChange('limite', parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Producciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Producida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {producciones.map((produccion) => (
                <tr key={produccion._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {produccion.nombre}
                      </div>
                      {produccion.receta && (
                        <div className="text-sm text-gray-500">
                          Receta: {produccion.receta.nombre}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {produccion.cantidadProducida} {produccion.unidadMedida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(produccion.estado)}`}>
                      {getEstadoLabel(produccion.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    S/.{produccion.costoTotal?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {produccion.operador}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFecha(produccion.fechaProduccion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVerDetalle(produccion)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        Ver
                      </button>
                      {produccion.estado === 'planificada' && (
                        <>
                          <button
                            onClick={() => handleEjecutarProduccion(produccion._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Ejecutar producción"
                          >
                            Ejecutar
                          </button>
                          <button
                            onClick={() => handleCancelarProduccion(produccion._id)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Cancelar producción"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEliminarProduccion(produccion._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar producción"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {producciones.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay producciones
            </h3>
            <p className="text-gray-500 mb-4">
              Comienza creando tu primera producción
            </p>
            <button
              onClick={handleNuevaProduccion}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Crear Primera Producción
            </button>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handleFiltroChange('pagina', Math.max(1, filtros.pagina - 1))}
              disabled={filtros.pagina === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => handleFiltroChange('pagina', Math.min(totalPaginas, filtros.pagina + 1))}
              disabled={filtros.pagina === totalPaginas}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{filtros.pagina}</span> de{' '}
                <span className="font-medium">{totalPaginas}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handleFiltroChange('pagina', Math.max(1, filtros.pagina - 1))}
                  disabled={filtros.pagina === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ←
                </button>
                
                {/* Números de página */}
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (filtros.pagina <= 3) {
                    pageNum = i + 1;
                  } else if (filtros.pagina >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = filtros.pagina - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handleFiltroChange('pagina', pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        filtros.pagina === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handleFiltroChange('pagina', Math.min(totalPaginas, filtros.pagina + 1))}
                  disabled={filtros.pagina === totalPaginas}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {mostrarDetalle && produccionSeleccionada && (
        <>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-900">
                📋 Detalle de: {produccionSeleccionada.nombre}
              </h3>
              <button
                onClick={handleCerrarDetalle}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>
          
          <DetalleProduccion
            produccion={produccionSeleccionada}
            onClose={handleCerrarDetalle}
            onProduccionActualizada={() => {
              setMostrarDetalle(false);
              setProduccionSeleccionada(null);
              cargarProducciones();
            }}
            esModal={false}
          />
        </>
      )}

      {/* Modales */}
      {mostrarNueva && (
        <NuevaProduccion
          onGuardar={() => {
            setMostrarNueva(false);
            cargarProducciones();
          }}
          onCancelar={() => setMostrarNueva(false)}
        />
      )}
    </div>
  );
};

export default GestionProduccion;
