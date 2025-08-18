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
      
      if (polygonApiKey && polygonApiKey.length > 10 && polygonApiKey !== 'your_polygon_api_key_here') {
        // Use real EOD data if API key is available
        console.log('Running backtest with real Polygon.io data...');
        const engine = new BacktestingEngine(polygonApiKey);
        const { results: backtestResults, summary: backtestSummary } = await engine.runBacktest(params);
        setResults(backtestResults);
        setSummary(backtestSummary);
      } else {
        // Use mock data for demonstration when no API key
        console.log('Running backtest with mock data (no API key configured)...');
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