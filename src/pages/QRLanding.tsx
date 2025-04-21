import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';

function QRLanding() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [productData, setProductData] = useState<any>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Log for debugging
    console.log('QRLanding loaded with uuid:', uuid);
    
    try {
      // Try to parse the QR code data if available
      const urlParams = new URLSearchParams(window.location.search);
      const encodedData = urlParams.get('data');
      
      if (encodedData) {
        const decodedData = JSON.parse(decodeURIComponent(encodedData));
        setProductData(decodedData);
      }
    } catch (error) {
      console.error('Error parsing QR data:', error);
    }

    // Auto-redirect after a short delay
    const timer = setTimeout(() => {
      setIsRedirecting(true);
      console.log('Redirecting to product page:', `/products/${uuid}`);
      navigate(`/products/${uuid}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [uuid, navigate]);

  // Immediate redirect if direct access
  const handleManualRedirect = () => {
    setIsRedirecting(true);
    console.log('Manual redirect to:', `/products/${uuid}`);
    navigate(`/products/${uuid}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <button
          onClick={handleManualRedirect}
          disabled={isRedirecting}
          className="inline-flex flex-col items-center justify-center p-8 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          {isRedirecting ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          ) : (
            <>
              <Globe className="h-16 w-16 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
              <span className="mt-4 text-sm text-gray-600">
                {productData?.name || 'Click para ver información del producto'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default QRLanding;