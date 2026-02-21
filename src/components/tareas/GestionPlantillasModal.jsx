import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Loader,
  FileText,
  Edit2,
  Trash2,
  Save,
  Check,
  AlertTriangle,
  Copy,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Zap,
  Search,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { plantillasService, categoriasService } from '../../services/tareas';
import { tareasService } from '../../services/tareas';
import api from '../../services/api';

// Prioridades disponibles
const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: 'bg-gray-100 text-gray-700' },
  { value: 'media', label: 'Media', color: 'bg-blue-100 text-blue-700' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-700' }
];

/**
 * Modal para gestionar plantillas de tareas
 */
export default function GestionPlantillasModal({ isOpen, onClose, onPlantillasChange, onTareaCreada, userRole }) {
  const [plantillas, setPlantillas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // === Estados para asignación rápida ===
  const [asignandoPlantillaId, setAsignandoPlantillaId] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [creandoTarea, setCreandoTarea] = useState(false);
  const asignarRef = useRef(null);

  // Estado para nueva plantilla
  const [nuevaPlantilla, setNuevaPlantilla] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    tituloBase: '',
    contenidoBase: '',
    categoriaId: '',
    prioridadDefecto: 'media',
    diasParaVencimiento: 7,
    subtareasPredefinidas: []
  });

  // Estado para edición
  const [editandoId, setEditandoId] = useState(null);
  const [plantillaEditando, setPlantillaEditando] = useState(null);

  // Estado para expandir/colapsar plantillas
  const [plantillaExpandida, setPlantillaExpandida] = useState(null);

  // Estado para nueva subtarea
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      cargarDatos();
      if (['admin', 'super_admin'].includes(userRole)) {
        cargarUsuarios();
      }
    } else {
      // Reset al cerrar
      setAsignandoPlantillaId(null);
      setUsuarioSeleccionado(null);
      setBusquedaUsuario('');
    }
  }, [isOpen]);

  // Cerrar panel de asignación al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (asignarRef.current && !asignarRef.current.contains(event.target)) {
        setAsignandoPlantillaId(null);
        setUsuarioSeleccionado(null);
        setBusquedaUsuario('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const endpoint = userRole === 'super_admin'
        ? '/api/admin/users?limit=500&role=all'
        : '/api/notes/my-users?limit=500';
      const response = await api.get(endpoint);
      const usuariosFiltrados = (response.data.users || response.data || [])
        .filter(u => {
          const role = u.role || u.publicMetadata?.role || 'user';
          return role !== 'de_baja' && ['user', 'admin', 'super_admin'].includes(role);
        });
      setUsuarios(usuariosFiltrados);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleTogglePermanente = async (plantilla) => {
    const nuevoValor = !plantilla.esPermanente;
    // Optimistic update
    setPlantillas(prev => prev.map(p =>
      p._id === plantilla._id ? { ...p, esPermanente: nuevoValor } : p
    ));
    try {
      await plantillasService.actualizar(plantilla._id, { esPermanente: nuevoValor });
      setSuccess(nuevoValor ? 'Plantilla marcada como permanente' : 'Plantilla desactivada como permanente');
      setTimeout(() => setSuccess(''), 3000);
      if (onPlantillasChange) onPlantillasChange();
    } catch (err) {
      // Revertir si falla
      setPlantillas(prev => prev.map(p =>
        p._id === plantilla._id ? { ...p, esPermanente: !nuevoValor } : p
      ));
      setError('Error al actualizar permanencia');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAsignarRapido = (plantillaId) => {
    if (asignandoPlantillaId === plantillaId) {
      setAsignandoPlantillaId(null);
      setUsuarioSeleccionado(null);
      setBusquedaUsuario('');
    } else {
      setAsignandoPlantillaId(plantillaId);
      setUsuarioSeleccionado(null);
      setBusquedaUsuario('');
    }
  };

  const handleCrearTareaRapida = async (plantillaId) => {
    if (!usuarioSeleccionado) {
      setError('Selecciona un usuario para asignar la tarea');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCreandoTarea(true);
    setError('');
    try {
      // Fecha hoy a las 00:00 para programada
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      const fechaProgramada = `${year}-${month}-${day}T00:00:00`;
      const fechaVencimiento = `${year}-${month}-${day}T23:59:00`;

      const datos = {
        plantillaId,
        asignadoA: usuarioSeleccionado.clerk_id || usuarioSeleccionado.id,
        fechaProgramada,
        fechaVencimiento
      };

      const response = await tareasService.crear(datos);
      setSuccess(`Tarea asignada a ${usuarioSeleccionado.nombre_negocio || usuarioSeleccionado.email}`);
      setAsignandoPlantillaId(null);
      setUsuarioSeleccionado(null);
      setBusquedaUsuario('');
      setTimeout(() => setSuccess(''), 3000);

      // Notificar al componente padre para recargar tareas
      if (onTareaCreada) onTareaCreada(response.data);
      if (onPlantillasChange) onPlantillasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear tarea desde plantilla');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCreandoTarea(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const nombre = (u.nombre_negocio || u.email || u.firstName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const busqueda = busquedaUsuario.toLowerCase();
    return nombre.includes(busqueda) || email.includes(busqueda);
  });

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const [plantillasRes, categoriasRes] = await Promise.all([
        plantillasService.listar(), // Solo plantillas activas
        categoriasService.listar()
      ]);
      setPlantillas(plantillasRes.data || []);
      setCategorias(categoriasRes.data || []);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarSubtareaNueva = () => {
    if (!nuevaSubtarea.trim()) return;
    setNuevaPlantilla(prev => ({
      ...prev,
      subtareasPredefinidas: [
        ...prev.subtareasPredefinidas,
        { titulo: nuevaSubtarea.trim(), orden: prev.subtareasPredefinidas.length + 1 }
      ]
    }));
    setNuevaSubtarea('');
  };

  const handleRemoverSubtareaNueva = (index) => {
    setNuevaPlantilla(prev => ({
      ...prev,
      subtareasPredefinidas: prev.subtareasPredefinidas.filter((_, i) => i !== index)
    }));
  };

  const handleCrearPlantilla = async (e) => {
    e.preventDefault();
    if (!nuevaPlantilla.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await plantillasService.crear(nuevaPlantilla);
      setPlantillas(prev => [...prev, response.data]);
      setNuevaPlantilla({
        nombre: '',
        codigo: '',
        descripcion: '',
        tituloBase: '',
        contenidoBase: '',
        categoriaId: '',
        prioridadDefecto: 'media',
        diasParaVencimiento: 7,
        subtareasPredefinidas: []
      });
      setSuccess('Plantilla creada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
      if (onPlantillasChange) onPlantillasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleInicializarPredeterminadas = async () => {
    if (!window.confirm('¿Crear plantillas predeterminadas? Esto agregará plantillas base del sistema.')) return;

    setSaving(true);
    setError('');
    try {
      const response = await plantillasService.inicializarPredeterminadas();
      setSuccess(response.message || 'Plantillas inicializadas');
      await cargarDatos();
      if (onPlantillasChange) onPlantillasChange();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al inicializar plantillas');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicarPlantilla = async (id) => {
    setSaving(true);
    setError('');
    try {
      const response = await plantillasService.duplicar(id);
      setPlantillas(prev => [...prev, response.data]);
      setSuccess('Plantilla duplicada');
      setTimeout(() => setSuccess(''), 3000);
      if (onPlantillasChange) onPlantillasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al duplicar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleEditarPlantilla = (plantilla) => {
    setEditandoId(plantilla._id);
    // Normalizar categoriaId (puede venir como objeto poblado o como string)
    const categoriaId = typeof plantilla.categoriaId === 'object'
      ? plantilla.categoriaId?._id || ''
      : plantilla.categoriaId || '';

    setPlantillaEditando({
      ...plantilla,
      categoriaId,
      nombre: plantilla.nombre || '',
      codigo: plantilla.codigo || '',
      descripcion: plantilla.descripcion || '',
      tituloBase: plantilla.tituloBase || '',
      contenidoBase: plantilla.contenidoBase || '',
      prioridadDefecto: plantilla.prioridadDefecto || 'media',
      diasParaVencimiento: plantilla.diasParaVencimiento || 0,
      subtareasPredefinidas: plantilla.subtareasPredefinidas || []
    });
  };

  const handleGuardarEdicion = async () => {
    if (!plantillaEditando.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await plantillasService.actualizar(editandoId, plantillaEditando);
      setPlantillas(prev => prev.map(p => p._id === editandoId ? response.data : p));
      setEditandoId(null);
      setPlantillaEditando(null);
      setSuccess('Plantilla actualizada');
      setTimeout(() => setSuccess(''), 3000);
      if (onPlantillasChange) onPlantillasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelarEdicion = () => {
    setEditandoId(null);
    setPlantillaEditando(null);
  };

  const handleEliminarPlantilla = async (id) => {
    if (!window.confirm('¿Eliminar esta plantilla? Esta acción no se puede deshacer.')) return;

    setSaving(true);
    setError('');
    try {
      await plantillasService.eliminar(id);
      setPlantillas(prev => prev.filter(p => p._id !== id));
      setSuccess('Plantilla eliminada');
      setTimeout(() => setSuccess(''), 3000);
      if (onPlantillasChange) onPlantillasChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpandirPlantilla = (id) => {
    setPlantillaExpandida(plantillaExpandida === id ? null : id);
  };

  const getCategoriaColor = (categoriaId) => {
    // Si categoriaId es un objeto poblado, usar directamente su color
    if (typeof categoriaId === 'object' && categoriaId !== null) {
      return categoriaId.color || '#6B7280';
    }
    const cat = categorias.find(c => c._id === categoriaId);
    return cat?.color || '#6B7280';
  };

  const getCategoriaNombre = (categoriaId) => {
    // Si categoriaId es un objeto poblado, usar directamente su nombre
    if (typeof categoriaId === 'object' && categoriaId !== null) {
      return categoriaId.nombre || 'Sin categoría';
    }
    const cat = categorias.find(c => c._id === categoriaId);
    return cat?.nombre || 'Sin categoría';
  };

  const getCategoriaId = (categoriaId) => {
    // Normalizar categoriaId para comparaciones
    if (typeof categoriaId === 'object' && categoriaId !== null) {
      return categoriaId._id || '';
    }
    return categoriaId || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-purple-600" size={24} />
              Gestión de Plantillas
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Mensajes */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <Check size={18} />
                {success}
              </div>
            )}

            {/* Formulario nueva plantilla */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Plus size={16} />
                Nueva Plantilla
              </h3>
              <form onSubmit={handleCrearPlantilla} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={nuevaPlantilla.nombre}
                      onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: Revisión Mensual"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                    <input
                      type="text"
                      value={nuevaPlantilla.codigo}
                      onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: REV-MEN"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={nuevaPlantilla.descripcion}
                    onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Descripción de la plantilla"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Título Base para Tareas</label>
                    <input
                      type="text"
                      value={nuevaPlantilla.tituloBase}
                      onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, tituloBase: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: Revisión mensual de inventario"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                    <select
                      value={nuevaPlantilla.categoriaId}
                      onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, categoriaId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Sin categoría</option>
                      {categorias.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prioridad por Defecto</label>
                    <select
                      value={nuevaPlantilla.prioridadDefecto}
                      onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, prioridadDefecto: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {PRIORIDADES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <Clock size={12} className="inline mr-1" />
                      Días para Vencimiento
                    </label>
                    <input
                      type="number"
                      value={nuevaPlantilla.diasParaVencimiento}
                      onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, diasParaVencimiento: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      max="365"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contenido Base</label>
                  <textarea
                    value={nuevaPlantilla.contenidoBase}
                    onChange={(e) => setNuevaPlantilla(prev => ({ ...prev, contenidoBase: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                    placeholder="Contenido o instrucciones base para la tarea"
                  />
                </div>

                {/* Subtareas predefinidas */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <ListChecks size={12} className="inline mr-1" />
                    Subtareas Predefinidas
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={nuevaSubtarea}
                      onChange={(e) => setNuevaSubtarea(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarSubtareaNueva())}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Agregar subtarea..."
                    />
                    <button
                      type="button"
                      onClick={handleAgregarSubtareaNueva}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {nuevaPlantilla.subtareasPredefinidas.length > 0 && (
                    <div className="space-y-1 bg-white rounded-lg p-2 border border-gray-200">
                      {nuevaPlantilla.subtareasPredefinidas.map((st, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                          <span>{st.titulo}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoverSubtareaNueva(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleInicializarPredeterminadas}
                    disabled={saving}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Crear Predeterminadas
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !nuevaPlantilla.nombre.trim()}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                    Crear Plantilla
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de plantillas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={16} />
                Plantillas Existentes ({plantillas.length})
              </h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader className="animate-spin text-purple-600" size={32} />
                </div>
              ) : plantillas.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <FileText size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No hay plantillas creadas</p>
                  <p className="text-sm">Crea una nueva o usa las predeterminadas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plantillas.map(plantilla => (
                    <div
                      key={plantilla._id}
                      className={`rounded-lg border transition-all ${
                        editandoId === plantilla._id
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {editandoId === plantilla._id ? (
                        // Modo edición completo
                        <div className="p-4 space-y-3">
                          {/* Nombre y Código */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                              <input
                                type="text"
                                value={plantillaEditando.nombre}
                                onChange={(e) => setPlantillaEditando(prev => ({ ...prev, nombre: e.target.value }))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                placeholder="Nombre"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                              <input
                                type="text"
                                value={plantillaEditando.codigo || ''}
                                onChange={(e) => setPlantillaEditando(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                placeholder="Código"
                              />
                            </div>
                          </div>

                          {/* Descripción */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                            <input
                              type="text"
                              value={plantillaEditando.descripcion || ''}
                              onChange={(e) => setPlantillaEditando(prev => ({ ...prev, descripcion: e.target.value }))}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                              placeholder="Descripción"
                            />
                          </div>

                          {/* Título Base */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Título Base para Tareas</label>
                            <input
                              type="text"
                              value={plantillaEditando.tituloBase || ''}
                              onChange={(e) => setPlantillaEditando(prev => ({ ...prev, tituloBase: e.target.value }))}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                              placeholder="Ej: Revisión mensual de inventario"
                            />
                          </div>

                          {/* Categoría y Prioridad */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                              <select
                                value={plantillaEditando.categoriaId || ''}
                                onChange={(e) => setPlantillaEditando(prev => ({ ...prev, categoriaId: e.target.value }))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">Sin categoría</option>
                                {categorias.map(cat => (
                                  <option key={cat._id} value={cat._id}>{cat.nombre}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Prioridad por Defecto</label>
                              <select
                                value={plantillaEditando.prioridadDefecto || 'media'}
                                onChange={(e) => setPlantillaEditando(prev => ({ ...prev, prioridadDefecto: e.target.value }))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                              >
                                {PRIORIDADES.map(p => (
                                  <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Días para Vencimiento */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                <Clock size={12} className="inline mr-1" />
                                Días para Vencimiento
                              </label>
                              <input
                                type="number"
                                value={plantillaEditando.diasParaVencimiento || 0}
                                onChange={(e) => setPlantillaEditando(prev => ({ ...prev, diasParaVencimiento: parseInt(e.target.value) || 0 }))}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                min="0"
                                max="365"
                              />
                            </div>
                          </div>

                          {/* Contenido Base */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Contenido Base</label>
                            <textarea
                              value={plantillaEditando.contenidoBase || ''}
                              onChange={(e) => setPlantillaEditando(prev => ({ ...prev, contenidoBase: e.target.value }))}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                              rows={2}
                              placeholder="Contenido o instrucciones base para la tarea"
                            />
                          </div>

                          {/* Subtareas existentes (solo visualización) */}
                          {plantillaEditando.subtareasPredefinidas?.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                <ListChecks size={12} className="inline mr-1" />
                                Subtareas Predefinidas ({plantillaEditando.subtareasPredefinidas.length})
                              </label>
                              <div className="space-y-1 bg-white rounded-lg p-2 border border-gray-200">
                                {plantillaEditando.subtareasPredefinidas.map((st, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded">
                                    <span>{st.titulo}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Botones de acción */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={handleCancelarEdicion}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleGuardarEdicion}
                              disabled={saving}
                              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                            >
                              {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Modo visualización
                        <>
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer"
                            onClick={() => toggleExpandirPlantilla(plantilla._id)}
                          >
                            <div
                              className="w-2 h-10 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCategoriaColor(plantilla.categoriaId) }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-800">{plantilla.nombre}</span>
                                {plantilla.esPermanente && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <RefreshCw size={9} />
                                    Permanente
                                  </span>
                                )}
                                {plantilla.codigo && (
                                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                    {plantilla.codigo}
                                  </span>
                                )}
                                {plantilla.categoriaId && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Tag size={10} />
                                    {getCategoriaNombre(plantilla.categoriaId)}
                                  </span>
                                )}
                                {!plantilla.activo && (
                                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                    Inactiva
                                  </span>
                                )}
                              </div>
                              {plantilla.descripcion && (
                                <p className="text-xs text-gray-500 truncate">{plantilla.descripcion}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              {/* Botón Permanente */}
                              {['admin', 'super_admin'].includes(userRole) && (
                                <button
                                  onClick={() => handleTogglePermanente(plantilla)}
                                  className={`p-1.5 rounded transition-colors ${
                                    plantilla.esPermanente
                                      ? 'bg-green-100 text-green-700'
                                      : 'text-gray-400 hover:bg-gray-100'
                                  }`}
                                  title={plantilla.esPermanente ? 'Desactivar permanencia' : 'Marcar como permanente'}
                                >
                                  <RefreshCw size={15} />
                                </button>
                              )}
                              {/* Botón Asignar Rápido */}
                              {['admin', 'super_admin'].includes(userRole) && (
                                <button
                                  onClick={() => handleAsignarRapido(plantilla._id)}
                                  className={`p-1.5 rounded transition-colors ${
                                    asignandoPlantillaId === plantilla._id
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'text-amber-500 hover:bg-amber-50'
                                  }`}
                                  title="Asignar Rápido"
                                >
                                  <Zap size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDuplicarPlantilla(plantilla._id)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                title="Duplicar"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => handleEditarPlantilla(plantilla)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleEliminarPlantilla(plantilla._id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                              {plantillaExpandida === plantilla._id ? (
                                <ChevronUp size={18} className="text-gray-400" />
                              ) : (
                                <ChevronDown size={18} className="text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Panel de Asignación Rápida */}
                          {asignandoPlantillaId === plantilla._id && (
                            <div
                              ref={asignarRef}
                              className="px-4 pb-3 border-t border-amber-200 bg-amber-50"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="py-3 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                                  <Zap size={14} />
                                  Asignación Rápida — {plantilla.nombre}
                                </div>

                                {/* Buscador de usuarios */}
                                <div className="relative">
                                  <div className="flex items-center border border-amber-300 rounded-lg bg-white overflow-hidden">
                                    <Search size={14} className="ml-2 text-gray-400" />
                                    <input
                                      type="text"
                                      value={busquedaUsuario}
                                      onChange={(e) => setBusquedaUsuario(e.target.value)}
                                      className="flex-1 px-2 py-2 text-sm border-0 focus:ring-0 focus:outline-none"
                                      placeholder="Buscar usuario..."
                                      autoFocus
                                    />
                                  </div>

                                  {/* Lista de usuarios */}
                                  {loadingUsuarios ? (
                                    <div className="flex justify-center py-3">
                                      <Loader size={18} className="animate-spin text-amber-600" />
                                    </div>
                                  ) : (
                                    <div className="mt-1 max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                                      {usuariosFiltrados.length === 0 ? (
                                        <div className="text-center py-2 text-xs text-gray-500">No se encontraron usuarios</div>
                                      ) : (
                                        usuariosFiltrados.map(u => {
                                          const uid = u.clerk_id || u.id;
                                          const isSelected = usuarioSeleccionado && (usuarioSeleccionado.clerk_id || usuarioSeleccionado.id) === uid;
                                          return (
                                            <button
                                              key={uid}
                                              type="button"
                                              onClick={() => setUsuarioSeleccionado(u)}
                                              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                                                isSelected
                                                  ? 'bg-amber-100 text-amber-800 font-medium'
                                                  : 'hover:bg-gray-50 text-gray-700'
                                              }`}
                                            >
                                              <UserPlus size={12} className={isSelected ? 'text-amber-600' : 'text-gray-400'} />
                                              <span className="truncate">{u.nombre_negocio || u.firstName || u.email}</span>
                                              <span className="text-xs text-gray-400 ml-auto">{u.role || 'user'}</span>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Usuario seleccionado + botón confirmar */}
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-500">
                                    {usuarioSeleccionado ? (
                                      <span className="text-amber-700 font-medium">
                                        <UserPlus size={12} className="inline mr-1" />
                                        {usuarioSeleccionado.nombre_negocio || usuarioSeleccionado.email}
                                      </span>
                                    ) : (
                                      'Selecciona un usuario'
                                    )}
                                    <span className="ml-2 text-gray-400">• Vence hoy 11:59 PM</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAsignandoPlantillaId(null);
                                        setUsuarioSeleccionado(null);
                                        setBusquedaUsuario('');
                                      }}
                                      className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCrearTareaRapida(plantilla._id)}
                                      disabled={!usuarioSeleccionado || creandoTarea}
                                      className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1"
                                    >
                                      {creandoTarea ? (
                                        <Loader size={12} className="animate-spin" />
                                      ) : (
                                        <Zap size={12} />
                                      )}
                                      Asignar Ahora
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Detalles expandidos */}
                          {plantillaExpandida === plantilla._id && (
                            <div className="px-4 pb-3 pt-0 border-t border-gray-100 space-y-2 text-sm">
                              {plantilla.tituloBase && (
                                <div>
                                  <span className="text-gray-500">Título base:</span>{' '}
                                  <span className="text-gray-700">{plantilla.tituloBase}</span>
                                </div>
                              )}
                              <div className="flex gap-4">
                                <div>
                                  <span className="text-gray-500">Prioridad:</span>{' '}
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${PRIORIDADES.find(p => p.value === plantilla.prioridadDefecto)?.color || ''}`}>
                                    {PRIORIDADES.find(p => p.value === plantilla.prioridadDefecto)?.label || 'Media'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Vencimiento:</span>{' '}
                                  <span className="text-gray-700">{plantilla.diasParaVencimiento || 0} días</span>
                                </div>
                              </div>
                              {plantilla.contenidoBase && (
                                <div>
                                  <span className="text-gray-500">Contenido:</span>
                                  <p className="text-gray-700 bg-gray-50 p-2 rounded mt-1">{plantilla.contenidoBase}</p>
                                </div>
                              )}
                              {plantilla.subtareasPredefinidas?.length > 0 && (
                                <div>
                                  <span className="text-gray-500">Subtareas ({plantilla.subtareasPredefinidas.length}):</span>
                                  <div className="mt-1 space-y-1">
                                    {plantilla.subtareasPredefinidas.map((st, i) => (
                                      <div key={i} className="flex items-center gap-2 text-gray-700 bg-gray-50 px-2 py-1 rounded">
                                        <ListChecks size={12} className="text-gray-400" />
                                        {st.titulo}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="text-xs text-gray-400 pt-1">
                                Usado {plantilla.vecesUsada || 0} veces
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
