import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getMinuteString } from './commonUtil';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.post('/api/ingest/servicePerformance', async (c) => {
  try {
    const payload = await c.req.json();

    c.executionCtx.waitUntil(
      (async () => {
        await c.env.DB.prepare(`
          INSERT INTO service_performance_log (
            trace_id, action, start_time_ms, end_time_ms, success, result_code, creation_time_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          payload.traceId,
          payload.action,
          payload.startTime,
          payload.endTime,
          payload.success,
          payload.resultCode,
          Date.now()
        ).run();
      })()
    );

    const roomId = c.env.TELEMETRY_ROOM.idFromName('global-telemetry');
    const room = c.env.TELEMETRY_ROOM.get(roomId);
    
    const roomPayload = {
      minute: getMinuteString(payload.startTime),
      action: payload.action,
      success: payload.success === 1 ? 'Y' : 'N',
      duration: payload.endTime - payload.startTime,
      resultCode: payload.resultCode
    }

    c.executionCtx.waitUntil(
      room.fetch(new Request('http://do/broadcast', {
        method: 'POST',
        body: JSON.stringify(roomPayload),
      }))
    );

    return c.json({ success: true, status: 'logged' }, 202);

  } catch (error) {
    return c.json({ success: false, error: 'Invalid payload' }, 400);
  }
});


app.get('/api/ws', async (c) => {
  const roomId = c.env.TELEMETRY_ROOM.idFromName('global-telemetry');
  const room = c.env.TELEMETRY_ROOM.get(roomId);
  
  return room.fetch(c.req.raw);
});


app.get('/api/history', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT action, start_time_ms, end_time_ms, success, result_code
    FROM service_performance_log
    ORDER BY creation_time_ms DESC
    LIMIT 2000
  `).all();
  const data = results.map((row: any) => ({
    minute: getMinuteString(row.start_time_ms),
    action: row.action,
    success: row.success === 1 ? 'Y' : 'N',
    duration: row.end_time_ms - row.start_time_ms,
    resultCode: row.result_code
  }));

  return c.json({ success: true, data: data });
});


app.get('*', async (c) => {
  return c.text("API is running, or Static Asset not found.", 404);
});

export default app;

export { TelemetryRoom } from './durableObjects/telemetryRoom';