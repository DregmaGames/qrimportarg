import { useEffect, useState, useRef } from 'react';
import { Plus, LogOut, Menu } from 'lucide-react';
import { ProductModal } from '../components/ProductModal';
import { DJCUploadModal } from '../components/DJCUploadModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { SearchBar } from '../components/SearchBar';
import { ProductSearchResults } from '../components/ProductSearchResults';
import { supabase } from '../lib/supabase';
import { Producto } from '../types/productos';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ProductsAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Producto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDJCModalOpen, setIsDJCModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | undefined>();
  const [editingProduct, setEditingProduct] = useState<Producto | undefined>();
  const [productToDelete, setProductToDelete] = useState<Producto | undefined>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      
      // Initialize filtered products
      applySearchFilter(data || [], searchTerm);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar los productos');
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Apply search filter to products
  const applySearchFilter = (productsToFilter: Producto[], search: string) => {
    if (!search.trim()) {
      setFilteredProducts(productsToFilter);
      setIsFiltered(false);
      return;
    }
    
    const normalizedSearch = search.toLowerCase().trim();
    const result = productsToFilter.filter(product => 
      product.nombre_producto.toLowerCase().includes(normalizedSearch) ||
      product.marca.toLowerCase().includes(normalizedSearch) ||
      product.modelo.toLowerCase().includes(normalizedSearch) ||
      product.fabricante.toLowerCase().includes(normalizedSearch) ||
      product.identificacion.toLowerCase().includes(normalizedSearch)
    );
    
    setFilteredProducts(result);
    setIsFiltered(search.trim() !== '');
  };

  // Update filtered products when search term changes
  useEffect(() => {
    applySearchFilter(products, searchTerm);
  }, [searchTerm, products]);

  const handleCreateProduct = async (productData: Omit<Producto, 'codigo_unico' | 'created_at' | 'qr_code_url' | 'qr_version' | 'qr_generated_at' | 'djc_estado' | 'qr_generado'>) => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .insert([{
          ...productData,
          created_by: user?.id,
          djc_estado: 'pendiente',
          qr_generado: false
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Producto creado exitosamente');
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error al crear el producto');
    }
  };

  const handleUpdateProduct = async (productData: Omit<Producto, 'codigo_unico' | 'created_at' | 'qr_code_url' | 'qr_version' | 'qr_generated_at' | 'djc_estado' | 'qr_generado'>) => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('productos')
        .update(productData)
        .eq('codigo_unico', editingProduct.codigo_unico);

      if (error) throw error;
      
      toast.success('Producto actualizado exitosamente');
      fetchProducts();
      setEditingProduct(undefined);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      // Use the delete_product RPC function to move to recycle bin
      const { error } = await supabase.rpc('delete_product', {
        product_id: productToDelete.codigo_unico,
        deleted_by_id: user?.id
      });
  
      if (error) throw error;
      
      toast.success(`Producto "${productToDelete.nombre_producto}" eliminado exitosamente`);
      setIsDeleteModalOpen(false);
      setProductToDelete(undefined);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const openEditModal = (product: Producto) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openDJCModal = (product: Producto) => {
    setSelectedProduct(product);
    setIsDJCModalOpen(true);
  };

  const openQRModal = (product: Producto) => {
    setSelectedProduct(product);
    setIsQRModalOpen(true);
  };

  const openDeleteConfirmation = (product: Producto) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSuggestionClick = (product: Producto) => {
    // Focus on the selected product
    setFilteredProducts([product]);
    setIsFiltered(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                Productos
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200 py-2">
              <div className="space-y-2 px-2">
                <p className="text-sm text-gray-600 truncate py-1">
                  {user?.email}
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="w-full md:w-1/2 lg:w-2/3">
            <SearchBar 
              products={products} 
              onSearch={handleSearch} 
              onSuggestionClick={handleSuggestionClick} 
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Producto
            </button>
          </div>
        </div>

        <ProductSearchResults
          products={filteredProducts}
          isFiltered={isFiltered}
          searchTerm={searchTerm}
          onEdit={openEditModal}
          onDelete={openDeleteConfirmation}
          onDJCUpload={openDJCModal}
          onQRView={openQRModal}
        />
      </main>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(undefined);
        }}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        editProduct={editingProduct}
      />

      {selectedProduct && (
        <>
          <DJCUploadModal
            isOpen={isDJCModalOpen}
            onClose={() => {
              setIsDJCModalOpen(false);
              setSelectedProduct(undefined);
            }}
            productId={selectedProduct.codigo_unico}
            productName={selectedProduct.nombre_producto}
            onSuccess={fetchProducts}
          />

          <QRCodeModal
            isOpen={isQRModalOpen}
            onClose={() => {
              setIsQRModalOpen(false);
              setSelectedProduct(undefined);
            }}
            productId={selectedProduct.codigo_unico}
            productName={selectedProduct.nombre_producto}
          />
        </>
      )}

      {productToDelete && (
        <DeleteConfirmationDialog
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setProductToDelete(undefined);
          }}
          onConfirm={handleConfirmDelete}
          productName={productToDelete.nombre_producto}
        />
      )}
    </div>
  );
}

export default ProductsAdmin;