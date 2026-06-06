export type LogMode = 'realtime' | 'minute';

export interface TelemetryLog {
  id?: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}