import { createClient, type User, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('tu-proyecto')
  );
};

// Create the Supabase client instance (or a dummy client if not configured)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

// --- AUTH HELPER FUNCTIONS ---

export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const getSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado aún. Por favor añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado aún. Por favor añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPasswordForEmail = async (email: string) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado aún.');
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
};

export const testConnection = async (): Promise<{ ok: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'Faltan credenciales de Supabase en .env' };
  }
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('relation "public.products" does not exist')) {
        return { ok: false, message: 'Conectado a Supabase pero falta ejecutar supabase_schema.sql en el SQL Editor.' };
      }
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Conexión a Supabase exitosa y tablas listas.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido al conectar';
    return { ok: false, message: errorMsg };
  }
};
