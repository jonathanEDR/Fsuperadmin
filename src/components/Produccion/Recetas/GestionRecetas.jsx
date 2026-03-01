import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Search, BarChart3, Eye, Pencil, Trash2, Play, Pause, RotateCcw, ChevronRight, Beaker, CheckCircle, Clock, FlaskConical, Flag, FileText, AlertTriangle, ChefHat } from 'lucide-react';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import BreadcrumbProduccion from '../BreadcrumbProduccion';
import { recetaService } from '../../../services/recetaService';
import FormularioReceta from './FormularioReceta';
import FormularioBasicoReceta from './FormularioBasicoReceta';
import VistaReceta from './VistaReceta';
import ModalAvanzarFase from './ModalAvanzarFase';
import TablaHistorialGeneral from './TablaHistorialGeneral';
import { useQuickPermissions } from '../../../hooks/useProduccionPermissions';

const GestionRecetas = () => {
  // Hook de permisos para control de roles
  const { 
    canViewPrices, 
    canManageRecetas, 
    canDeleteProduccion 
  } = useQuickPermissions();

  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    buscar: '',
    activo: true
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [recetaEditando, setRecetaEditando] = useState(null);
  const [mostrarFormularioBasico, setMostrarFormularioBasico] = useState(false);
  const [mostrarVista, setMostrarVista] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [recargarVistaKey, setRecargarVistaKey] = useState(0);
  
  // Estados para el flujo de trabajo
  const [mostrarModalAvanzar, setMostrarModalAvanzar] = useState(false);
  const [recetaParaAvanzar, setRecetaParaAvanzar] = useState(null);

  useEffect(() => {
    cargarRecetas();
  }, [filtros]);

  const cargarRecetas = async () => {
    try {
      setLoading(true);
      const response = await recetaService.obtenerRecetas(filtros);
      setRecetas(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar recetas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleNuevaReceta = () => {
    setRecetaEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarReceta = (receta) => {
    setRecetaEditando(receta);
    setMostrarFormularioBasico(true); // 🎯 CAMBIO: Usar formulario básico para editar
  };

  const handleVerReceta = (receta) => {
    setRecetaSeleccionada(receta);
    setMostrarVista(true);
  };

  const handleGuardarReceta = async (datos) => {
    console.log('🎯 handleGuardarReceta iniciado');
    console.log('📋 Datos recibidos:', datos);
    
    try {
      console.log('🔍 Iniciando validaciones...');
      
      // Validaciones adicionales antes del envío
      if (!datos.categoria) {
        throw new Error('La categoría de la receta es requerida');
      }
      
      if (!datos.ingredientes || datos.ingredientes.length === 0) {
        throw new Error('Debe agregar al menos un ingrediente');
      }
      
      // Verificar que todos los items (ingredientes o recetas) tienen IDs válidos
      const itemsInvalidos = datos.ingredientes.filter(item => {
        const tipoItem = item.tipo || 'ingrediente';
        if (tipoItem === 'receta') {
          // Para sub-recetas, validar el campo 'receta'
          return !item.receta || item.receta.length !== 24;
        } else {
          // Para ingredientes, validar el campo 'ingrediente'
          return !item.ingrediente || item.ingrediente.length !== 24;
        }
      });

      if (itemsInvalidos.length > 0) {
        throw new Error('Uno o más ingredientes o recetas seleccionados no son válidos. Por favor, verifique la selección.');
      }
      
      console.log('✅ Validaciones frontend completadas');
      
      if (recetaEditando) {
        console.log('🔄 Actualizando receta existente...');
        await recetaService.actualizarReceta(recetaEditando._id, datos);
      } else {
        console.log('🆕 Creando nueva receta...');
        console.log('📞 Llamando a recetaService.crearReceta...');
        const response = await recetaService.crearReceta(datos);
        console.log('✅ Respuesta del backend:', response);
      }
      
      console.log('🎉 Operación exitosa, cerrando modal y recargando...');
      setMostrarFormulario(false);
      setRecetaEditando(null);
      cargarRecetas();
      
      // Si hay una vista abierta, forzar recarga
      if (mostrarVista && recetaSeleccionada) {
        setRecargarVistaKey(prev => prev + 1);
      }
      
      setError('');
      
      console.log('✅ Receta guardada exitosamente');
    } catch (err) {
      console.error('❌ Error completo al guardar receta:', err);
      console.error('❌ Response data:', err.response?.data);
      console.error('❌ Response status:', err.response?.status);
      console.error('❌ Response headers:', err.response?.headers);
      
      // Extraer mensaje de error más específico
      let mensajeError = 'Error desconocido';
      
      if (err.response?.data?.message) {
        mensajeError = err.response.data.message;
      } else if (err.response?.data?.error) {
        mensajeError = err.response.data.error;
      } else if (err.message) {
        mensajeError = err.message;
      }
      
      setError(`Error al guardar receta: ${mensajeError}`);
      
      // Mostrar alerta al usuario también
      alert(`❌ Error: ${mensajeError}`);
    }
  };

  // 🎯 NUEVO: Manejador específico para editar información básica
  const handleGuardarEdicionBasica = async (datosBasicos) => {
    console.log('🎯 handleGuardarEdicionBasica iniciado');
    console.log('📋 Datos básicos recibidos:', datosBasicos);
    
    try {
      if (!recetaEditando?._id) {
        throw new Error('No hay receta seleccionada para editar');
      }
      
      console.log('🔄 Actualizando información básica de receta...');
      await recetaService.actualizarReceta(recetaEditando._id, datosBasicos);
      
      console.log('🎉 Edición básica exitosa, cerrando modal y recargando...');
      setMostrarFormularioBasico(false);
      setRecetaEditando(null);
      cargarRecetas();
      
      // Si hay una vista abierta, forzar recarga
      if (mostrarVista && recetaSeleccionada) {
        setRecargarVistaKey(prev => prev + 1);
      }
      
      setError('');
      console.log('✅ Información básica actualizada exitosamente');
    } catch (err) {
      console.error('❌ Error al editar información básica:', err);
      
      let mensajeError = 'Error desconocido';
      if (err.response?.data?.message) {
        mensajeError = err.response.data.message;
      } else if (err.response?.data?.error) {
        mensajeError = err.response.data.error;
      } else if (err.message) {
        mensajeError = err.message;
      }
      
      setError(`Error al actualizar información básica: ${mensajeError}`);
      alert(`❌ Error: ${mensajeError}`);
    }
  };

  // 🎯 NUEVO: Función para reiniciar receta desde tarjeta
  const handleReiniciarRecetaTarjeta = async (receta) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres reiniciar la receta "${receta.nombre}" al estado preparado?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmacion) return;

    try {
      setLoading(true);
      await recetaService.reiniciarReceta(receta._id, 'Reinicio desde tarjeta');
      cargarRecetas(); // Recargar la lista
      
      // Si hay una vista abierta de esta receta, forzar recarga
      if (mostrarVista && recetaSeleccionada?._id === receta._id) {
        setRecargarVistaKey(prev => prev + 1);
      }
      
      alert(`✅ Receta "${receta.nombre}" reiniciada exitosamente al estado preparado`);
    } catch (error) {
      console.error('Error al reiniciar receta:', error);
      alert(`❌ Error al reiniciar receta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      if (window.confirm('¿Estás seguro de que quieres eliminar completamente esta receta?\n\nEsta acción no se puede deshacer y liberará todos los ingredientes asociados.')) {
        await recetaService.eliminarReceta(id);
        cargarRecetas();
        alert('✅ Receta eliminada completamente de la base de datos');
      }
    } catch (err) {
      setError('Error al eliminar receta: ' + err.message);
      alert('❌ Error al eliminar receta: ' + err.message);
    }
  };

  // ============= NUEVAS FUNCIONES PARA FLUJO DE TRABAJO =============
  
  // Iniciar proceso de producción
  const handleIniciarProceso = async (recetaId) => {
    try {
      if (window.confirm('¿Deseas iniciar el proceso de producción para esta receta?')) {
        await recetaService.iniciarProceso(recetaId);
        setError('');
        cargarRecetas();
        alert('✅ Proceso de producción iniciado exitosamente');
      }
    } catch (err) {
      const mensajeError = err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al iniciar proceso: ${mensajeError}`);
      alert(`❌ Error: ${mensajeError}`);
    }
  };

  // Abrir modal para avanzar fase
  const handleAbrirModalAvanzar = (receta) => {
    setRecetaParaAvanzar(receta);
    setMostrarModalAvanzar(true);
  };

  // Confirmar avance de fase
  const handleConfirmarAvance = async (datosAdicionales) => {
    try {
      await recetaService.avanzarFase(recetaParaAvanzar._id, datosAdicionales);
      setMostrarModalAvanzar(false);
      setRecetaParaAvanzar(null);
      setError('');
      cargarRecetas();
      
      // Si hay una vista abierta, forzar recarga
      if (mostrarVista && recetaSeleccionada) {
        setRecargarVistaKey(prev => prev + 1);
      }
      
      alert('✅ Fase avanzada exitosamente');
    } catch (err) {
      const mensajeError = err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al avanzar fase: ${mensajeError}`);
      alert(`❌ Error: ${mensajeError}`);
    }
  };

  // Pausar proceso
  const handlePausarProceso = async (recetaId) => {
    try {
      const motivo = prompt('¿Por qué deseas pausar el proceso? (opcional)');
      if (motivo !== null) { // Si no canceló el prompt
        await recetaService.pausarProceso(recetaId, motivo);
        setError('');
        cargarRecetas();
        alert('⏸️ Proceso pausado exitosamente');
      }
    } catch (err) {
      const mensajeError = err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al pausar proceso: ${mensajeError}`);
      alert(`❌ Error: ${mensajeError}`);
    }
  };

  // Reanudar proceso
  const handleReanudarProceso = async (recetaId) => {
    try {
      if (window.confirm('¿Deseas reanudar el proceso de producción?')) {
        await recetaService.reanudarProceso(recetaId);
        setError('');
        cargarRecetas();
        alert('▶️ Proceso reanudado exitosamente');
      }
    } catch (err) {
      const mensajeError = err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al reanudar proceso: ${mensajeError}`);
      alert(`❌ Error: ${mensajeError}`);
    }
  };

  // Función para calcular el costo total de una receta
  const calcularCostoTotal = (receta) => {
    if (!receta.ingredientes || receta.ingredientes.length === 0) {
      return 0;
    }

    let costoTotal = 0;
    let ingredientesConPrecio = 0;
    
    for (const item of receta.ingredientes) {
      const ingrediente = item.ingrediente;
      if (ingrediente && typeof ingrediente.precioUnitario === 'number' && ingrediente.precioUnitario > 0) {
        const cantidad = Number(item.cantidad) || 0;
        const precio = Number(ingrediente.precioUnitario) || 0;
        costoTotal += cantidad * precio;
        ingredientesConPrecio++;
      }
    }
    
    // Solo retornar el costo si al menos un ingrediente tiene precio
    return ingredientesConPrecio > 0 ? costoTotal : 0;
  };

  // Función para calcular el precio unitario
  const calcularPrecioUnitario = (receta) => {
    const costoTotal = calcularCostoTotal(receta);
    const rendimiento = Number(receta.rendimiento?.cantidad) || 1;
    
    if (costoTotal <= 0 || rendimiento <= 0) {
      return 0;
    }
    
    return costoTotal / rendimiento;
  };

  // Función para verificar si la receta tiene información de costos
  const tieneCostos = (receta) => {
    return calcularCostoTotal(receta) > 0;
  };

  // ============= FUNCIONES AUXILIARES PARA UI =============
  
  // Obtener color por fase
  const obtenerColorPorFase = (fase) => {
    switch (fase) {
      case 'preparado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'intermedio': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'terminado': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener icono Lucide por fase
  const obtenerIconoFase = (fase, size = 14) => {
    switch (fase) {
      case 'preparado': return <Beaker size={size} />;
      case 'intermedio': return <FlaskConical size={size} />;
      case 'terminado': return <CheckCircle size={size} />;
      default: return <FileText size={size} />;
    }
  };

  // Obtener icono por estado
  const obtenerIconoEstado = (estado, size = 14) => {
    switch (estado) {
      case 'borrador': return <FileText size={size} />;
      case 'en_proceso': return <Play size={size} />;
      case 'completado': return <CheckCircle size={size} />;
      case 'pausado': return <Pause size={size} />;
      default: return <FileText size={size} />;
    }
  };

  // Obtener icono para la siguiente fase
  const obtenerIconoSiguienteFase = (siguienteFase, size = 14) => {
    switch (siguienteFase) {
      case 'producto_intermedio': return <FlaskConical size={size} />;
      case 'producto_terminado': return <Flag size={size} />;
      default: return <ChevronRight size={size} />;
    }
  };

  // Obtener color del botón outline según la fase
  const obtenerColorBotonFase = (siguienteFase) => {
    switch (siguienteFase) {
      case 'producto_intermedio':
        return 'text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100';
      case 'producto_terminado':
        return 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100';
      default:
        return 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100';
    }
  };

  // Obtener icono para la siguiente fase (inline helper kept)
  const obtenerEmojiSiguienteFase = (siguienteFase) => {
    return obtenerIconoSiguienteFase(siguienteFase, 14);
  };

  // Normalizar categoría para comparaciones internas
  const normalizarCategoria = (categoria) => {
    const mapeoNormalizacion = {
      'preparado': 'preparado',
      'intermedio': 'intermedio',              // ✅ AÑADIDO: Faltaba este mapeo
      'producto_intermedio': 'intermedio', 
      'terminado': 'terminado',                // ✅ AÑADIDO: Para completitud
      'producto_terminado': 'terminado'
    };
    return mapeoNormalizacion[categoria] || 'preparado';
  };

  // Verificar si puede avanzar de fase
  const puedeAvanzarFase = (receta) => {
    const categoriaOriginal = receta.categoria || 'preparado'; // 🎯 CORRECCIÓN: Usar categoria directamente
    const faseNormalizada = normalizarCategoria(categoriaOriginal);
    const estadoProceso = receta.estadoProceso || 'borrador';
    const fases = ['preparado', 'intermedio', 'terminado'];
    const indiceActual = fases.indexOf(faseNormalizada);
    
    return estadoProceso === 'en_proceso' && 
           indiceActual >= 0 &&  // Verificar que la fase sea válida
           indiceActual < fases.length - 1 && 
           (receta.puedeAvanzar !== false);
  };

  // Obtener siguiente fase
  const obtenerSiguienteFase = (receta) => {
    const categoriaOriginal = receta.categoria || 'preparado'; // 🎯 CORRECCIÓN: Usar categoria directamente
    const faseNormalizada = normalizarCategoria(categoriaOriginal);
    const fases = ['preparado', 'intermedio', 'terminado'];
    const indiceActual = fases.indexOf(faseNormalizada);
    
    if (indiceActual >= 0 && indiceActual < fases.length - 1) {
      const siguienteFaseNormalizada = fases[indiceActual + 1];
      // Convertir de vuelta a la nomenclatura original
      const mapeoInverso = {
        'preparado': 'preparado',
        'intermedio': 'producto_intermedio',
        'terminado': 'producto_terminado'
      };
      return mapeoInverso[siguienteFaseNormalizada] || siguienteFaseNormalizada;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-6 py-4">
      <BreadcrumbProduccion />
      
      {/* 🎯 OPTIMIZADO: Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestión de Recetas</h1>
        {/* Solo admin o superior puede crear recetas */}
        {canManageRecetas && (
          <button
            onClick={handleNuevaReceta}
            className="flex items-center justify-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors w-full sm:w-auto font-medium text-sm sm:text-base"
          >
            <Plus size={16} /> Nueva Receta
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm sm:text-base flex items-center gap-2">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-100 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <Search size={14} /> Buscar Receta
            </label>
            <input
              type="text"
              value={filtros.buscar}
              onChange={(e) => handleFiltroChange('buscar', e.target.value)}
              placeholder="Nombre de la receta..."
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <BarChart3 size={14} /> Estado
            </label>
            <select
              value={filtros.activo}
              onChange={(e) => handleFiltroChange('activo', e.target.value === 'true')}
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========== VISTA MÓVIL: Tarjetas compactas ========== */}
      <div className="md:hidden space-y-3">
        {recetas.map((receta) => {
          const categoriaOriginal = receta.categoria || 'preparado';
          const faseNormalizada = normalizarCategoria(categoriaOriginal);
          const estadoProceso = receta.estadoProceso || 'borrador';
          const siguienteFase = obtenerSiguienteFase(receta);
          const puedeAvanzar = puedeAvanzarFase(receta);
          const disponible = (receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0);

          return (
            <div key={receta._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-base flex-1 mr-2">{receta.nombre}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${obtenerColorPorFase(faseNormalizada)}`}>
                      {obtenerIconoFase(faseNormalizada, 12)}
                      {categoriaOriginal.replace('producto_', '').toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ${
                  estadoProceso === 'completado' ? 'bg-green-50 text-green-700 border border-green-200' :
                  estadoProceso === 'en_proceso' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  estadoProceso === 'pausado' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                  'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {obtenerIconoEstado(estadoProceso, 12)}
                  {estadoProceso.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="p-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-2 text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Clock size={10} /> Prep.</p>
                    <p className="text-sm font-bold text-gray-800">{receta.tiempoPreparacion || 0}m</p>
                  </div>
                  <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-2 text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><Beaker size={10} /> Ingr.</p>
                    <p className="text-sm font-bold text-gray-800">{receta.ingredientes?.length || 0}</p>
                  </div>
                  <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-2 text-center">
                    <p className="text-xs text-gray-500">Disp.</p>
                    <p className={`text-sm font-bold ${disponible > 0 ? 'text-green-600' : 'text-gray-500'}`}>{disponible}</p>
                  </div>
                </div>

                {/* Progreso visual */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                    <span>Prep.</span><span>Inter.</span><span>Term.</span>
                  </div>
                  <div className="flex gap-0.5">
                    {['preparado', 'intermedio', 'terminado'].map((fase, index) => (
                      <div key={fase} className={`flex-1 h-1.5 rounded ${
                        estadoProceso === 'completado' && faseNormalizada === 'terminado' ? 'bg-green-400' :
                        faseNormalizada === fase ? 'bg-blue-400' :
                        index < ['preparado', 'intermedio', 'terminado'].indexOf(faseNormalizada) ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                </div>

                {/* Acción principal de flujo */}
                {estadoProceso === 'borrador' && (
                  <button onClick={() => handleIniciarProceso(receta._id)}
                    className="w-full flex items-center justify-center gap-2 text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 px-3 py-2 rounded-xl transition-colors text-sm font-medium mb-2">
                    <Play size={14} /> Iniciar Proceso
                  </button>
                )}
                {puedeAvanzar && (
                  <button onClick={() => handleAbrirModalAvanzar(receta)}
                    className={`w-full flex items-center justify-center gap-2 ${obtenerColorBotonFase(siguienteFase)} px-3 py-2 rounded-xl transition-colors text-sm font-medium mb-2`}>
                    {obtenerEmojiSiguienteFase(siguienteFase)} Avanzar a {siguienteFase?.replace('producto_', '').toUpperCase()}
                  </button>
                )}
                {estadoProceso === 'en_proceso' && !puedeAvanzar && faseNormalizada !== 'terminado' && (
                  <button onClick={() => handlePausarProceso(receta._id)}
                    className="w-full flex items-center justify-center gap-2 text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 px-3 py-2 rounded-xl transition-colors text-sm font-medium mb-2">
                    <Pause size={14} /> Pausar
                  </button>
                )}
                {estadoProceso === 'pausado' && (
                  <button onClick={() => handleReanudarProceso(receta._id)}
                    className="w-full flex items-center justify-center gap-2 text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 px-3 py-2 rounded-xl transition-colors text-sm font-medium mb-2">
                    <Play size={14} /> Reanudar
                  </button>
                )}
                {estadoProceso === 'completado' && (
                  <div className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-xl text-sm font-medium mb-2">
                    <CheckCircle size={14} /> Completado
                  </div>
                )}

                {/* Acciones secundarias */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                  <button onClick={() => handleVerReceta(receta)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-medium transition-colors">
                    <Eye size={12} /> Ver
                  </button>
                  {canManageRecetas && (
                    <button onClick={() => handleEditarReceta(receta)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl text-xs font-medium transition-colors">
                      <Pencil size={12} /> Editar
                    </button>
                  )}
                  {canManageRecetas && receta.estadoProceso !== 'borrador' && (
                    <button onClick={() => handleReiniciarRecetaTarjeta(receta)} disabled={loading}
                      className="px-2 py-1.5 text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-xl text-xs font-medium transition-colors disabled:opacity-50">
                      <RotateCcw size={12} />
                    </button>
                  )}
                  {canDeleteProduccion && (
                    <button onClick={() => handleEliminar(receta._id)}
                      className="px-2 py-1.5 text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-medium transition-colors">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========== VISTA DESKTOP: Tabla ========== */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Prep.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ingr.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rend.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Disp.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Flujo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recetas.map((receta) => {
                const categoriaOriginal = receta.categoria || 'preparado';
                const faseNormalizada = normalizarCategoria(categoriaOriginal);
                const estadoProceso = receta.estadoProceso || 'borrador';
                const siguienteFase = obtenerSiguienteFase(receta);
                const puedeAvanzar = puedeAvanzarFase(receta);
                const disponible = (receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0);

                return (
                  <tr key={receta._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Receta */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{receta.nombre}</div>
                      {receta.descripcion && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{receta.descripcion}</p>
                      )}
                    </td>
                    {/* Categoría */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${obtenerColorPorFase(faseNormalizada)}`}>
                        {obtenerIconoFase(faseNormalizada, 12)}
                        {categoriaOriginal.replace('producto_', '')}
                      </span>
                    </td>
                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium ${
                        estadoProceso === 'completado' ? 'bg-green-50 text-green-700 border border-green-200' :
                        estadoProceso === 'en_proceso' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        estadoProceso === 'pausado' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {obtenerIconoEstado(estadoProceso, 12)}
                        {estadoProceso.replace('_', ' ')}
                      </span>
                    </td>
                    {/* Progreso */}
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5 w-20 mx-auto">
                        {['preparado', 'intermedio', 'terminado'].map((fase, index) => (
                          <div key={fase} className={`flex-1 h-1.5 rounded ${
                            estadoProceso === 'completado' && faseNormalizada === 'terminado' ? 'bg-green-400' :
                            faseNormalizada === fase ? 'bg-blue-400' :
                            index < ['preparado', 'intermedio', 'terminado'].indexOf(faseNormalizada) ? 'bg-green-300' : 'bg-gray-200'
                          }`} />
                        ))}
                      </div>
                    </td>
                    {/* Preparación */}
                    <td className="px-4 py-3 text-center text-sm text-gray-700">{receta.tiempoPreparacion || 0}m</td>
                    {/* Ingredientes */}
                    <td className="px-4 py-3 text-center text-sm text-gray-700">{receta.ingredientes?.length || 0}</td>
                    {/* Rendimiento */}
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {receta.rendimiento?.cantidad || 1} {receta.rendimiento?.unidadMedida || 'u'}
                    </td>
                    {/* Disponible */}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${disponible > 0 ? 'text-green-600' : 'text-gray-400'}`}>{disponible}</span>
                    </td>
                    {/* Flujo de trabajo */}
                    <td className="px-4 py-3 text-center">
                      {estadoProceso === 'borrador' && (
                        <button onClick={() => handleIniciarProceso(receta._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl text-xs font-medium transition-colors"
                          title="Iniciar proceso">
                          <Play size={12} /> Iniciar
                        </button>
                      )}
                      {puedeAvanzar && (
                        <button onClick={() => handleAbrirModalAvanzar(receta)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 ${obtenerColorBotonFase(siguienteFase)} rounded-xl text-xs font-medium transition-colors`}
                          title={`Avanzar a ${siguienteFase?.replace('producto_', '')}`}>
                          {obtenerEmojiSiguienteFase(siguienteFase)} Avanzar
                        </button>
                      )}
                      {estadoProceso === 'en_proceso' && !puedeAvanzar && faseNormalizada !== 'terminado' && (
                        <button onClick={() => handlePausarProceso(receta._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-xl text-xs font-medium transition-colors"
                          title="Pausar proceso">
                          <Pause size={12} /> Pausar
                        </button>
                      )}
                      {estadoProceso === 'pausado' && (
                        <button onClick={() => handleReanudarProceso(receta._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-medium transition-colors"
                          title="Reanudar proceso">
                          <Play size={12} /> Reanudar
                        </button>
                      )}
                      {estadoProceso === 'completado' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-medium">
                          <CheckCircle size={12} /> Listo
                        </span>
                      )}
                    </td>
                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleVerReceta(receta)} title="Ver"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                        {canManageRecetas && (
                          <button onClick={() => handleEditarReceta(receta)} title="Editar"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Pencil size={16} />
                          </button>
                        )}
                        {canManageRecetas && receta.estadoProceso !== 'borrador' && (
                          <button onClick={() => handleReiniciarRecetaTarjeta(receta)} disabled={loading} title="Reiniciar"
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50">
                            <RotateCcw size={16} />
                          </button>
                        )}
                        {canDeleteProduccion && (
                          <button onClick={() => handleEliminar(receta._id)} title="Eliminar"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {recetas.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <ChefHat size={48} className="text-gray-300" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay recetas
          </h3>
          <p className="text-gray-500 mb-4">
            {canManageRecetas ? 'Comienza creando tu primera receta' : 'No tienes permisos para crear recetas'}
          </p>
          {canManageRecetas && (
            <button
              onClick={handleNuevaReceta}
              className="inline-flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors font-medium"
            >
              <Plus size={16} /> Crear Primera Receta
            </button>
          )}
        </div>
      )}

      {/* 🎯 NUEVO: Tabla de Historial General - Solo mostrar si hay recetas */}
      {recetas.length > 0 && (
        <div className="mt-8">
          <TablaHistorialGeneral 
            recetas={recetas} 
            onActualizar={cargarRecetas}
          />
        </div>
      )}

      {/* Modales */}
      {mostrarFormulario && (
        <FormularioReceta
          receta={recetaEditando}
          onGuardar={handleGuardarReceta}
          onCancelar={() => {
            setMostrarFormulario(false);
            setRecetaEditando(null);
          }}
        />
      )}

      {/* 🎯 NUEVO: Modal para editar información básica */}
      {mostrarFormularioBasico && (
        <FormularioBasicoReceta
          receta={recetaEditando}
          onGuardar={handleGuardarEdicionBasica}
          onCancelar={() => {
            setMostrarFormularioBasico(false);
            setRecetaEditando(null);
          }}
        />
      )}

      {mostrarVista && recetaSeleccionada && (
        <VistaReceta
          receta={recetaSeleccionada}
          recargarKey={recargarVistaKey}
          onCerrar={() => {
            setMostrarVista(false);
            setRecetaSeleccionada(null);
          }}
        />
      )}

      {mostrarModalAvanzar && recetaParaAvanzar && (
        <ModalAvanzarFase
          receta={recetaParaAvanzar}
          onConfirmar={handleConfirmarAvance}
          onCancelar={() => {
            setMostrarModalAvanzar(false);
            setRecetaParaAvanzar(null);
          }}
          isOpen={mostrarModalAvanzar}
        />
      )}
    </div>
  );
};

export default GestionRecetas;
