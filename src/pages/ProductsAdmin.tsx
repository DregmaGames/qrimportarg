import { useEffect, useState, useRef } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { ProductModal } from '../components/ProductModal';
import { DJCUploadModal } from '../components/DJCUploadModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { SearchBar } from '../components/SearchBar';
import { ProductSearchResults } from '../components/ProductSearchResults';
import { ProductCardGrid } from '../components/ProductCardGrid';
import { supabase } from '../lib/supabase';
import { Producto } from '../types/productos';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      // First, create the product
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
      
      // Now, create an initial DJC record associated with the product
      if (data) {
        // Prepare DJC data from product information
        const initialDJCData = {
          resolucion: data.resolution || 'Res. SIYC N° 16/2025',
          razon_social: '', // Will be completed by the user
          cuit: '', // Will be completed by the user
          marca: data.marca || '',
          domicilio_legal: '', // Will be completed by the user
          domicilio_planta: '', // Will be completed by the user
          telefono: '', // Will be completed by the user
          email: '', // Will be completed by the user
          codigo_producto: data.codigo_unico || '',
          fabricante: data.fabricante || '',
          identificacion_producto: data.nombre_producto || '',
          reglamentos: '', // Will be completed by the user
          normas_tecnicas: '', // Will be completed by the user
          documento_evaluacion: '', // Will be completed by the user
          fecha_lugar: '', // Will be completed by the user
          created_by: user?.id,
          producto_id: data.codigo_unico
        };
        
        const { error: djcError } = await supabase
          .from('djc')
          .insert([initialDJCData]);
          
        if (djcError) {
          console.error('Error creating initial DJC:', djcError);
          // We'll still consider the product creation successful even if DJC creation fails
          toast.error('Producto creado, pero hubo un error al crear la Declaración Jurada asociada.');
        } else {
          toast.success('Producto creado exitosamente con Declaración Jurada asociada.');
          toast.success('Complete la Declaración Jurada desde la sección "Declaraciones Juradas".');
        }
      } else {
        toast.success('Producto creado exitosamente');
      }
      
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
      const { data, error } = await supabase.rpc('delete_product', {
        product_id: productToDelete.codigo_unico,
        deleted_by_id: user?.id || null
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
        <div className="flex justify-end gap-3">
          {/* View toggle */}
          <div className="hidden sm:flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <ProductCardGrid
          products={filteredProducts}
          isFiltered={isFiltered}
          searchTerm={searchTerm}
          onEdit={openEditModal}
          onDelete={openDeleteConfirmation}
          onDJCUpload={openDJCModal}
          onQRView={openQRModal}
        />
      ) : (
        <ProductSearchResults
          products={filteredProducts}
          isFiltered={isFiltered}
          searchTerm={searchTerm}
          onEdit={openEditModal}
          onDelete={openDeleteConfirmation}
          onDJCUpload={openDJCModal}
          onQRView={openQRModal}
        />
      )}

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