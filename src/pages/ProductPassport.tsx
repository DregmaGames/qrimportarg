import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Producto } from '../types/productos';

function ProductPassport() {
  const { uuid } = useParams<{ uuid: string }>();
  const [product, setProduct] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!uuid?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
          throw new Error('Identificador de producto inválido');
        }

        const { data, error: fetchError } = await supabase
          .from('productos')
          .select('*')
          .eq('codigo_unico', uuid)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Producto no encontrado');

        setProduct(data);
        
        // Update metadata
        document.title = `${data.nombre_producto} - Información Digital de Producto`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', `Información detallada sobre ${data.nombre_producto} fabricado por ${data.fabricante}`);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse max-w-3xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Producto no encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.nombre_producto}
            </h1>
            <p className="text-lg text-gray-600">
            Información Digital de Producto
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {product.resolution}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-8">
            {/* Información Principal */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Información Principal
              </h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fabricante</dt>
                  <dd className="mt-1 text-lg text-gray-900">{product.fabricante}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha de Registro</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {format(new Date(product.created_at), 'dd/MM/yyyy', { locale: es })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Marca</dt>
                  <dd className="mt-1 text-lg text-gray-900">{product.marca}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Modelo</dt>
                  <dd className="mt-1 text-lg text-gray-900">{product.modelo}</dd>
                </div>
              </dl>
            </section>

            {/* Detalles de Fabricación */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Detalles de Fabricación
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Domicilio de Fabricación</dt>
                  <dd className="mt-1 text-lg text-gray-900">{product.domicilio_fabricante}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Identificación</dt>
                  <dd className="mt-1 text-lg text-gray-900">{product.identificacion}</dd>
                </div>
              </dl>
            </section>

            {/* Especificaciones Técnicas */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Especificaciones Técnicas
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Características Técnicas</dt>
                  <dd className="mt-1 text-lg text-gray-900 whitespace-pre-wrap">
                    {product.caracteristicas_tecnicas}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Capacidades y Limitaciones</dt>
                  <dd className="mt-1 text-lg text-gray-900 whitespace-pre-wrap">
                    {product.capacidades_limitaciones}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Materiales</dt>
                  <dd className="mt-1 text-lg text-gray-900">{product.materiales}</dd>
                </div>
              </dl>
            </section>

            {/* Documentación */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Documentación
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Declaración de Conformidad (DJC)
                  </h3>
                  {product.djc_documento ? (
                    <a
                      href={product.djc_documento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Ver/Descargar
                    </a>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50">
                      Archivo no disponible
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Certificado de Producto
                  </h3>
                  {product.certificado_url ? (
                    <a
                      href={product.certificado_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Ver/Descargar
                    </a>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50">
                      Archivo no disponible
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              ID del Producto: {product.codigo_unico}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPassport;