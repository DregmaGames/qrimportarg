import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

export interface FilterState {
  fabricantes: string[];
  precioMin?: number;
  precioMax?: number;
  ordenar: 'nombre_asc' | 'nombre_desc' | 'fecha_asc' | 'fecha_desc' | null;
}

interface FilterPanelProps {
  fabricantes: FilterOption[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function FilterPanel({ fabricantes, filters, onChange, onReset }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFabricanteChange = (fabricante: string) => {
    const currentFabricantes = [...filters.fabricantes];
    const index = currentFabricantes.indexOf(fabricante);
    
    if (index === -1) {
      currentFabricantes.push(fabricante);
    } else {
      currentFabricantes.splice(index, 1);
    }
    
    onChange({ ...filters, fabricantes: currentFabricantes });
  };

  const handlePrecioMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onChange({ ...filters, precioMin: value });
  };

  const handlePrecioMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onChange({ ...filters, precioMax: value });
  };

  const handleOrdenarChange = (value: FilterState['ordenar']) => {
    onChange({ ...filters, ordenar: value });
  };

  const hasActiveFilters = filters.fabricantes.length > 0 || 
                           filters.precioMin !== undefined || 
                           filters.precioMax !== undefined || 
                           filters.ordenar !== null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div 
        className="px-4 py-3 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="filter-panel-content"
      >
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filtros y Ordenamiento</span>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Activos
            </span>
          )}
        </div>
        <button 
          className="text-gray-400 hover:text-gray-500 focus:outline-none" 
          aria-label={isExpanded ? "Colapsar filtros" : "Expandir filtros"}
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {isExpanded && (
        <div 
          id="filter-panel-content" 
          className="px-4 pb-4 border-t border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {/* Fabricantes */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Fabricante</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                {fabricantes.map((fabricante) => (
                  <div key={fabricante.value} className="flex items-center">
                    <input
                      id={`fabricante-${fabricante.value}`}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={filters.fabricantes.includes(fabricante.value)}
                      onChange={() => handleFabricanteChange(fabricante.value)}
                    />
                    <label 
                      htmlFor={`fabricante-${fabricante.value}`} 
                      className="ml-2 text-sm text-gray-700"
                    >
                      {fabricante.label}
                    </label>
                  </div>
                ))}
                {fabricantes.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No hay fabricantes disponibles</p>
                )}
              </div>
            </div>

            {/* Rango de Precio (placeholder) */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Rango de Precio</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="precio-min" className="sr-only">Precio mínimo</label>
                  <input
                    type="number"
                    id="precio-min"
                    placeholder="Mín"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={filters.precioMin || ''}
                    onChange={handlePrecioMinChange}
                    min={0}
                  />
                </div>
                <div>
                  <label htmlFor="precio-max" className="sr-only">Precio máximo</label>
                  <input
                    type="number"
                    id="precio-max"
                    placeholder="Máx"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={filters.precioMax || ''}
                    onChange={handlePrecioMaxChange}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Ordenar */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Ordenar por</h3>
              <select
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.ordenar || ''}
                onChange={(e) => handleOrdenarChange(e.target.value as FilterState['ordenar'] || null)}
              >
                <option value="">Relevancia</option>
                <option value="nombre_asc">Nombre (A-Z)</option>
                <option value="nombre_desc">Nombre (Z-A)</option>
                <option value="fecha_asc">Más antiguo</option>
                <option value="fecha_desc">Más reciente</option>
              </select>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onReset}
              disabled={!hasActiveFilters}
            >
              <X className="h-4 w-4 mr-1.5" />
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}