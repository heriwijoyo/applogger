# ⚡️ Edge-Native Telemetry & Observability Hub

![Real-time Telemetry Dashboard](./assets/dashboard-demo.gif)
*(Note: Replace with an actual GIF/video of your Tremor dashboard in action)*

A full-stack, real-time observability pipeline built entirely on the Cloudflare Edge network. This project acts as an ingestion and visualization engine for distributed Cloudflare Workers, achieving zero-latency logging via Service Bindings and real-time frontend updates via Durable Objects.

## 🤔 The "Build vs. Buy" Decision: Why not Datadog or Sentry?

In a traditional Node.js/Containerized backend, I would utilize standard APM agents (like Datadog or New Relic). However, the Edge ecosystem (V8 Isolates) introduces unique constraints that make a custom, edge-native telemetry hub highly advantageous:

1. **Eliminating Public Internet Latency:** Sending telemetry to a third-party observability platform requires an outbound HTTPS request over the public internet. By building the `applogger` natively on Cloudflare, the main application passes logs via **Service Bindings**—which execute in the same underlying datacenter with near-zero millisecond network latency.
2. **No Background Threads:** Cloudflare Workers do not have background threads to batch and dispatch logs asynchronously like traditional Node.js agents do. Our custom solution leverages `ctx.waitUntil()` and Service Bindings to immediately offload the processing to a secondary worker, preventing log-dispatching from blocking the main user response.
3. **Cost & Egress Control:** High-volume logging to third-party SaaS platforms often leads to astronomical ingestion and egress costs. By persisting to D1 and broadcasting via Durable Objects, the data never leaves the Cloudflare network, drastically reducing egress fees.

## 🧠 Architectural Highlights

As a senior backend architect, I designed this system to overcome the stateless nature of edge compute while ensuring the core application's performance remains unaffected:

* **Zero-Latency Ingestion:** Main APIs send telemetry via **Cloudflare Service Bindings**, bypassing the public internet entirely.
* **Non-Blocking Persistence:** Logs are flushed to a **D1 (SQLite) Database** using `ctx.waitUntil()`, ensuring the ingestion API returns a `202 Accepted` instantly without waiting for the database I/O.
* **Stateful Real-Time Broadcasting:** Overcomes the stateless limitation of standard Workers by routing WebSocket connections to a singleton **Durable Object**, creating a persistent pub/sub room for real-time dashboard updates.
* **Monolithic Deployment, Decoupled Architecture:** A single `wrangler.jsonc` configuration deploys a compiled React SPA (Frontend Assets), a Hono.js API router, and a Durable Object cluster simultaneously.

## 🛠 Tech Stack

* **Backend:** Cloudflare Workers, Hono.js, Durable Objects, Cloudflare D1 (SQLite)
* **Frontend:** React 18, Vite, Tailwind CSS v3, Tremor (Data Visualization)
* **Architecture:** Monorepo (NPM Workspaces / Isolated contexts)

## 🚀 Local Development (Monorepo Workflow)

This project requires running both the edge environment and the frontend bundler simultaneously to mimic the production edge environment.

**1. Start the Edge Backend (Terminal 1)**
```bash
cd backend
npx wrangler d1 execute applogger-db --local --file=./schema.sql # Initialize DB Schema
npx wrangler dev # Starts the API and WebSocket server on http://localhost:8787
```

**2. Start the React Frontend (Terminal 2)**
```bash
cd frontend
npm run dev # Starts the Vite HMR server on http://localhost:5173
```

## 📈 Simulating Traffic

To test the real-time WebSocket broadcasting, you can send POST requests directly to the ingestion API while the dashboard is open:
```bash
curl -X POST http://localhost:8787/api/ingest \
     -H "Content-Type: application/json" \
     -d '{"level":"error","message":"Database connection timeout"}'
```