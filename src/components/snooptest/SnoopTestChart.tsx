import React, { useEffect, useRef } from 'react';
import { SnoopTestResult } from '../../types/snooptest';

interface SnoopTestChartProps {
  results: SnoopTestResult[];
}

export function SnoopTestChart({ results }: SnoopTestChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || results.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart dimensions
    const padding = 40;
    const chartWidth = rect.width - 2 * padding;
    const chartHeight = rect.height - 2 * padding;

    // Find data range
    const percentChanges = results.map(r => r.percentChange);
    const minChange = Math.min(...percentChanges);
    const maxChange = Math.max(...percentChanges);
    const range = Math.max(Math.abs(minChange), Math.abs(maxChange), 1);

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Y-axis (center line)
    const centerY = padding + chartHeight / 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();

    // X-axis (zero line)
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(padding + chartWidth, centerY);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 4; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw data points
    const pointRadius = 4;
    results.forEach((result, index) => {
      const x = padding + (index / (results.length - 1)) * chartWidth;
      const normalizedChange = result.percentChange / (range * 2);
      const y = centerY - (normalizedChange * chartHeight);

      // Color by trade location
      let color = '#6B7280'; // gray
      switch (result.tradeLocation) {
        case 'below-bid': color = '#EF4444'; break; // red
        case 'at-bid': color = '#F97316'; break; // orange
        case 'midpoint': color = '#3B82F6'; break; // blue
        case 'at-ask': color = '#10B981'; break; // green
        case 'above-ask': color = '#8B5CF6'; break; // purple
      }

      // Draw point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Add border for wins
      if (result.isWin) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.fillText(`+${range.toFixed(1)}%`, padding - 10, padding + 5);
    ctx.fillText('0%', padding - 10, centerY + 5);
    ctx.fillText(`-${range.toFixed(1)}%`, padding - 10, padding + chartHeight + 5);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Price Movement by Trade Location', rect.width / 2, 20);

  }, [results]);

  if (results.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-64 bg-gray-900 rounded"
        style={{ width: '100%', height: '256px' }}
      />
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-300">Below Bid</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-gray-300">At Bid</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-300">Midpoint</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-300">At Ask</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-300">Above Ask</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-white rounded-full"></div>
          <span className="text-gray-300">Win</span>
        </div>
      </div>
    </div>
  );
}