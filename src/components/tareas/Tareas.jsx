import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Plus,
  Loader,
  AlertTriangle,
  CheckCircle,
  Clock,
  ListTodo,
  BarChart3,
  Filter,
  RefreshCw,
  Settings,
  FileText
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { tareasService, categoriasService, etiquetasService, plantillasService } from '../../services/tareas';

import TarjetaTarea from './TarjetaTarea';
import CrearTareaModal from './CrearTareaModal';
import DetalleTareaModal from './DetalleTareaModal';
import FiltrosTareas from './FiltrosTareas';
import EstadisticasTareas from './EstadisticasTareas';
import TablaTareasAprobadas from './TablaTareasAprobadas';
import GestionCategoriasModal from './GestionCategoriasModal';
import GestionPlantillasModal from './GestionPlantillasModal';

// Configuración de pestañas
const TABS = {
  ACTIVAS: 'activas',
  EN_REVISION: 'en_revision',
  APROBADAS: 'aprobadas',
  ESTADISTICAS: 'estadisticas'
};

/**
 * Componente principal para gestión de Tareas
 * Soporta roles: user, admin, super_admin
 */
export default function Tareas() {
  const { user } = useUser();
  const userRole = useRole();

  // Estados principales
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de UI
  const [activeTab, setActiveTab] = useState(TABS.ACTIVAS);
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);
  const [isCategoriasModalOpen, setIsCategoriasModalOpen] = useState(false);
  const [isPlantillasModalOpen, setIsPlantillasModalOpen] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);

  // Estados de datos auxiliares
  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [paginacion, setPaginacion] = useState({ pagina: 1, limite: 20, total: 0 });

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    prioridad: '',
    categoriaId: '',
    buscar: '',
    soloVencidas: false,
    soloUrgentes: false
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Recargar tareas cuando cambian los filtros o la pestaña
  useEffect(() => {
    cargarTareas();
  }, [filtros, activeTab, paginacion.pagina]);

  const cargarDatosIniciales = async () => {
    try {
      const [categoriasRes, etiquetasRes, plantillasRes] = await Promise.all([
        categoriasService.listar(),
        etiquetasService.listar(),
        plantillasService.listar()
      ]);
      setCategorias(categoriasRes.data || []);
      setEtiquetas(etiquetasRes.data || []);
      setPlantillas(plantillasRes.data || []);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    }
  };

  const cargarTareas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Construir filtros según la pestaña activa
      const filtrosQuery = { ...filtros, pagina: paginacion.pagina, limite: paginacion.limite };

      if (activeTab === TABS.ACTIVAS) {
        filtrosQuery.estado = filtros.estado || 'pendiente,en_progreso';
      } else if (activeTab === TABS.EN_REVISION) {
        filtrosQuery.estado = 'en_revision';
      }

      const response = await tareasService.listar(filtrosQuery);
      setTareas(response.data || []);
      if (response.paginacion) {
        setPaginacion(prev => ({ ...prev, total: response.paginacion.total }));
      }
    } catch (err) {
      setError('Error al cargar tareas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtros, activeTab, paginacion.pagina, paginacion.limite]);

  const cargarEstadisticas = async () => {
    try {
      const response = await tareasService.obtenerEstadisticas();
      setEstadisticas(response.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  // Handlers de acciones
  const handleCrearTarea = async (datosTarea) => {
    try {
      const response = await tareasService.crear(datosTarea);
      setTareas(prev => [response.data, ...prev]);
      setSuccess('Tarea creada exitosamente');
      setIsCrearModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear tarea');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Función para actualizar la tarea en el estado local (cuando ya viene actualizada del backend)
  const handleActualizarTareaLocal = (id, tareaActualizada) => {
    setTareas(prev => prev.map(t => t._id === id ? tareaActualizada : t));
    // También actualizar la tarea seleccionada si es la misma
    if (tareaSeleccionada && tareaSeleccionada._id === id) {
      setTareaSeleccionada(tareaActualizada);
    }
  };

  // Función para hacer PUT al backend y actualizar
  const handleActualizarTarea = async (id, datos) => {
    try {
      const response = await tareasService.actualizar(id, datos);
      setTareas(prev => prev.map(t => t._id === id ? response.data : t));
      setSuccess('Tarea actualizada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al actualizar tarea');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEliminarTarea = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await tareasService.eliminar(id);
      setTareas(prev => prev.filter(t => t._id !== id));
      setSuccess('Tarea eliminada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al eliminar tarea');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      const response = await tareasService.cambiarEstado(id, nuevoEstado);
      setTareas(prev => prev.map(t => t._id === id ? response.data : t));
      setSuccess(`Estado cambiado a ${nuevoEstado}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al cambiar estado');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEnviarARevision = async (id) => {
    try {
      const response = await tareasService.enviarARevision(id);
      setTareas(prev => prev.map(t => t._id === id ? response.data : t));
      setSuccess('Tarea enviada a revisión');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al enviar a revisión');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRevisar = async (id, resultado, comentario = '') => {
    try {
      const response = await tareasService.revisar(id, resultado, comentario);
      setTareas(prev => prev.map(t => t._id === id ? response.data : t));
      setSuccess(`Tarea ${resultado}`);
      if (resultado === 'aprobada') {
        setTimeout(() => setActiveTab(TABS.APROBADAS), 1500);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al revisar tarea');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleVerDetalle = (tarea) => {
    setTareaSeleccionada(tarea);
    setIsDetalleModalOpen(true);
  };

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  // Contadores para badges
  const contadorActivas = tareas.filter(t =>
    ['pendiente', 'en_progreso'].includes(t.estado)
  ).length;
  const contadorEnRevision = tareas.filter(t => t.estado === 'en_revision').length;

  // Renderizado
  return (
    <div className="space-y-6">
      {/* Modales */}
      <CrearTareaModal
        isOpen={isCrearModalOpen}
        onClose={() => setIsCrearModalOpen(false)}
        onCrear={handleCrearTarea}
        categorias={categorias}
        etiquetas={etiquetas}
        plantillas={plantillas}
        userRole={userRole}
      />

      <DetalleTareaModal
        isOpen={isDetalleModalOpen}
        onClose={() => {
          setIsDetalleModalOpen(false);
          setTareaSeleccionada(null);
        }}
        tarea={tareaSeleccionada}
        onActualizar={handleActualizarTareaLocal}
        onCambiarEstado={handleCambiarEstado}
        onRevisar={handleRevisar}
        userRole={userRole}
        userId={user?.id}
      />

      {/* Modal de gestión de categorías (solo admin) */}
      {['admin', 'super_admin'].includes(userRole) && (
        <GestionCategoriasModal
          isOpen={isCategoriasModalOpen}
          onClose={() => setIsCategoriasModalOpen(false)}
          onCategoriasChange={cargarDatosIniciales}
        />
      )}

      {/* Modal de gestión de plantillas (solo admin) */}
      {['admin', 'super_admin'].includes(userRole) && (
        <GestionPlantillasModal
          isOpen={isPlantillasModalOpen}
          onClose={() => setIsPlantillasModalOpen(false)}
          onPlantillasChange={cargarDatosIniciales}
        />
      )}

      {/* Header - Responsivo */}
      <div className="bg-white shadow-xl rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
            <ListTodo className="text-blue-600" size={24} />
            Gestión de Tareas
          </h1>

          {/* Botones de acción - Grid en móvil */}
          <div className="grid grid-cols-4 sm:flex gap-2 sm:gap-3">
            {/* Botón de gestión de categorías (solo admin) */}
            {['admin', 'super_admin'].includes(userRole) && (
              <button
                onClick={() => setIsCategoriasModalOpen(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center sm:justify-start gap-2"
                title="Gestionar Categorías"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Categorías</span>
              </button>
            )}
            {/* Botón de gestión de plantillas (solo admin) */}
            {['admin', 'super_admin'].includes(userRole) && (
              <button
                onClick={() => setIsPlantillasModalOpen(true)}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2.5 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center sm:justify-start gap-2"
                title="Gestionar Plantillas"
              >
                <FileText size={18} />
                <span className="hidden sm:inline">Plantillas</span>
              </button>
            )}
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`p-2.5 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center sm:justify-start gap-2 transition-colors ${
                showFiltros
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Filtros"
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filtros</span>
            </button>
            <button
              onClick={cargarTareas}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center"
              disabled={loading}
              title="Recargar"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            {/* Botón Nueva Tarea - Solo para admin y super_admin */}
            {['admin', 'super_admin'].includes(userRole) && (
              <button
                onClick={() => setIsCrearModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center sm:justify-start gap-2 shadow"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Nueva Tarea</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtros expandibles */}
        {showFiltros && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <FiltrosTareas
              filtros={filtros}
              onChange={handleFiltrosChange}
              categorias={categorias}
              etiquetas={etiquetas}
            />
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Pestañas - Responsivas */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
          <button
            onClick={() => setActiveTab(TABS.ACTIVAS)}
            className={`flex-1 min-w-[100px] px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
              activeTab === TABS.ACTIVAS
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ListTodo size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden xs:inline">Tareas</span> Activas
            {contadorActivas > 0 && (
              <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {contadorActivas}
              </span>
            )}
          </button>

          {['admin', 'super_admin'].includes(userRole) && (
            <button
              onClick={() => setActiveTab(TABS.EN_REVISION)}
              className={`flex-1 min-w-[100px] px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
                activeTab === TABS.EN_REVISION
                  ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
              En Revisión
              {contadorEnRevision > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  {contadorEnRevision}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab(TABS.APROBADAS)}
            className={`flex-1 min-w-[100px] px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
              activeTab === TABS.APROBADAS
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            Completadas
          </button>

          <button
            onClick={() => {
              setActiveTab(TABS.ESTADISTICAS);
              cargarEstadisticas();
            }}
            className={`flex-1 min-w-[100px] px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
              activeTab === TABS.ESTADISTICAS
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={16} className="sm:w-[18px] sm:h-[18px]" />
            Estadísticas
          </button>
        </div>

        {/* Contenido de pestañas */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin text-blue-600" size={40} />
            </div>
          ) : (
            <>
              {activeTab === TABS.ACTIVAS && (
                <div className="space-y-4">
                  {tareas.filter(t => ['pendiente', 'en_progreso'].includes(t.estado)).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ListTodo size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No hay tareas activas</p>
                    </div>
                  ) : (
                    tareas
                      .filter(t => ['pendiente', 'en_progreso'].includes(t.estado))
                      .map(tarea => (
                        <TarjetaTarea
                          key={tarea._id}
                          tarea={tarea}
                          onVerDetalle={handleVerDetalle}
                          onCambiarEstado={handleCambiarEstado}
                          onEnviarRevision={handleEnviarARevision}
                          onEliminar={handleEliminarTarea}
                          userRole={userRole}
                          userId={user?.id}
                        />
                      ))
                  )}
                </div>
              )}

              {activeTab === TABS.EN_REVISION && (
                <div className="space-y-4">
                  {tareas.filter(t => t.estado === 'en_revision').length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No hay tareas pendientes de revisión</p>
                    </div>
                  ) : (
                    tareas
                      .filter(t => t.estado === 'en_revision')
                      .map(tarea => (
                        <TarjetaTarea
                          key={tarea._id}
                          tarea={tarea}
                          onVerDetalle={handleVerDetalle}
                          onRevisar={handleRevisar}
                          onEliminar={handleEliminarTarea}
                          userRole={userRole}
                          userId={user?.id}
                          mostrarAccionesRevision
                        />
                      ))
                  )}
                </div>
              )}

              {activeTab === TABS.APROBADAS && (
                <TablaTareasAprobadas userRole={userRole} />
              )}

              {activeTab === TABS.ESTADISTICAS && (
                <EstadisticasTareas estadisticas={estadisticas} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
