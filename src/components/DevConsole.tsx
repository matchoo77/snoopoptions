import { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown, Terminal } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
  args: any[];
}

export function DevConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const logIdRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.PROD) return;

    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    const createLogEntry = (level: LogEntry['level'], args: any[]): LogEntry => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      return {
        id: ++logIdRef.current,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
        args,
      };
    };

    // Override console methods
    console.log = (...args) => {
      originalConsole.log(...args);
      setLogs(prev => [...prev.slice(-99), createLogEntry('log', args)]);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      setLogs(prev => [...prev.slice(-99), createLogEntry('error', args)]);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      setLogs(prev => [...prev.slice(-99), createLogEntry('warn', args)]);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      setLogs(prev => [...prev.slice(-99), createLogEntry('info', args)]);
    };

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      setLogs(prev => [...prev.slice(-99), createLogEntry('error', [
        `Uncaught Error: ${event.error?.message || event.message}`,
        event.filename ? `at ${event.filename}:${event.lineno}` : ''
      ])]);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      setLogs(prev => [...prev.slice(-99), createLogEntry('error', [
        `Unhandled Promise Rejection: ${event.reason}`
      ])]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      // Restore original console
      Object.assign(console, originalConsole);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    if (isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  // Only render in development
  if (import.meta.env.PROD) return null;

  const filteredLogs = logs.filter(log => 
    filter === '' || log.message.toLowerCase().includes(filter.toLowerCase())
  );

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full max-w-4xl">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute bottom-0 right-4 bg-gray-800 text-white px-3 py-2 rounded-t-lg flex items-center gap-2 text-sm"
      >
        <Terminal className="w-4 h-4" />
        Console ({logs.length})
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {/* Console Panel */}
      {isOpen && (
        <div className="bg-gray-900 border-t border-gray-700 text-white h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">Dev Console</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
              />
              <button
                onClick={() => setLogs([])}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                {filter ? 'No logs match the filter' : 'No logs yet'}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="mb-1 flex gap-2">
                  <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                  <span className={`shrink-0 uppercase font-bold ${getLogColor(log.level)}`}>
                    {log.level}
                  </span>
                  <pre className="whitespace-pre-wrap break-words">{log.message}</pre>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
