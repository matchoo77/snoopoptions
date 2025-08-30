import { Wifi, WifiOff, AlertCircle, Database } from 'lucide-react';
import { isValidApiKey } from '../lib/apiKeyValidation';
import { isSupabaseConfigured } from '../lib/supabase';

interface DataSourceIndicatorProps {
  isConnected: boolean;
  isUsingRealData: boolean;
  dataSource?: 'none' | 'realtime' | 'eod';
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function DataSourceIndicator({ 
  isConnected, 
  isUsingRealData, 
  dataSource = 'realtime',
  loading = false,
  error,
  onRefresh 
}: DataSourceIndicatorProps) {
  // Hide all data source indicators - user doesn't want to see connection status
  return null;
}