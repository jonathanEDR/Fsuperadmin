import React from 'react';
import { Link, useLocation, useResolvedPath } from 'react-router-dom';


const accesos = [
  {
    label: 'Catálogo de Producción',
    to: 'catalogo',
    icon: '📋',
    color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800',
  },
  {
    label: 'Gestión de Ingredientes',
    to: 'ingredientes',
    icon: '🥬',
    color: 'bg-green-50 hover:bg-green-100 text-green-800',
  },
  {
    label: 'Gestión de Recetas',
    to: 'recetas',
    icon: '📝',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-800',
  },
  {
    label: 'Gestión de Producción',
    to: 'produccion',
    icon: '🏭',
    color: 'bg-purple-50 hover:bg-purple-100 text-purple-800',
  },
  {
    label: 'Movimientos de Inventario',
    to: 'movimientos',
    icon: '📊',
    color: 'bg-orange-50 hover:bg-orange-100 text-orange-800',
  },
];

const AccesosRapidosProduccion = () => {
  const location = useLocation();
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

  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 sm:gap-4">
        {accesos.map((acceso) => {
          const to = basePath + '/' + acceso.to;
          const isActive = location.pathname.startsWith(to);
          return (
            <Link
              key={acceso.to}
              to={to}
              className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg font-medium transition-colors border border-transparent ${acceso.color} ${isActive ? 'ring-2 ring-blue-400 border-blue-200' : ''}`}
            >
              <span className="text-xl sm:text-2xl">{acceso.icon}</span>
              <span className="text-sm sm:text-base truncate">{acceso.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AccesosRapidosProduccion;
