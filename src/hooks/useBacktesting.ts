import { useState } from 'react';
import { BacktestParams, BacktestResult, BacktestSummary } from '../types/backtesting';
import { BacktestingEngine } from '../lib/backtesting';
import { isValidPolygonApiKey } from '../lib/apiKeyValidation';

export function useBacktesting() {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async (params: BacktestParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const polygonApiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
      console.log('Attempting to run backtest with hardcoded Polygon API key.');

      // Use real EOD data if API key is available
      console.log('Running backtest with real Polygon.io data...');
      const engine = new BacktestingEngine(polygonApiKey);
      const { results: backtestResults, summary: backtestSummary } = await engine.runBacktest(params);
      console.log('Real backtest completed:', { resultsCount: backtestResults.length, successRate: backtestSummary.successRate });
      setResults(backtestResults);
      setSummary(backtestSummary);
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