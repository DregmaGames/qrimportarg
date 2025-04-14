import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';

function QRLanding() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [productData, setProductData] = useState<any>(null);

  useEffect(() => {
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

    // Auto-redirect after 2 seconds
    const timer = setTimeout(() => {
      navigate(`/products/${uuid}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [uuid, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <button
          onClick={() => navigate(`/products/${uuid}`)}
          className="inline-flex flex-col items-center justify-center p-8 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <Globe className="h-16 w-16 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
          <span className="mt-4 text-sm text-gray-600">
            {productData?.name || 'Click para ver información del producto'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default QRLanding;