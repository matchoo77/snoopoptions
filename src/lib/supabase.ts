import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Optional hardcoded fallbacks (edit these to hardcode your project)
// Example:
// const HARDCODED_SUPABASE_URL = 'https://your-ref.supabase.co';
// const HARDCODED_SUPABASE_ANON_KEY = 'ey...';
const HARDCODED_SUPABASE_URL = '';
const HARDCODED_SUPABASE_ANON_KEY = '';
// If you deploy the public-config Edge Function, you can hardcode its base URL here too
// For example: https://<ref>.functions.supabase.co
const HARDCODED_FUNCTIONS_URL = '';

// Resolve Supabase URL and ANON KEY with precedence:
// 1) window globals set by hosting or inline script
// 2) localStorage overrides
// 3) Vite env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
// 4) Hardcoded fallbacks above
const resolveSupabaseUrl = (): string | undefined => {
  const w = (typeof window !== 'undefined' ? (window as any) : undefined) as any;
  return (
    (w && (w.__SUPABASE_URL__ as string)) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_URL') || undefined : undefined) ||
    ((import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined) ||
    (HARDCODED_SUPABASE_URL || undefined)
  );
};

const resolveSupabaseAnonKey = (): string | undefined => {
  const w = (typeof window !== 'undefined' ? (window as any) : undefined) as any;
  return (
    (w && (w.__SUPABASE_ANON_KEY__ as string)) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') || undefined : undefined) ||
    ((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    (HARDCODED_SUPABASE_ANON_KEY || undefined)
  );
};

export const getResolvedSupabaseUrl = resolveSupabaseUrl;
export const getResolvedSupabaseAnonKey = resolveSupabaseAnonKey;

let supabaseUrl = resolveSupabaseUrl();
let supabaseAnonKey = resolveSupabaseAnonKey();

const isUrlValid = (url?: string) =>
  !!url && url.startsWith('https://') && url.includes('.supabase.co') && !url.includes('your_supabase_url');
const isKeyValid = (key?: string) =>
  !!key && key.length > 100 && key.includes('.') && !key.includes('your_supabase_anon_key');

// Validate Supabase configuration (initial)
let isValidSupabaseUrl = isUrlValid(supabaseUrl);
let isValidSupabaseKey = isKeyValid(supabaseAnonKey);

export const isSupabaseConfigured = (): boolean => {
  const url = resolveSupabaseUrl();
  const key = resolveSupabaseAnonKey();
  return isUrlValid(url) && isKeyValid(key);
};

const createSupabaseClient = (): SupabaseClient<any> => {
  // Re-resolve at creation to pick up any globals/localStorage updates
  supabaseUrl = resolveSupabaseUrl();
  supabaseAnonKey = resolveSupabaseAnonKey();
  isValidSupabaseUrl = isUrlValid(supabaseUrl);
  isValidSupabaseKey = isKeyValid(supabaseAnonKey);

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
    urlPreview: `${supabaseUrl!.substring(0, 30)}...`,
    keyPreview: `${supabaseAnonKey!.substring(0, 20)}...`
  });
  
  return createClient(supabaseUrl!, supabaseAnonKey!, {
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

// Export a live-binding client that can be swapped after bootstrap
export let supabase: SupabaseClient<any> = createSupabaseClient();

// Optionally fetch public config (URL + ANON KEY) from a Supabase Edge Function
// Expects an Edge Function deployed at <functionsBase>/public-config
// The base can be provided by window.__SUPABASE_FUNCTIONS_URL__ or HARDCODED_FUNCTIONS_URL
export async function bootstrapSupabaseConfig(): Promise<void> {
  if (isSupabaseConfigured()) return; // already configured

  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : {};
    const functionsBase =
      (w && w.__SUPABASE_FUNCTIONS_URL__) ||
      HARDCODED_FUNCTIONS_URL ||
      undefined;

    if (!functionsBase) {
      // Nothing to fetch from
      return;
    }

    const url = `${functionsBase.replace(/\/$/, '')}/public-config`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return;
    const json = await resp.json();
    const urlVal = json?.supabaseUrl as string | undefined;
    const keyVal = json?.supabaseAnonKey as string | undefined;
    if (urlVal && keyVal) {
      try {
        localStorage.setItem('SUPABASE_URL', urlVal);
        localStorage.setItem('SUPABASE_ANON_KEY', keyVal);
      } catch {}
      if (w) {
        w.__SUPABASE_URL__ = urlVal;
        w.__SUPABASE_ANON_KEY__ = keyVal;
      }
      // Recreate client with new config
      supabase = createSupabaseClient();
    }
  } catch (e) {
    console.warn('bootstrapSupabaseConfig failed:', e);
  }
}