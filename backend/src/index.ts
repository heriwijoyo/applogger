import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.post('/api/ingest', async (c) => {
  try {
    const payload = await c.req.json();

    c.executionCtx.waitUntil(
      (async () => {
        await c.env.DB.prepare(
          "INSERT INTO logs (level, message, timestamp) VALUES (?, ?, ?)"
        ).bind(payload.level, payload.message, Date.now()).run();
      })()
    );

    const roomId = c.env.TELEMETRY_ROOM.idFromName('global-telemetry');
    const room = c.env.TELEMETRY_ROOM.get(roomId);
    
    c.executionCtx.waitUntil(
      room.fetch(new Request('http://do/broadcast', {
        method: 'POST',
        body: JSON.stringify(payload)
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
  const results = [
    { id: 1, level: 'info', message: 'System started', timestamp: Date.now() - 60000 },
    { id: 2, level: 'error', message: 'An error occurred', timestamp: Date.now() - 30000 },
    { id: 3, level: 'info', message: 'User logged in', timestamp: Date.now() - 10000 },
    { id: 4, level: 'warn', message: 'Low disk space', timestamp: Date.now() - 5000 }
  ];

  return c.json({ success: true, data: results });
});


app.get('*', async (c) => {
  return c.text("API is running, or Static Asset not found.", 404);
});

export default app;

export { TelemetryRoom } from './durableObjects/telemetryRoom';