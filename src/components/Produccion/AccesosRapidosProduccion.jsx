import React, { useState, useEffect } from 'react';
import { Link, useLocation, useResolvedPath } from 'react-router-dom';
import { ClipboardList, Carrot, Package, FileText, Factory, TrendingUp, Trash2, BarChart3, BookOpen, ArrowRight, LayoutGrid, Orbit } from 'lucide-react';

// Importar servicios para estadísticas
import { ingredienteService } from '../../services/ingredienteService';
import { materialService } from '../../services/materialService';
import { recetaService } from '../../services/recetaService';
import { produccionService } from '../../services/produccionService';

// Importar el nuevo Sistema Solar
import { SistemaSolarProduccion } from './SistemaSolarProduccion';

// Importar hook de permisos
import { useQuickPermissions } from '../../hooks/useProduccionPermissions';

// Mapa centralizado de íconos Lucide por módulo
const iconMap = {
  catalogo: ClipboardList,
  ingredientes: Carrot,
  materiales: Package,
  recetas: FileText,
  produccion: Factory,
  graficos: TrendingUp,
  residuos: Trash2,
  movimientos: BarChart3,
  kardex: BookOpen,
};

const accesosCompletos = [
  {
    label: 'Catálogo de Producción',
    to: 'catalogo',
    color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-800 border-indigo-200',
    iconBg: 'bg-indigo-100/70',
    description: 'Ver productos del catálogo',
    requiereAdmin: false,
    requiereSuperAdmin: false
  },
  {
    label: 'Gestión de Ingredientes',
    to: 'ingredientes',
    color: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border-green-200',
    iconBg: 'bg-green-100/70',
    description: 'Administrar ingredientes',
    requiereAdmin: true,
    requiereSuperAdmin: true
  },
  {
    label: 'Gestión de Materiales',
    to: 'materiales',
    color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-800 border-yellow-200',
    iconBg: 'bg-yellow-100/70',
    description: 'Administrar materiales',
    requiereAdmin: true,
    requiereSuperAdmin: true
  },
  {
    label: 'Gestión de Recetas',
    to: 'recetas',
    color: 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-800 border-blue-200',
    iconBg: 'bg-blue-100/70',
    description: 'Crear y editar recetas',
    requiereAdmin: true,
    requiereSuperAdmin: false
  },
  {
    label: 'Gestión de Producción',
    to: 'produccion',
    color: 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-800 border-purple-200',
    iconBg: 'bg-purple-100/70',
    description: 'Procesos de producción',
    requiereAdmin: true,
    requiereSuperAdmin: false
  },
  {
    label: 'Gráficos de Producción',
    to: 'graficos',
    color: 'bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 text-cyan-800 border-cyan-200',
    iconBg: 'bg-cyan-100/70',
    description: 'Estadísticas y gráficos de producción',
    requiereAdmin: false,
    requiereSuperAdmin: false
  },
  {
    label: 'Residuos y Malogrados',
    to: 'residuos',
    color: 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-800 border-red-200',
    iconBg: 'bg-red-100/70',
    description: 'Gestión de residuos y productos malogrados',
    requiereAdmin: true,
    requiereSuperAdmin: false
  },
  {
    label: 'Movimientos de Inventario',
    to: 'movimientos',
    color: 'bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-800 border-orange-200',
    iconBg: 'bg-orange-100/70',
    description: 'Historial de movimientos',
    requiereAdmin: false,
    requiereSuperAdmin: false
  },
  {
    label: 'Kardex de Inventario',
    to: 'kardex',
    color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-800 border-indigo-200',
    iconBg: 'bg-indigo-100/70',
    description: 'Valuación PEPS y control de lotes',
    requiereAdmin: true,
    requiereSuperAdmin: true
  },
];

const AccesosRapidosProduccion = () => {
  const location = useLocation();
  
  // Hook de permisos para filtrar accesos según rol
  const { canManageRecetas, canViewPrices, isAdminOrAbove, isSuperAdmin } = useQuickPermissions();
  
  // Filtrar accesos según permisos del usuario
  const accesos = accesosCompletos.filter(acceso => {
    // Si requiere super_admin (ingredientes/materiales con precios)
    if (acceso.requiereSuperAdmin) {
      return isSuperAdmin; // Solo super_admin puede ver
    }
    // Si requiere admin (recetas, producción, residuos)
    if (acceso.requiereAdmin) {
      return isAdminOrAbove; // admin o super_admin pueden ver
    }
    // Acceso para todos (catálogo, gráficos, movimientos)
    return true;
  });
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalRecetas: '-',
    ingredientes: '-',
    enProduccion: '-',
    materiales: '-'
  });
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Estado para alternar entre vistas
  const [vistaActual, setVistaActual] = useState('tradicional'); // 'tradicional' | 'sistemaSolar'
  
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

  // Manejar click en planeta del sistema solar
  const handlePlanetaClick = (tipo) => {
    // Navegar directamente al módulo
    const pathParts = location.pathname.split('/');
    const produccionIdx = pathParts.findIndex(p => p === 'produccion');
    let basePath = '';
    if (produccionIdx !== -1) {
      basePath = pathParts.slice(0, produccionIdx + 1).join('/');
    } else {
      basePath = pathParts.slice(0, 2).join('/');
    }
    
    // Encontrar el acceso correspondiente
    const acceso = accesos.find(a => a.to === tipo);
    if (acceso) {
      window.location.href = basePath + '/' + acceso.to;
    }
  };

  // Si es vista de sistema solar, renderizar el componente nuevo
  if (vistaActual === 'sistemaSolar') {
    return (
      <div className="p-4 sm:p-6">
        {/* Header con toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Sistema de Producción
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Gestiona todos los aspectos de tu proceso de producción desde un solo lugar
            </p>
          </div>
          
          {/* Toggle de vista - responsive */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Vista:</span>
            <button
              onClick={() => setVistaActual('tradicional')}
              title="Vista Tradicional"
              className="px-2 sm:px-3 py-2 text-sm rounded-xl border transition-colors hover:bg-gray-50 flex items-center gap-1.5"
            >
              <span className="sm:hidden"><LayoutGrid size={18} /></span>
              <span className="hidden sm:inline flex items-center gap-1.5"><LayoutGrid size={16} /> Tradicional</span>
            </button>
            <button
              onClick={() => setVistaActual('sistemaSolar')}
              title="Vista Sistema Solar"
              className="px-2 sm:px-3 py-2 text-sm rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 flex items-center gap-1.5"
            >
              <span className="sm:hidden"><Orbit size={18} /></span>
              <span className="hidden sm:inline flex items-center gap-1.5"><Orbit size={16} /> Sistema Solar</span>
            </button>
          </div>
        </div>

        {/* Componente del Sistema Solar */}
        <SistemaSolarProduccion
          onPlanetaClick={handlePlanetaClick}
          mostrarEstadisticas={true}
          modoInteractivo={true}
        />
      </div>
    );
  }

  // Vista tradicional (código original)

  return (
    <div className="p-4 sm:p-6">
      {/* Header con toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Sistema de Producción
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gestiona todos los aspectos de tu proceso de producción desde un solo lugar
          </p>
        </div>
        
        {/* Toggle de vista - responsive */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Vista:</span>
          <button
            onClick={() => setVistaActual('tradicional')}
            title="Vista Tradicional"
            className="px-2 sm:px-3 py-2 text-sm rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 flex items-center gap-1.5"
          >
            <span className="sm:hidden"><LayoutGrid size={18} /></span>
            <span className="hidden sm:inline flex items-center gap-1.5"><LayoutGrid size={16} /> Tradicional</span>
          </button>
          <button
            onClick={() => setVistaActual('sistemaSolar')}
            title="Vista Sistema Solar"
            className="px-2 sm:px-3 py-2 text-sm rounded-xl border transition-colors hover:bg-gray-50 flex items-center gap-1.5"
          >
            <span className="sm:hidden"><Orbit size={18} /></span>
            <span className="hidden sm:inline flex items-center gap-1.5"><Orbit size={16} /> Sistema Solar</span>
          </button>
        </div>
      </div>

      {/* Grid de accesos rápidos */}
      {/* Móvil pequeño (<640px): grid 4 cols con solo iconos */}
      {/* Móvil grande/tablet (640px+): grid 2 cols con icono + texto */}
      {/* Desktop (1024px+): grid 3 cols con icono + texto */}
      <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-6">
        {accesos.map((acceso) => {
          const to = basePath + '/' + acceso.to;
          const isActive = location.pathname.startsWith(to);
          const IconComponent = iconMap[acceso.to];
          return (
            <Link
              key={acceso.to}
              to={to}
              title={acceso.label}
              className={`group relative overflow-hidden rounded-2xl border-2 p-2 sm:p-3 md:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] transform ${acceso.color} ${
                isActive 
                  ? 'ring-4 ring-blue-400 ring-opacity-50 shadow-lg scale-[1.02]' 
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              {/* Background decoration - oculto en móvil pequeño */}
              <div className="absolute top-0 right-0 w-12 h-12 md:w-20 md:h-20 opacity-[0.07] transform rotate-12 translate-x-3 md:translate-x-6 -translate-y-3 md:-translate-y-6 hidden sm:block">
                {IconComponent && <IconComponent size={64} />}
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Vista móvil pequeño: solo icono centrado */}
                <div className="flex sm:hidden flex-col items-center justify-center py-1">
                  <div className={`w-10 h-10 rounded-xl ${acceso.iconBg} flex items-center justify-center group-hover:bg-opacity-70 transition-all`}>
                    {IconComponent && <IconComponent size={20} />}
                  </div>
                  <span className="text-[10px] font-medium mt-1 text-center leading-tight line-clamp-2">
                    {acceso.label.split(' ').slice(-1)[0]}
                  </span>
                </div>
                
                {/* Vista tablet/desktop: icono + texto */}
                <div className="hidden sm:block">
                  <div className="flex items-center mb-2 md:mb-3">
                    <div className={`flex-shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-xl ${acceso.iconBg} flex items-center justify-center mr-2 md:mr-4 group-hover:bg-opacity-70 transition-all`}>
                      {IconComponent && <IconComponent size={20} className="md:hidden" />}
                      {IconComponent && <IconComponent size={26} className="hidden md:block" />}
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
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-1 sm:top-2 md:top-4 right-1 sm:right-2 md:right-4">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full shadow-sm"></div>
                  </div>
                )}
                
                {/* Hover arrow - solo en tablet/desktop */}
                <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                  <ArrowRight size={18} className="md:hidden" />
                  <ArrowRight size={20} className="hidden md:block" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick stats section */}
      <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-1.5 md:p-2 bg-blue-50 rounded-xl border border-blue-100">
              <BarChart3 size={18} className="text-blue-600" />
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
        
        <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-1.5 md:p-2 bg-green-50 rounded-xl border border-green-100">
              <Carrot size={18} className="text-green-600" />
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
        
        <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-1.5 md:p-2 bg-purple-50 rounded-xl border border-purple-100">
              <Factory size={18} className="text-purple-600" />
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
        
        <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-1.5 md:p-2 bg-yellow-50 rounded-xl border border-yellow-100">
              <Package size={18} className="text-yellow-600" />
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
