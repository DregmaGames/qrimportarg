import { useEffect, useState } from 'react';
import { testSupabaseConnection, checkSupabaseHealth } from '../lib/supabase';
import toast from 'react-hot-toast';

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    let mounted = true;

    async function checkConnection() {
      try {
        // Initial connection test
        const { success, error } = await testSupabaseConnection();

        if (!mounted) return;

        if (!success) throw error;

        setStatus('connected');
        setLastCheck(new Date());
        toast.success('Conexión con Supabase establecida');

        // Start periodic health checks
        const interval = setInterval(async () => {
          const health = await checkSupabaseHealth();
          
          if (!mounted) return;

          if (!health.success) {
            setStatus('error');
            setError('Error de conexión detectado');
            toast.error('Se perdió la conexión con Supabase');
          } else {
            setStatus('connected');
            setLastCheck(new Date());
          }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
      } catch (err) {
        if (!mounted) return;

        console.error('Error connecting to Supabase:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Error desconocido');
        toast.error('Error al conectar con Supabase');
      }
    }

    checkConnection();

    return () => {
      mounted = false;
    };
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
      {status === 'connected' && (
        <p className="mt-1 text-xs text-gray-500">
          Última verificación: {lastCheck.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}