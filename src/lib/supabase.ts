import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Supabase environment check:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'not set',
  urlValid: !!(supabaseUrl && supabaseUrl.startsWith('https://')),
  keyValid: !!(supabaseAnonKey && supabaseAnonKey.length > 20)
});

const createSupabaseClient = () => {
  // Check if Supabase is properly configured
  const isConfigured = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl.startsWith('https://') && 
                      supabaseUrl.includes('.supabase.co') &&
                      supabaseAnonKey.length > 20 &&
                      !supabaseUrl.includes('placeholder') &&
                      !supabaseAnonKey.includes('placeholder');

  if (!isConfigured) {
    console.warn('Supabase environment variables not configured - some features may be limited');
    console.log('Supabase config details:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlFormat: supabaseUrl ? 'set' : 'missing',
      keyLength: supabaseAnonKey?.length || 0
    });
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