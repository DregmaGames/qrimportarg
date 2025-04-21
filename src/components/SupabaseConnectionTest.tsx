import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

export function SupabaseConnectionTest() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkConnection() {
      try {
        // Test the connection silently
        const { error } = await supabase
          .from('productos')
          .select('codigo_unico')
          .limit(1);

        if (error) {
          console.error('Error connecting to Supabase:', error);
        }

        // Log the current path for debugging routing
        console.log('Current path:', location.pathname);
        
        // Check if we're at the root and not already navigating
        if (location.pathname === '/' && !location.state?.navigating) {
          navigate('/login', { state: { navigating: true } });
        }
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
      }
    }

    checkConnection();
  }, [location, navigate]);

  // Return null to render nothing
  return null;
}