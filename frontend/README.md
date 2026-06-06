# AppLogger - React Telemetry Dashboard

This workspace contains the frontend visualization layer for the AppLogger system. It is a React Single Page Application (SPA) compiled via Vite and styled with Tailwind CSS and Tremor.

## 🧠 Core Logic: `useTelemetry` Hook

The brain of the frontend is located in `src/hooks/useTelemetry.ts`. It manages the complex lifecycle of edge-driven data:
* **Strict-Mode Safe WebSockets:** Handles React 18's rapid mount/unmount cycle during development to prevent orphaned `CONNECTING` sockets.
* **Memory Protection:** Implements a rolling ring-buffer (`slice(-100)`) on incoming real-time logs to prevent the browser tab from crashing during high-volume traffic.
* **Graceful Degradation:** Allows toggling between real-time WebSocket streams and legacy REST polling (`/api/history`).

## 🛠 Tech Stack
* React 18
* Vite (Bundler)
* Tailwind CSS v3 (Styling)
* Tremor (Data Visualization & UI Components)

## 💻 Local Development

This frontend expects the Hono backend to be running simultaneously on port `8787` (or `8788`).

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite hot-reloading server
npm run dev
```

## 📦 Build Process

When deploying to Cloudflare, the backend `wrangler.jsonc` is configured to serve this application's `dist/` folder via Cloudflare Worker Assets.
```bash
# Compiles the React application into static HTML/JS/CSS inside /dist
npm run build
```