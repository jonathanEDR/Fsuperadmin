/**
 * ModalProducirRecetaNuevo.jsx
 * 
 * Modal de Producción Flexible para Recetas
 * 
 * Características:
 * - ✅ Rendimiento libre (cuántas unidades se producirán)
 * - ✅ Ingredientes con cantidades editables manualmente
 * - ✅ Mostrar stock disponible en tiempo real
 * - ✅ Validación de stock (suficiente/insuficiente)
 * - ✅ Agregar ingredientes extra
 * - ✅ Agregar recetas anidadas extra
 * - ✅ Operador responsable
 * - ✅ Fecha y hora de producción
 * - ✅ Consumir ingredientes automáticamente
 * - ✅ Observaciones
 * 
 * Creado: Febrero 2026
 */

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { ingredienteService } from '../../../services/ingredienteService';
import { recetaService } from '../../../services/recetaService';
import { getLocalDateTimeString } from '../../../utils/fechaHoraUtils';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';
import { getFullApiUrl, safeFetch } from '../../../config/api';
import { X, ClipboardList, Loader2, AlertCircle, Package, Carrot, Lightbulb, Calendar, User, Trash2, Check, AlertTriangle, Search, Sparkles, Plus } from 'lucide-react';
import '../../../styles/modal-protection.css';

const ModalProducirRecetaNuevo = ({ isOpen, onClose, receta, onSuccess }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isSuperAdmin, canViewPrices } = useQuickPermissions();
  
  // ============= ESTADOS PRINCIPALES =============
  
  // Rendimiento de la producción
  const [rendimiento, setRendimiento] = useState({
    cantidad: 1,
    unidadMedida: 'unidad'
  });
  
  // Lista de ingredientes/recetas a usar (editables)
  const [ingredientesProduccion, setIngredientesProduccion] = useState([]);
  
  // Datos disponibles del inventario
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  
  // Información del operador
  const [formData, setFormData] = useState({
    operador: '',
    fechaProduccion: '',
    consumirIngredientes: true,
    observaciones: ''
  });
  
  // Estados de UI
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingRecursos, setLoadingRecursos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para agregar ingredientes/recetas extras
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [tipoBuscador, setTipoBuscador] = useState('ingrediente'); // 'ingrediente' o 'receta'
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [cantidadNuevo, setCantidadNuevo] = useState('');
  const [unidadNuevo, setUnidadNuevo] = useState('gr');

  // ============= EFECTOS =============
  
  useEffect(() => {
    if (isOpen && receta) {
      resetearFormulario();
      cargarDatos();
    }
  }, [isOpen, receta]);

  // ============= FUNCIONES DE CARGA =============
  
  const resetearFormulario = () => {
    // Establecer rendimiento inicial desde la receta
    const cantidadReceta = receta?.rendimiento?.cantidad || 1;
    const unidadReceta = receta?.rendimiento?.unidadMedida || 'unidad';
    
    setRendimiento({
      cantidad: cantidadReceta,
      unidadMedida: unidadReceta
    });
    
    // Autocompletar operador
    const nombreUsuario = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || '';
    
    setFormData({
      operador: isSuperAdmin ? '' : nombreUsuario,
      fechaProduccion: getLocalDateTimeString(),
      consumirIngredientes: true,
      observaciones: ''
    });
    
    setError('');
    setMostrarBuscador(false);
    setTerminoBusqueda('');
    setItemSeleccionado(null);
    setCantidadNuevo('');
  };

  const cargarDatos = async () => {
    try {
      setLoadingRecursos(true);
      
      // Cargar ingredientes, recetas y usuarios en paralelo
      const [ingredientesResponse, recetasResponse] = await Promise.all([
        ingredienteService.obtenerIngredientes({ activo: true }),
        recetaService.obtenerRecetas({ activo: true })
      ]);
      
      const ingredientesData = ingredientesResponse.data || [];
      const recetasData = recetasResponse.data || [];
      
      setIngredientesDisponibles(ingredientesData);
      setRecetasDisponibles(recetasData);
      
      // Inicializar ingredientes de producción desde la receta
      if (receta && receta.ingredientes) {
        const ingredientesIniciales = receta.ingredientes.map((item) => {
          const tipoItem = item.tipo || 'ingrediente';
          
          if (tipoItem === 'receta') {
            // Es una receta anidada
            const recetaId = typeof item.receta === 'object' ? item.receta._id : item.receta;
            const recetaInfo = recetasData.find(r => r._id === recetaId);
            const cantidadProducida = recetaInfo?.inventario?.cantidadProducida || 0;
            const cantidadUtilizada = recetaInfo?.inventario?.cantidadUtilizada || 0;
            const disponible = cantidadProducida - cantidadUtilizada;
            
            return {
              id: recetaId,
              tipo: 'receta',
              nombre: item.receta?.nombre || recetaInfo?.nombre || 'Receta no encontrada',
              cantidad: item.cantidad || 0,
              unidadMedida: recetaInfo?.rendimiento?.unidadMedida || item.unidadMedida || 'unidad',
              disponible: disponible,
              encontrado: !!recetaInfo,
              esOriginal: true // Marca que viene de la receta original
            };
          } else {
            // Es un ingrediente
            const ingredienteId = typeof item.ingrediente === 'object' ? item.ingrediente._id : item.ingrediente;
            const ingredienteInfo = ingredientesData.find(i => i._id === ingredienteId);
            const cantidadTotal = ingredienteInfo?.cantidad || 0;
            const cantidadProcesada = ingredienteInfo?.procesado || 0;
            const disponible = cantidadTotal - cantidadProcesada;
            
            return {
              id: ingredienteId,
              tipo: 'ingrediente',
              nombre: item.ingrediente?.nombre || ingredienteInfo?.nombre || 'Ingrediente no encontrado',
              cantidad: item.cantidad || 0,
              unidadMedida: ingredienteInfo?.unidadMedida || item.unidadMedida || 'unidad',
              disponible: disponible,
              encontrado: !!ingredienteInfo,
              esOriginal: true
            };
          }
        });
        
        setIngredientesProduccion(ingredientesIniciales);
      }
      
      // Cargar usuarios si es super_admin
      if (isSuperAdmin) {
        cargarUsuarios();
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setLoadingRecursos(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const token = await getToken();
      const response = await safeFetch(getFullApiUrl('/admin/users?limit=100&excludeInactive=true'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.users || []);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // ============= MANEJADORES DE CAMBIOS =============
  
  const handleRendimientoChange = (valor) => {
    const cantidad = parseFloat(valor) || 0;
    setRendimiento(prev => ({
      ...prev,
      cantidad: cantidad
    }));
  };

  const handleCantidadIngredienteChange = (index, valor) => {
    const nuevosIngredientes = [...ingredientesProduccion];
    nuevosIngredientes[index].cantidad = parseFloat(valor) || 0;
    setIngredientesProduccion(nuevosIngredientes);
  };

  const handleEliminarIngrediente = (index) => {
    const nuevosIngredientes = ingredientesProduccion.filter((_, i) => i !== index);
    setIngredientesProduccion(nuevosIngredientes);
  };

  const handleFormDataChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // ============= AGREGAR INGREDIENTES/RECETAS EXTRAS =============
  
  const abrirBuscador = (tipo) => {
    setTipoBuscador(tipo);
    setMostrarBuscador(true);
    setTerminoBusqueda('');
    setItemSeleccionado(null);
    setCantidadNuevo('');
    setUnidadNuevo(tipo === 'receta' ? 'unidad' : 'gr');
  };

  const cerrarBuscador = () => {
    setMostrarBuscador(false);
    setTerminoBusqueda('');
    setItemSeleccionado(null);
    setCantidadNuevo('');
  };

  const getItemsFiltrados = () => {
    const termino = terminoBusqueda.toLowerCase();
    const idsYaAgregados = ingredientesProduccion.map(i => i.id);
    
    if (tipoBuscador === 'ingrediente') {
      return ingredientesDisponibles
        .filter(ing => 
          !idsYaAgregados.includes(ing._id) &&
          ing.nombre.toLowerCase().includes(termino)
        )
        .slice(0, 5);
    } else {
      // Excluir la receta actual para evitar ciclos
      return recetasDisponibles
        .filter(rec => 
          rec._id !== receta?._id &&
          !idsYaAgregados.includes(rec._id) &&
          rec.nombre.toLowerCase().includes(termino)
        )
        .slice(0, 5);
    }
  };

  const seleccionarItem = (item) => {
    setItemSeleccionado(item);
    setTerminoBusqueda(item.nombre);
    
    // Sugerir unidad de medida
    if (tipoBuscador === 'ingrediente') {
      setUnidadNuevo(item.unidadMedida || 'gr');
    } else {
      setUnidadNuevo(item.rendimiento?.unidadMedida || 'unidad');
    }
  };

  const agregarItemExtra = () => {
    if (!itemSeleccionado || !cantidadNuevo || parseFloat(cantidadNuevo) <= 0) {
      return;
    }

    let disponible = 0;
    
    if (tipoBuscador === 'ingrediente') {
      const cantidadTotal = itemSeleccionado.cantidad || 0;
      const cantidadProcesada = itemSeleccionado.procesado || 0;
      disponible = cantidadTotal - cantidadProcesada;
    } else {
      const cantidadProducida = itemSeleccionado.inventario?.cantidadProducida || 0;
      const cantidadUtilizada = itemSeleccionado.inventario?.cantidadUtilizada || 0;
      disponible = cantidadProducida - cantidadUtilizada;
    }

    const nuevoItem = {
      id: itemSeleccionado._id,
      tipo: tipoBuscador,
      nombre: itemSeleccionado.nombre,
      cantidad: parseFloat(cantidadNuevo),
      unidadMedida: unidadNuevo,
      disponible: disponible,
      encontrado: true,
      esOriginal: false, // Marca que es agregado extra
      esExtra: true
    };

    setIngredientesProduccion(prev => [...prev, nuevoItem]);
    cerrarBuscador();
  };

  // ============= VALIDACIONES =============
  
  const validarStock = (item) => {
    return item.disponible >= item.cantidad;
  };

  const hayErroresStock = () => {
    return ingredientesProduccion.some(item => !validarStock(item));
  };

  const getIngredientesConError = () => {
    return ingredientesProduccion.filter(item => !validarStock(item));
  };

  // ============= SUBMIT =============
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (rendimiento.cantidad <= 0) {
      setError('El rendimiento debe ser mayor a 0');
      return;
    }

    if (ingredientesProduccion.length === 0) {
      setError('Debe haber al menos un ingrediente o receta para producir');
      return;
    }

    if (!formData.operador?.trim()) {
      setError('El operador responsable es obligatorio');
      return;
    }

    // Validar stock si se van a consumir
    if (formData.consumirIngredientes && hayErroresStock()) {
      const errores = getIngredientesConError();
      const listaErrores = errores.map(e => 
        `${e.nombre} (necesario: ${e.cantidad}, disponible: ${e.disponible})`
      ).join(', ');
      setError(`Stock insuficiente: ${listaErrores}`);
      return;
    }

    try {
      setEnviando(true);
      setError('');

      // Preparar payload para el backend
      // NOTA: El backend actual solo procesa ingredientes, no recetas anidadas
      // Filtramos solo ingredientes para el consumo
      const soloIngredientes = ingredientesProduccion.filter(item => item.tipo === 'ingrediente');
      const recetasAnidadas = ingredientesProduccion.filter(item => item.tipo === 'receta');
      
      const payload = {
        // Ingredientes ajustados manualmente (solo ingredientes, no recetas)
        ingredientesAjustados: soloIngredientes.map(item => ({
          ingredienteId: item.id,
          cantidadPlaneada: item.cantidad,
          cantidadReal: item.cantidad,
          motivo: item.esExtra ? 'Agregado extra en producción' : ''
        })),
        
        // Recetas anidadas que se usarán (para registro, no procesadas aún por el backend)
        recetasAnidadas: recetasAnidadas.map(item => ({
          recetaId: item.id,
          nombre: item.nombre,
          cantidadUsada: item.cantidad,
          unidadMedida: item.unidadMedida
        })),
        
        // Rendimiento real
        rendimientoReal: {
          planeado: receta?.rendimiento?.cantidad || 1,
          cantidad: rendimiento.cantidad,
          unidadMedida: rendimiento.unidadMedida,
          motivo: ''
        },
        
        // Información del operador
        motivo: `Producción de receta: ${receta?.nombre}`,
        observaciones: formData.observaciones?.trim() || '',
        operador: formData.operador?.trim(),
        fechaProduccion: formData.fechaProduccion,
        consumirIngredientes: formData.consumirIngredientes
      };

      console.log('📦 ModalProducirRecetaNuevo - Enviando:', payload);

      // Llamar al servicio de producción ajustable
      await recetaService.producirRecetaAjustable(receta._id, payload);

      // Éxito
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Error al producir receta:', error);
      setError(error.response?.data?.message || error.message || 'Error al producir la receta');
    } finally {
      setEnviando(false);
    }
  };

  // ============= UNIDADES DE MEDIDA =============
  
  const unidadesMedida = [
    { value: 'kg', label: 'kg' },
    { value: 'gr', label: 'gr' },
    { value: 'lt', label: 'lt' },
    { value: 'ml', label: 'ml' },
    { value: 'unidad', label: 'un' },
    { value: 'pieza', label: 'pz' }
  ];

  // ============= RENDER =============
  
  if (!isOpen) return null;

  if (!receta) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md border border-gray-100 shadow-xl">
          <p className="text-red-600 flex items-center gap-2"><AlertCircle size={16} /> Error: No se ha seleccionado una receta</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-medium">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="modal-protection bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* ============= HEADER ============= */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
              <ClipboardList size={20} className="text-purple-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Producir Receta
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {receta.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors flex-shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* ============= ERROR ============= */}
        {error && (
          <div className="mx-2 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-red-600 break-words">{error}</p>
          </div>
        )}

        {/* ============= BODY ============= */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            
            {loadingRecursos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin text-purple-600" />
                <span className="ml-3 text-gray-600">Cargando datos...</span>
              </div>
            ) : (
              <>
                {/* ============= SECCIÓN: RENDIMIENTO ============= */}
                <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <Package size={18} className="text-indigo-600" />
                    <span className="text-sm sm:text-base">Rendimiento de esta Producción</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad a Producir *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={rendimiento.cantidad}
                        onChange={(e) => handleRendimientoChange(e.target.value)}
                        className="w-full p-3 text-lg font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        disabled={enviando}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad de Medida
                      </label>
                      <select
                        value={rendimiento.unidadMedida}
                        onChange={(e) => setRendimiento(prev => ({ ...prev, unidadMedida: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={enviando}
                      >
                        <option value="unidad">Unidades</option>
                        <option value="kg">Kilogramos</option>
                        <option value="gr">Gramos</option>
                        <option value="lt">Litros</option>
                        <option value="ml">Mililitros</option>
                        <option value="pieza">Piezas</option>
                      </select>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Lightbulb size={12} className="text-gray-400" /> La receta original rinde: {receta.rendimiento?.cantidad || 1} {receta.rendimiento?.unidadMedida || 'unidad'}
                  </p>
                </div>

                {/* ============= SECCIÓN: INGREDIENTES ============= */}
                <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-3 sm:p-4">
                  <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2 min-w-0">
                      <Carrot size={18} className="text-green-600 flex-shrink-0" />
                      <span className="text-sm sm:text-base truncate">Ingredientes Necesarios</span>
                      <span className="text-xs sm:text-sm font-normal text-gray-500 flex-shrink-0">
                        ({ingredientesProduccion.length})
                      </span>
                    </h3>
                    
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirBuscador('ingrediente')}
                        className="px-2 sm:px-3 py-1.5 text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1 font-medium"
                        disabled={enviando}
                        title="Agregar Ingrediente"
                      >
                        <Plus size={14} />
                        <span className="hidden md:inline">Ingrediente</span>
                        <Carrot size={14} className="md:hidden" />
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirBuscador('receta')}
                        className="px-2 sm:px-3 py-1.5 text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1 font-medium"
                        disabled={enviando}
                        title="Agregar Receta"
                      >
                        <Plus size={14} />
                        <span className="hidden md:inline">Receta</span>
                        <ClipboardList size={14} className="md:hidden" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de ingredientes */}
                  {ingredientesProduccion.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search size={32} className="mx-auto mb-2 text-gray-300" />
                      <p>No hay ingredientes. Agrega ingredientes o recetas.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Header de la tabla */}
                      <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 bg-white rounded-xl border border-gray-100 text-xs font-medium text-gray-600">
                        <div className="col-span-5">Ingrediente/Receta</div>
                        <div className="col-span-2 text-center">Cantidad</div>
                        <div className="col-span-2 text-center">Unidad</div>
                        <div className="col-span-2 text-center">Disponible</div>
                        <div className="col-span-1 text-center">Acción</div>
                      </div>

                      {/* Filas de ingredientes */}
                      {ingredientesProduccion.map((item, index) => {
                        const suficiente = validarStock(item);
                        const falta = item.cantidad - item.disponible;
                        
                        return (
                          <div 
                            key={`${item.tipo}-${item.id}-${index}`}
                            className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-xl items-center
                              ${item.esExtra ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}
                              ${!suficiente ? 'border-2 border-red-300' : ''}`}
                          >
                            {/* Nombre */}
                            <div className="col-span-12 sm:col-span-5 flex items-center gap-2">
                              <span className="text-gray-500">
                                {item.tipo === 'receta' ? <ClipboardList size={16} /> : <Carrot size={16} />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className={`font-medium truncate block ${!suficiente ? 'text-red-700' : 'text-gray-900'}`}>
                                  {item.nombre}
                                </span>
                                {item.esExtra && (
                                  <span className="text-xs text-blue-600 flex items-center gap-0.5"><Sparkles size={10} /> Agregado extra</span>
                                )}
                              </div>
                            </div>

                            {/* Cantidad editable */}
                            <div className="col-span-4 sm:col-span-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.cantidad}
                                onChange={(e) => handleCantidadIngredienteChange(index, e.target.value)}
                                className={`w-full p-2 text-sm border rounded-xl text-center font-medium
                                  ${!suficiente 
                                    ? 'border-red-400 bg-red-50 text-red-700' 
                                    : 'border-gray-200 focus:ring-purple-500 focus:border-transparent outline-none'}`}
                                disabled={enviando}
                              />
                            </div>

                            {/* Unidad */}
                            <div className="col-span-3 sm:col-span-2 text-center text-sm text-gray-600">
                              {item.unidadMedida}
                            </div>

                            {/* Disponible */}
                            <div className="col-span-4 sm:col-span-2 text-center">
                              <span className={`text-sm font-medium ${suficiente ? 'text-green-600' : 'text-red-600'}`}>
                                {item.disponible.toFixed(2)} {item.unidadMedida}
                              </span>
                              {suficiente ? (
                                <span className="ml-1 text-green-600"><Check size={14} className="inline" /></span>
                              ) : (
                                <span className="block text-xs text-red-500">
                                  Faltan: {falta.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Botón eliminar */}
                            <div className="col-span-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleEliminarIngrediente(index)}
                                className="p-1.5 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                                title="Eliminar"
                                disabled={enviando}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Modal/Panel de agregar item extra */}
                  {mostrarBuscador && (
                    <div className="mt-4 p-4 bg-white border border-gray-100 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800 flex items-center gap-1.5">
                          {tipoBuscador === 'ingrediente' ? <><Carrot size={14} className="text-green-600" /> Agregar Ingrediente</> : <><ClipboardList size={14} className="text-purple-600" /> Agregar Receta</>}
                        </h4>
                        <button
                          type="button"
                          onClick={cerrarBuscador}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-xl transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-3">
                        {/* Buscador */}
                        <div className="col-span-12 sm:col-span-5 relative">
                          <input
                            type="text"
                            value={terminoBusqueda}
                            onChange={(e) => {
                              setTerminoBusqueda(e.target.value);
                              setItemSeleccionado(null);
                            }}
                            placeholder={`Buscar ${tipoBuscador}...`}
                            className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          />
                          
                          {/* Sugerencias */}
                          {terminoBusqueda && !itemSeleccionado && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {getItemsFiltrados().length > 0 ? (
                                getItemsFiltrados().map(item => (
                                  <button
                                    key={item._id}
                                    type="button"
                                    onClick={() => seleccionarItem(item)}
                                    className="w-full px-3 py-2 text-left hover:bg-purple-50 border-b last:border-b-0"
                                  >
                                    <span className="font-medium">{item.nombre}</span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {tipoBuscador === 'ingrediente'
                                        ? `(${(item.cantidad - (item.procesado || 0)).toFixed(2)} ${item.unidadMedida} disp.)`
                                        : `(${((item.inventario?.cantidadProducida || 0) - (item.inventario?.cantidadUtilizada || 0)).toFixed(2)} disp.)`
                                      }
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-gray-500 text-sm">
                                  No se encontraron resultados
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Cantidad */}
                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cantidadNuevo}
                            onChange={(e) => setCantidadNuevo(e.target.value)}
                            placeholder="Cant."
                            className="w-full p-2 border border-gray-200 rounded-xl outline-none"
                          />
                        </div>

                        {/* Unidad */}
                        <div className="col-span-4 sm:col-span-2">
                          <select
                            value={unidadNuevo}
                            onChange={(e) => setUnidadNuevo(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-xl outline-none"
                          >
                            {unidadesMedida.map(u => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Botón agregar */}
                        <div className="col-span-4 sm:col-span-3">
                          <button
                            type="button"
                            onClick={agregarItemExtra}
                            disabled={!itemSeleccionado || !cantidadNuevo || parseFloat(cantidadNuevo) <= 0}
                            className="w-full p-2 text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-sm"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ============= SECCIÓN: INFORMACIÓN DE PRODUCCIÓN ============= */}
                <div className="bg-gray-50/60 border border-gray-100 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User size={18} className="text-gray-600" /> Información de Producción
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Operador */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operador Responsable *
                      </label>
                      {isSuperAdmin ? (
                        <select
                          value={formData.operador}
                          onChange={(e) => handleFormDataChange('operador', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          disabled={enviando || loadingUsuarios}
                          required
                        >
                          <option value="">Seleccionar operador...</option>
                          {usuarios
                            .filter(u => u.role !== 'de_baja' && u.is_active !== false)
                            .map((usuario) => (
                              <option key={usuario._id} value={usuario.nombre_negocio || usuario.email}>
                                {usuario.nombre_negocio || usuario.email} ({usuario.role})
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.operador}
                          readOnly
                          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                      )}
                    </div>

                    {/* Fecha y Hora */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-500" /> Fecha y Hora de Producción
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.fechaProduccion}
                        onChange={(e) => handleFormDataChange('fechaProduccion', e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        disabled={enviando}
                      />
                    </div>
                  </div>

                  {/* Checkbox consumir ingredientes */}
                  <div className="mt-4 p-3 bg-green-50/60 border border-green-200 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.consumirIngredientes}
                        onChange={(e) => handleFormDataChange('consumirIngredientes', e.target.checked)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        disabled={enviando}
                      />
                      <div>
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                          <Check size={14} className="text-green-600" /> Consumir ingredientes del inventario al producir
                        </span>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Los ingredientes se descontarán automáticamente del stock
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Observaciones */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones (Opcional)
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => handleFormDataChange('observaciones', e.target.value)}
                      placeholder="Notas adicionales sobre esta producción..."
                      rows={3}
                      maxLength={500}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                      disabled={enviando}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.observaciones.length}/500 caracteres
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ============= FOOTER ============= */}
          <div className="bg-gray-50/50 border-t border-gray-100 px-4 sm:px-5 py-3 rounded-b-2xl flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || loadingRecursos || (formData.consumirIngredientes && hayErroresStock())}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Produciendo...
                  </>
                ) : (
                  <>
                    <ClipboardList size={16} />
                    Producir Receta
                  </>
                )}
              </button>
            </div>
            
            {/* Aviso de errores de stock */}
            {formData.consumirIngredientes && hayErroresStock() && (
              <div className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-red-600 flex items-center justify-center gap-1">
                <AlertTriangle size={14} /> Hay ingredientes con stock insuficiente. Ajusta las cantidades o desactiva el consumo automático.
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalProducirRecetaNuevo;
