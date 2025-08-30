import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { OptionsSweep, SnoopTestParams } from '../types/snooptest';

export function useSweepsStorage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const storeSweeps = async (sweeps: OptionsSweep[], _params?: SnoopTestParams) => {
        try {
            setLoading(true);
            setError(null);

            // Transform sweeps to database format
            const dbSweeps = sweeps.map(sweep => ({
                ticker: sweep.ticker,
                trade_date: sweep.date,
                option_type: sweep.optionType,
                strike_price: 0, // Would be extracted from contract data
                expiration_date: new Date(sweep.date), // Simplified for demo
                volume: sweep.volume,
                price: sweep.price,
                bid: sweep.bid,
                ask: sweep.ask,
                trade_location: sweep.tradeLocation.replace('-', '_'), // Convert to snake_case for enum
                inferred_side: sweep.inferredSide,
                premium: sweep.price * sweep.volume, // Calculate premium
            }));

            // Batch insert sweeps (only if using real data)
            if (dbSweeps.length > 0) {
                const { error: insertError } = await supabase
                    .from('options_sweeps')
                    .upsert(dbSweeps, {
                        onConflict: 'ticker,trade_date,option_type,volume',
                        ignoreDuplicates: true
                    });

                if (insertError) {
                    console.warn('Failed to store sweeps:', insertError.message);
                    // Don't throw error - storage is optional
                } else {
                    console.log(`✅ Stored ${dbSweeps.length} sweeps to Supabase for faster future queries`);
                }
            }

        } catch (err) {
            console.warn('Sweep storage error:', err);
            setError(err instanceof Error ? err.message : 'Failed to store sweeps');
        } finally {
            setLoading(false);
        }
    };

    const getStoredSweeps = async (params: SnoopTestParams): Promise<OptionsSweep[]> => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('options_sweeps')
                .select('*')
                .eq('ticker', params.ticker)
                .gte('trade_date', params.startDate)
                .lte('trade_date', params.endDate)
                .in('trade_location', params.tradeLocations.map(loc => loc.replace('-', '_')))
                .order('trade_date', { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            // Transform back to frontend format
            const sweeps: OptionsSweep[] = (data || []).map(sweep => ({
                id: sweep.id,
                ticker: sweep.ticker,
                date: sweep.trade_date,
                optionType: sweep.option_type,
                volume: sweep.volume,
                price: sweep.price,
                bid: sweep.bid,
                ask: sweep.ask,
                tradeLocation: sweep.trade_location.replace('_', '-'), // Convert back to kebab-case
                inferredSide: sweep.inferred_side,
                timestamp: new Date(sweep.trade_date).toISOString(),
            }));

            console.log(`📦 Retrieved ${sweeps.length} pre-processed sweeps from Supabase`);
            return sweeps;

        } catch (err) {
            console.warn('Failed to retrieve stored sweeps:', err);
            setError(err instanceof Error ? err.message : 'Failed to retrieve sweeps');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const checkStoredSweepsAvailability = async (params: SnoopTestParams): Promise<boolean> => {
        try {
            const { count, error } = await supabase
                .from('options_sweeps')
                .select('*', { count: 'exact', head: true })
                .eq('ticker', params.ticker)
                .gte('trade_date', params.startDate)
                .lte('trade_date', params.endDate);

            if (error) {
                console.warn('Error checking stored sweeps:', error.message);
                return false;
            }

            const hasStoredData = (count || 0) > 10; // Minimum threshold for using stored data
            if (hasStoredData) {
                console.log(`📦 Found ${count} stored sweeps for ${params.ticker}, using cached data for faster performance`);
            }

            return hasStoredData;
        } catch (err) {
            console.warn('Error checking stored sweeps availability:', err);
            return false;
        }
    };

    return {
        loading,
        error,
        storeSweeps,
        getStoredSweeps,
        checkStoredSweepsAvailability,
    };
}
