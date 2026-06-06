export type LogMode = 'realtime' | 'minute';

export interface TelemetryLog {
  minute: string; // "YYYYMMDDHHMM"
  action: string;
  success: 'Y' | 'N';
  duration: number; // in milliseconds
  resultCode: string;
}