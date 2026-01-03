import React from 'react';
import { Search, Filter } from 'lucide-react';

/**
 * Componente de búsqueda y filtrado de productos
 * 
 * @param {Object} props
 * @param {string} props.searchTerm - Término de búsqueda actual
 * @param {Function} props.onSearchChange - Callback cuando cambia el término de búsqueda
 * @param {string} props.selectedCategory - Categoría seleccionada
 * @param {Function} props.onCategoryChange - Callback cuando cambia la categoría
 * @param {Array} props.categorias - Lista de categorías disponibles
 * @param {boolean} props.disabled - Si los controles están deshabilitados
 */
const BusquedaProductos = React.memo(({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categorias = [],
  disabled = false
}) => {
  /**
   * Maneja el cambio en el input de búsqueda
   */
  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };

  /**
   * Maneja el cambio en el selector de categoría
   */
  const handleCategoryChange = (e) => {
    onCategoryChange(e.target.value);
  };

  return (
    <div className="flex flex-col xs:grid xs:grid-cols-2 gap-2 sm:gap-3">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search 
          className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          size={16} 
        />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={disabled}
          className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors placeholder:text-gray-400"
          aria-label="Buscar productos"
        />
      </div>
      
      {/* Selector de categoría */}
      <div className="relative">
        <Filter 
          className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
          size={16} 
        />
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={disabled}
          className="w-full pl-8 sm:pl-10 pr-6 sm:pr-8 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none transition-colors cursor-pointer"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas</option>
          {categorias.map(categoria => (
            <option key={categoria._id} value={categoria._id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
        {/* Flecha del select */}
        <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
});

// Nombre para debugging
BusquedaProductos.displayName = 'BusquedaProductos';

export default BusquedaProductos;
