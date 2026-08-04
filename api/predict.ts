/**
 * Vercel serverless function — mirrors the FastAPI /predict endpoint.
 *
 * Returns mock YOLO detections so the dashboard is fully interactive
 * without a real Python backend.  Detection class alternates between
 * HELMET and NO HELMET every ~3 s based on wall-clock time (stateless,
 * works across serverless cold-starts).
 *
 * When you have a real backend, set VITE_API_URL to its URL and remove
 * this file (or keep it as a fallback demo).
 */
import type { IncomingMessage, ServerResponse } from "node:http";

export const config = { api: { bodyParser: false } };

function jitter(range = 20): number {
  return (Math.random() - 0.5) * range;
}

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  // Cycle between HELMET and NO HELMET every 3 seconds
  const helmetState = Math.floor(Date.now() / 3000) % 2 === 0;
  const confidence = parseFloat((0.82 + Math.random() * 0.14).toFixed(3));

  // Bounding box centred in the upper part of the frame (head region)
  const box = [
    Math.round(200 + jitter(30)),
    Math.round(30 + jitter(15)),
    Math.round(440 + jitter(30)),
    Math.round(230 + jitter(15)),
  ];

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(
    JSON.stringify({
      detections: [
        {
          class_id: helmetState ? 1 : 0,
          label: helmetState ? "HELMET" : "NO HELMET",
          confidence,
          box,
        },
      ],
      width: 640,
      height: 480,
    }),
  );
}
