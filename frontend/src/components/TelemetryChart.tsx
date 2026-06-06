import { useMemo } from 'react';
import { Card, Title, AreaChart, Text } from '@tremor/react';
import type { TelemetryLog } from '../types';

interface Props {
  logs: TelemetryLog[];
}

// Helper to convert "YYYYMMDDHHMM" to "HH:mm"
const formatTime = (minuteStr: string) => `${minuteStr.slice(8, 10)}:${minuteStr.slice(10, 12)}`;

export default function TelemetryChart({ logs }: Props) {
  
  // --- CHART 1: Minute-by-Minute Aggregation ---
  const minuteData = useMemo(() => {
    // 1. Group logs by exact minute
    const grouped = logs.reduce((acc, log) => {
      const time = formatTime(log.minute);
      if (!acc[time]) acc[time] = { time, Success: 0, Failed: 0 };
      
      if (log.success === 'Y') acc[time].Success += 1;
      else acc[time].Failed += 1;
      
      return acc;
    }, {} as Record<string, { time: string, Success: number, Failed: number }>);

    // 2. We only want the last 20 unique minutes available in the data
    const sortedTimes = Object.keys(grouped).sort();
    const last20 = sortedTimes.slice(-20);
    
    return last20.map(time => grouped[time]);
  }, [logs]);


  // --- CHART 2: 10-Minute Bucket Aggregation ---
  const tenMinuteData = useMemo(() => {
    const grouped = logs.reduce((acc, log) => {
      // Bucket logic: replace the last digit of the minute with '0'
      // "202310241917" -> "202310241910" -> "19:10"
      const bucketedMinute = log.minute.substring(0, 11) + '0';
      const time = formatTime(bucketedMinute);
      
      if (!acc[time]) acc[time] = { time, Success: 0, Failed: 0 };
      
      if (log.success === 'Y') acc[time].Success += 1;
      else acc[time].Failed += 1;
      
      return acc;
    }, {} as Record<string, { time: string, Success: number, Failed: number }>);

    return Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));
  }, [logs]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <Title>Real-Time Traffic (1 Min Resolution)</Title>
        <Text>Success vs Fail count over the last 20 minutes</Text>
        <AreaChart
          className="h-72 mt-4"
          data={minuteData}
          index="time"
          categories={['Success', 'Failed']}
          colors={['emerald', 'rose']}
          yAxisWidth={40}
          showAnimation={true}
        />
      </Card>

      <Card>
        <Title>Macro Trend (10 Min Resolution)</Title>
        <Text>Aggregated volume in 10-minute buckets</Text>
        <AreaChart
          className="h-72 mt-4"
          data={tenMinuteData}
          index="time"
          categories={['Success', 'Failed']}
          colors={['emerald', 'rose']}
          yAxisWidth={40}
          showAnimation={true}
        />
      </Card>
    </div>
  );
}