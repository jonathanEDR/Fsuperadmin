import React, { useState, useEffect } from 'react';
import AccesosRapidosProduccion from '../AccesosRapidosProduccion';
import { recetaService } from '../../../services/recetaService';
import FormularioReceta from './FormularioReceta';
import VistaReceta from './VistaReceta';
import ModalAvanzarFase from './ModalAvanzarFase';

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
  const [mostrarVista, setMostrarVista] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  
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
    setMostrarFormulario(true);
  };

  const handleVerReceta = (receta) => {
    setRecetaSeleccionada(receta);
    setMostrarVista(true);
  };

  const handleGuardarReceta = async (datos) => {
    try {
      console.log('📋 Datos a enviar:', datos);
      console.log('🔍 Validando estructura de datos...');
      
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
        await recetaService.crearReceta(datos);
      }
      
      setMostrarFormulario(false);
      setRecetaEditando(null);
      cargarRecetas();
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

  const handleDesactivar = async (id) => {
    try {
      if (window.confirm('¿Estás seguro de que quieres desactivar esta receta?')) {
        await recetaService.desactivarReceta(id);
        cargarRecetas();
      }
    } catch (err) {
      setError('Error al desactivar receta: ' + err.message);
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

  // Verificar si puede avanzar de fase
  const puedeAvanzarFase = (receta) => {
    const faseActual = receta.faseActual || receta.categoria || 'preparado';
    const estadoProceso = receta.estadoProceso || 'borrador';
    const fases = ['preparado', 'intermedio', 'terminado'];
    const indiceActual = fases.indexOf(faseActual);
    
    return estadoProceso === 'en_proceso' && 
           indiceActual < fases.length - 1 && 
           (receta.puedeAvanzar !== false);
  };

  // Obtener siguiente fase
  const obtenerSiguienteFase = (receta) => {
    const faseActual = receta.faseActual || receta.categoria || 'preparado';
    const fases = ['preparado', 'intermedio', 'terminado'];
    const indiceActual = fases.indexOf(faseActual);
    return indiceActual < fases.length - 1 ? fases[indiceActual + 1] : null;
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gestión de Recetas</h1>
        <button
          onClick={handleNuevaReceta}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          Nueva Receta
        </button>
      </div>
      <AccesosRapidosProduccion />

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filtros.buscar}
              onChange={(e) => handleFiltroChange('buscar', e.target.value)}
              placeholder="Nombre de la receta..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.activo}
              onChange={(e) => handleFiltroChange('activo', e.target.value === 'true')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
          const faseActual = receta.faseActual || receta.categoria || 'preparado';
          const estadoProceso = receta.estadoProceso || 'borrador';
          const siguienteFase = obtenerSiguienteFase(receta);
          const puedeAvanzar = puedeAvanzarFase(receta);
          
          return (
            <div key={receta._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              
              {/* Header con nombre y fase */}
              <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-4 py-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {receta.nombre}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{obtenerEmojiFase(faseActual)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${obtenerColorPorFase(faseActual)}`}>
                      {faseActual.toUpperCase()}
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
                          estadoProceso === 'completado' && faseActual === 'terminado'
                            ? 'bg-green-400'
                            : faseActual === fase
                            ? 'bg-blue-400'
                            : index < ['preparado', 'intermedio', 'terminado'].indexOf(faseActual)
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>⏭️</span>
                      <span>Avanzar a {siguienteFase?.toUpperCase()}</span>
                    </button>
                  )}
                  
                  {estadoProceso === 'en_proceso' && !puedeAvanzar && faseActual !== 'terminado' && (
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

                {/* Botones de gestión tradicional */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleVerReceta(receta)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver Detalles
                  </button>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleEditarReceta(receta)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDesactivar(receta._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Desactivar
                    </button>
                  </div>
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

      {mostrarVista && recetaSeleccionada && (
        <VistaReceta
          receta={recetaSeleccionada}
          onCerrar={() => {
            setMostrarVista(false);
            setRecetaSeleccionada(null);
          }}
          onEditar={() => {
            setMostrarVista(false);
            handleEditarReceta(recetaSeleccionada);
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
