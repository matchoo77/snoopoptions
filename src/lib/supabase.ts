import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration
const HARDCODED_SUPABASE_URL = 'https://vmaktasytlnftugkrlmp.supabase.co';
const HARDCODED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtYWt0YXN5dGxuZnR1Z2tybG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzM2OTEsImV4cCI6MjA3MDk0OTY5MX0.D4tSqMTKS0xJIw4vfIcINmYpvjw7lM_yezOpCxs37gE';

export const getResolvedSupabaseUrl = () => HARDCODED_SUPABASE_URL;
export const getResolvedSupabaseAnonKey = () => HARDCODED_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return true; // Always return true since we have hardcoded values
};

// Create the Supabase client with hardcoded values
export const supabase = createClient(HARDCODED_SUPABASE_URL, HARDCODED_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    debug: false,
  }
});

// Simple bootstrap function
export async function bootstrapSupabaseConfig(): Promise<void> {
  console.log('Supabase config already hardcoded, skipping bootstrap');
  return Promise.resolve();
}