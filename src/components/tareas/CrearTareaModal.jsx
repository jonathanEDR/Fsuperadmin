import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Loader,
  Flag,
  Calendar,
  Tag,
  FolderOpen,
  User,
  FileText,
  CheckSquare,
  Trash2,
  LayoutTemplate,
  ChevronDown,
  Search,
  Building2
} from 'lucide-react';
import api from '../../services/api';
import { getLocalDateTimeString } from '../../utils/fechaHoraUtils';
import { getSucursalesActivas } from '../../services/sucursalService';

const PRIORIDADES = [
  { value: 'urgente', label: 'Urgente', color: 'text-red-600' },
  { value: 'alta', label: 'Alta', color: 'text-orange-600' },
  { value: 'media', label: 'Media', color: 'text-yellow-600' },
  { value: 'baja', label: 'Baja', color: 'text-green-600' }
];

/**
 * Modal para crear nueva tarea
 */
export default function CrearTareaModal({
  isOpen,
  onClose,
  onCrear,
  categorias = [],
  etiquetas = [],
  plantillas = [],
  userRole
}) {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  
  // Estados para el selector de usuarios con búsqueda
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [showUsuariosDropdown, setShowUsuariosDropdown] = useState(false);
  const usuariosDropdownRef = useRef(null);

  // Estados para sucursales
  const [sucursales, setSucursales] = useState([]);
  const [modoAsignacion, setModoAsignacion] = useState('usuario'); // 'usuario' | 'sucursal'

  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    prioridad: 'media',
    categoriaId: '',
    etiquetas: [],
    fechaVencimiento: '',
    fechaProgramada: '',
    asignadoA: '',
    sucursalId: '',
    requiereRevision: true,
    subtareas: []
  });

  // Estado para nueva subtarea
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  // Estado para mostrar selector de plantillas
  const [showPlantillas, setShowPlantillas] = useState(false);

  // Cargar usuarios y sucursales si es admin
  useEffect(() => {
    if (isOpen && ['admin', 'super_admin'].includes(userRole)) {
      cargarUsuarios();
      cargarSucursales();
    }
  }, [isOpen, userRole]);

  // Reset form al abrir - Inicializar con fecha y hora actual (hora Lima)
  useEffect(() => {
    if (isOpen) {
      const fechaHoraHoy = getLocalDateTimeString(false); // Formato YYYY-MM-DDTHH:mm
      setFormData({
        titulo: '',
        contenido: '',
        prioridad: 'media',
        categoriaId: '',
        etiquetas: [],
        fechaVencimiento: fechaHoraHoy,
        fechaProgramada: fechaHoraHoy,
        asignadoA: '',
        sucursalId: '',
        requiereRevision: true,
        subtareas: []
      });
      setNuevaSubtarea('');
      setShowPlantillas(false);
      setModoAsignacion('usuario');
    }
  }, [isOpen]);

  // Aplicar plantilla seleccionada
  const handleAplicarPlantilla = (plantilla) => {
    // Calcular fecha de vencimiento basada en días
    let fechaVencimiento = '';
    if (plantilla.diasParaVencimiento) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + plantilla.diasParaVencimiento);
      fechaVencimiento = fecha.toISOString().split('T')[0];
    }

    setFormData(prev => ({
      ...prev,
      titulo: plantilla.tituloBase || '',
      contenido: plantilla.contenidoBase || '',
      prioridad: plantilla.prioridadDefecto || 'media',
      categoriaId: plantilla.categoriaId || '',
      fechaVencimiento: fechaVencimiento,
      etiquetas: plantilla.etiquetasPredefinidas || [],
      subtareas: (plantilla.subtareasPredefinidas || []).map(st => ({
        titulo: st.titulo,
        descripcion: st.descripcion || ''
      }))
    }));
    setShowPlantillas(false);
  };

  const cargarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      // Usar límite alto para obtener todos los usuarios activos
      const endpoint = userRole === 'super_admin'
        ? '/api/admin/users?limit=500&role=all'
        : '/api/notes/my-users?limit=500';
      const response = await api.get(endpoint);
      // Filtrar usuarios: excluir rol 'de_baja' y solo mostrar user, admin, super_admin
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

  const cargarSucursales = async () => {
    try {
      const response = await getSucursalesActivas();
      setSucursales(response.sucursales || response || []);
    } catch (err) {
      console.error('Error cargando sucursales:', err);
    }
  };

  // Filtrar usuarios por búsqueda
  const usuariosFiltrados = usuarios.filter(u => {
    const nombre = (u.nombre_negocio || u.email || u.firstName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const busqueda = busquedaUsuario.toLowerCase();
    return nombre.includes(busqueda) || email.includes(busqueda);
  });

  // Obtener nombre del usuario seleccionado
  const getUsuarioSeleccionado = () => {
    if (!formData.asignadoA) return null;
    return usuarios.find(u => (u.clerk_id || u.id) === formData.asignadoA);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (usuariosDropdownRef.current && !usuariosDropdownRef.current.contains(event.target)) {
        setShowUsuariosDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEtiquetaToggle = (etiquetaId) => {
    setFormData(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(etiquetaId)
        ? prev.etiquetas.filter(id => id !== etiquetaId)
        : [...prev.etiquetas, etiquetaId]
    }));
  };

  const handleAgregarSubtarea = () => {
    if (!nuevaSubtarea.trim()) return;
    setFormData(prev => ({
      ...prev,
      subtareas: [...prev.subtareas, { titulo: nuevaSubtarea.trim(), descripcion: '' }]
    }));
    setNuevaSubtarea('');
  };

  const handleEliminarSubtarea = (index) => {
    setFormData(prev => ({
      ...prev,
      subtareas: prev.subtareas.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para enviar
      const datosEnviar = {
        ...formData,
        etiquetas: formData.etiquetas.length > 0 ? formData.etiquetas : undefined,
        categoriaId: formData.categoriaId || undefined,
        fechaVencimiento: formData.fechaVencimiento || undefined,
        fechaProgramada: formData.fechaProgramada || undefined,
        asignadoA: modoAsignacion === 'usuario' ? (formData.asignadoA || undefined) : undefined,
        sucursalId: modoAsignacion === 'sucursal' ? (formData.sucursalId || undefined) : undefined,
        subtareas: formData.subtareas.length > 0 ? formData.subtareas : undefined
      };

      await onCrear(datosEnviar);
    } finally {
      setLoading(false);
    }
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
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Plus className="text-blue-600" size={24} />
              Nueva Tarea
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Selector de Plantillas */}
            {plantillas.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <button
                  type="button"
                  onClick={() => setShowPlantillas(!showPlantillas)}
                  className="w-full flex items-center justify-between text-sm font-medium text-purple-700"
                >
                  <span className="flex items-center gap-2">
                    <LayoutTemplate size={16} />
                    Usar Plantilla
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${showPlantillas ? 'rotate-180' : ''}`} />
                </button>

                {showPlantillas && (
                  <div className="mt-3 space-y-2">
                    {plantillas.filter(p => p.activa !== false).map(plantilla => (
                      <button
                        key={plantilla._id}
                        type="button"
                        onClick={() => handleAplicarPlantilla(plantilla)}
                        className="w-full text-left px-3 py-2 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-6 rounded-full"
                            style={{
                              backgroundColor: categorias.find(c => c._id === plantilla.categoriaId)?.color || '#6B7280'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{plantilla.nombre}</p>
                            {plantilla.descripcion && (
                              <p className="text-xs text-gray-500 truncate">{plantilla.descripcion}</p>
                            )}
                          </div>
                          {plantilla.subtareasPredefinidas?.length > 0 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {plantilla.subtareasPredefinidas.length} subtareas
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={16} className="inline mr-1" />
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título de la tarea"
                required
              />
            </div>

            {/* Contenido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="contenido"
                value={formData.contenido}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Descripción detallada de la tarea..."
              />
            </div>

            {/* Prioridad y Categoría */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Flag size={16} className="inline mr-1" />
                  Prioridad
                </label>
                <select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PRIORIDADES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FolderOpen size={16} className="inline mr-1" />
                  Categoría
                </label>
                <select
                  name="categoriaId"
                  value={formData.categoriaId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fechas con hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Fecha y Hora Programada
                </label>
                <input
                  type="datetime-local"
                  name="fechaProgramada"
                  value={formData.fechaProgramada}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1 text-red-500" />
                  Fecha y Hora de Vencimiento
                </label>
                <input
                  type="datetime-local"
                  name="fechaVencimiento"
                  value={formData.fechaVencimiento}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Asignar a usuario o sucursal (solo admin) */}
            {['admin', 'super_admin'].includes(userRole) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asignar a
                </label>
                
                {/* Toggle: Usuario / Sucursal */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setModoAsignacion('usuario');
                      setFormData(prev => ({ ...prev, sucursalId: '' }));
                    }}
                    className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      modoAsignacion === 'usuario'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <User size={14} />
                    Usuario
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModoAsignacion('sucursal');
                      setFormData(prev => ({ ...prev, asignadoA: '' }));
                    }}
                    className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      modoAsignacion === 'sucursal'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 size={14} />
                    Sucursal
                  </button>
                </div>

                {/* Selector de Usuario */}
                {modoAsignacion === 'usuario' && (
                  <div ref={usuariosDropdownRef} className="relative">
                    <div 
                      className="relative"
                      onClick={() => !loadingUsuarios && setShowUsuariosDropdown(true)}
                    >
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white cursor-pointer flex items-center justify-between">
                        {showUsuariosDropdown ? (
                          <input
                            type="text"
                            value={busquedaUsuario}
                            onChange={(e) => setBusquedaUsuario(e.target.value)}
                            placeholder="Buscar usuario..."
                            className="w-full outline-none bg-transparent"
                            autoFocus
                          />
                        ) : (
                          <span className={formData.asignadoA ? 'text-gray-900' : 'text-gray-500'}>
                            {getUsuarioSeleccionado() 
                              ? (getUsuarioSeleccionado().nombre_negocio || getUsuarioSeleccionado().email)
                              : 'Sin asignar (para mí)'}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          {loadingUsuarios ? (
                            <Loader size={16} className="animate-spin text-gray-400" />
                          ) : (
                            <>
                              {formData.asignadoA && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData(prev => ({ ...prev, asignadoA: '' }));
                                    setBusquedaUsuario('');
                                  }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showUsuariosDropdown ? 'rotate-180' : ''}`} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dropdown de usuarios */}
                    {showUsuariosDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={busquedaUsuario}
                              onChange={(e) => setBusquedaUsuario(e.target.value)}
                              placeholder="Buscar por nombre o email..."
                              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, asignadoA: '' }));
                            setBusquedaUsuario('');
                            setShowUsuariosDropdown(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center gap-2 ${
                            !formData.asignadoA ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <User size={16} className="text-gray-400" />
                          <span>Sin asignar (para mí)</span>
                        </button>

                        {usuariosFiltrados.length > 0 ? (
                          usuariosFiltrados.map(u => {
                            const userId = u.clerk_id || u.id;
                            const isSelected = formData.asignadoA === userId;
                            const role = u.role || u.publicMetadata?.role || 'user';
                            
                            return (
                              <button
                                key={userId}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, asignadoA: userId }));
                                  setBusquedaUsuario('');
                                  setShowUsuariosDropdown(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center justify-between ${
                                  isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                    {(u.nombre_negocio || u.email || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{u.nombre_negocio || u.firstName || 'Sin nombre'}</span>
                                    <span className="text-xs text-gray-500">{u.email}</span>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                                  role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Usuario'}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            No se encontraron usuarios
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Selector de Sucursal */}
                {modoAsignacion === 'sucursal' && (
                  <div>
                    <select
                      name="sucursalId"
                      value={formData.sucursalId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      <option value="">Seleccionar sucursal...</option>
                      {sucursales.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.nombre} {s.ubicacion ? `- ${s.ubicacion}` : ''}
                        </option>
                      ))}
                    </select>
                    {formData.sucursalId && (
                      <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                        <Building2 size={12} />
                        Se creará una tarea para cada trabajador asignado a esta sucursal
                      </p>
                    )}
                    {sucursales.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        No hay sucursales activas
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Etiquetas */}
            {etiquetas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag size={16} className="inline mr-1" />
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {etiquetas.map(etiqueta => (
                    <button
                      key={etiqueta._id}
                      type="button"
                      onClick={() => handleEtiquetaToggle(etiqueta._id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        formData.etiquetas.includes(etiqueta._id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                      style={formData.etiquetas.includes(etiqueta._id) && etiqueta.color ? {
                        backgroundColor: `${etiqueta.color}20`,
                        borderColor: etiqueta.color,
                        color: etiqueta.color
                      } : {}}
                    >
                      {etiqueta.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subtareas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckSquare size={16} className="inline mr-1" />
                Subtareas (Checklist)
              </label>

              {/* Lista de subtareas */}
              {formData.subtareas.length > 0 && (
                <div className="mb-3 space-y-2">
                  {formData.subtareas.map((subtarea, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg"
                    >
                      <CheckSquare size={16} className="text-gray-400" />
                      <span className="flex-1 text-sm">{subtarea.titulo}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarSubtarea(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar subtarea */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaSubtarea}
                  onChange={(e) => setNuevaSubtarea(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarSubtarea())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Agregar subtarea..."
                />
                <button
                  type="button"
                  onClick={handleAgregarSubtarea}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Requiere revisión */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="requiereRevision"
                name="requiereRevision"
                checked={formData.requiereRevision}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="requiereRevision" className="text-sm text-gray-700">
                Requiere revisión de administrador antes de completar
              </label>
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.titulo.trim()}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Crear Tarea
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
