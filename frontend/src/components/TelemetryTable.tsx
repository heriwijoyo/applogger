import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge } from '@tremor/react';
import { format } from 'date-fns';
import type { TelemetryLog } from '../types';

interface Props {
  logs: TelemetryLog[];
}

const colorMap = {
  info: 'blue',
  warn: 'yellow',
  error: 'red',
} as const;

export default function TelemetryTable({ logs }: Props) {
  // Show only the 10 most recent logs in the table
  const recentLogs = [...logs].reverse().slice(0, 10);

  return (
    <Card className="mt-6">
      <Title>Recent Telemetry Stream</Title>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Timestamp</TableHeaderCell>
            <TableHeaderCell>Level</TableHeaderCell>
            <TableHeaderCell>Message</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recentLogs.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{format(new Date(item.timestamp), 'HH:mm:ss.SSS')}</TableCell>
              <TableCell>
                <Badge color={colorMap[item.level]}>{item.level.toUpperCase()}</Badge>
              </TableCell>
              <TableCell>{item.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}