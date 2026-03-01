import React, { useState, useEffect } from 'react';
import { Loader2, Search, BarChart3, User, Calendar, FileText, Plus, Factory, Eye, Play, Pause, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import BreadcrumbProduccion from '../BreadcrumbProduccion';
import { produccionService } from '../../../services/produccionService';
import NuevaProduccion from './NuevaProduccion';
import HistorialProduccion from '../Movimientos/HistorialProduccion';
import { formatearFecha, getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

const GestionProduccion = () => {
  // Hook de permisos para control de roles
  const { canViewPrices, canDeleteProduccion, canCreateProduccion, isSuperAdmin } = useQuickPermissions();

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

  // Estado para historial de cantidades
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [productoParaHistorial, setProductoParaHistorial] = useState(null);

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

  // Función para abrir historial de cantidades
  const handleVerHistorial = (produccion) => {
    // Crear objeto producto compatible con HistorialProduccion
    const productoParaHistorial = {
      _id: produccion.productoId || produccion._id,
      nombre: produccion.nombre,
      unidadMedida: produccion.unidadMedida
    };
    setProductoParaHistorial(productoParaHistorial);
    setMostrarHistorial(true);
  };

  const handleCerrarHistorial = () => {
    setMostrarHistorial(false);
    setProductoParaHistorial(null);
  };

  const handleEliminarProduccion = async (id) => {
    if (!id) {
      setError('Error: ID de producción no válido');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar esta producción?\n\nIMPORTANTE: Esto revertirá automáticamente:\n• Stock del producto final\n• Inventario de ingredientes consumidos\n• Inventario de recetas utilizadas\n\nEsta acción no se puede deshacer.`)) {
      try {
        const resultado = await produccionService.eliminarProduccion(id);
        
        // Mostrar mensaje de éxito con detalles mejorados
        const mensaje = `Producción eliminada exitosamente\n\nDetalles de la reversión:\n${resultado.inventarioRevertido ? 'Stock del producto revertido correctamente\nIngredientes y recetas repuestos al inventario' : 'Sin cambios de stock necesarios (producción no completada)'}`;
        
        alert(mensaje);
        
        cargarProducciones();
      } catch (err) {
        setError('Error al eliminar producción: ' + err.message);
        alert(`Error al eliminar producción:\n\n${err.message}\n\nNota: Si el error persiste, puede que algunos ingredientes/recetas no hayan sido revertidos correctamente. Revise el inventario manualmente.`);
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

  // Usar utilidades de fecha robustas de fechaHoraUtils
  const formatearFechaLocal = (fecha) => {
    if (!fecha) return 'N/A';
    return formatearFecha(fecha);
  };

  const obtenerFechaHoy = () => {
    // Usar zona horaria de Perú para obtener la fecha actual
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  };

  if (loading && filtros.pagina === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-6 py-4">
      <BreadcrumbProduccion />
      
      {/* 🎯 OPTIMIZADO: Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestión de Producción</h1>
      
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <AlertTriangle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 🎯 OPTIMIZADO: Filtros súper compactos - máximo 2 filas en todos los dispositivos */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-100 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
          {/* Fila 1: Campos principales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Search size={14} className="text-gray-400" /> Buscar Producto
            </label>
            <input
              type="text"
              value={filtros.buscar}
              onChange={(e) => handleFiltroChange('buscar', e.target.value)}
              placeholder="Nombre del producto..."
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <BarChart3 size={14} className="text-gray-400" /> Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="planificada">Planificada</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <User size={14} className="text-gray-400" /> Operador
            </label>
            <input
              type="text"
              value={filtros.operador}
              onChange={(e) => handleFiltroChange('operador', e.target.value)}
              placeholder="Nombre del operador..."
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Fila 2: Fechas y configuración */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" /> Fecha Inicio
            </label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
              max={obtenerFechaHoy()}
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" /> Fecha Fin
            </label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
              max={obtenerFechaHoy()}
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400" /> Por página
            </label>
            <select
              value={filtros.limite}
              onChange={(e) => handleFiltroChange('limite', parseInt(e.target.value))}
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

        {/* Botón Nueva Producción - Solo visible para super_admin */}
        {canCreateProduccion && (
          <button
            onClick={handleNuevaProduccion}
            className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors w-full sm:w-auto font-medium text-sm sm:text-base"
          >
            <Plus size={18} /> Nueva Producción
          </button>
        )}

      {/* 🎯 OPTIMIZADO: Lista de Producciones con vista dual */}
      
      {/* ========== VISTA MÓVIL: Tarjetas ========== */}
      <div className="md:hidden space-y-3">
        {producciones.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Factory size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay producciones
            </h3>
            <p className="text-gray-500 mb-4">
              {canCreateProduccion 
                ? 'Comienza creando tu primera producción' 
                : 'Aún no hay producciones registradas'}
            </p>
            {canCreateProduccion && (
              <button
                onClick={handleNuevaProduccion}
                className="flex items-center gap-2 mx-auto text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={16} /> Crear Primera Producción
              </button>
            )}
          </div>
        ) : (
          producciones.map((produccion) => (
            <div 
              key={produccion._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {produccion.nombre}
                  </h3>
                  {produccion.receta && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Receta: {produccion.receta.nombre}
                    </p>
                  )}
                </div>
                {/* Badge de estado */}
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(produccion.estado)}`}>
                  {getEstadoLabel(produccion.estado)}
                </span>
              </div>
              
              {/* Stats en grid */}
              <div className={`grid ${canViewPrices ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-3`}>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-blue-600 font-medium">Cantidad</p>
                  <p className="text-sm font-bold text-blue-800">{produccion.cantidadProducida}</p>
                  <p className="text-[10px] text-blue-500">{produccion.unidadMedida}</p>
                </div>
                {/* Solo super_admin ve el costo */}
                {canViewPrices && (
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-green-600 font-medium">Costo</p>
                    <p className="text-sm font-bold text-green-800">S/.{produccion.costoTotal?.toFixed(2) || '0.00'}</p>
                  </div>
                )}
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-purple-600 font-medium">Fecha</p>
                  <p className="text-sm font-bold text-purple-800">
                    {new Date(produccion.fechaProduccion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
              
              {/* Info adicional */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
                <span className="flex items-center gap-1"><User size={12} /> {produccion.operador}</span>
              </div>
              
              {/* Acciones */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleVerDetalle(produccion)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <Eye size={14} /> Ver
                </button>
                <button
                  onClick={() => handleVerHistorial(produccion)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200"
                  title="Ver historial de cantidades producidas"
                >
                  <BarChart3 size={14} /> Historial
                </button>
                {produccion.estado === 'planificada' && (
                  <>
                    <button
                      onClick={() => handleEjecutarProduccion(produccion._id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors border border-green-200"
                    >
                      <Play size={14} /> Ejecutar
                    </button>
                    <button
                      onClick={() => handleCancelarProduccion(produccion._id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-xs font-medium hover:bg-orange-100 transition-colors border border-orange-200"
                    >
                      <Pause size={14} /> Cancelar
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleEliminarProduccion(produccion._id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========== VISTA DESKTOP: Tabla ========== */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                {/* Solo super_admin ve la columna de costo */}
                {canViewPrices && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
                  </th>
                )}
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
                  {/* Solo super_admin ve el costo */}
                  {canViewPrices && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      S/.{produccion.costoTotal?.toFixed(2) || '0.00'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {produccion.operador}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFecha(produccion.fechaProduccion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVerHistorial(produccion)}
                        className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-xl text-xs transition-colors"
                        title="Ver historial de cantidades producidas"
                      >
                        <Eye size={13} /> Ver
                      </button>
                      {produccion.estado === 'planificada' && (
                        <>
                          <button
                            onClick={() => handleEjecutarProduccion(produccion._id)}
                            className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 px-2.5 py-1 rounded-xl text-xs transition-colors"
                            title="Ejecutar producción"
                          >
                            <Play size={13} /> Ejecutar
                          </button>
                          <button
                            onClick={() => handleCancelarProduccion(produccion._id)}
                            className="flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 px-2.5 py-1 rounded-xl text-xs transition-colors"
                            title="Cancelar producción"
                          >
                            <Pause size={13} /> Cancelar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEliminarProduccion(produccion._id)}
                        className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-2.5 py-1 rounded-xl text-xs transition-colors"
                        title="Eliminar producción"
                      >
                        <Trash2 size={13} /> Eliminar
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
            <Factory size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay producciones
            </h3>
            <p className="text-gray-500 mb-4">
              {canCreateProduccion 
                ? 'Comienza creando tu primera producción' 
                : 'Aún no hay producciones registradas'}
            </p>
            {canCreateProduccion && (
              <button
                onClick={handleNuevaProduccion}
                className="flex items-center gap-2 mx-auto text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={16} /> Crear Primera Producción
              </button>
            )}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-xl">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handleFiltroChange('pagina', Math.max(1, filtros.pagina - 1))}
              disabled={filtros.pagina === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => handleFiltroChange('pagina', Math.min(totalPaginas, filtros.pagina + 1))}
              disabled={filtros.pagina === totalPaginas}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
                  className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
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
                  className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            </div>
          </div>
        </div>
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

      {/* Modal de Historial de Cantidades */}
      {mostrarHistorial && productoParaHistorial && (
        <HistorialProduccion
          producto={productoParaHistorial}
          isOpen={mostrarHistorial}
          onClose={handleCerrarHistorial}
        />
      )}
    </div>
  );
};

export default GestionProduccion;
