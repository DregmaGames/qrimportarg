import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SupabaseConnectionTest } from './components/SupabaseConnectionTest';
import ProductsAdmin from './pages/ProductsAdmin';
import ProductPassport from './pages/ProductPassport';
import QRLanding from './pages/QRLanding';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <SupabaseConnectionTest />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/products/:uuid" element={<ProductPassport />} />
        <Route path="/qr/:uuid" element={<QRLanding />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ProductsAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;