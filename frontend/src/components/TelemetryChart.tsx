import { useMemo } from 'react';
import { Card, Title, AreaChart } from '@tremor/react';
import { format } from 'date-fns';
import type { TelemetryLog } from '../types';

interface Props {
  logs: TelemetryLog[];
}

export default function TelemetryChart({ logs }: Props) {
  // Memoize the data transformation so we don't re-calculate on every render
  const chartData = useMemo(() => {
    // Group logs by second to create a time-series
    const grouped = logs.reduce((acc, log) => {
      // Format timestamp to HH:mm:ss
      const timeStr = format(new Date(log.timestamp), 'HH:mm:ss');
      
      if (!acc[timeStr]) {
        acc[timeStr] = { time: timeStr, info: 0, warn: 0, error: 0 };
      }
      
      acc[timeStr][log.level] += 1;
      return acc;
    }, {} as Record<string, { time: string, info: number, warn: number, error: number }>);

    return Object.values(grouped);
  }, [logs]);

  return (
    <Card className="mt-6">
      <Title>API Requests (Logs per second)</Title>
      <AreaChart
        className="h-72 mt-4"
        data={chartData}
        index="time"
        categories={['info', 'warn', 'error']}
        colors={['blue', 'yellow', 'red']}
        yAxisWidth={40}
        showAnimation={true}
        noDataText="Waiting for telemetry data..."
      />
    </Card>
  );
}