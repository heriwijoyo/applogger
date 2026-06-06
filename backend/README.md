# AppLogger - Edge API & Stateful Broadcaster

This workspace contains the backend infrastructure for the AppLogger telemetry system. It is designed to run natively on Cloudflare Workers, utilizing **Hono.js** for zero-overhead routing and **Durable Objects** for stateful WebSocket connections.

## 🏗 Architecture Details

* **Hono Router (`src/index.ts`):** Acts as the entry point. It receives Service Binding requests from the main application, executes non-blocking `ctx.waitUntil()` database inserts, and proxies WebSocket upgrades.
* **Durable Object (`src/durable-objects/TelemetryRoom.ts`):** Solves the stateless worker problem. It acts as a singleton pub/sub room that holds active WebSocket connections in memory and broadcasts incoming telemetry payloads to all connected clients.
* **D1 SQLite (`schema.sql`):** Edge-native serverless SQL for persisting historical logs.

## 🛠 Tech Stack
* Cloudflare Workers (Runtime)
* Hono.js (Web Framework)
* Cloudflare Durable Objects (State / WebSockets)
* Cloudflare D1 (Database)

## 💻 Local Development

Ensure you have the latest Wrangler CLI installed.

```bash
# 1. Install dependencies
npm install

# 2. Generate Cloudflare Types (Crucial for VS Code Autocomplete)
npx wrangler types

# 3. Initialize the local D1 database
npx wrangler d1 execute applogger-db --local --file=./schema.sql

# 4. Start the local development server
npx wrangler dev
```

## 🚀 Deployment

This project deploys as a single Cloudflare Worker, including the statically compiled assets from the `frontend` workspace. **Ensure the frontend is built before deploying.**

```bash
# Build frontend first, then:
npx wrangler deploy
```