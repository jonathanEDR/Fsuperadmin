import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Download,
  Eye,
  CheckCircle,
  User,
  Loader,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { tareasService } from '../../services/tareas';

// Configuración de colores por prioridad
const PRIORIDAD_CONFIG = {
  urgente: { bg: 'bg-red-100', text: 'text-red-800' },
  alta: { bg: 'bg-orange-100', text: 'text-orange-800' },
  media: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  baja: { bg: 'bg-green-100', text: 'text-green-800' }
};

/**
 * Tabla/Tarjetas de tareas completadas/aprobadas con búsqueda y filtros
 * Responsivo: Tabla en desktop, tarjetas en móvil
 */
export default function TablaTareasAprobadas({ userRole }) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [paginacion, setPaginacion] = useState({ pagina: 1, limite: 10, total: 0 });
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);

  useEffect(() => {
    cargarTareas();
  }, [paginacion.pagina, busqueda, fechaDesde, fechaHasta]);

  const cargarTareas = async () => {
    setLoading(true);
    try {
      const filtros = {
        estado: 'completada',
        pagina: paginacion.pagina,
        limite: paginacion.limite
      };

      if (busqueda) filtros.buscar = busqueda;
      if (fechaDesde) filtros.fechaDesde = fechaDesde;
      if (fechaHasta) filtros.fechaHasta = fechaHasta;

      const response = await tareasService.listar(filtros);
      setTareas(response.data || []);
      if (response.paginacion) {
        setPaginacion(prev => ({ ...prev, total: response.paginacion.totalRegistros || response.paginacion.total }));
      }
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  const exportarCSV = () => {
    const headers = ['Código', 'Título', 'Prioridad', 'Completada', 'Revisada por', 'Resultado'];
    const rows = tareas.map(t => [
      t.codigo || '',
      t.titulo,
      t.prioridad,
      t.completadaAt ? new Date(t.completadaAt).toLocaleDateString('es-ES') : '',
      t.revisadoNombre || '',
      t.resultadoRevision || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tareas_completadas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPaginas = Math.ceil(paginacion.total / paginacion.limite);
  const hayFiltrosActivos = busqueda || fechaDesde || fechaHasta;

  // Componente de tarjeta para móvil
  const TarjetaTareaCompletada = ({ tarea }) => {
    const prioridadConfig = PRIORIDAD_CONFIG[tarea.prioridad] || PRIORIDAD_CONFIG.media;

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        {/* Header con código y prioridad */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {tarea.codigo || '-'}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${prioridadConfig.bg} ${prioridadConfig.text}`}>
            {tarea.prioridad?.charAt(0).toUpperCase() + tarea.prioridad?.slice(1)}
          </span>
        </div>

        {/* Título */}
        <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">{tarea.titulo}</h4>

        {/* Info del asignado */}
        {tarea.asignadoNombre && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
            <User size={12} />
            {tarea.asignadoNombre}
          </p>
        )}

        {/* Fechas y estado */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {tarea.completadaAt
              ? new Date(tarea.completadaAt).toLocaleDateString('es-ES')
              : '-'
            }
          </div>
          {tarea.revisadoPor && (
            <span className={`px-2 py-0.5 rounded-full ${
              tarea.resultadoRevision === 'aprobada'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {tarea.resultadoRevision === 'aprobada' ? 'Aprobada' : 'Rechazada'}
            </span>
          )}
        </div>

        {/* Botón ver más */}
        <button
          onClick={() => setTareaSeleccionada(tarea)}
          className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Eye size={16} />
          Ver detalles
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header con filtros - Responsivo */}
      <div className="space-y-3">
        {/* Barra de búsqueda y botones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleBuscar} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Buscar tareas..."
              />
            </div>
          </form>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                showFiltros || hayFiltrosActivos
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} />
              <span>Filtros</span>
              {hayFiltrosActivos && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">!</span>
              )}
            </button>

            <button
              onClick={exportarCSV}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Download size={18} />
              <span className="sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Panel de filtros expandible */}
        {showFiltros && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {hayFiltrosActivos && (
                <div className="flex items-end">
                  <button
                    onClick={limpiarFiltros}
                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <X size={16} />
                    Limpiar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        ) : tareas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay tareas completadas</p>
          </div>
        ) : (
          <>
            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden p-4 space-y-3">
              {tareas.map((tarea) => (
                <TarjetaTareaCompletada key={tarea._id} tarea={tarea} />
              ))}
            </div>

            {/* Tabla para desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarea
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completada
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revisión
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tareas.map((tarea) => {
                    const prioridadConfig = PRIORIDAD_CONFIG[tarea.prioridad] || PRIORIDAD_CONFIG.media;
                    return (
                      <tr key={tarea._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {tarea.codigo || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{tarea.titulo}</p>
                            {tarea.asignadoNombre && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <User size={12} />
                                {tarea.asignadoNombre}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${prioridadConfig.bg} ${prioridadConfig.text}`}>
                            {tarea.prioridad?.charAt(0).toUpperCase() + tarea.prioridad?.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar size={14} />
                            {tarea.completadaAt
                              ? new Date(tarea.completadaAt).toLocaleDateString('es-ES')
                              : '-'
                            }
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {tarea.revisadoPor ? (
                            <div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                tarea.resultadoRevision === 'aprobada'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {tarea.resultadoRevision === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                por {tarea.revisadoNombre}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Sin revisión</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setTareaSeleccionada(tarea)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación - Responsiva */}
            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600 text-center sm:text-left">
                  {((paginacion.pagina - 1) * paginacion.limite) + 1} - {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de {paginacion.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginacion(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                    disabled={paginacion.pagina === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg">
                    {paginacion.pagina} / {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginacion(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                    disabled={paginacion.pagina >= totalPaginas}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalle - Responsivo */}
      {tareaSeleccionada && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setTareaSeleccionada(null)}
          />
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
              {/* Header del modal */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 pr-8">
                  {tareaSeleccionada.titulo}
                </h3>
                <button
                  onClick={() => setTareaSeleccionada(null)}
                  className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {tareaSeleccionada.codigo && (
                <p className="text-sm text-gray-500 mb-3">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {tareaSeleccionada.codigo}
                  </span>
                </p>
              )}

              {tareaSeleccionada.contenido && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-gray-600 text-sm">
                  {tareaSeleccionada.contenido}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Prioridad</span>
                  <span className="font-medium capitalize">{tareaSeleccionada.prioridad}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Completada</span>
                  <span className="font-medium">
                    {tareaSeleccionada.completadaAt
                      ? new Date(tareaSeleccionada.completadaAt).toLocaleString('es-ES')
                      : '-'
                    }
                  </span>
                </div>
                {tareaSeleccionada.revisadoNombre && (
                  <>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Revisada por</span>
                      <span className="font-medium">{tareaSeleccionada.revisadoNombre}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Resultado</span>
                      <span className={`font-medium capitalize ${
                        tareaSeleccionada.resultadoRevision === 'aprobada'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {tareaSeleccionada.resultadoRevision}
                      </span>
                    </div>
                    {tareaSeleccionada.comentarioRevision && (
                      <div className="py-2 border-b border-gray-100">
                        <span className="text-gray-500 block mb-1">Comentario</span>
                        <span className="text-gray-700">{tareaSeleccionada.comentarioRevision}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Creada por</span>
                  <span className="font-medium">{tareaSeleccionada.creatorName}</span>
                </div>
              </div>

              <button
                onClick={() => setTareaSeleccionada(null)}
                className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
