import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { QrCode, Plus, Download, Search, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import CreateProductModal from '../components/CreateProductModal';
import EditProductModal from '../components/EditProductModal';

interface Product {
  id: string;
  uuid: string;
  type: string;
  manufacturer: string;
  manufacturer_address: string;
  brand: string;
  model: string;
  specs: {
    technical_specs: string;
    technical_regulations: string;
    technical_standards: string;
    oec_document_reference: string;
  };
  cert_url: string;
  qr_code: string;
  expiry_date: string;
  created_at: string;
}

function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Product>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSort = (field: keyof Product) => {
    setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
    setSortField(field);
  };

  const filteredProducts = products.filter(product =>
    Object.values(product).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleQRClick = (qrUrl: string) => {
    window.open(qrUrl, '_blank');
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (product: Product) => {
    const confirmed = window.confirm(
      `¿Está seguro que desea eliminar el producto "${product.brand} ${product.model}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      await fetchProducts();
      setSuccessMessage('Producto eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setErrorMessage('Error al eliminar el producto. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Producto
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 sm:p-4 bg-green-100 border-l-4 border-green-500 text-green-700 text-sm sm:text-base">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 sm:p-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm sm:text-base">
          {errorMessage}
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:-mx-6">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('model')}
                        className="group inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Nombre del Producto
                        <ArrowUpDown className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100" />
                      </button>
                    </div>
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    UUID
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSort('manufacturer')}
                        className="group inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Fabricante
                        <ArrowUpDown className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100" />
                      </button>
                    </div>
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.brand} {product.model}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {product.type}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{product.uuid}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{product.manufacturer}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {product.manufacturer_address}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(product.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                        <button
                          onClick={() => handleQRClick(product.qr_code)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Ver código QR"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(product)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Editar producto"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <a
                          href={product.cert_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Descargar certificado"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="text-[#dc3545] hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProductCreated={fetchProducts}
      />

      {selectedProduct && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
          onProductUpdated={fetchProducts}
          product={selectedProduct}
        />
      )}
    </div>
  );
}

export default Products;