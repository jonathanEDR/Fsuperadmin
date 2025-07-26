import React from 'react';
import { Search, Filter, RotateCcw, Package, SortAsc } from 'lucide-react';

const FiltrosCatalogo = ({ 
  filtros, 
  onFiltrosChange, 
  categorias = [],
  totalProductos = 0,
  compactMode = false
}) => {
  
  const handleFiltroChange = (campo, valor) => {
    onFiltrosChange(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    onFiltrosChange({
      busqueda: '',
      categoria: '',
      soloConStock: true,
      ordenarPor: 'nombre'
    });
  };

  const opcionesOrden = [
    { valor: 'nombre', label: 'Nombre A-Z' },
    { valor: 'precio', label: 'Precio (menor a mayor)' },
    { valor: 'stock', label: 'Stock (mayor a menor)' }
  ];

  // Modo compacto para el header
  if (compactMode) {
    return (
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center'
        }}
      >
        {/* Búsqueda compacta */}
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <Search 
            style={{ 
              position: 'absolute', 
              left: '8px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#6b7280' 
            }} 
            size={14} 
          />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={filtros.busqueda}
            onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '32px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#1f2937',
              outline: 'none'
            }}
          />
        </div>

        {/* Categoría compacta */}
        <select
          value={filtros.categoria}
          onChange={(e) => handleFiltroChange('categoria', e.target.value)}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#1f2937',
            outline: 'none',
            minWidth: '140px'
          }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(categoria => (
            <option key={categoria._id} value={categoria._id}>
              {categoria.nombre}
            </option>
          ))}
        </select>

        {/* Ordenar compacto */}
        <select
          value={filtros.ordenarPor}
          onChange={(e) => handleFiltroChange('ordenarPor', e.target.value)}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#1f2937',
            outline: 'none',
            minWidth: '120px'
          }}
        >
          {opcionesOrden.map(opcion => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.label}
            </option>
          ))}
        </select>

        {/* Checkbox solo con stock compacto */}
        <label 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#1f2937',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <input
            type="checkbox"
            checked={filtros.soloConStock}
            onChange={(e) => handleFiltroChange('soloConStock', e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              accentColor: '#f97316'
            }}
          />
          Solo con stock
        </label>

        {/* Botón limpiar compacto */}
        <button
          onClick={limpiarFiltros}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#1f2937',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RotateCcw size={12} />
          Limpiar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Fila superior: Búsqueda y categoría */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Buscar productos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-white placeholder-gray-400"
              />
              {filtros.busqueda && (
                <button
                  onClick={() => handleFiltroChange('busqueda', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Filtrar por categoría
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={filtros.categoria}
                onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm appearance-none text-white"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria._id} value={categoria._id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fila inferior: Controles adicionales */}
        <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
          {/* Ordenamiento */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ordenar por
            </label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={filtros.ordenarPor}
                onChange={(e) => handleFiltroChange('ordenarPor', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm appearance-none text-white"
              >
                {opcionesOrden.map(opcion => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro de stock y acciones */}
          <div className="flex flex-col justify-end gap-2">
            {/* Checkbox solo con stock */}
            <div className="flex items-center gap-2">
              <input
                id="soloConStock"
                type="checkbox"
                checked={filtros.soloConStock}
                onChange={(e) => handleFiltroChange('soloConStock', e.target.checked)}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 bg-gray-700 border-gray-600 rounded"
              />
              <label htmlFor="soloConStock" className="text-sm text-gray-300 flex items-center gap-1">
                <Package size={14} />
                Solo con stock
              </label>
            </div>

            {/* Botón limpiar filtros */}
            <button
              onClick={limpiarFiltros}
              className="flex items-center justify-center gap-2 px-3 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm border border-gray-600"
            >
              <RotateCcw size={14} />
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Información de resultados */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span>
            <strong className="text-orange-400">{totalProductos}</strong> productos encontrados
          </span>
          
          {/* Filtros activos */}
          {(filtros.busqueda || filtros.categoria || !filtros.soloConStock) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Filtros activos:</span>
              <div className="flex gap-1">
                {filtros.busqueda && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-500 bg-opacity-20 text-orange-300 border border-orange-500 border-opacity-30">
                    Búsqueda: "{filtros.busqueda}"
                    <button
                      onClick={() => handleFiltroChange('busqueda', '')}
                      className="hover:text-orange-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {filtros.categoria && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500 bg-opacity-20 text-yellow-300 border border-yellow-500 border-opacity-30">
                    Categoría: {categorias.find(c => c._id === filtros.categoria)?.nombre}
                    <button
                      onClick={() => handleFiltroChange('categoria', '')}
                      className="hover:text-yellow-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {!filtros.soloConStock && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-500 bg-opacity-20 text-gray-300 border border-gray-500 border-opacity-30">
                    Incluye sin stock
                    <button
                      onClick={() => handleFiltroChange('soloConStock', true)}
                      className="hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {filtros.ordenarPor && (
            <span>
              Ordenado por: <strong className="text-gray-300">{opcionesOrden.find(o => o.valor === filtros.ordenarPor)?.label}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltrosCatalogo;
