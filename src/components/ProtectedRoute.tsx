import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, checkSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const validateSession = async () => {
      const isValid = await checkSession();
      if (!isValid && !location.pathname.startsWith('/login')) {
        // Session is invalid, redirect to login
        return;
      }
    };

    validateSession();
  }, [location, checkSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location.pathname,
          message: 'Por favor inicie sesión para continuar'
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
}