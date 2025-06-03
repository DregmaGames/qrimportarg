import React, { useState, useRef } from 'react';
import { AlertCircle, Pencil, Trash2, FileText, QrCode, Upload } from 'lucide-react';
import { Producto } from '../types/productos';
import { ProductTooltip } from './ProductTooltip';

interface ProductSearchResultsProps {
  products: Producto[];
  isFiltered: boolean;
  searchTerm: string;
  onEdit: (product: Producto) => void;
  onDelete: (productId: string) => void;
  onDJCUpload: (product: Producto) => void;
  onQRView: (product: Producto) => void;
  highlightSearchTerm?: boolean;
}

export function ProductSearchResults({
  products,
  isFiltered,
  searchTerm,
  onEdit,
  onDelete,
  onDJCUpload,
  onQRView,
  highlightSearchTerm = true,
}: ProductSearchResultsProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const hoveredRowRef = useRef<HTMLTableRowElement>(null);
  const tooltipTimeoutRef = useRef<number>();

  const handleProductMouseEnter = (product: Producto, event: React.MouseEvent<HTMLTableRowElement>) => {
    hoveredRowRef.current = event.currentTarget;
    
    if (tooltipTimeoutRef.current) {
      window.clearTimeout(tooltipTimeoutRef.current);
    }

    tooltipTimeoutRef.current = window.setTimeout(() => {
      setHoveredProduct(product.codigo_unico);
    }, 300);
  };

  const handleProductMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      window.clearTimeout(tooltipTimeoutRef.current);
    }
    setHoveredProduct(null);
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
        <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron productos</h3>
        <p className="text-gray-500">
          {isFiltered 
            ? `No hay productos que coincidan con "${searchTerm}" y los filtros aplicados.` 
            : 'Aún no hay productos registrados.'}
        </p>
      </div>
    );
  }

  // Vista móvil para pantallas pequeñas
  const renderMobileView = () => {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden md:hidden">
        <div className="divide-y divide-gray-200">
          {products.map((product) => (
            <div 
              key={product.codigo_unico}
              className="p-4"
            >
              {/* Encabezado del producto */}
              <div className="mb-3">
                <h3 className="text-base font-medium text-gray-900 mb-1"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightMatch(product.nombre_producto, searchTerm) 
                  }}
                />
                {/* Product code removed */}
              </div>
              
              {/* Información principal */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Marca/Modelo</p>
                  <p className="text-sm text-gray-900">
                    <span
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(product.marca, searchTerm) 
                      }}
                    />
                    {' / '}
                    <span
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(product.modelo, searchTerm) 
                      }}
                    />
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Fabricante</p>
                  <p className="text-sm text-gray-900"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightMatch(product.fabricante, searchTerm) 
                    }}
                  />
                </div>
              </div>
              
              {/* Estado y acciones */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.djc_estado === 'cargado'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {product.djc_estado === 'cargado' ? 'DJC Cargado' : 'DJC Pendiente'}
                  </span>
                  {product.qr_generado && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      QR Generado
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  {/* Documentos */}
                  <div className="flex items-center space-x-3">
                    {product.certificado_url && (
                      <a
                        href={product.certificado_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 px-3 py-1.5 text-sm rounded-md bg-blue-50"
                        aria-label="Ver certificado"
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        <span>Certificado</span>
                      </a>
                    )}
                    {product.djc_documento && (
                      <a
                        href={product.djc_documento}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-green-600 px-3 py-1.5 text-sm rounded-md bg-green-50"
                        aria-label="Ver DJC"
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        <span>DJC</span>
                      </a>
                    )}
                    <button
                      onClick={() => onQRView(product)}
                      className="inline-flex items-center text-purple-600 px-3 py-1.5 text-sm rounded-md bg-purple-50"
                      aria-label="Ver código QR"
                    >
                      <QrCode className="h-4 w-4 mr-1.5" />
                      <span>QR</span>
                    </button>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2">
                    {product.djc_estado === 'pendiente' && (
                      <button
                        onClick={() => onDJCUpload(product)}
                        className="p-2 text-green-600 bg-green-50 rounded-full"
                        aria-label="Cargar DJC"
                      >
                        <Upload className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-blue-600 bg-blue-50 rounded-full"
                      aria-label="Editar producto"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(product.codigo_unico)}
                      className="p-2 text-red-600 bg-red-50 rounded-full"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Vista de escritorio para pantallas medianas y grandes
  const renderDesktopView = () => {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden hidden md:block">
        <div className="product-table-container">
          <table className="product-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="col-name">
                  Nombre
                </th>
                <th className="col-marca-modelo">
                  Marca / Modelo
                </th>
                <th className="col-fabricante">
                  Fabricante
                </th>
                <th className="col-estado">
                  Estado DJC
                </th>
                <th className="col-documentos">
                  Documentos
                </th>
                <th className="col-acciones text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr
                  key={product.codigo_unico}
                  ref={hoveredProduct === product.codigo_unico ? hoveredRowRef : null}
                  onMouseEnter={(e) => handleProductMouseEnter(product, e)}
                  onMouseLeave={handleProductMouseLeave}
                  className="relative hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(product.nombre_producto, searchTerm) 
                      }} 
                    />
                    {/* Product code removed */}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(product.marca, searchTerm) 
                      }}
                    />
                    <div className="text-sm text-gray-500 truncate"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(product.modelo, searchTerm) 
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(product.fabricante, searchTerm) 
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.djc_estado === 'cargado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.djc_estado === 'cargado' ? 'Cargado' : 'Pendiente'}
                    </span>
                    {product.qr_generado && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        QR Generado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      {product.certificado_url && (
                        <a
                          href={product.certificado_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver certificado"
                        >
                          <FileText className="h-5 w-5" />
                        </a>
                      )}
                      {product.djc_documento && (
                        <a
                          href={product.djc_documento}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                          title="Ver DJC"
                        >
                          <FileText className="h-5 w-5" />
                        </a>
                      )}
                      <button
                        onClick={() => onQRView(product)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Ver código QR"
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-3">
                      {product.djc_estado === 'pendiente' && (
                        <button
                          onClick={() => onDJCUpload(product)}
                          className="text-green-600 hover:text-green-900"
                          title="Cargar DJC"
                        >
                          <Upload className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(product)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar producto"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDelete(product.codigo_unico)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hoveredProduct && (
          <ProductTooltip
            product={products.find(p => p.codigo_unico === hoveredProduct)!}
            show={!!hoveredProduct}
            containerRef={hoveredRowRef}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {renderMobileView()}
      {renderDesktopView()}
    </>
  );
}