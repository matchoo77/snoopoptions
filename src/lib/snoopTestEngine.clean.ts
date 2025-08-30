import { SnoopTestParams, SnoopTestResult, SnoopTestSummary } from '../types/snooptest';
import { supabase } from './supabase';

export class SnoopTestEngine {
    private onProgress?: (percentage: number, status: string) => void;

    constructor(onProgress?: (percentage: number, status: string) => void) {
        this.onProgress = onProgress;
        console.log('🚀 SnoopTestEngine initialized - REAL DATA ONLY via Supabase edge functions');
    }

    private reportProgress(percentage: number, status: string) {
        if (this.onProgress) {
            this.onProgress(percentage, status);
        }
    }

    async runTest(params: SnoopTestParams): Promise<{ results: SnoopTestResult[]; summary: SnoopTestSummary }> {
        try {
            this.reportProgress(0, 'Starting real data analysis...');
            console.log('🔍 Running SnoopTest with REAL API DATA ONLY via Supabase edge function...');
            console.log('📋 Parameters:', params);

            // Get the current user's session for authentication
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                console.error('❌ Authentication error:', sessionError);
                throw new Error('Authentication required for real data analysis. Please log in.');
            }

            console.log('✅ User authenticated, proceeding with real API data analysis');
            this.reportProgress(10, 'Connecting to real data engine...');
            console.log('📡 Calling snooptest-engine edge function for REAL DATA...');

            // Call the Supabase edge function which will use real Polygon.io API
            const { data, error } = await supabase.functions.invoke('snooptest-engine', {
                body: params,
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (error) {
                console.error('❌ Edge function error:', error);
                throw new Error(`Real data analysis failed: ${error.message}. Only real API data is supported.`);
            }

            if (!data || !data.results) {
                console.warn('⚠️ Edge function returned empty data');
                throw new Error('No real data returned from analysis engine. Check API configuration.');
            }

            this.reportProgress(100, 'Real data analysis complete!');
            console.log('✅ SnoopTest completed successfully with REAL API DATA');
            console.log('📊 REAL results received from Polygon.io API:', {
                resultsCount: data.results?.length || 0,
                winRate: data.summary?.winRate || 0,
                dataSource: 'REAL-POLYGON-API-DATA'
            });

            return {
                results: data.results || [],
                summary: data.summary || this.getDefaultSummary(),
            };

        } catch (error) {
            console.error('❌ Real data analysis error:', error);
            this.reportProgress(0, 'Error: Real data analysis failed');
            throw new Error(`Real data analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Only real API data is supported.`);
        }
    }

    private getDefaultSummary(): SnoopTestSummary {
        return {
            totalTrades: 0,
            neutralTrades: 0,
            nonNeutralTrades: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            averageMove: 0,
            bestTrade: null,
            worstTrade: null,
            breakdownByLocation: {
                'below-bid': { total: 0, wins: 0, winRate: 0, avgMove: 0 },
                'at-bid': { total: 0, wins: 0, winRate: 0, avgMove: 0 },
                'midpoint': { total: 0, wins: 0, winRate: 0, avgMove: 0 },
                'at-ask': { total: 0, wins: 0, winRate: 0, avgMove: 0 },
                'above-ask': { total: 0, wins: 0, winRate: 0, avgMove: 0 },
            },
        };
    }
}
