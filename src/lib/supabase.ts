import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in development or production
const isDevelopment = import.meta.env.DEV;

console.log('Supabase config check:', {
  isDevelopment,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0
});

const createSupabaseClient = () => {
  // In production, if Supabase isn't configured, show a helpful message
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found');
    
    // Return a mock client that provides helpful error messages
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Authentication requires Supabase connection. Please connect to Supabase in your project settings.' } 
        }),
        signUp: () => Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Account creation requires Supabase connection. Please connect to Supabase in your project settings.' } 
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
  
  console.log('Creating Supabase client with valid credentials');
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: 'snoopflow-auth-token',
    },
    global: {
      headers: {
        'X-Client-Info': 'snoopflow-web'
      }
    }
  });
};

export const supabase = createSupabaseClient();