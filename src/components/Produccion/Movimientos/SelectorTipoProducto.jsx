import React from 'react';

const SelectorTipoProducto = ({ 
  tipoSeleccionado, 
  onTipoSeleccionado, 
  tipos = [],
  disabled = false 
}) => {
  
  const tiposPorDefecto = [
    {
      id: 'ingredientes',
      nombre: 'Ingredientes',
      descripcion: 'Materias primas para producción',
      icono: '🥕',
      color: 'bg-green-500'
    },
    {
      id: 'materiales',
      nombre: 'Materiales',
      descripcion: 'Materiales de producción',
      icono: '📦',
      color: 'bg-blue-500'
    },
    {
      id: 'recetas',
      nombre: 'Recetas',
      descripcion: 'Productos con recetas definidas',
      icono: '📋',
      color: 'bg-purple-500'
    },
    {
      id: 'produccion',
      nombre: 'Producción',
      descripción: 'Productos del catálogo de producción',
      icono: '🏭',
      color: 'bg-orange-500'
    }
  ];

  const tiposAUsar = tipos.length > 0 ? tipos : tiposPorDefecto;

  const handleTipoClick = (tipo) => {
    if (!disabled && onTipoSeleccionado) {
      onTipoSeleccionado(tipo.id);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Seleccionar Tipo de Producto
      </h3>
      
      {/* 🎯 OPTIMIZADO: Grid compacto para móvil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {tiposAUsar.map((tipo) => (
          <div
            key={tipo.id}
            onClick={() => handleTipoClick(tipo)}
            className={`
              relative p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-105
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${
                tipoSeleccionado === tipo.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            {/* Indicador de selección */}
            {tipoSeleccionado === tipo.id && (
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-2 h-2 sm:w-3 sm:h-3 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Contenido de la tarjeta */}
            <div className="flex flex-col items-center text-center">
              {/* Icono */}
              <div className={`
                w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3
                ${tipoSeleccionado === tipo.id ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <span className="text-lg sm:text-2xl">{tipo.icono}</span>
              </div>
              
              {/* Nombre */}
              <h4 className={`
                font-semibold mb-1 text-xs sm:text-sm
                ${tipoSeleccionado === tipo.id ? 'text-blue-700' : 'text-gray-800'}
              `}>
                {tipo.nombre}
              </h4>
              
              {/* Descripción */}
              <p className={`
                text-xs leading-tight hidden sm:block
                ${tipoSeleccionado === tipo.id ? 'text-blue-600' : 'text-gray-500'}
              `}>
                {tipo.descripcion || tipo.descripción}
              </p>
            </div>
            
            {/* Efecto de brillo al seleccionar */}
            {tipoSeleccionado === tipo.id && (
              <div className="absolute inset-0 bg-blue-500 opacity-5 rounded-lg pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Información adicional */}
      {tipoSeleccionado && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-blue-600 mr-2">ℹ️</span>
            <span className="text-sm text-blue-800">
              Tipo seleccionado: <strong>
                {tiposAUsar.find(t => t.id === tipoSeleccionado)?.nombre}
              </strong>
            </span>
          </div>
        </div>
      )}
      
      {/* Estado de carga */}
      {disabled && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
            <span className="text-sm text-gray-600">
              Cargando productos...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorTipoProducto;
