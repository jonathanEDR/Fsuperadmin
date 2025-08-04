import React, { useState, useEffect } from 'react';
import { Link, useLocation, useResolvedPath } from 'react-router-dom';

// Importar servicios para estadísticas
import { ingredienteService } from '../../services/ingredienteService';
import { materialService } from '../../services/materialService';
import { recetaService } from '../../services/recetaService';
import { produccionService } from '../../services/produccionService';


const accesos = [
  {
    label: 'Catálogo de Producción',
    to: 'catalogo',
    icon: '📋',
    color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-800 border-indigo-200',
    description: 'Ver productos del catálogo'
  },
  {
    label: 'Gestión de Ingredientes',
    to: 'ingredientes',
    icon: '🥬',
    color: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border-green-200',
    description: 'Administrar ingredientes'
  },
  {
    label: 'Gestión de Materiales',
    to: 'materiales',
    icon: '📦',
    color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-800 border-yellow-200',
    description: 'Administrar materiales'
  },
  {
    label: 'Gestión de Recetas',
    to: 'recetas',
    icon: '📝',
    color: 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 border-blue-200',
    description: 'Crear y editar recetas'
  },
  {
    label: 'Gestión de Producción',
    to: 'produccion',
    icon: '🏭',
    color: 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-800 border-purple-200',
    description: 'Procesos de producción'
  },
  {
    label: 'Residuos y Malogrados',
    to: 'residuos',
    icon: '🗑️',
    color: 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-800 border-red-200',
    description: 'Gestión de residuos y productos malogrados'
  },
  {
    label: 'Movimientos de Inventario',
    to: 'movimientos',
    icon: '📊',
    color: 'bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-800 border-orange-200',
    description: 'Historial de movimientos'
  },
];

const AccesosRapidosProduccion = () => {
  const location = useLocation();
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalRecetas: '-',
    ingredientes: '-',
    enProduccion: '-',
    materiales: '-'
  });
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Buscar el segmento '/produccion' en la ruta actual
  const pathParts = location.pathname.split('/');
  const produccionIdx = pathParts.findIndex(p => p === 'produccion');
  let basePath = '';
  if (produccionIdx !== -1) {
    basePath = pathParts.slice(0, produccionIdx + 1).join('/');
  } else {
    // fallback: usar los dos primeros segmentos
    basePath = pathParts.slice(0, 2).join('/');
  }

  // Cargar estadísticas reales
  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoadingStats(true);
        
        // Cargar datos en paralelo
        const [
          ingredientesRes,
          materialesRes,
          recetasRes,
          produccionesRes
        ] = await Promise.all([
          ingredienteService.obtenerIngredientes({ activo: true }).catch(() => ({ data: [] })),
          materialService.obtenerMateriales({ activo: true }).catch(() => ({ data: [] })),
          recetaService.obtenerRecetas({ activo: true }).catch(() => ({ data: [] })),
          produccionService.obtenerProducciones({ estado: 'en_proceso' }).catch(() => ({ data: { producciones: [] } }))
        ]);

        // Calcular estadísticas
        const ingredientesActivos = ingredientesRes.data?.filter(ing => 
          (ing.cantidad - (ing.procesado || 0)) > 0
        ).length || 0;

        const materialesActivos = materialesRes.data?.filter(mat => 
          (mat.cantidad - (mat.utilizado || 0)) > 0
        ).length || 0;

        const recetasDisponibles = recetasRes.data?.filter(rec => 
          (rec.inventario?.cantidadProducida || 0) > 0
        ).length || 0;

        const produccionesEnProceso = produccionesRes.data?.producciones?.length || 0;

        setEstadisticas({
          totalRecetas: recetasRes.data?.length || 0,
          ingredientes: ingredientesActivos,
          enProduccion: produccionesEnProceso,
          materiales: materialesActivos
        });
        
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    cargarEstadisticas();
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Producción
        </h1>
        <p className="text-gray-600">
          Gestiona todos los aspectos de tu proceso de producción desde un solo lugar
        </p>
      </div>

      {/* Grid de accesos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {accesos.map((acceso) => {
          const to = basePath + '/' + acceso.to;
          const isActive = location.pathname.startsWith(to);
          return (
            <Link
              key={acceso.to}
              to={to}
              className={`group relative overflow-hidden rounded-xl border-2 p-3 md:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform ${acceso.color} ${
                isActive 
                  ? 'ring-4 ring-blue-400 ring-opacity-50 shadow-lg scale-[1.02]' 
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-12 h-12 md:w-20 md:h-20 opacity-10 transform rotate-12 translate-x-3 md:translate-x-6 -translate-y-3 md:-translate-y-6">
                <span className="text-3xl md:text-6xl">{acceso.icon}</span>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center mb-2 md:mb-3">
                  <div className="flex-shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-lg bg-white bg-opacity-50 flex items-center justify-center mr-2 md:mr-4 group-hover:bg-opacity-70 transition-all">
                    <span className="text-sm md:text-2xl">{acceso.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs md:text-lg leading-tight text-left">
                      {acceso.label}
                    </h3>
                  </div>
                </div>
                
                <p className="text-xs md:text-sm opacity-75 group-hover:opacity-90 transition-opacity line-clamp-2">
                  {acceso.description}
                </p>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-2 md:top-4 right-2 md:right-4">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full shadow-sm"></div>
                  </div>
                )}
                
                {/* Hover arrow */}
                <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick stats section */}
      <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-1 md:p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-sm md:text-base">📊</span>
            </div>
            <div className="ml-2 md:ml-3 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Total Recetas</p>
              <p className="text-sm md:text-lg font-semibold text-gray-900">
                {loadingStats ? (
                  <span className="animate-pulse bg-gray-200 h-4 w-8 rounded inline-block"></span>
                ) : (
                  estadisticas.totalRecetas
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-1 md:p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-sm md:text-base">🥬</span>
            </div>
            <div className="ml-2 md:ml-3 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Ingredientes</p>
              <p className="text-sm md:text-lg font-semibold text-gray-900">
                {loadingStats ? (
                  <span className="animate-pulse bg-gray-200 h-4 w-8 rounded inline-block"></span>
                ) : (
                  estadisticas.ingredientes
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-1 md:p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-sm md:text-base">🏭</span>
            </div>
            <div className="ml-2 md:ml-3 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">En Producción</p>
              <p className="text-sm md:text-lg font-semibold text-gray-900">
                {loadingStats ? (
                  <span className="animate-pulse bg-gray-200 h-4 w-8 rounded inline-block"></span>
                ) : (
                  estadisticas.enProduccion
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border">
          <div className="flex items-center">
            <div className="p-1 md:p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-sm md:text-base">📦</span>
            </div>
            <div className="ml-2 md:ml-3 min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Materiales</p>
              <p className="text-sm md:text-lg font-semibold text-gray-900">
                {loadingStats ? (
                  <span className="animate-pulse bg-gray-200 h-4 w-8 rounded inline-block"></span>
                ) : (
                  estadisticas.materiales
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccesosRapidosProduccion;
