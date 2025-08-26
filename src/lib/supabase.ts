import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration
const HARDCODED_SUPABASE_URL = 'https://vmaktasytlnftugkrlmp.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtYWt0YXN5dGxuZnR1Z2tybG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzM2OTEsImV4cCI6MjA3MDk0OTY5MX0.D4tSqMTKS0xJIw4vfIcINmYpvjw7lM_yezOpCxs37gE';
const HARDCODED_FUNCTIONS_URL = '';

// Debug function to check all possible sources
function debugSupabaseConfig() {
  const w = (typeof window !== 'undefined' ? (window as any) : undefined) as any;
  const viteUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
  const viteKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined;
  
  console.log('Supabase config debug:', {
    windowUrl: w?.__SUPABASE_URL__,
    windowKey: w?.__SUPABASE_ANON_KEY__ ? `${w.__SUPABASE_ANON_KEY__.substring(0, 20)}...` : undefined,
    localStorageUrl: typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_URL') : undefined,
    localStorageKey: typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') : undefined,
    viteUrl,
    viteKey: viteKey ? `${viteKey.substring(0, 20)}...` : undefined,
    hardcodedUrl: HARDCODED_SUPABASE_URL,
    hardcodedKey: HARDCODED_SUPABASE_ANON_KEY ? `${HARDCODED_SUPABASE_ANON_KEY.substring(0, 20)}...` : undefined,
  });
}

// Resolve Supabase URL and ANON KEY with precedence:
// 1) window globals set by hosting or inline script
// 2) localStorage overrides
// 3) Vite env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
// 4) Hardcoded fallbacks above
const resolveSupabaseUrl = (): string => {
  debugSupabaseConfig();
  const w = (typeof window !== 'undefined' ? (window as any) : undefined) as any;
  return (
    (w && (w.__SUPABASE_URL__ as string)) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_URL') || undefined : undefined) ||
    ((import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined) ||
    HARDCODED_SUPABASE_URL
  );
};

const resolveSupabaseAnonKey = (): string => {
  const w = (typeof window !== 'undefined' ? (window as any) : undefined) as any;
  return (
    (w && (w.__SUPABASE_ANON_KEY__ as string)) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') || undefined : undefined) ||
    ((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    HARDCODED_SUPABASE_ANON_KEY
  );
};

export const getResolvedSupabaseUrl = resolveSupabaseUrl;
export const getResolvedSupabaseAnonKey = resolveSupabaseAnonKey;

// Simple validation functions
const isUrlValid = (url: string) => {
  return url && url.startsWith('https://') && url.includes('.supabase.co') && url.length > 20;
};

const isKeyValid = (key: string) => {
  return key && key.length > 100 && key.includes('.') && key.startsWith('eyJ');
};

export const isSupabaseConfigured = (): boolean => {
  const url = resolveSupabaseUrl();
  const key = resolveSupabaseAnonKey();
  const configured = isUrlValid(url) && isKeyValid(key);
  
  console.log('isSupabaseConfigured check:', { 
    url: url ? `${url.substring(0, 30)}...` : 'none', 
    key: key ? `${key.substring(0, 20)}...` : 'none',
    urlValid: isUrlValid(url),
    keyValid: isKeyValid(key),
    configured
  });
  
  return configured;
};

// Create the Supabase client with hardcoded values
const createSupabaseClient = (): SupabaseClient<any> => {
  const supabaseUrl = resolveSupabaseUrl();
  const supabaseAnonKey = resolveSupabaseAnonKey();
  
  console.log('Creating Supabase client with:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length || 0,
    urlValid: isUrlValid(supabaseUrl),
    keyValid: isKeyValid(supabaseAnonKey)
  });
  
  // Always create a real client since we have hardcoded values
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

// Export the Supabase client
export const supabase = createSupabaseClient();

// Optionally fetch public config (URL + ANON KEY) from a Supabase Edge Function
export async function bootstrapSupabaseConfig(): Promise<void> {
  // Since we have hardcoded values, we don't need to bootstrap
  console.log('Supabase config already hardcoded, skipping bootstrap');
  return;
}