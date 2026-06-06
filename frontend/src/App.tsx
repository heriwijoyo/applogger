import { Title, Text, Select, SelectItem, Badge } from '@tremor/react';
import { useTelemetry } from './hooks/useTelemetry';
import TelemetryChart from './components/TelemetryChart';
import TelemetryTable from './components/TelemetryTable';
import type { LogMode } from './types';

function App() {
  const { logs, mode, setMode, isConnected } = useTelemetry('realtime');

  return (
    <main className="p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title className="text-3xl">Edge Telemetry Hub</Title>
          <Text>Real-time observability powered by Cloudflare Durable Objects.</Text>
        </div>
        
        <div className="flex items-center gap-4">
          {mode === 'realtime' && (
            <Badge color={isConnected ? 'emerald' : 'rose'} className="animate-pulse">
              {isConnected ? 'WebSocket Connected' : 'Disconnected'}
            </Badge>
          )}
          
          <Select 
            value={mode} 
            onValueChange={(val) => setMode(val as LogMode)} 
            className="w-48"
          >
            <SelectItem value="realtime">Real-time (WebSocket)</SelectItem>
            <SelectItem value="minute">Per Minute (Polling)</SelectItem>
          </Select>
        </div>
      </div>

      {/* DASHBOARD CONTENT */}
      <TelemetryChart logs={logs} />
      <TelemetryTable logs={logs} />
    </main>
  );
}

export default App;