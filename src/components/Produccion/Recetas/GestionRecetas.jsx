import React, { useState, useEffect } from 'react';
import { recetaService } from '../../../services/recetaService';
import FormularioReceta from './FormularioReceta';
import VistaReceta from './VistaReceta';
import TablaRecetasTerminadas from './TablaRecetasTerminadas';

const GestionRecetas = () => {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    buscar: '',
    categoria: '',
    activo: true
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [recetaEditando, setRecetaEditando] = useState(null);
  const [mostrarVista, setMostrarVista] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);

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
      console.log('📝 Guardando receta:', datos);
      
      if (recetaEditando) {
        console.log('🔧 Actualizando receta existente:', recetaEditando._id);
        const response = await recetaService.actualizarReceta(recetaEditando._id, datos);
        console.log('✅ Receta actualizada:', response);
      } else {
        console.log('🆕 Creando nueva receta');
        const response = await recetaService.crearReceta(datos);
        console.log('✅ Receta creada:', response);
      }
      
      setMostrarFormulario(false);
      setRecetaEditando(null);
      cargarRecetas();
      setError('');
    } catch (err) {
      console.error('❌ Error al guardar receta:', err);
      
      // Extraer mensaje de error más específico
      let mensajeError = 'Error desconocido';
      
      if (err.response?.data?.message) {
        mensajeError = err.response.data.message;
      } else if (err.message) {
        mensajeError = err.message;
      }
      
      setError(`Error al guardar receta: ${mensajeError}`);
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

  const getCategoriaColor = (categoria) => {
    const colores = {
      producto_terminado: 'bg-green-100 text-green-800',
      producto_intermedio: 'bg-yellow-100 text-yellow-800',
      preparado: 'bg-blue-100 text-blue-800'
    };
    return colores[categoria] || 'bg-gray-100 text-gray-800';
  };

  const getCategoriaLabel = (categoria) => {
    const labels = {
      producto_terminado: 'Producto Terminado',
      producto_intermedio: 'Producto Intermedio',
      preparado: 'Preparado'
    };
    return labels[categoria] || categoria;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Recetas</h1>
        <button
          onClick={handleNuevaReceta}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Nueva Receta
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Categoría
            </label>
            <select
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="producto_terminado">Producto Terminado</option>
              <option value="producto_intermedio">Producto Intermedio</option>
              <option value="preparado">Preparado</option>
            </select>
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

      {/* Lista de Recetas */}

      {/* Lista de Recetas Disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recetas.filter(receta => ((receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0)) > 0).map((receta) => (
          <div key={receta._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {receta.nombre}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(receta.categoria)}`}>
                  {getCategoriaLabel(receta.categoria)}
                </span>
              </div>

              {receta.descripcion && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {receta.descripcion}
                </p>
              )}

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {/* Información de costos */}
                {tieneCostos(receta) ? (
                  <>
                    <div className="flex justify-between">
                      <span>Costo Total:</span>
                      <span className="font-medium text-gray-700">
                        S/.{calcularCostoTotal(receta).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio Unitario:</span>
                      <span className="font-medium text-blue-700">
                        S/.{calcularPrecioUnitario(receta).toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>Precio Unitario:</span>
                    <span className="font-medium text-gray-400 text-xs">
                      Sin precios de ingredientes
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Ingredientes:</span>
                  <span className="font-medium">{receta.ingredientes?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rendimiento:</span>
                  <span className="font-medium">
                    {receta.rendimiento?.cantidad} {receta.rendimiento?.unidadMedida}
                  </span>
                </div>
                {receta.tiempoPreparacion > 0 && (
                  <div className="flex justify-between">
                    <span>Tiempo:</span>
                    <span className="font-medium">{receta.tiempoPreparacion} min</span>
                  </div>
                )}
                
                {/* Información de inventario */}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span>Producido:</span>
                    <span className="font-medium text-green-600">
                      {receta.inventario?.cantidadProducida || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilizado:</span>
                    <span className="font-medium text-red-600">
                      {receta.inventario?.cantidadUtilizada || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disponible:</span>
                    <span className={`font-medium ${
                      (receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0) > 0 
                        ? 'text-blue-600' 
                        : 'text-gray-500'
                    }`}>
                      {(receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleVerReceta(receta)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver Detalles
                </button>
                <div className="space-x-2">
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
        ))}
      </div>

      {/* Tabla de Recetas Terminadas */}
      <TablaRecetasTerminadas recetas={recetas} />

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
    </div>
  );
};

export default GestionRecetas;
