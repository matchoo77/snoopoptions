import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FilterOptions } from '../types/options';
import { useAuth } from './useAuth';

interface PersistedFiltersRow {
  id: string;
  user_id: string;
  data: FilterOptions;
  updated_at: string;
}

// Assumes a Supabase table:
// create table user_filters (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid not null references auth.users(id) on delete cascade,
//   data jsonb not null,
//   updated_at timestamptz default now()
// );
// create index on user_filters(user_id);

export function usePersistedFilters(filters: FilterOptions, setFilters: (f: FilterOptions) => void) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load on auth ready
  useEffect(() => {
    const load = async () => {
      if (!user || loadedOnce) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('user_filters')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (!error && (data as any)) {
          const row = data as unknown as PersistedFiltersRow;
            setFilters({ ...filters, ...row.data });
        }
        setLoadedOnce(true);
      } catch (e) {
        setError('Failed to load saved filters');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Debounced save when filters change
  useEffect(() => {
    if (!user || !loadedOnce) return; // only after initial load
    const handle = setTimeout(async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('user_filters')
          .upsert({ user_id: user.id, data: filters }, { onConflict: 'user_id' });
        if (error) throw error;
      } catch (e) {
        console.warn('Failed to persist filters', e);
      } finally {
        setSaving(false);
      }
    }, 1200);
    return () => clearTimeout(handle);
  }, [filters, user, loadedOnce]);

  return { loading, saving, error };
}
