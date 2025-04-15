import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function SupabaseConnectionTest() {
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
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
      }
    }

    checkConnection();
  }, []);

  // Return null to render nothing
  return null;
}