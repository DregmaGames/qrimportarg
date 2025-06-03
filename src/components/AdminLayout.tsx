import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, FileText, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Check if user is already signed out
      if (!user) {
        navigate('/login');
        toast.success('Sesión cerrada');
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate('/login');
      toast.success('Sesión cerrada');
    } catch (error: any) {
      // Check if the error is related to the session already being invalid/missing
      const errorMessage = error.message || '';
      const errorDetails = error.details || '';
      const errorCode = error.code || '';
      
      if (
        errorMessage.includes('Auth session missing') || 
        errorDetails.includes('session_not_found') ||
        errorCode === 'session_not_found' ||
        errorMessage.includes('Session from session_id claim in JWT does not exist') ||
        errorMessage.includes('Invalid JWT')
      ) {
        // If the session is already invalid, treat this as a successful logout
        console.log('Session already invalid, treating as successful logout');
        navigate('/login');
        toast.success('Sesión cerrada');
      } else {
        // For other unexpected errors, log to console and show error toast
        console.error('Error signing out:', error);
        toast.error('Error al cerrar sesión');
      }
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                Panel de Administración
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                  />
                </svg>
              </button>

              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation - Desktop */}
          <div className="hidden sm:block border-t border-gray-200">
            <div className="flex -mb-px">
              <Link
                to="/admin"
                className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                  isActive('/admin')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="inline-block h-5 w-5 mr-2 -mt-0.5" />
                Productos
              </Link>
              <Link
                to="/djc"
                className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                  isActive('/djc')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="inline-block h-5 w-5 mr-2 -mt-0.5" />
                Declaraciones Juradas
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200 py-2">
              <div className="space-y-1 px-2 pb-3 pt-2">
                <Link
                  to="/admin"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/admin')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Package className="inline-block h-5 w-5 mr-2 -mt-0.5" />
                  Productos
                </Link>
                <Link
                  to="/djc"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/djc')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <FileText className="inline-block h-5 w-5 mr-2 -mt-0.5" />
                  Declaraciones Juradas
                </Link>
                <div className="pt-4 pb-2 border-t border-gray-200">
                  <div className="flex items-center px-3">
                    <div className="text-sm font-medium text-gray-500 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;