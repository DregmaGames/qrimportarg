import React, { useState } from 'react';
import { Producto } from '../types/productos';
import { FileText, Pencil, Trash2, QrCode, Upload, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductCardGridProps {
  products: Producto[];
  isFiltered: boolean;
  searchTerm: string;
  onEdit: (product: Producto) => void;
  onDelete: (productId: string) => void;
  onDJCUpload: (product: Producto) => void;
  onQRView: (product: Producto) => void;
  highlightSearchTerm?: boolean;
}

export function ProductCardGrid({
  products,
  isFiltered,
  searchTerm,
  onEdit,
  onDelete,
  onDJCUpload,
  onQRView,
  highlightSearchTerm = true,
}: ProductCardGridProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const toggleDescription = (productId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const highlightMatch = (text: string, query: string) => {
    if (!highlightSearchTerm || !query.trim()) return text;
    
    const normalizedText = text.toString();
    const normalizedQuery = query.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${normalizedQuery})`, 'gi');
    
    return normalizedText.replace(regex, '<mark class="bg-yellow-200 text-gray-900">$1</mark>');
  };

  if (products.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg flex flex-col items-center justify-center p-8">
        <Info className="h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron productos</h3>
        <p className="text-gray-500">
          {isFiltered 
            ? `No hay productos que coincidan con "${searchTerm}" y los filtros aplicados.` 
            : 'Aún no hay productos registrados.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.codigo_unico}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
        >
          {/* Product Image */}
          <div className="relative h-48 bg-gray-100 flex items-center justify-center border-b">
            <div className="text-6xl text-gray-300 absolute">
              <FileText />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-100/10 to-gray-900/40 flex flex-col justify-end p-4">
              <div className="text-white font-bold text-lg leading-tight" 
                dangerouslySetInnerHTML={{ __html: highlightMatch(product.nombre_producto, searchTerm) }} 
              />
              <div className="flex items-center mt-1">
                <span className="text-white/90 text-sm"
                  dangerouslySetInnerHTML={{ __html: highlightMatch(product.marca, searchTerm) }}
                />
                <span className="mx-1 text-white/80">•</span>
                <span className="text-white/90 text-sm"
                  dangerouslySetInnerHTML={{ __html: highlightMatch(product.modelo, searchTerm) }}
                />
              </div>
            </div>
            
            {/* DJC Status Badge */}
            <div className="absolute top-2 right-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                product.djc_estado === 'cargado'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {product.djc_estado === 'cargado' ? 'DJC Cargado' : 'DJC Pendiente'}
              </span>
            </div>
          </div>
          
          {/* Product Info */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fabricante</p>
              <p className="text-sm text-gray-800"
                dangerouslySetInnerHTML={{ __html: highlightMatch(product.fabricante, searchTerm) }}
              />
            </div>
            
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Certificado</p>
              <p className="text-sm text-gray-800"
                dangerouslySetInnerHTML={{ __html: highlightMatch(product.identificacion, searchTerm) }}
              />
            </div>
            
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Especificaciones</p>
              <div className={`text-sm text-gray-700 ${expandedDescriptions.has(product.codigo_unico) ? '' : 'line-clamp-2'}`}>
                {product.caracteristicas_tecnicas}
              </div>
              {product.caracteristicas_tecnicas.length > 100 && (
                <button 
                  className="text-xs text-blue-600 mt-1 hover:text-blue-800"
                  onClick={() => toggleDescription(product.codigo_unico)}
                >
                  {expandedDescriptions.has(product.codigo_unico) ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-end mt-auto pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {format(new Date(product.created_at), 'dd MMM yyyy', { locale: es })}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="flex space-x-2">
              {product.certificado_url && (
                <a
                  href={product.certificado_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Ver certificado"
                >
                  <FileText className="h-5 w-5" />
                </a>
              )}
              
              <button
                onClick={() => onQRView(product)}
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                title="Ver código QR"
              >
                <QrCode className="h-5 w-5" />
              </button>
              
              {product.djc_estado === 'pendiente' && (
                <button
                  onClick={() => onDJCUpload(product)}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title="Cargar DJC"
                >
                  <Upload className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(product)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Editar producto"
              >
                <Pencil className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => onDelete(product.codigo_unico)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Eliminar producto"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}