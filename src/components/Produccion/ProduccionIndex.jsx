import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { estadisticasService } from '../../services/estadisticasService';

const ProduccionIndex = () => {
  const [estadisticas, setEstadisticas] = useState({
    ingredientesActivos: 0,
    recetasDisponibles: 0,
    produccionesCompletadas: 0,
    movimientosHoy: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await estadisticasService.obtenerEstadisticasDashboard();
      
      if (response.success) {
        setEstadisticas(response.data);
      } else {
        setError('Error al cargar las estadísticas');
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Datos de estadísticas dinámicas
  const estadisticasDisplay = [
    { 
      titulo: 'Ingredientes Activos', 
      valor: loading ? '...' : estadisticas.ingredientesActivos?.toString() || '0', 
      color: 'text-green-600' 
    },
    { 
      titulo: 'Recetas Disponibles', 
      valor: loading ? '...' : estadisticas.recetasDisponibles?.toString() || '0', 
      color: 'text-blue-600' 
    },
    { 
      titulo: 'Producciones Completadas', 
      valor: loading ? '...' : estadisticas.produccionesCompletadas?.toString() || '0', 
      color: 'text-purple-600' 
    },
    { 
      titulo: 'Movimientos Hoy', 
      valor: loading ? '...' : estadisticas.movimientosHoy?.toString() || '0', 
      color: 'text-orange-600' 
    }
  ];

  const modulos = [
    {
      titulo: 'Gestión de Ingredientes',
      descripcion: 'Administra el inventario de ingredientes, ajustes de stock y movimientos',
      enlace: 'ingredientes',
      icono: '🥬',
      color: 'bg-green-100 hover:bg-green-200 border-green-300'
    },
    {
      titulo: 'Gestión de Recetas',
      descripcion: 'Crea y administra recetas de productos con sus ingredientes y procesos',
      enlace: 'recetas',
      icono: '📝',
      color: 'bg-blue-100 hover:bg-blue-200 border-blue-300'
    },
    {
      titulo: 'Gestión de Producción',
      descripcion: 'Planifica, ejecuta y controla las órdenes de producción',
      enlace: 'produccion',
      icono: '🏭',
      color: 'bg-purple-100 hover:bg-purple-200 border-purple-300'
    },
    {
      titulo: 'Movimientos de Inventario',
      descripcion: 'Consulta el historial y auditoría de movimientos de inventario',
      enlace: 'movimientos',
      icono: '📊',
      color: 'bg-orange-100 hover:bg-orange-200 border-orange-300'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Módulo de Producción
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Sistema integral de gestión de producción, inventario de ingredientes y control de recetas
            </p>
          </div>
          <button
            onClick={cargarEstadisticas}
            disabled={loading}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{loading ? '🔄' : '🔄'}</span>
            <span className="text-sm sm:text-base">{loading ? 'Cargando...' : 'Actualizar'}</span>
          </button>
        </div>
        {error && (
          <div className="mt-3 p-2 sm:p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
            {error}
          </div>
        )}
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {estadisticasDisplay.map((stat, index) => (
          <div key={index} className="bg-white p-3 sm:p-6 rounded-lg shadow-md border">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.titulo}</p>
                <p className={`text-xl sm:text-2xl font-bold ${stat.color} ${loading ? 'animate-pulse' : ''}`}>
                  {stat.valor}
                </p>
              </div>
              <div className="text-xl sm:text-2xl opacity-60">
                {index === 0 && '🥬'}
                {index === 1 && '📝'}
                {index === 2 && '🏭'}
                {index === 3 && '📊'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Módulos Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {modulos.map((modulo, index) => (
          <Link
            key={index}
            to={modulo.enlace}
            className={`block p-3 sm:p-6 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${modulo.color}`}
          >
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="text-2xl sm:text-4xl">{modulo.icono}</div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                  {modulo.titulo}
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  {modulo.descripcion}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Accesos Rápidos */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
          <Link
            to="ingredientes/nuevo"
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">➕</span>
            <span className="font-medium text-green-800 text-sm sm:text-base">Nuevo Ingrediente</span>
          </Link>
          <Link
            to="recetas/nueva"
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">📋</span>
            <span className="font-medium text-blue-800 text-sm sm:text-base">Nueva Receta</span>
          </Link>
          <Link
            to="produccion/nueva"
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">🚀</span>
            <span className="font-medium text-purple-800 text-sm sm:text-base">Nueva Producción</span>
          </Link>
        </div>
      </div>

      {/* Información del Sistema */}
      <div className="mt-6 sm:mt-8 bg-gray-50 rounded-lg p-3 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Funcionalidades del Módulo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Gestión de Ingredientes</h3>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li>• Control de inventario en tiempo real</li>
              <li>• Ajustes manuales de stock</li>
              <li>• Historial de movimientos</li>
              <li>• Alertas de stock bajo</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Gestión de Recetas</h3>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li>• Creación de recetas detalladas</li>
              <li>• Cálculo automático de costos</li>
              <li>• Control de rendimientos</li>
              <li>• Instrucciones de preparación</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Control de Producción</h3>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li>• Planificación de órdenes</li>
              <li>• Ejecución automática</li>
              <li>• Control de calidad</li>
              <li>• Trazabilidad completa</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Auditoría y Reportes</h3>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li>• Historial completo de movimientos</li>
              <li>• Reportes de producción</li>
              <li>• Análisis de consumos</li>
              <li>• Indicadores de eficiencia</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProduccionIndex;
