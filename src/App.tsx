import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import ProductsAdmin from './pages/ProductsAdmin';
import ProductPassport from './pages/ProductPassport';
import QRLanding from './pages/QRLanding';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products/:uuid" element={<ProductPassport />} />
        <Route path="/qr/:uuid" element={<QRLanding />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProductsAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;