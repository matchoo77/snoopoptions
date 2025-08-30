import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { SnoopTestParams, SnoopTestResult, SnoopTestSummary } from '../types/snooptest';

export function useSnoopTestStorage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const storeTestResults = async (
        params: SnoopTestParams,
        results: SnoopTestResult[],
        summary: SnoopTestSummary
    ) => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error: insertError } = await supabase
                .from('snooptest_results')
                .insert({
                    user_id: user.id,
                    ticker: params.ticker,
                    start_date: params.startDate,
                    end_date: params.endDate,
                    hold_period: params.holdPeriod,
                    trade_locations: params.tradeLocations,
                    total_sweeps: summary.totalTrades,
                    win_rate: summary.winRate,
                    average_move: summary.averageMove,
                    results_data: {
                        results,
                        summary,
                        params
                    }
                });

            if (insertError) {
                throw new Error(insertError.message);
            }

            console.log(`💾 Stored SnoopTest results for ${params.ticker} (${summary.winRate.toFixed(1)}% win rate)`);

        } catch (err) {
            console.warn('Failed to store test results:', err);
            setError(err instanceof Error ? err.message : 'Failed to store test results');
        } finally {
            setLoading(false);
        }
    };

    const getTestHistory = async (ticker?: string, limit = 10) => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            let query = supabase
                .from('snooptest_results')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (ticker) {
                query = query.eq('ticker', ticker);
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(error.message);
            }

            console.log(`📊 Retrieved ${data?.length || 0} historical SnoopTest results`);
            return data || [];

        } catch (err) {
            console.warn('Failed to retrieve test history:', err);
            setError(err instanceof Error ? err.message : 'Failed to retrieve test history');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getRecentResults = async (days = 7) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const { data, error } = await supabase
                .from('snooptest_results')
                .select('ticker, win_rate, total_sweeps, created_at')
                .eq('user_id', user.id)
                .gte('created_at', cutoffDate.toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Failed to get recent results:', error.message);
                return [];
            }

            return data || [];
        } catch (err) {
            console.warn('Error fetching recent results:', err);
            return [];
        }
    };

    return {
        loading,
        error,
        storeTestResults,
        getTestHistory,
        getRecentResults,
    };
}
