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

      // Optionally start a mock data stream for testing
      //this.startMockDataStream();

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

    const getMinuteString = () => {
      const d = new Date();
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    };

    this.mockInterval = setInterval(() => {
      if (this.ctx.getWebSockets().length === 0) {
        clearInterval(this.mockInterval!);
        this.mockInterval = null;
        return;
      }

      const actions = ['CREATE_ORDER', 'PROCESS_PAYMENT', 'SEND_EMAIL', 'USER_LOGIN'];
      const isSuccess = Math.random() > 0.15 ? 'Y' : 'N'; 

      const dummyPayload = {
        minute: getMinuteString(),
        action: actions[Math.floor(Math.random() * actions.length)],
        success: isSuccess,
        duration: Math.floor(Math.random() * 500) + 50,
        resultCode: isSuccess === 'Y' ? '200' : '500',
      };

      this.broadcast(JSON.stringify(dummyPayload));
    }, 1000);
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