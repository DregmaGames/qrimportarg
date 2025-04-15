import React, { useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Producto } from '../types/productos';
import { supabase } from '../lib/supabase';
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
    resolution: 'Res. SIYC N° 16/2025',
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
        resolution: editProduct.resolution || 'Res. SIYC N° 16/2025',
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
        resolution: 'Res. SIYC N° 16/2025',
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl">
          <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-200/80 rounded-t-xl flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {editProduct ? 'Editar Producto' : 'Crear Producto'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Identificación del Producto */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Identificación del Producto
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Producto
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Máquina Industrial XYZ"
                        className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200"
                        value={formData.nombre_producto}
                        onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marca
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: TechBrand"
                        className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200"
                        value={formData.marca}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modelo
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: PRO-2025"
                        className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200"
                        value={formData.modelo}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identificación
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Número de serie o identificador único"
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200"
                      value={formData.identificacion}
                      onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolución
                    </label>
                    <select
                      required
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200"
                      value={formData.resolution}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    >
                      <option value="Res. SIYC N° 16/2025">Res. SIYC N° 16/2025</option>
                      <option value="Res. SIYC N° 236/2024">Res. SIYC N° 236/2024</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Características Técnicas
                    </label>
                    <textarea
                      required
                      placeholder="Detalle las especificaciones técnicas del producto"
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200 min-h-[100px]"
                      value={formData.caracteristicas_tecnicas}
                      onChange={(e) => setFormData({ ...formData, caracteristicas_tecnicas: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacidades y Limitaciones Operativas
                    </label>
                    <textarea
                      required
                      placeholder="Describa las capacidades y limitaciones operativas"
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200 min-h-[100px]"
                      value={formData.capacidades_limitaciones}
                      onChange={(e) => setFormData({ ...formData, capacidades_limitaciones: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Información del Fabricante */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Información del Fabricante
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Fabricante
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo del fabricante"
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200"
                      value={formData.fabricante}
                      onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domicilio de la Planta de Producción
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dirección completa de la planta"
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 shadow-sm transition duration-200"
                      value={formData.domicilio_fabricante}
                      onChange={(e) => setFormData({ ...formData, domicilio_fabricante: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Documentación */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Documentación
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificado del Producto (PDF, máx. 10MB)
                  </label>
                  <div className="mt-1 flex items-center flex-wrap gap-3">
                    <label className="relative cursor-pointer bg-white rounded-lg font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors">
                      <span className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
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
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                        {certificateFile ? certificateFile.name : 'Certificado cargado'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200/80 rounded-b-xl">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                disabled={isUploading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={isUploading}
              >
                {isUploading ? 'Procesando...' : (editProduct ? 'Guardar Cambios' : 'Crear Producto')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}