import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight, ClipboardList, Carrot, Package, FileText, Factory, Trash2, BarChart3, TrendingUp, BookOpen } from 'lucide-react';

// Mapa centralizado de íconos Lucide por módulo
const iconMap = {
  catalogo: ClipboardList,
  ingredientes: Carrot,
  materiales: Package,
  recetas: FileText,
  produccion: Factory,
  residuos: Trash2,
  movimientos: BarChart3,
  graficos: TrendingUp,
  kardex: BookOpen,
};

const modulosInfo = {
  'catalogo': {
    label: 'Catálogo de Producción',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
  },
  'ingredientes': {
    label: 'Gestión de Ingredientes',
    color: 'text-green-600 bg-green-50 border-green-100'
  },
  'materiales': {
    label: 'Gestión de Materiales',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-100'
  },
  'recetas': {
    label: 'Gestión de Recetas',
    color: 'text-blue-600 bg-blue-50 border-blue-100'
  },
  'produccion': {
    label: 'Gestión de Producción',
    color: 'text-purple-600 bg-purple-50 border-purple-100'
  },
  'residuos': {
    label: 'Residuos y Malogrados',
    color: 'text-red-600 bg-red-50 border-red-100'
  },
  'movimientos': {
    label: 'Movimientos de Inventario',
    color: 'text-orange-600 bg-orange-50 border-orange-100'
  },
  'graficos': {
    label: 'Gráficos de Inventario',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-100'
  },
  'kardex': {
    label: 'Kardex de Inventario',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
  }
};

// Labels cortos para los accesos rápidos
const moduloLabels = {
  catalogo: 'Catálogo',
  ingredientes: 'Ingredientes',
  materiales: 'Materiales',
  recetas: 'Recetas',
  produccion: 'Producción',
  residuos: 'Residuos',
  movimientos: 'Movimientos',
  graficos: 'Gráficos',
  kardex: 'Kardex',
};

// Genera dinámicamente los accesos rápidos excluyendo el módulo actual
const getAccesosRapidos = (currentModule) =>
  Object.keys(modulosInfo)
    .filter((key) => key !== currentModule)
    .map((key) => ({ to: key, label: moduloLabels[key] || modulosInfo[key].label }));

// Helper para obtener el ícono Lucide del módulo
const getModuleIcon = (moduleKey, size = 14) => {
  const IconComponent = iconMap[moduleKey];
  return IconComponent ? <IconComponent size={size} /> : null;
};

const BreadcrumbProduccion = ({ showQuickAccess = true }) => {
  const location = useLocation();
  
  // Extraer información de la ruta actual
  const pathParts = location.pathname.split('/').filter(Boolean);
  const produccionIdx = pathParts.findIndex(p => p === 'produccion');
  
  if (produccionIdx === -1) return null;
  
  const basePath = pathParts.slice(0, produccionIdx + 1).join('/');
  const currentModule = pathParts[produccionIdx + 1];
  const subRoute = pathParts[produccionIdx + 2];
  
  const moduleInfo = modulosInfo[currentModule];
  const quickAccess = currentModule ? getAccesosRapidos(currentModule) : [];

  return (
    <div className="bg-white border-b border-gray-200 mb-4 md:mb-6">
      <div className="px-4 md:px-6 py-3">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm">
          <Link 
            to={`/${basePath}`}
            className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Sistema de Producción</span>
            <span className="sm:hidden">Producción</span>
          </Link>
          
          {moduleInfo && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${moduleInfo.color}`}>
                  {getModuleIcon(currentModule, 14)}
                  <span className="hidden sm:inline">{moduleInfo.label}</span>
                  <span className="sm:hidden">{moduleInfo.label.split(' ')[1] || moduleInfo.label}</span>
                </span>
              </div>
            </>
          )}
          
          {subRoute && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="text-gray-700 font-medium capitalize">
                {subRoute.replace('-', ' ')}
              </span>
            </>
          )}
        </nav>

        {/* Quick Access Actions - Solo en móvil como dropdown, en desktop como botones */}
        {showQuickAccess && quickAccess.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {/* Desktop - Botones horizontales */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 mr-2">Acceso rápido:</span>
              {quickAccess.map((item) => (
                <Link
                  key={item.to}
                  to={`/${basePath}/${item.to}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-xs font-medium rounded-xl transition-colors"
                >
                  {getModuleIcon(item.to, 13)}
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile - Selector compacto */}
            <div className="md:hidden">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ir a otro módulo:
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/${basePath}/${e.target.value}`;
                  }
                }}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                defaultValue=""
              >
                <option value="">Seleccionar módulo...</option>
                {quickAccess.map((item) => (
                  <option key={item.to} value={item.to}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreadcrumbProduccion;
