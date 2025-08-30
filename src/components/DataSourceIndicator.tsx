interface DataSourceIndicatorProps {
  isConnected: boolean;
  isUsingRealData: boolean;
  dataSource?: 'none' | 'realtime' | 'eod';
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function DataSourceIndicator(_props: DataSourceIndicatorProps) {
  // Hide all data source indicators - user doesn't want to see connection status
  return null;
}