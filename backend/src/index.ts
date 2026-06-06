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
  return c.json({ success: true, data: [] });
});


app.get('*', async (c) => {
  return c.text("API is running, or Static Asset not found.", 404);
});

export default app;

export { TelemetryRoom } from './durableObjects/telemetryRoom';