import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';
import QRCode from 'qrcode';

interface UserProfile {
  company_name: string;
  tax_id: string;
  brand_name: string;
  legal_address: string;
  warehouse_address: string;
  phone: string;
  email: string;
}

interface Representative {
  id: string;
  name: string;
  position: string;
  include_in_djc: boolean;
}

const productSchema = z.object({
  uuid: z.string().optional(),
  type: z.string().min(1, 'El tipo de producto es requerido'),
  manufacturer: z.string().min(1, 'Fabricante es requerido'),
  manufacturer_address: z.string().min(1, 'Dirección del fabricante es requerida'),
  brand: z.string().min(1, 'Marca es requerida'),
  model: z.string().min(1, 'Modelo es requerido'),
  technical_specs: z.string().min(1, 'Características técnicas son requeridas'),
  technical_regulations: z.string().min(1, 'Reglamentos técnicos son requeridos'),
  technical_standards: z.string().min(1, 'Normas técnicas son requeridas'),
  oec_document_reference: z.string().min(1, 'Referencia del documento OEC es requerida'),
  expiry_date: z.string().min(1, 'La fecha de vencimiento es requerida'),
  cert_file: z.any().refine((file) => {
    if (!file || !(file instanceof FileList) || file.length === 0) {
      return false;
    }
    const firstFile = file[0];
    return firstFile && firstFile.type === 'application/pdf';
  }, 'El certificado del producto es requerido y debe ser un archivo PDF'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
}

function CreateProductModal({ isOpen, onClose, onProductCreated }: CreateProductModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
      fetchRepresentatives();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setProfileError('No se encontró el perfil del usuario. Por favor, complete su perfil antes de crear un producto.');
        setUserProfile(null);
        return;
      }

      setUserProfile(data[0]);
      setProfileError(null);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setProfileError('Error al cargar el perfil del usuario. Por favor, intente nuevamente.');
      setUserProfile(null);
    }
  };

  const fetchRepresentatives = async () => {
    try {
      const { data, error } = await supabase
        .from('representatives')
        .select('*')
        .eq('user_id', user?.id)
        .eq('include_in_djc', true);

      if (error) throw error;
      setRepresentatives(data || []);
    } catch (error) {
      console.error('Error fetching representatives:', error);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('product-files')
      .upload(`${user?.id}/${path}`, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-files')
      .getPublicUrl(`${user?.id}/${path}`);

    return publicUrl;
  };

  const generateQRCode = async (uuid: string) => {
    const url = `${window.location.origin}/product/${uuid}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(url);
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user || !userProfile) {
      setError('Debe completar su perfil antes de crear un producto');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get the certificate file and validate it exists
      const certFile = (data.cert_file as FileList)?.[0];
      if (!certFile) {
        setError('Por favor, seleccione un archivo de certificado válido');
        setIsSubmitting(false);
        return;
      }

      // Upload certificate file
      const certUrl = await uploadFile(certFile, `cert/${Date.now()}-${certFile.name}`);

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([
          {
            user_id: user.id,
            uuid: data.uuid || undefined,
            type: data.type,
            manufacturer: data.manufacturer,
            manufacturer_address: data.manufacturer_address,
            brand: data.brand,
            model: data.model,
            specs: {
              technical_specs: data.technical_specs,
              technical_regulations: data.technical_regulations,
              technical_standards: data.technical_standards,
              oec_document_reference: data.oec_document_reference,
              company_info: {
                company_name: userProfile.company_name,
                tax_id: userProfile.tax_id,
                brand_name: userProfile.brand_name,
                legal_address: userProfile.legal_address,
                warehouse_address: userProfile.warehouse_address,
                phone: userProfile.phone,
                email: userProfile.email,
                representatives: representatives,
              },
            },
            cert_url: certUrl,
            expiry_date: data.expiry_date,
          },
        ])
        .select()
        .single();

      if (productError) throw productError;

      // Generate QR code
      const qrCode = await generateQRCode(product.uuid);

      // Update product with QR code
      const { error: updateError } = await supabase
        .from('products')
        .update({ qr_code: qrCode })
        .eq('id', product.id);

      if (updateError) throw updateError;

      reset();
      onProductCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating product:', error);
      setError(error.message || 'Error al crear el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Producto</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {profileError ? (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {profileError}
          </div>
        ) : error ? (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        ) : null}

        {userProfile && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Información de la Empresa</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Razón Social:</strong> {userProfile.company_name}</p>
                <p><strong>CUIT:</strong> {userProfile.tax_id}</p>
                <p><strong>Marca Registrada:</strong> {userProfile.brand_name}</p>
                <p><strong>Teléfono:</strong> {userProfile.phone}</p>
              </div>
              <div>
                <p><strong>Domicilio Legal:</strong> {userProfile.legal_address}</p>
                <p><strong>Domicilio Depósito:</strong> {userProfile.warehouse_address}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
              </div>
            </div>
            {representatives.length > 0 && (
              <div className="mt-2">
                <p><strong>Representantes Autorizados:</strong></p>
                <ul className="list-disc list-inside">
                  {representatives.map(rep => (
                    <li key={rep.id}>{rep.name} - {rep.position}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!profileError && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Código Único del Producto (opcional)
              </label>
              <input
                type="text"
                {...register('uuid')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Dejar en blanco para generar automáticamente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Producto
              </label>
              <select
                {...register('type')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Seleccione un tipo</option>
                <option value="Electrodoméstico">Electrodoméstico</option>
                <option value="Equipamiento Industrial">Equipamiento Industrial</option>
                <option value="Iluminación">Iluminación</option>
                <option value="Material Eléctrico">Material Eléctrico</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fabricante
              </label>
              <input
                type="text"
                {...register('manufacturer')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Nombre del fabricante"
              />
              {errors.manufacturer && (
                <p className="mt-1 text-sm text-red-600">{errors.manufacturer.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dirección del Fabricante
              </label>
              <input
                type="text"
                {...register('manufacturer_address')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Dirección completa de producción"
              />
              {errors.manufacturer_address && (
                <p className="mt-1 text-sm text-red-600">{errors.manufacturer_address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Marca
              </label>
              <input
                type="text"
                {...register('brand')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Marca del producto"
              />
              {errors.brand && (
                <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Modelo
              </label>
              <input
                type="text"
                {...register('model')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Modelo o número de serie"
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                {...register('expiry_date')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.expiry_date && (
                <p className="mt-1 text-sm text-red-600">{errors.expiry_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Características Técnicas
              </label>
              <textarea
                {...register('technical_specs')}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Detalle las características técnicas del producto"
              />
              {errors.technical_specs && (
                <p className="mt-1 text-sm text-red-600">{errors.technical_specs.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reglamentos Técnicos Aplicables
              </label>
              <textarea
                {...register('technical_regulations')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Liste los reglamentos técnicos aplicables"
              />
              {errors.technical_regulations && (
                <p className="mt-1 text-sm text-red-600">{errors.technical_regulations.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Normas Técnicas Específicas
              </label>
              <textarea
                {...register('technical_standards')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Liste las normas técnicas específicas aplicables"
              />
              {errors.technical_standards && (
                <p className="mt-1 text-sm text-red-600">{errors.technical_standards.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Referencia del Documento OEC
              </label>
              <input
                type="text"
                {...register('oec_document_reference')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Número de referencia del documento emitido por el Organismo Evaluador de la Conformidad"
              />
              {errors.oec_document_reference && (
                <p className="mt-1 text-sm text-red-600">{errors.oec_document_reference.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Certificado del Producto (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                {...register('cert_file')}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {errors.cert_file && (
                <p className="mt-1 text-sm text-red-600">{errors.cert_file.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creando...' : 'Crear Producto'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateProductModal;