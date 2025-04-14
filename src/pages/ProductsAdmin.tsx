import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, FileText, QrCode, Upload, LogOut, Menu } from 'lucide-react';
import { ProductModal } from '../components/ProductModal';
import { DJCUploadModal } from '../components/DJCUploadModal';
import { ProductTooltip } from '../components/ProductTooltip';
import { QRCodeModal } from '../components/QRCodeModal';
import { supabase } from '../lib/supabase';
import { Producto } from '../types/productos';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ProductsAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDJCModalOpen, setIsDJCModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | undefined>();
  const [editingProduct, setEditingProduct] = useState<Producto | undefined>();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tooltipTimeoutRef = useRef<number>();
  const hoveredRowRef = useRef<HTMLTableRowElement>(null);

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

  const handleDeleteProduct = async (codigoUnico: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('codigo_unico', codigoUnico);

      if (error) throw error;
      
      toast.success('Producto eliminado exitosamente');
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
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Producto
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca / Modelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fabricante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado DJC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documentos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.nombre_producto}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.codigo_unico}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.marca}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.modelo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.fabricante}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        {product.certificado_url && (
                          <a
                            href={product.certificado_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
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
                          onClick={() => openQRModal(product)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <QrCode className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-3">
                        {product.djc_estado === 'pendiente' && (
                          <button
                            onClick={() => openDJCModal(product)}
                            className="text-green-600 hover:text-green-900"
                            title="Cargar DJC"
                          >
                            <Upload className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.codigo_unico)}
                          className="text-red-600 hover:text-red-900"
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
        </div>
      </main>

      {hoveredProduct && (
        <ProductTooltip
          product={products.find(p => p.codigo_unico === hoveredProduct)!}
          show={!!hoveredProduct}
          containerRef={hoveredRowRef}
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
    </div>
  );
}

export default ProductsAdmin;