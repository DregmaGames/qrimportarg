import { useEffect, useState } from 'react';
import { AuthContext } from '../lib/auth';
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

  useEffect(() => {
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
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
          
          if (location.pathname === '/login') {
            const returnTo = location.state?.from || '/admin';
            navigate(returnTo, { replace: true });
          }
        } else if (!location.pathname.startsWith('/login') && 
                   !location.pathname.startsWith('/products/') && 
                   !location.pathname.startsWith('/qr/')) {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        toast.error('Error al inicializar la sesión');
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login', { replace: true });
        return;
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        
        if (location.pathname === '/login') {
          const returnTo = location.state?.from || '/admin';
          navigate(returnTo, { replace: true });
        }
      } else {
        setUser(null);
        if (!location.pathname.startsWith('/products/') && 
            !location.pathname.startsWith('/qr/') && 
            location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, lastActivity, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}