import React, { useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Producto } from '../types/productos';
import { supabase } from '../lib/supabase';
import { generateQRCode, uploadQRCode } from '../lib/qr';
import toast from 'react-hot-toast';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Omit<Producto, 'codigo_unico' | 'created_at' | 'qr_code_url' | 'qr_version' | 'qr_generated_at'>) => Promise<void>;
  editProduct?: Producto;
}

export function ProductModal({ isOpen, onClose, onSubmit, editProduct }: ProductModalProps) {
  const [formData, setFormData] = useState({
    nombre_producto: '',
    marca: '',
    modelo: '',
    caracteristicas_tecnicas: '',
    capacidades_limitaciones: '',
    fabricante: '',
    domicilio_fabricante: '',
    certificado_url: '',
    identificacion: '',
  });
  
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editProduct) {
      setFormData({
        nombre_producto: editProduct.nombre_producto,
        marca: editProduct.marca,
        modelo: editProduct.modelo,
        caracteristicas_tecnicas: editProduct.caracteristicas_tecnicas,
        capacidades_limitaciones: editProduct.capacidades_limitaciones,
        fabricante: editProduct.fabricante,
        domicilio_fabricante: editProduct.domicilio_fabricante,
        certificado_url: editProduct.certificado_url || '',
        identificacion: editProduct.identificacion,
      });
    } else {
      setFormData({
        nombre_producto: '',
        marca: '',
        modelo: '',
        caracteristicas_tecnicas: '',
        capacidades_limitaciones: '',
        fabricante: '',
        domicilio_fabricante: '',
        certificado_url: '',
        identificacion: '',
      });
    }
    setCertificateFile(null);
  }, [editProduct]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

    setCertificateFile(file);
  };

  const uploadCertificate = async (modelo: string): Promise<string | null> => {
    if (!certificateFile) return null;

    const fileName = `${modelo}_${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(fileName, certificateFile);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let certificateUrl = formData.certificado_url;

      if (certificateFile) {
        certificateUrl = await uploadCertificate(formData.modelo) || '';
      }

      await onSubmit({
        ...formData,
        certificado_url: certificateUrl,
      });

      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar el formulario');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {editProduct ? 'Editar Producto' : 'Crear Producto'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Identificación del Producto */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Identificación del Producto</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nombre del Producto
                        </label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={formData.nombre_producto}
                          onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Marca
                        </label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={formData.marca}
                          onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Modelo
                        </label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={formData.modelo}
                          onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Identificación
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={formData.identificacion}
                        onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Características Técnicas
                      </label>
                      <textarea
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={formData.caracteristicas_tecnicas}
                        onChange={(e) => setFormData({ ...formData, caracteristicas_tecnicas: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Capacidades y Limitaciones Operativas
                      </label>
                      <textarea
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={formData.capacidades_limitaciones}
                        onChange={(e) => setFormData({ ...formData, capacidades_limitaciones: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Información del Fabricante */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Fabricante</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre del Fabricante
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={formData.fabricante}
                        onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Domicilio de la Planta de Producción
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={formData.domicilio_fabricante}
                        onChange={(e) => setFormData({ ...formData, domicilio_fabricante: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Documentación */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Documentación</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Certificado del Producto (PDF, máx. 10MB)
                    </label>
                    <div className="mt-1 flex items-center flex-wrap gap-3">
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
                      {(certificateFile || formData.certificado_url) && (
                        <span className="text-sm text-gray-600">
                          {certificateFile ? certificateFile.name : 'Certificado cargado'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isUploading}
                >
                  {isUploading ? 'Procesando...' : (editProduct ? 'Guardar Cambios' : 'Crear Producto')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}