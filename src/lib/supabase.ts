import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with additional options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage
  },
  global: {
    headers: {
      'x-application-name': 'qrdeclarg',
      'x-application-version': '1.0.0'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection function with detailed error handling
export async function testSupabaseConnection() {
  try {
    // First, check if we can connect to Supabase
    const { error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;

    // Then try to query the database
    const { data, error: dbError } = await supabase
      .from('productos')
      .select('codigo_unico')
      .limit(1);

    if (dbError) throw dbError;

    // Log successful connection
    console.log('Successfully connected to Supabase:', {
      url: supabaseUrl,
      hasData: Array.isArray(data)
    });

    return { success: true, data };
  } catch (error) {
    // Detailed error logging
    console.error('Supabase connection error:', {
      error,
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    });
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown connection error') 
    };
  }
}

// Health check function
export async function checkSupabaseHealth() {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    const connectionPromise = testSupabaseConnection();
    const result = await Promise.race([connectionPromise, timeoutPromise]);

    return result;
  } catch (error) {
    console.error('Health check failed:', error);
    return { success: false, error };
  }
}