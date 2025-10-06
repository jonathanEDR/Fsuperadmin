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
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search 
          className="absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          size={20} 
        />
        <input
          type="text"
          placeholder="Buscar producto o código..."
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={disabled}
          className="w-full pl-12 sm:pl-10 pr-4 sm:pr-3 py-4 sm:py-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          aria-label="Buscar productos"
        />
      </div>
      
      {/* Selector de categoría */}
      <div className="relative">
        <Filter 
          className="absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          size={20} 
        />
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={disabled}
          className="w-full pl-12 sm:pl-10 pr-4 sm:pr-3 py-4 sm:py-3 bg-white border border-gray-300 rounded-lg text-lg sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none transition-colors"
          aria-label="Filtrar por categoría"
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
  );
});

// Nombre para debugging
BusquedaProductos.displayName = 'BusquedaProductos';

export default BusquedaProductos;
