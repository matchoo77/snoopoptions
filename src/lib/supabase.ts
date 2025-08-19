import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detailed debug environment variables
console.log('=== SUPABASE ENVIRONMENT DEBUG ===');
console.log('Raw VITE_SUPABASE_URL:', supabaseUrl);
console.log('Raw VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
console.log('All environment variables:', import.meta.env);
console.log('URL validation:', {
  exists: !!supabaseUrl,
  isString: typeof supabaseUrl === 'string',
  startsWithHttps: supabaseUrl?.startsWith('https://'),
  includesSupabase: supabaseUrl?.includes('supabase'),
  length: supabaseUrl?.length || 0
});
console.log('Key validation:', {
  exists: !!supabaseAnonKey,
  isString: typeof supabaseAnonKey === 'string',
  length: supabaseAnonKey?.length || 0,
  preview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'not set'
});
console.log('=== END SUPABASE DEBUG ===');

const createSupabaseClient = () => {
  // More lenient check for Supabase configuration
  const hasUrl = supabaseUrl && typeof supabaseUrl === 'string' && supabaseUrl.length > 10;
  const hasKey = supabaseAnonKey && typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 20;
  const isConfigured = hasUrl && hasKey;

  console.log('Supabase configuration check:', {
    hasUrl,
    hasKey,
    isConfigured,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0
  });

  if (!isConfigured) {
    console.warn('Supabase not properly configured - using mock client');
    // Return a mock client for development
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
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
  
  console.log('Creating real Supabase client...');
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();