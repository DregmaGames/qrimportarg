import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Download } from 'lucide-react';

interface Product {
  id: string;
  type: string;
  manufacturer: string;
  manufacturer_address: string;
  brand: string;
  model: string;
  specs: Record<string, any>;
  djc_url: string;
  cert_url: string;
  created_at: string;
}

function PublicProduct() {
  const { uuid } = useParams<{ uuid: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [uuid]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('uuid', uuid)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Producto no encontrado');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              Información del Producto
            </h1>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Detalles del Producto</h2>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Marca</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.brand}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Modelo</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.model}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Registro</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(product.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900">Información del Fabricante</h2>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.manufacturer}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.manufacturer_address}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900">Especificaciones Técnicas</h2>
                <div className="mt-2 prose prose-sm text-gray-500">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(product.specs, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900">Documentos</h2>
                <div className="mt-2 space-y-4">
                  {product.djc_url && (
                    <a
                      href={product.djc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Declaración Jurada de Conformidad
                    </a>
                  )}
                  
                  {product.cert_url && (
                    <a
                      href={product.cert_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Certificado del Producto
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProduct;