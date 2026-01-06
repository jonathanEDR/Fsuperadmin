import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Iconos SVG simples para evitar dependencias
const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const modulosInfo = {
  'catalogo': {
    label: 'Catálogo de Producción',
    icon: '📋',
    color: 'text-indigo-600 bg-indigo-50'
  },
  'ingredientes': {
    label: 'Gestión de Ingredientes',
    icon: '🥬',
    color: 'text-green-600 bg-green-50'
  },
  'materiales': {
    label: 'Gestión de Materiales',
    icon: '📦',
    color: 'text-yellow-600 bg-yellow-50'
  },
  'recetas': {
    label: 'Gestión de Recetas',
    icon: '📝',
    color: 'text-blue-600 bg-blue-50'
  },
  'produccion': {
    label: 'Gestión de Producción',
    icon: '🏭',
    color: 'text-purple-600 bg-purple-50'
  },
  'residuos': {
    label: 'Residuos y Malogrados',
    icon: '🗑️',
    color: 'text-red-600 bg-red-50'
  },
  'movimientos': {
    label: 'Movimientos de Inventario',
    icon: '📊',
    color: 'text-orange-600 bg-orange-50'
  },
  'graficos': {
    label: 'Gráficos de Inventario',
    icon: '📈',
    color: 'text-cyan-600 bg-cyan-50'
  }
};

const accesosRapidos = {
  'catalogo': [
    { to: 'ingredientes', label: 'Ingredientes', icon: '🥬' },
    { to: 'recetas', label: 'Recetas', icon: '📝' },
    { to: 'produccion', label: 'Producción', icon: '🏭' }
  ],
  'ingredientes': [
    { to: 'catalogo', label: 'Catálogo', icon: '📋' },
    { to: 'recetas', label: 'Recetas', icon: '📝' },
    { to: 'materiales', label: 'Materiales', icon: '📦' }
  ],
  'materiales': [
    { to: 'catalogo', label: 'Catálogo', icon: '📋' },
    { to: 'ingredientes', label: 'Ingredientes', icon: '🥬' },
    { to: 'produccion', label: 'Producción', icon: '🏭' }
  ],
  'recetas': [
    { to: 'catalogo', label: 'Catálogo', icon: '📋' },
    { to: 'ingredientes', label: 'Ingredientes', icon: '🥬' },
    { to: 'produccion', label: 'Producción', icon: '🏭' }
  ],
  'produccion': [
    { to: 'catalogo', label: 'Catálogo', icon: '📋' },
    { to: 'ingredientes', label: 'Ingredientes', icon: '🥬' },
    { to: 'recetas', label: 'Recetas', icon: '📝' }
  ],
  'residuos': [
    { to: 'catalogo', label: 'Catálogo', icon: '📋' },
    { to: 'ingredientes', label: 'Ingredientes', icon: '🥬' },
    { to: 'produccion', label: 'Producción', icon: '🏭' }
  ],
  'movimientos': [
    { to: 'catalogo', label: 'Catálogo', icon: '📋' },
    { to: 'ingredientes', label: 'Ingredientes', icon: '🥬' },
    { to: 'produccion', label: 'Producción', icon: '🏭' }
  ],
  'graficos': [
    { to: 'catalogo', label: 'Catálogo', icon: '📋' },
    { to: 'ingredientes', label: 'Ingredientes', icon: '🥬' },
    { to: 'produccion', label: 'Producción', icon: '🏭' }
  ]
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
  const quickAccess = accesosRapidos[currentModule] || [];

  return (
    <div className="bg-white border-b border-gray-200 mb-4 md:mb-6">
      <div className="px-4 md:px-6 py-3">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm">
          <Link 
            to={`/${basePath}`}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema de Producción</span>
            <span className="sm:hidden">Producción</span>
          </Link>
          
          {moduleInfo && (
            <>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${moduleInfo.color}`}>
                  <span className="mr-1">{moduleInfo.icon}</span>
                  <span className="hidden sm:inline">{moduleInfo.label}</span>
                  <span className="sm:hidden">{moduleInfo.label.split(' ')[1] || moduleInfo.label}</span>
                </span>
              </div>
            </>
          )}
          
          {subRoute && (
            <>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
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
                  className="inline-flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-md transition-colors"
                >
                  <span className="mr-1">{item.icon}</span>
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
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue=""
              >
                <option value="">Seleccionar módulo...</option>
                {quickAccess.map((item) => (
                  <option key={item.to} value={item.to}>
                    {item.icon} {item.label}
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
