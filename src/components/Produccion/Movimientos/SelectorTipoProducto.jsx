import React from 'react';
import { Carrot, Package, ClipboardList, Factory, Loader2, Check, Info } from 'lucide-react';

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
      icono: <Carrot size={24} />,
      color: 'green'
    },
    {
      id: 'materiales',
      nombre: 'Materiales',
      descripcion: 'Materiales de producción',
      icono: <Package size={24} />,
      color: 'blue'
    },
    {
      id: 'recetas',
      nombre: 'Recetas',
      descripcion: 'Productos con recetas definidas',
      icono: <ClipboardList size={24} />,
      color: 'purple'
    },
    {
      id: 'produccion',
      nombre: 'Producción',
      descripción: 'Productos del catálogo de producción',
      icono: <Factory size={24} />,
      color: 'orange'
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
              relative p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 transform hover:scale-105
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
                  <Check size={10} className="text-white" />
                </div>
              </div>
            )}
            
            {/* Contenido de la tarjeta */}
            <div className="flex flex-col items-center text-center">
              {/* Icono */}
              <div className={`
                w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3
                ${tipoSeleccionado === tipo.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
              `}>
                {tipo.icono}
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
              <div className="absolute inset-0 bg-blue-500 opacity-5 rounded-xl pointer-events-none"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Estado de carga */}
      {disabled && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center">
            <Loader2 size={16} className="animate-spin text-gray-500 mr-2" />
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
