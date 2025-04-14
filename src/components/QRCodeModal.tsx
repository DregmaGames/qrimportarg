import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Download, X, Link as LinkIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function QRCodeModal({ isOpen, onClose, productId, productName }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [destinationUrl, setDestinationUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, productId]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const url = `${window.location.origin}/qr/${productId}`;
      setDestinationUrl(url);

      // Generate high-quality QR code
      const dataUrl = await QRCode.toDataURL(
        `${url}?data=${encodeURIComponent(
          JSON.stringify({
            id: productId,
            name: productName,
            timestamp: new Date().toISOString()
          })
        )}`,
        {
          type: 'image/png',
          width: 1000, // High resolution
          margin: 2,
          errorCorrectionLevel: 'H', // Highest error correction level
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          quality: 1.0 // Maximum quality
        }
      );
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Error al generar el código QR');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      saveAs(blob, `qr-${productName.toLowerCase().replace(/\s+/g, '-')}.png`);
      toast.success('Código QR descargado exitosamente');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Error al descargar el código QR');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(destinationUrl);
      toast.success('URL copiada al portapapeles');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Error al copiar la URL');
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Código QR del Producto
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  {isGenerating ? (
                    <div className="w-64 h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : qrDataUrl && (
                    <>
                      <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
                        <img
                          src={qrDataUrl}
                          alt="Código QR del producto"
                          className="w-64 h-64"
                        />
                      </div>
                      
                      <p className="mt-4 text-sm text-gray-600 text-center">
                        {productName}
                      </p>

                      <div className="mt-4 w-full">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <LinkIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <input
                            type="text"
                            readOnly
                            value={destinationUrl}
                            className="text-sm text-gray-600 bg-transparent flex-1 outline-none"
                            onClick={(e) => e.currentTarget.select()}
                          />
                          <button
                            onClick={copyToClipboard}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={handleDownload}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}