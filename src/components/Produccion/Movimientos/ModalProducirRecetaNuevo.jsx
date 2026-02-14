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
      const response = await safeFetch(getFullApiUrl('/admin/users?limit=100'), {
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <p className="text-red-600">Error: No se ha seleccionado una receta</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="modal-protection bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* ============= HEADER ============= */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4 md:p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold m-0 flex items-center gap-2">
                📋 <span className="hidden xs:inline">Producir Receta</span><span className="xs:hidden">Producir</span>
              </h2>
              <p className="text-purple-100 text-xs sm:text-sm mt-1 mb-0 truncate">
                {receta.nombre}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={enviando}
              className="text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ============= ERROR ============= */}
        {error && (
          <div className="mx-2 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs sm:text-sm text-red-600 flex items-center gap-2">
              <span>❌</span> <span className="break-words">{error}</span>
            </p>
          </div>
        )}

        {/* ============= BODY ============= */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            
            {loadingRecursos ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Cargando datos...</span>
              </div>
            ) : (
              <>
                {/* ============= SECCIÓN: RENDIMIENTO ============= */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <span className="text-lg sm:text-xl">📦</span>
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
                        className="w-full p-3 text-lg font-bold border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                  
                  <p className="text-xs text-gray-500 mt-2">
                    💡 La receta original rinde: {receta.rendimiento?.cantidad || 1} {receta.rendimiento?.unidadMedida || 'unidad'}
                  </p>
                </div>

                {/* ============= SECCIÓN: INGREDIENTES ============= */}
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2 min-w-0">
                      <span className="text-lg sm:text-xl flex-shrink-0">🥬</span>
                      <span className="text-sm sm:text-base truncate">Ingredientes Necesarios</span>
                      <span className="text-xs sm:text-sm font-normal text-gray-500 flex-shrink-0">
                        ({ingredientesProduccion.length})
                      </span>
                    </h3>
                    
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirBuscador('ingrediente')}
                        className="px-2 sm:px-3 py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                        disabled={enviando}
                        title="Agregar Ingrediente"
                      >
                        <span className="text-base sm:text-sm">+</span>
                        <span className="hidden md:inline">Ingrediente</span>
                        <span className="md:hidden text-base">🥬</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirBuscador('receta')}
                        className="px-2 sm:px-3 py-1.5 bg-purple-600 text-white text-xs sm:text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                        disabled={enviando}
                        title="Agregar Receta"
                      >
                        <span className="text-base sm:text-sm">+</span>
                        <span className="hidden md:inline">Receta</span>
                        <span className="md:hidden text-base">📋</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista de ingredientes */}
                  {ingredientesProduccion.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl mb-2 block">🔍</span>
                      <p>No hay ingredientes. Agrega ingredientes o recetas.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Header de la tabla */}
                      <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
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
                            className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg items-center
                              ${item.esExtra ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}
                              ${!suficiente ? 'border-2 border-red-300' : ''}`}
                          >
                            {/* Nombre */}
                            <div className="col-span-12 sm:col-span-5 flex items-center gap-2">
                              <span className="text-lg">
                                {item.tipo === 'receta' ? '📋' : '🥬'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className={`font-medium truncate block ${!suficiente ? 'text-red-700' : 'text-gray-900'}`}>
                                  {item.nombre}
                                </span>
                                {item.esExtra && (
                                  <span className="text-xs text-blue-600">✨ Agregado extra</span>
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
                                className={`w-full p-2 text-sm border rounded-lg text-center font-medium
                                  ${!suficiente 
                                    ? 'border-red-400 bg-red-50 text-red-700' 
                                    : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'}`}
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
                                <span className="ml-1 text-green-600">✓</span>
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
                                className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                                title="Eliminar"
                                disabled={enviando}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Modal/Panel de agregar item extra */}
                  {mostrarBuscador && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800">
                          {tipoBuscador === 'ingrediente' ? '🥬 Agregar Ingrediente' : '📋 Agregar Receta'}
                        </h4>
                        <button
                          type="button"
                          onClick={cerrarBuscador}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
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
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                          />
                          
                          {/* Sugerencias */}
                          {terminoBusqueda && !itemSeleccionado && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                            className="w-full p-2 border border-gray-300 rounded-lg"
                          />
                        </div>

                        {/* Unidad */}
                        <div className="col-span-4 sm:col-span-2">
                          <select
                            value={unidadNuevo}
                            onChange={(e) => setUnidadNuevo(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
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
                            className="w-full p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ============= SECCIÓN: INFORMACIÓN DE PRODUCCIÓN ============= */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    👤 Información de Producción
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
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                          disabled={enviando || loadingUsuarios}
                          required
                        >
                          <option value="">Seleccionar operador...</option>
                          {usuarios.map((usuario) => (
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
                          className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                        />
                      )}
                    </div>

                    {/* Fecha y Hora */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        📅 Fecha y Hora de Producción
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.fechaProduccion}
                        onChange={(e) => handleFormDataChange('fechaProduccion', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        disabled={enviando}
                      />
                    </div>
                  </div>

                  {/* Checkbox consumir ingredientes */}
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.consumirIngredientes}
                        onChange={(e) => handleFormDataChange('consumirIngredientes', e.target.checked)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        disabled={enviando}
                      />
                      <div>
                        <span className="font-medium text-gray-900">
                          ✅ Consumir ingredientes del inventario al producir
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-none"
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
          <div className="border-t border-gray-200 px-2 sm:px-4 md:px-6 py-3 sm:py-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={enviando}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || loadingRecursos || (formData.consumirIngredientes && hayErroresStock())}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="hidden xs:inline">Produciendo...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span className="hidden xs:inline">Producir Receta</span>
                    <span className="xs:hidden">Producir</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Aviso de errores de stock */}
            {formData.consumirIngredientes && hayErroresStock() && (
              <div className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-red-600">
                <span className="hidden sm:inline">⚠️ Hay ingredientes con stock insuficiente. Ajusta las cantidades o desactiva el consumo automático.</span>
                <span className="sm:hidden">⚠️ Stock insuficiente. Ajusta cantidades.</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalProducirRecetaNuevo;
