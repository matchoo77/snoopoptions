import { useState } from 'react';
import { BacktestParams, BacktestResult, BacktestSummary } from '../types/backtesting';
import { BacktestingEngine } from '../lib/backtesting';

export function useBacktesting() {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async (params: BacktestParams) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Running backtest with real-time Polygon API data...');
      const engine = new BacktestingEngine();
      const { results: backtestResults, summary: backtestSummary } = await engine.runBacktest(params);
      console.log('Real-time backtest completed:', {
        resultsCount: backtestResults.length,
        successRate: backtestSummary.successRate,
        hasResults: backtestResults.length > 0,
        hasSummary: !!backtestSummary
      });
      console.log('Setting results and summary...');
      setResults(backtestResults);
      setSummary(backtestSummary);
      console.log('Results and summary set successfully');
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