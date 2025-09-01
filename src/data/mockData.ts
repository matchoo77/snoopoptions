import { OptionsActivity } from '../types/options';

// Return empty data instead of generating synthetic data
export function generateMockData(): OptionsActivity[] {
  console.log('generateMockData: Returning empty array - no synthetic data');
  return [];
}