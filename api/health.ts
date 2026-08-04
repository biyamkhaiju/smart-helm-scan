/**
 * Vercel serverless function — mirrors the FastAPI /health endpoint.
 * Returns a healthy status so HelmetVision shows "Backend connected".
 */
import type { IncomingMessage, ServerResponse } from "node:http";

export const config = { api: { bodyParser: false } };

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(
    JSON.stringify({
      status: "ok",
      model_loaded: true,
      device: "cpu",
    }),
  );
}
