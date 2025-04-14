import { useEffect, useState } from 'react';
import { AuthContext, checkTokenValidity, isSessionExpired } from '../lib/auth';
import { User } from '../types/users';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = useNavigate();
  const location = useLocation();

  const checkSession = async () => {
    try {
      // Check token validity
      const isValid = await checkTokenValidity();
      if (!isValid) {
        setUser(null);
        return false;
      }

      // Check session timeout
      if (isSessionExpired(lastActivity)) {
        await supabase.auth.signOut();
        setUser(null);
        toast.error('Sesión expirada por inactividad');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  };

  useEffect(() => {
    // Update last activity on user interaction
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  useEffect(() => {
    // Check session periodically
    const interval = setInterval(async () => {
      const isValid = await checkSession();
      if (!isValid && !location.pathname.startsWith('/login')) {
        navigate('/login', { 
          state: { 
            from: location.pathname,
            message: 'Por favor inicie sesión para continuar' 
          }
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [navigate, location, lastActivity]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        
        if (location.pathname === '/login') {
          const returnTo = location.state?.from || '/admin';
          navigate(returnTo);
        }
      } else if (!location.pathname.startsWith('/login')) {
        navigate('/login', { 
          state: { 
            from: location.pathname,
            message: 'Por favor inicie sesión para continuar' 
          }
        });
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        
        if (location.pathname === '/login') {
          const returnTo = location.state?.from || '/admin';
          navigate(returnTo);
        }
      } else {
        setUser(null);
        if (!location.pathname.startsWith('/products/') && 
            !location.pathname.startsWith('/qr/') && 
            location.pathname !== '/login' && 
            location.pathname !== '/register') {
          navigate('/login', { 
            state: { 
              from: location.pathname,
              message: 'Por favor inicie sesión para continuar' 
            }
          });
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  return (
    <AuthContext.Provider value={{ user, isLoading, lastActivity, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}