import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'react-signature-canvas';

interface SignatureCanvasProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  initialSignature?: string | null;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSignatureChange, initialSignature }) => {
  const sigCanvas = useRef<SignaturePad>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialSignature || null);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 400, height: 150 });

  // Set initial signature if provided
  useEffect(() => {
    if (initialSignature) {
      setImagePreview(initialSignature);
      setIsEmpty(false);
    }
  }, [initialSignature]);

  // Adjust canvas dimensions to match container
  useEffect(() => {
    const resizeCanvas = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Maintain aspect ratio (400:150)
        const height = (width * 150) / 400;
        setCanvasDimensions({ width, height });
        
        // Need to clear and reset when resizing
        if (sigCanvas.current) {
          const isEmpty = sigCanvas.current.isEmpty();
          const dataUrl = isEmpty ? null : sigCanvas.current.toDataURL();
          
          // Update canvas dimensions
          sigCanvas.current.clear();
          
          // Restore previous signature if it wasn't empty
          if (!isEmpty && dataUrl) {
            // Use setTimeout to ensure canvas is ready after resize
            setTimeout(() => {
              if (sigCanvas.current) {
                sigCanvas.current.fromDataURL(dataUrl);
              }
            }, 0);
          }
        }
      }
    };

    // Initial sizing
    resizeCanvas();

    // Set up resize listener
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setImagePreview(null);
      setIsEmpty(true);
      onSignatureChange(null);
    }
  };

  const save = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        setIsEmpty(true);
        setImagePreview(null);
        onSignatureChange(null);
        return;
      }

      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      setImagePreview(dataUrl);
      setIsEmpty(false);
      onSignatureChange(dataUrl);
    }
  };

  const handleSignatureEnd = () => {
    save();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is a PNG
    if (file.type !== 'image/png') {
      alert('Solo se permiten archivos PNG');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setIsEmpty(false);
      onSignatureChange(dataUrl);
      
      // Clear the file input
      if (e.target) {
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-2 space-y-4">
      <div 
        ref={containerRef} 
        className="border border-gray-300 rounded-md p-0 bg-white overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <SignaturePad
          ref={sigCanvas}
          canvasProps={{
            className: 'signature-canvas w-full h-full',
            style: {
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
              backgroundColor: 'white',
              touchAction: 'none',
              cursor: 'crosshair'
            },
            width: canvasDimensions.width,
            height: canvasDimensions.height,
          }}
          onEnd={handleSignatureEnd}
          dotSize={1} // Improve drawing precision
          minWidth={0.5}
          maxWidth={2.5}
          throttle={16} // 60fps rendering
          velocityFilterWeight={0.7}
        />
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={clear}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Borrar Firma
        </button>
        
        <div className="relative">
          <input
            type="file"
            id="signature-upload"
            accept="image/png"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Subir firma"
          />
          <label
            htmlFor="signature-upload"
            className="inline-flex cursor-pointer items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Subir Firma (PNG)
          </label>
        </div>
      </div>
      
      {imagePreview && (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-700 mb-1">Vista previa de la firma:</p>
          <div className="border border-gray-200 rounded-md p-2 bg-white">
            <img
              src={imagePreview}
              alt="Vista previa de la firma"
              className="max-w-full max-h-[150px] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureCanvas;