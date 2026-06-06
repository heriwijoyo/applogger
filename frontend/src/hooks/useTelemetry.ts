import { useState, useEffect, useRef } from 'react';
import type { TelemetryLog, LogMode } from '../types';

const BE_HOST = 'localhost';
const BE_PORT = '8788';
const API_BASE = `http://${BE_HOST}:${BE_PORT}/api`;
const WS_BASE = `ws://${BE_HOST}:${BE_PORT}/api/ws`;

export function useTelemetry(initialMode: LogMode = 'realtime') {
  const [mode, setMode] = useState<LogMode>(initialMode);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.reverse()); 
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    if (mode === 'realtime') {
      fetchHistory(); // Fetch initial state first

      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onmessage = (event) => {
        const newLog: TelemetryLog = JSON.parse(event.data);
        setLogs((prev) => [...prev, newLog].slice(-2000));
      };

      return () => {
        ws.onmessage = null;
        ws.onclose = null;
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        }
      };
    }

    if (mode === 'minute') {
      setIsConnected(false);
      fetchHistory();

      const interval = setInterval(() => {
        fetchHistory();
      }, 60000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [mode]);

  return {
    logs,
    mode,
    setMode,
    isConnected
  };
}