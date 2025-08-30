import { useState } from 'react';
import { SnoopTestParams, SnoopTestResult, SnoopTestSummary, OptionsSweep, TradeLocation } from '../types/snooptest';
import { SnoopTestEngine } from '../lib/snoopTestEngine';

export function useSnoopTest() {
  const [results, setResults] = useState<SnoopTestResult[]>([]);
  const [summary, setSummary] = useState<SnoopTestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ percentage: number; status: string }>({ percentage: 0, status: '' });

  const runSnoopTest = async (params: SnoopTestParams) => {
    setLoading(true);
    setError(null);
    setProgress({ percentage: 0, status: 'Initializing...' });

    try {
      console.log('Running SnoopTest with parameters:', params);
      
      // Progress callback function
      const onProgress = (percentage: number, status: string) => {
        setProgress({ percentage, status });
      };
      
      const engine = new SnoopTestEngine(onProgress);
      const { results: testResults, summary: testSummary } = await engine.runTest(params);
      
      console.log('SnoopTest completed:', {
        resultsCount: testResults.length,
        winRate: testSummary.winRate,
        nonNeutralTrades: testSummary.nonNeutralTrades
      });
      
      setResults(testResults);
      setSummary(testSummary);
    } catch (err) {
      console.error('SnoopTest error:', err);
      setError(err instanceof Error ? err.message : 'Failed to run SnoopTest');
      setProgress({ percentage: 0, status: 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setSummary(null);
    setError(null);
    setProgress({ percentage: 0, status: '' });
  };

  return {
    results,
    summary,
    loading,
    error,
    progress,
    runSnoopTest,
    clearResults,
  };
}