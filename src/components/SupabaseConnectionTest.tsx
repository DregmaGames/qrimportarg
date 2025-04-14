import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        // Test the connection by making a simple query
        const { data, error } = await supabase
          .from('productos')
          .select('codigo_unico')
          .limit(1);

        if (error) throw error;

        // If we get here, the connection is working
        setStatus('connected');
        toast.success('Conexión con Supabase establecida');
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Error desconocido');
        toast.error('Error al conectar con Supabase');
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg bg-white">
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            status === 'checking'
              ? 'bg-yellow-500 animate-pulse'
              : status === 'connected'
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium">
          {status === 'checking'
            ? 'Verificando conexión...'
            : status === 'connected'
            ? 'Conectado a Supabase'
            : 'Error de conexión'}
        </span>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}