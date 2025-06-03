import { useEffect, useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { ProductModal } from '../components/ProductModal';
import { DJCUploadModal } from '../components/DJCUploadModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { SearchBar } from '../components/SearchBar';
import { ProductSearchResults } from '../components/ProductSearchResults';
import { supabase } from '../lib/supabase';
import { Producto } from '../types/productos';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';

function ProductsAdmin() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Producto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDJCModalOpen, setIsDJCModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | undefined>();
  const [editingProduct, setEditingProduct] = useState<Producto | undefined>();
  const [productToDelete, setProductToDelete] = useState<Producto | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

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
      console.log('Deleting product:', {
        productId: productToDelete.codigo_unico,
        userId: user?.id || null
      });
      
      // Use the delete_product RPC function to move to recycle bin
      // Fixed the parameter order to match the expected function signature
      const { data, error } = await supabase.rpc('delete_product', {
        deleted_by_id: user?.id || null,
        product_id: productToDelete.codigo_unico
      });
  
      if (error) {
        console.error('Delete product RPC error:', error);
        throw error;
      }
      
      if (data === true) {
        toast.success(`Producto "${productToDelete.nombre_producto}" eliminado exitosamente`);
      } else {
        toast.error('No se pudo eliminar el producto');
      }
      
      setIsDeleteModalOpen(false);
      setProductToDelete(undefined);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto. Por favor intente nuevamente.');
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
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="w-full sm:w-2/3">
          <SearchBar 
            products={products} 
            onSearch={handleSearch} 
            onSuggestionClick={handleSuggestionClick} 
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    </>
  );
}

export default ProductsAdmin;