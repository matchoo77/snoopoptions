import { useState } from 'react';
import { BacktestParams, BacktestResult, BacktestSummary } from '../types/backtesting';
import { BacktestingEngine, generateMockBacktestData } from '../lib/backtesting';

export function useBacktesting() {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async (params: BacktestParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const polygonApiKey = import.meta.env.VITE_POLYGON_API_KEY;
      
      if (polygonApiKey && polygonApiKey !== 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X') {
        // Use real data if API key is available
        const engine = new BacktestingEngine(polygonApiKey);
        const { results: backtestResults, summary: backtestSummary } = await engine.runBacktest(params);
        setResults(backtestResults);
        setSummary(backtestSummary);
      } else {
        // Use mock data for demonstration
        const { results: mockResults, summary: mockSummary } = generateMockBacktestData(params);
        setResults(mockResults);
        setSummary(mockSummary);
      }
    } catch (err) {
      console.error('Backtest error:', err);
      setError(err instanceof Error ? err.message : 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setSummary(null);
    setError(null);
  };

  return {
    results,
    summary,
    loading,
    error,
    runBacktest,
    clearResults,
  };
}