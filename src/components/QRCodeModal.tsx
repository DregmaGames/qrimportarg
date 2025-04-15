import React, { useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Download, X, Link as LinkIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { saveAs } from 'file-saver';
import { toPng, toBlob } from 'html-to-image';
import { jsPDF } from 'jspdf';
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
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, productId]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const url = `${window.location.origin}/products/${productId}`;
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
          width: 1000,
          margin: 0,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
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

  const handleDownloadPNG = async () => {
    if (!labelRef.current) return;

    try {
      const dataUrl = await toPng(labelRef.current, {
        width: 94, // 25mm at 96dpi
        height: 113, // 30mm at 96dpi
        pixelRatio: 4
      });
      
      saveAs(dataUrl, `qr-${productName.toLowerCase().replace(/\s+/g, '-')}.png`);
      toast.success('Etiqueta PNG descargada exitosamente');
    } catch (error) {
      console.error('Error downloading PNG:', error);
      toast.error('Error al descargar la etiqueta PNG');
    }
  };

  const handleDownloadPDF = async () => {
    if (!labelRef.current) return;

    try {
      const blob = await toBlob(labelRef.current, {
        width: 94,
        height: 113,
        pixelRatio: 4
      });

      if (!blob) throw new Error('Error generating image');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [25, 30] // Exact dimensions in mm
      });

      const imgData = URL.createObjectURL(blob);
      pdf.addImage(imgData, 'PNG', 0, 0, 25, 30); // Place at exact dimensions
      pdf.save(`qr-${productName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      
      URL.revokeObjectURL(imgData);
      toast.success('Etiqueta PDF descargada exitosamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar la etiqueta PDF');
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

  // Convert CMYK to RGB: C=47%, M=22%, Y=0%, K=14%
  // Using standard CMYK to RGB conversion formula
  const cmykToRgb = () => {
    const c = 0.47;
    const m = 0.22;
    const y = 0;
    const k = 0.14;
    
    const r = Math.round(255 * (1 - c) * (1 - k));
    const g = Math.round(255 * (1 - m) * (1 - k));
    const b = Math.round(255 * (1 - y) * (1 - k));
    
    return `rgb(${r}, ${g}, ${b})`;
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
                      <div 
                        ref={labelRef}
                        className="bg-white flex flex-col items-center"
                        style={{
                          width: '94px', // 25mm at 96dpi
                          height: '113px', // 30mm at 96dpi
                          boxSizing: 'border-box',
                          border: '1px solid black',
                          borderRadius: '8px',
                          padding: '8px 8px'
                        }}
                      >
                        <div style={{ flex: 0.5 }} />
                        <img
                          src={qrDataUrl}
                          alt="Código QR del producto"
                          style={{
                            width: '75px', // 20mm at 96dpi
                            height: '75px', // 20mm at 96dpi
                            imageRendering: 'pixelated'
                          }}
                        />
                        <div style={{ flex: 1 }} />
                        <div className="flex items-center" style={{ alignItems: 'baseline' }}>
                          <span
                            style={{
                              fontFamily: 'Montserrat-Arabic',
                              fontSize: '20pt',
                              lineHeight: 1,
                              marginRight: '4px',
                              color: '#000000'
                            }}
                          >
                            AR
                          </span>
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{
                              verticalAlign: 'baseline',
                              color: cmykToRgb()
                            }}
                          >
                            <path
                              d="M3 12L9 18L21 6"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              transform="translate(0, -3)"
                            />
                            <path
                              d="M3 12L9 18L21 6"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              transform="translate(0, 4)"
                            />
                          </svg>
                        </div>
                        <div style={{ flex: 0.5 }} />
                      </div>

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

                      <div className="mt-6 flex justify-center gap-3">
                        <button
                          onClick={handleDownloadPNG}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PNG
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
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