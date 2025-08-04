import React, { useState, useEffect } from 'react';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import BreadcrumbProduccion from '../BreadcrumbProduccion';
import { recetaService } from '../../../services/recetaService';
import FormularioReceta from './FormularioReceta';
import FormularioBasicoReceta from './FormularioBasicoReceta';
import VistaReceta from './VistaReceta';
import ModalAvanzarFase from './ModalAvanzarFase';
import TablaHistorialGeneral from './TablaHistorialGeneral';

const GestionRecetas = () => {
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
      
      // 🔍 DEBUG: Ver qué datos llegan del backend
      console.log('🔍 DEBUG - Datos del backend:', response.data);
      if (response.data.length > 0) {
        console.log('🔍 DEBUG - Primera receta ejemplo:', response.data[0]);
        console.log('🔍 DEBUG - Categoría de primera receta:', response.data[0].categoria);
      }
      
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
      
      // Verificar que todos los ingredientes tienen IDs válidos
      const ingredientesInvalidos = datos.ingredientes.filter(ing => 
        !ing.ingrediente || ing.ingrediente.length !== 24
      );
      
      if (ingredientesInvalidos.length > 0) {
        throw new Error('Uno o más ingredientes seleccionados no son válidos. Por favor, seleccione ingredientes de la lista.');
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

  // Obtener emoji por fase
  const obtenerEmojiFase = (fase) => {
    switch (fase) {
      case 'preparado': return '🥄';
      case 'intermedio': return '⚗️';
      case 'terminado': return '✅';
      default: return '📋';
    }
  };

  // Obtener emoji por estado
  const obtenerEmojiEstado = (estado) => {
    switch (estado) {
      case 'borrador': return '📝';
      case 'en_proceso': return '⚙️';
      case 'completado': return '✅';
      case 'pausado': return '⏸️';
      default: return '📋';
    }
  };

  // Obtener color del botón según la fase
  const obtenerColorBotonFase = (siguienteFase) => {
    switch (siguienteFase) {
      case 'producto_intermedio':
        return 'bg-yellow-600 hover:bg-yellow-700'; // Amarillo para intermedio
      case 'producto_terminado':
        return 'bg-green-600 hover:bg-green-700';   // Verde para terminado
      default:
        return 'bg-blue-600 hover:bg-blue-700';     // Azul por defecto
    }
  };

  // Obtener emoji para la siguiente fase
  const obtenerEmojiSiguienteFase = (siguienteFase) => {
    switch (siguienteFase) {
      case 'producto_intermedio':
        return '⚗️';
      case 'producto_terminado':
        return '🏁';
      default:
        return '⏭️';
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-6 py-4">
      <BreadcrumbProduccion />
      
      {/* 🎯 OPTIMIZADO: Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestión de Recetas</h1>
        <button
          onClick={handleNuevaReceta}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors w-full sm:w-auto font-medium text-sm sm:text-base"
        >
          ➕ Nueva Receta
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* 🎯 SUPER OPTIMIZADO: Filtros ultra compactos - máximo 2 filas */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Buscar Receta
            </label>
            <input
              type="text"
              value={filtros.buscar}
              onChange={(e) => handleFiltroChange('buscar', e.target.value)}
              placeholder="Nombre de la receta..."
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📊 Estado
            </label>
            <select
              value={filtros.activo}
              onChange={(e) => handleFiltroChange('activo', e.target.value === 'true')}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Recetas con Flujo de Trabajo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {recetas.map((receta) => {
          // 🎯 CORRECCIÓN: Usar categoria como fuente de verdad principal
          const categoriaOriginal = receta.categoria || 'preparado';
          const faseNormalizada = normalizarCategoria(categoriaOriginal);
          const estadoProceso = receta.estadoProceso || 'borrador';
          const siguienteFase = obtenerSiguienteFase(receta);
          const puedeAvanzar = puedeAvanzarFase(receta);
          
          // 🔍 DEBUG: Ver el mapeo de cada receta
          console.log(`🔍 DEBUG receta "${receta.nombre}":`, {
            'DB categoria': receta.categoria,
            'DB faseActual': receta.faseActual,
            categoriaOriginal,
            faseNormalizada,
            estadoProceso,
            siguienteFase,
            puedeAvanzar
          });
          
          return (
            <div key={receta._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              
              {/* Header con nombre y fase */}
              <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-4 py-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {receta.nombre}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{obtenerEmojiFase(faseNormalizada)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${obtenerColorPorFase(faseNormalizada)}`}>
                      {categoriaOriginal.replace('producto_', '').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Estado del proceso */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{obtenerEmojiEstado(estadoProceso)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    estadoProceso === 'completado' ? 'bg-green-100 text-green-700' :
                    estadoProceso === 'en_proceso' ? 'bg-blue-100 text-blue-700' :
                    estadoProceso === 'pausado' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {estadoProceso.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                {/* Progreso visual */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Prep.</span>
                    <span>Inter.</span>
                    <span>Term.</span>
                  </div>
                  <div className="flex gap-1">
                    {['preparado', 'intermedio', 'terminado'].map((fase, index) => (
                      <div
                        key={fase}
                        className={`flex-1 h-2 rounded ${
                          estadoProceso === 'completado' && faseNormalizada === 'terminado'
                            ? 'bg-green-400'
                            : faseNormalizada === fase
                            ? 'bg-blue-400'
                            : index < ['preparado', 'intermedio', 'terminado'].indexOf(faseNormalizada)
                            ? 'bg-green-300'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Información de la receta */}
              <div className="p-4">
                {receta.descripcion && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {receta.descripcion}
                  </p>
                )}

                {/* Detalles de la receta */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">⏱️ Preparación:</span>
                    <p className="font-medium">{receta.tiempoPreparacion || 0} min</p>
                  </div>
                  <div>
                    <span className="text-gray-500">📦 Rendimiento:</span>
                    <p className="font-medium">
                      {receta.rendimiento?.cantidad || 1} {receta.rendimiento?.unidadMedida || 'unidad'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">🧪 Ingredientes:</span>
                    <p className="font-medium">{receta.ingredientes?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">📈 Disponible:</span>
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${
                        (receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0) > 0 
                          ? 'text-green-600' 
                          : 'text-gray-500'
                      }`}>
                        {(receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción del flujo de trabajo */}
                <div className="space-y-2 mb-4">
                  {estadoProceso === 'borrador' && (
                    <button
                      onClick={() => handleIniciarProceso(receta._id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🚀</span>
                      <span>Iniciar Proceso</span>
                    </button>
                  )}
                  
                  {puedeAvanzar && (
                    <button
                      onClick={() => handleAbrirModalAvanzar(receta)}
                      className={`w-full ${obtenerColorBotonFase(siguienteFase)} text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2`}
                    >
                      <span>{obtenerEmojiSiguienteFase(siguienteFase)}</span>
                      <span>Avanzar a {siguienteFase?.replace('producto_', '').toUpperCase()}</span>
                    </button>
                  )}
                  
                  {estadoProceso === 'en_proceso' && !puedeAvanzar && faseNormalizada !== 'terminado' && (
                    <button
                      onClick={() => handlePausarProceso(receta._id)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>⏸️</span>
                      <span>Pausar Proceso</span>
                    </button>
                  )}
                  
                  {estadoProceso === 'pausado' && (
                    <button
                      onClick={() => handleReanudarProceso(receta._id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>▶️</span>
                      <span>Reanudar Proceso</span>
                    </button>
                  )}
                  
                  {estadoProceso === 'completado' && (
                    <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center font-medium">
                      ✅ Proceso Completado
                    </div>
                  )}
                </div>

                {/* 🎯 OPTIMIZADO: Botones compactos para móvil - 2 filas máximo */}
                <div className="pt-2 border-t space-y-2">
                  {/* Fila 1: Botones principales */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleVerReceta(receta)}
                      className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium py-1 px-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                    >
                      👁️ Ver
                    </button>
                    <button
                      onClick={() => handleEditarReceta(receta)}
                      className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium py-1 px-2 border border-green-200 rounded hover:bg-green-50 transition-colors"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                  
                  {/* Fila 2: Botones secundarios (solo si es necesario) */}
                  {(receta.estadoProceso !== 'borrador' || true) && (
                    <div className="grid grid-cols-2 gap-2">
                      {receta.estadoProceso !== 'borrador' && (
                        <button
                          onClick={() => handleReiniciarRecetaTarjeta(receta)}
                          disabled={loading}
                          className="px-2 py-1 bg-orange-100 text-orange-700 border border-orange-300 rounded text-xs sm:text-sm font-medium hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Reiniciar receta al estado preparado"
                        >
                          🔄 Reiniciar
                        </button>
                      )}
                      <button
                        onClick={() => handleEliminar(receta._id)}
                        className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium py-1 px-2 border border-red-200 rounded hover:bg-red-50 transition-colors"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {recetas.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay recetas
          </h3>
          <p className="text-gray-500 mb-4">
            Comienza creando tu primera receta
          </p>
          <button
            onClick={handleNuevaReceta}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Crear Primera Receta
          </button>
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
