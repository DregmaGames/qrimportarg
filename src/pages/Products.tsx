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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Producto
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
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
            className="pl-10 pr-4 py-2 w-full border rounded-md"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('model')}
              >
                <div className="flex items-center">
                  Nombre del Producto
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                UUID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('manufacturer')}
              >
                <div className="flex items-center">
                  Fabricante
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Fecha Creación
                  <ArrowUpDown className="w-4 h-4 ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {product.brand} {product.model}
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.type}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{product.uuid}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{product.manufacturer}</div>
                  <div className="text-sm text-gray-500">{product.manufacturer_address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(product.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleQRClick(product.qr_code)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Ver código QR"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditClick(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Editar producto"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <a
                      href={product.cert_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Descargar certificado"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="text-[#dc3545] hover:text-red-700"
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