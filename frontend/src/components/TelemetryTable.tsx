import React, { useMemo } from 'react';
import { Card, Title, Text } from '@tremor/react';
import type { TelemetryLog } from '../types';

interface Props {
  logs: TelemetryLog[];
}

export default function TelemetryTable({ logs }: Props) {
  
  const { pivotData, recentMinutes } = useMemo(() => {
    // 1. Find the 5 most recent unique minutes to display as columns
    const allMinutes = Array.from(new Set(logs.map(l => l.minute))).sort().reverse();
    const displayMinutes = allMinutes.slice(0, 5);

    // 2. Build the Pivot Dictionary
    const pivot: Record<string, Record<string, { Y: number; N: number }>> = {};

    logs.forEach(log => {
      if (!log || !log.minute || !log.action) return;

      if (!pivot[log.action]) pivot[log.action] = {};
      if (!pivot[log.action][log.minute]) pivot[log.action][log.minute] = { Y: 0, N: 0 };
      
      pivot[log.action][log.minute][log.success] += 1;
    });

    return { pivotData: pivot, recentMinutes: displayMinutes };
  }, [logs]);

  const getPercentage = (y: number, n: number) => {
    const total = y + n;
    if (total === 0) return '0%';
    return `${Math.round((y / total) * 100)}%`;
  };

  const formatTime = (m: string) => `${m.slice(8, 10)}:${m.slice(10, 12)}`;

  return (
    <Card className="mt-6 overflow-x-auto">
      <Title>Action Success Rate Matrix</Title>
      <Text>Real-time success percentage grouped by action.</Text>
      
      <div className="mt-6 border border-gray-200 rounded-tremor-default overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            {/* TOP HEADER ROW: Actions + Time Columns */}
            <tr>
              <th 
                rowSpan={2} 
                className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200 align-middle"
              >
                Action
              </th>
              {recentMinutes.map(minute => (
                <th 
                  key={minute} 
                  colSpan={3} 
                  className="px-4 py-2 text-center font-semibold text-gray-900 border-r border-gray-200 last:border-r-0"
                >
                  {formatTime(minute)}
                </th>
              ))}
            </tr>
            
            {/* SUB HEADER ROW: Y | N | % */}
            <tr>
              {recentMinutes.map(minute => (
                <React.Fragment key={minute + '-sub'}>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-emerald-600 border-t border-r border-gray-200">Y</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-rose-600 border-t border-r border-gray-200">N</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 border-t border-r border-gray-200 last:border-r-0">%</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200 bg-white">
            {Object.entries(pivotData).map(([action, minuteData]) => (
              <tr key={action} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">
                  {action}
                </td>
                {recentMinutes.map(minute => {
                  const stats = minuteData[minute] || { Y: 0, N: 0 };
                  const pct = getPercentage(stats.Y, stats.N);
                  
                  // Dynamic coloring for the percentage
                  const pctColor = pct === '100%' 
                    ? 'text-emerald-600' 
                    : pct === '0%' ? 'text-gray-400' : 'text-amber-600';
                  
                  return (
                    <React.Fragment key={action + minute}>
                      <td className="px-2 py-3 text-center text-gray-600 border-r border-gray-200">{stats.Y}</td>
                      <td className="px-2 py-3 text-center text-gray-600 border-r border-gray-200">{stats.N}</td>
                      <td className={`px-2 py-3 text-center font-semibold border-r border-gray-200 last:border-r-0 ${pctColor}`}>
                        {pct}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}