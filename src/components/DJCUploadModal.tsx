import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { generateQRCode, uploadQRCode } from '../lib/qr';

interface DJCUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSuccess: () => void;
}

export function DJCUploadModal({
  isOpen,
  onClose,
  productId,
  productName,
  onSuccess,
}: DJCUploadModalProps) {
  const [djcFile, setDjcFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }

    setDjcFile(file);
  };

  const uploadDJC = async (): Promise<string> => {
    if (!djcFile) throw new Error('No se ha seleccionado ningún archivo');

    const fileName = `djc_${productId}_${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from('djc_documents')
      .upload(fileName, djcFile);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('djc_documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Upload DJC document
      const djcUrl = await uploadDJC();

      // Generate QR code
      const qrDataUrl = await generateQRCode(productId);
      const qrBlob = await fetch(qrDataUrl).then(r => r.blob());
      const qrUrl = await uploadQRCode(qrBlob, productId, 1);

      // Update product record
      const { error: updateError } = await supabase
        .from('productos')
        .update({
          djc_documento: djcUrl,
          djc_fecha: new Date().toISOString(),
          djc_estado: 'cargado',
          qr_generado: true,
          qr_code_url: qrUrl,
          qr_version: 1,
          qr_generated_at: new Date().toISOString()
        })
        .eq('codigo_unico', productId);

      if (updateError) throw updateError;

      toast.success('DJC cargado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el DJC');
    } finally {
      setIsUploading(false);
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Cargar DJC para {productName}
                </Dialog.Title>

                <div className="mt-4">
                  <div className="rounded-md bg-blue-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          El código QR se generará automáticamente después de cargar el DJC.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Documento DJC (PDF, máx. 10MB)
                      </label>
                      <div className="mt-1 flex items-center">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Upload className="h-5 w-5 mr-2" />
                            Seleccionar archivo
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf"
                            onChange={handleFileChange}
                          />
                        </label>
                        {djcFile && (
                          <span className="ml-3 text-sm text-gray-600">
                            {djcFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={handleSubmit}
                    disabled={!djcFile || isUploading}
                  >
                    {isUploading ? 'Cargando...' : 'Cargar DJC'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}