import { SnoopTestParams, SnoopTestResult, SnoopTestSummary } from '../types/snooptest';
import { supabase } from './supabase';

export class SnoopTestEngine {
  private onProgress?: (percentage: number, status: string) => void;

  constructor(onProgress?: (percentage: number, status: string) => void) {
    this.onProgress = onProgress;
    console.log('🚀 SnoopTestEngine initialized - using Supabase edge functions');
  }

  private reportProgress(percentage: number, status: string) {
    if (this.onProgress) {
      this.onProgress(percentage, status);
    }
  }

  async runTest(params: SnoopTestParams): Promise<{ results: SnoopTestResult[]; summary: SnoopTestSummary }> {
    try {
      this.reportProgress(0, 'Starting SnoopTest analysis...');
      console.log('🔍 Running SnoopTest via Supabase edge function...');
      console.log('📋 Parameters:', params);

      // Get the current user's session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ Authentication error:', sessionError);
        throw new Error('Authentication required for real data analysis. Please log in.');
      }

      console.log('✅ User authenticated, proceeding with edge function call');
      this.reportProgress(10, 'Connecting to SnoopTest engine...');
      console.log('📡 Calling snooptest-engine edge function...');

      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('snooptest-engine', {
        body: params,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function failed: ${error.message}. Real API data required.`);
      }

      if (!data || !data.results) {
        console.warn('⚠️ Edge function returned empty data');
        throw new Error('No data returned from analysis engine. Real API data required.');
      }

      this.reportProgress(100, 'Analysis complete!');
      console.log('✅ SnoopTest completed successfully via edge function');
      console.log('📊 Results received from edge function:', {
        resultsCount: data.results?.length || 0,
        winRate: data.summary?.winRate || 0,
        dataSource: 'REAL-API-DATA'
      });

      return {
        results: data.results || [],
        summary: data.summary || this.getDefaultSummary(),
      };

    } catch (error) {
      console.error('❌ SnoopTest engine error:', error);
      this.reportProgress(0, 'Error: Real data analysis failed');
      throw error; // Don't fall back to synthetic data - throw the error
    }
  }

  // Fallback method for when edge function is unavailable
  private async runLocalFallback(params: SnoopTestParams): Promise<{ results: SnoopTestResult[]; summary: SnoopTestSummary }> {
    console.log('⚠️ Running local fallback with deterministic synthetic data...');
    console.log('🔧 This produces consistent results based on input parameters');
    this.reportProgress(25, 'Running local fallback analysis...');

    // Generate deterministic results based on parameters
    const syntheticResults = this.generateSyntheticResults(params);
    const summary = this.generateSummary(syntheticResults, syntheticResults.length + 5);

    console.log('📊 Fallback results generated:', {
      resultsCount: syntheticResults.length,
      winRate: summary.winRate,
      dataSource: 'deterministic-fallback'
    });

    this.reportProgress(100, 'Fallback analysis complete');
    return { results: syntheticResults, summary };
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

  private generateSyntheticResults(params: SnoopTestParams): SnoopTestResult[] {
    const results: SnoopTestResult[] = [];
    const baseDate = new Date(params.startDate);
    
    // Create a seed based on the parameters for consistent results
    const seed = this.createSeed(params.ticker + params.startDate + params.endDate + params.holdPeriod);
    let seedValue = seed;
    
    // Deterministic random function based on seed
    const deterministicRandom = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
    
    // Generate consistent number of results based on date range
    const daysDiff = Math.floor((new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const numResults = Math.max(15, Math.min(25, Math.floor(daysDiff / 2))); // 15-25 results based on date range
    
    console.log(`📊 Generating ${numResults} deterministic synthetic results for ${params.ticker}`);
    
    for (let i = 0; i < numResults; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + Math.floor(deterministicRandom() * daysDiff));
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const entryPrice = 400 + deterministicRandom() * 100;
      // More realistic price movements with slight bias toward success
      const percentChange = (deterministicRandom() - 0.45) * 8; // Slight positive bias, -3.6% to +4.4%
      const exitPrice = entryPrice * (1 + percentChange / 100);
      
      const optionType = deterministicRandom() > 0.5 ? 'call' : 'put';
      const inferredSide = deterministicRandom() > 0.5 ? 'buy' : 'sell';
      const tradeLocation = params.tradeLocations[Math.floor(deterministicRandom() * params.tradeLocations.length)];
      
      // Determine if it's a win based on direction
      let isWin = false;
      if (optionType === 'call' && inferredSide === 'buy') {
        isWin = percentChange > 0;
      } else if (optionType === 'put' && inferredSide === 'buy') {
        isWin = percentChange < 0;
      } else if (optionType === 'call' && inferredSide === 'sell') {
        isWin = percentChange < 0;
      } else if (optionType === 'put' && inferredSide === 'sell') {
        isWin = percentChange > 0;
      }
      
      results.push({
        id: `synthetic_${params.ticker}_${i}`,
        date: date.toISOString().split('T')[0],
        ticker: params.ticker,
        optionType,
        tradeLocation,
        inferredSide,
        entryPrice: Math.round(entryPrice * 100) / 100,
        exitPrice: Math.round(exitPrice * 100) / 100,
        percentChange: Math.round(percentChange * 100) / 100,
        isWin,
        holdDays: params.holdPeriod,
      });
    }
    
    return results;
  }
  
  private createSeed(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }  private generateSummary(results: SnoopTestResult[], totalSweeps: number): SnoopTestSummary {
    const nonNeutralTrades = results.length;
    const wins = results.filter(r => r.isWin).length;
    const winRate = nonNeutralTrades > 0 ? (wins / nonNeutralTrades) * 100 : 0;
    const averageMove = nonNeutralTrades > 0
      ? results.reduce((sum, r) => sum + Math.abs(r.percentChange), 0) / nonNeutralTrades
      : 0;

    const bestTrade = results.length > 0
      ? results.reduce((best, current) =>
        Math.abs(current.percentChange) > Math.abs(best.percentChange) ? current : best)
      : null;

    const worstTrade = results.length > 0
      ? results.reduce((worst, current) =>
        Math.abs(current.percentChange) < Math.abs(worst.percentChange) ? current : worst)
      : null;

    // Breakdown by trade location
    const breakdownByLocation: Record<string, any> = {};
    const locations = ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'];

    locations.forEach(location => {
      const locationResults = results.filter(r => r.tradeLocation === location);
      const locationWins = locationResults.filter(r => r.isWin).length;

      breakdownByLocation[location] = {
        total: locationResults.length,
        wins: locationWins,
        winRate: locationResults.length > 0 ? (locationWins / locationResults.length) * 100 : 0,
        avgMove: locationResults.length > 0
          ? locationResults.reduce((sum, r) => sum + Math.abs(r.percentChange), 0) / locationResults.length
          : 0,
      };
    });

    return {
      totalTrades: totalSweeps,
      neutralTrades: totalSweeps - nonNeutralTrades,
      nonNeutralTrades,
      wins,
      losses: nonNeutralTrades - wins,
      winRate,
      averageMove,
      bestTrade,
      worstTrade,
      breakdownByLocation,
    };
  }
}