import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

/**
 * Componente SearchableSelect - Dropdown con búsqueda integrada
 * 
 * Combina un dropdown tradicional con funcionalidad de búsqueda en tiempo real.
 * Permite a los usuarios buscar y seleccionar opciones de manera más eficiente.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.options - Array de opciones [{id, label, ...}]
 * @param {string} props.value - Valor seleccionado actual
 * @param {Function} props.onChange - Callback cuando cambia la selección
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.required - Si el campo es requerido
 * @param {string} props.searchPlaceholder - Placeholder del input de búsqueda
 * @param {Function} props.renderOption - Función personalizada para renderizar opciones
 * @param {Function} props.filterFn - Función personalizada para filtrar opciones
 * @param {boolean} props.disabled - Si el componente está deshabilitado
 * @param {string} props.className - Clases CSS adicionales
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Selecciona una opción',
  searchPlaceholder = 'Buscar...',
  required = false,
  renderOption = null,
  filterFn = null,
  disabled = false,
  className = '',
  name = ''
}) => {
  // Estados del componente
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // Referencias para manejo de eventos
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsRef = useRef([]);

  // Encontrar la opción seleccionada
  const selectedOption = options.find(opt => opt.id === value);

  // Filtrar opciones basado en el término de búsqueda (optimizado con useMemo)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    
    // Usar función de filtrado personalizada si se proporciona
    if (filterFn) {
      return filterFn(options, searchTerm);
    }
    
    // Filtrado por defecto: buscar en label (insensible a mayúsculas/minúsculas)
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.code && option.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm, filterFn]);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-focus en el input de búsqueda cuando se abre
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Manejo de teclas (navegación con flechas, Enter, Escape)
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
      
      default:
        break;
    }
  };

  // Seleccionar una opción (optimizado con useCallback)
  const handleSelectOption = useCallback((option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  }, [onChange]);

  // Limpiar selección (optimizado con useCallback)
  const handleClear = useCallback((e) => {
    e.stopPropagation();
    onChange('');
  }, [onChange]);

  // Renderizar opción por defecto
  const renderDefaultOption = (option, index) => {
    const isHighlighted = index === highlightedIndex;
    
    return (
      <div
        key={option.id}
        ref={el => optionsRef.current[index] = el}
        onClick={() => handleSelectOption(option)}
        className={`
          px-3 py-2 cursor-pointer transition-colors duration-150
          ${isHighlighted 
            ? 'bg-blue-100 text-blue-900' 
            : 'text-gray-900 hover:bg-gray-50'
          }
        `}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        <div className="flex items-center">
          {option.code && (
            <span className="font-mono text-sm text-gray-600 mr-2">
              {option.code}
            </span>
          )}
          <span className="flex-1">{option.label}</span>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger container */}
      <div
        className={`
          relative w-full text-left rounded-md border border-gray-300 bg-white
          shadow-sm transition-colors duration-200
          ${disabled 
            ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
            : 'hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
          }
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
      >
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full px-3 py-2 text-left bg-transparent focus:outline-none"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          required={required}
          name={name}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-8">
              {selectedOption ? (
                <div className="flex items-center">
                  {selectedOption.code && (
                    <span className="font-mono text-sm text-gray-600 mr-2">
                      {selectedOption.code}
                    </span>
                  )}
                  <span className="truncate">{selectedOption.label}</span>
                </div>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
          </div>
        </button>
        
        {/* Botones de acción - fuera del botón principal */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <div className="flex items-center pointer-events-auto">
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 mr-1"
                tabIndex={-1}
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown 
              size={20} 
              className={`text-gray-400 transition-transform duration-200 pointer-events-none ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => 
                renderOption 
                  ? renderOption(option, index, highlightedIndex === index, () => handleSelectOption(option))
                  : renderDefaultOption(option, index)
              )
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No se encontraron resultados
                {searchTerm && (
                  <>
                    <br />
                    <span className="text-xs">para "{searchTerm}"</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;