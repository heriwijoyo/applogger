import { DurableObject } from "cloudflare:workers";

export class TelemetryRoom extends DurableObject<Env> {
  private mockInterval: ReturnType<typeof setInterval> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/ws') {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected Upgrade: websocket header", { status: 426 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      this.ctx.acceptWebSocket(server);

      this.startMockDataStream();

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const payload = await request.text();

      this.broadcast(payload);

      return new Response("Broadcast successful", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  }

  private broadcast(message: string) {
    const websockets = this.ctx.getWebSockets();
    for (const ws of websockets) {
      try {
        ws.send(message);
      } catch (error) {
        console.error("Failed to send to a client", error);
      }
    }
  }

  private startMockDataStream() {
    if (this.mockInterval) return;

    console.log("Starting Mock Data Stream...");

    this.mockInterval = setInterval(() => {
      if (this.ctx.getWebSockets().length === 0) {
        clearInterval(this.mockInterval!);
        this.mockInterval = null;
        return;
      }

      const levels: ('info' | 'warn' | 'error')[] = ['info', 'info', 'info', 'warn', 'error'];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      
      const messages = {
        info: ['User authenticated successfully', 'Cache hit on route /users', 'Payment processed'],
        warn: ['High CPU usage detected', 'Rate limit threshold approaching'],
        error: ['Database connection timeout', 'Failed to reach external payment API']
      };
      
      const randomMsgList = messages[randomLevel];
      const randomMsg = randomMsgList[Math.floor(Math.random() * randomMsgList.length)];

      const dummyPayload = {
        level: randomLevel,
        message: `[MOCK] ${randomMsg}`,
        timestamp: Date.now(),
      };

      this.broadcast(JSON.stringify(dummyPayload));
    }, 2000);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`WebSocket closed: ${code} ${reason}`);
    
    if (this.ctx.getWebSockets().length === 0 && this.mockInterval) {
      console.log("Last client left, stopping mock stream.");
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error("WebSocket error:", error);
  }
}