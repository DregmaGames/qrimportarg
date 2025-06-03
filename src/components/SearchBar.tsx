import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Producto } from '../types/productos';

interface SearchBarProps {
  products: Producto[];
  onSearch: (searchTerm: string) => void;
  onSuggestionClick: (product: Producto) => void;
}

export function SearchBar({ products, onSearch, onSuggestionClick }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Producto[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const filteredProducts = products
      .filter(product =>
        product.nombre_producto.toLowerCase().includes(normalizedSearchTerm) ||
        product.marca.toLowerCase().includes(normalizedSearchTerm) ||
        product.modelo.toLowerCase().includes(normalizedSearchTerm) ||
        product.fabricante.toLowerCase().includes(normalizedSearchTerm)
      )
      .slice(0, 5);

    setSuggestions(filteredProducts);
  }, [searchTerm, products]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
    setShowSuggestions(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    onSearch('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (product: Producto) => {
    onSuggestionClick(product);
    setSearchTerm(product.nombre_producto);
    setShowSuggestions(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900">$1</mark>');
  };

  return (
    <div ref={searchContainerRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-base md:text-sm"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(searchTerm.trim() !== '' && suggestions.length > 0)}
          aria-label="Buscar productos"
          aria-expanded={showSuggestions}
          aria-owns={showSuggestions ? "search-suggestions" : undefined}
          role="combobox"
          aria-autocomplete="list"
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
            onClick={handleClearSearch}
            aria-label="Limpiar búsqueda"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden max-h-80 overflow-y-auto"
          role="listbox"
        >
          <ul className="py-1 divide-y divide-gray-100">
            {suggestions.map((product) => (
              <li
                key={product.codigo_unico}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSuggestionClick(product)}
                role="option"
                aria-selected={false}
              >
                <div className="text-sm font-medium text-gray-900" 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightMatch(product.nombre_producto, searchTerm) 
                  }}
                />
                <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-between">
                  <span dangerouslySetInnerHTML={{ 
                    __html: highlightMatch(product.marca, searchTerm) + ' - ' + 
                           highlightMatch(product.modelo, searchTerm) 
                  }} />
                  <span dangerouslySetInnerHTML={{ 
                    __html: highlightMatch(product.fabricante, searchTerm)
                  }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && searchTerm && suggestions.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No se encontraron productos que coincidan con "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
}