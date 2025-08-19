import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error && error.message.includes('refresh_token_not_found')) {
          // Clear invalid session data
          console.warn('Invalid refresh token detected, clearing session:', error);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else if (error) {
          console.warn('Auth session error:', error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
        // Clear any stale data on initialization error
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn('Error clearing stale session:', signOutError);
        }
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    let subscription: any;
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Token refresh failed, clear everything
          console.warn('Token refresh failed, clearing session');
          await supabase.auth.signOut();
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
      subscription = authSubscription;
    } catch (error) {
      console.warn('Auth state change listener error:', error);
    }

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Logout error:', error.message);
      }
    } catch (error) {
      console.warn('Logout failed:', error);
    } finally {
      // Always clear local state
      setSession(null);
      setUser(null);
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
}