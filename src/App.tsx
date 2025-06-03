import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SupabaseConnectionTest } from './components/SupabaseConnectionTest';
import ProductsAdmin from './pages/ProductsAdmin';
import ProductPassport from './pages/ProductPassport';
import QRLanding from './pages/QRLanding';
import LoginPage from './pages/LoginPage';
import DJCForm from './pages/DJCForm';
import DJCList from './pages/DJCList';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <SupabaseConnectionTest />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Product and QR routes - these should be accessible publicly */}
        <Route path="/products/:uuid" element={<ProductPassport />} />
        <Route path="/qr/:uuid" element={<QRLanding />} />
        
        {/* Admin section - protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ProductsAdmin />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/djc"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DJCList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/djc/create"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DJCForm />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/djc/edit/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DJCForm />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/login\" replace />} />
        <Route path="*" element={<Navigate to="/login\" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;