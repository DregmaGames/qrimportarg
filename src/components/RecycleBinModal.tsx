import React, { useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Trash2, RefreshCw, X } from 'lucide-react';
import { DeletedProduct } from '../types/productos';
import { supabase } from '../lib/supabase';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductRestored: () => void;
}

export function RecycleBinModal({
  isOpen,
  onClose,
  onProductRestored,
}: RecycleBinModalProps) {
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDeletedProducts();
    }
  }, [isOpen]);

  const fetchDeletedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('deleted_products')
        .select('*')
        .order('deletion_timestamp', { ascending: false });

      if (error) throw error;
      setDeletedProducts(data || []);
    } catch (error) {
      console.error('Error fetching deleted products:', error);
      toast.error('Error al cargar los productos eliminados');
    }
  };

  const handleRestore = async (productId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('restore_product', {
        product_id: productId
      });

      if (error) throw error;

      // Log the restoration
      await supabase.from('deletion_logs').insert({
        action_type: 'restore',
        product_id: productId,
        details: { restored_at: new Date().toISOString() }
      });

      toast.success('Producto restaurado exitosamente');
      await fetchDeletedProducts();
      onProductRestored();
    } catch (error) {
      console.error('Error restoring product:', error);
      toast.error('Error al restaurar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchRestore = async () => {
    setIsLoading(true);
    try {
      for (const productId of selectedProducts) {
        await handleRestore(productId);
      }
      setSelectedProducts(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Papelera de Reciclaje
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {selectedProducts.size > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedProducts.size} productos seleccionados
                    </span>
                    <button
                      onClick={handleBatchRestore}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restaurar Seleccionados
                    </button>
                  </div>
                )}

                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={selectedProducts.size === deletedProducts.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts(new Set(deletedProducts.map(p => p.codigo_unico)));
                                } else {
                                  setSelectedProducts(new Set());
                                }
                              }}
                            />
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Eliminado
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tiempo Restante
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {deletedProducts.map((product) => (
                          <tr key={product.codigo_unico}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={selectedProducts.has(product.codigo_unico)}
                                onChange={() => toggleProductSelection(product.codigo_unico)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {product.nombre_producto}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.marca} - {product.modelo}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {format(new Date(product.deletion_timestamp), 'dd/MM/yyyy HH:mm')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDistanceToNow(new Date(product.restore_deadline), {
                                  addSuffix: true,
                                  locale: es
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleRestore(product.codigo_unico)}
                                disabled={isLoading}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Restaurar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {deletedProducts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              No hay productos en la papelera de reciclaje
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}