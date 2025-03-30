import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

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
  expiry_date: string;
}

const productSchema = z.object({
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
  cert_file: z.any().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
  product: Product;
}

function EditProductModal({ isOpen, onClose, onProductUpdated, product }: EditProductModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: product.type,
      manufacturer: product.manufacturer,
      manufacturer_address: product.manufacturer_address,
      brand: product.brand,
      model: product.model,
      technical_specs: product.specs.technical_specs,
      technical_regulations: product.specs.technical_regulations,
      technical_standards: product.specs.technical_standards,
      oec_document_reference: product.specs.oec_document_reference,
      expiry_date: product.expiry_date.split('T')[0], // Format date for input
    },
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
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setError('Error al cargar el perfil del usuario');
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

  const onSubmit = async (data: ProductFormData) => {
    if (!user || !userProfile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let certUrl = product.cert_url;

      // Upload new certificate if provided
      if (data.cert_file) {
        const certFile = (data.cert_file as FileList)?.[0];
        if (certFile) {
          certUrl = await uploadFile(certFile, `cert/${Date.now()}-${certFile.name}`);
        }
      }

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
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
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      onProductUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating product:', error);
      setError(error.message || 'Error al actualizar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Editar Producto</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              UUID del Producto
            </label>
            <p className="mt-1 text-sm text-gray-500">{product.uuid}</p>
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
            />
            {errors.oec_document_reference && (
              <p className="mt-1 text-sm text-red-600">{errors.oec_document_reference.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Certificado del Producto Actual
            </label>
            <a
              href={product.cert_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-indigo-600 hover:text-indigo-500"
            >
              Ver certificado actual
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Actualizar Certificado (PDF, opcional)
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
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductModal;