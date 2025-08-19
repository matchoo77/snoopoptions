import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
const isValidSupabaseUrl = supabaseUrl && 
  supabaseUrl.startsWith('https://') && 
  supabaseUrl.includes('.supabase.co') &&
  !supabaseUrl.includes('your_supabase_url');

const isValidSupabaseKey = supabaseAnonKey && 
  supabaseAnonKey.length > 100 && 
  supabaseAnonKey.includes('.') &&
  !supabaseAnonKey.includes('your_supabase_anon_key');

const createSupabaseClient = () => {
  if (!isValidSupabaseUrl || !isValidSupabaseKey) {
    console.warn('Supabase not configured - using mock client');
    
    // Return a mock client that provides helpful error messages
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Please connect to Supabase using the "Connect to Supabase" button in the top right to enable authentication.' } 
        }),
        signUp: () => Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Please connect to Supabase using the "Connect to Supabase" button in the top right to enable authentication.' } 
        }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    } as any;
  }
  
  console.log('Creating Supabase client with valid credentials:', {
    urlPreview: `${supabaseUrl.substring(0, 30)}...`,
    keyPreview: `${supabaseAnonKey.substring(0, 20)}...`
  });
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      debug: false,
      storage: {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            // Ignore storage errors
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch {
            // Ignore storage errors
          }
        },
      },
    }
  });
};

export const supabase = createSupabaseClient();