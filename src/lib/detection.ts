/**
 * Detection API client.
 * Talks to the local FastAPI + Ultralytics YOLO backend (see /backend).
 * Base URL is configured via VITE_API_URL (Vite equivalent of NEXT_PUBLIC_API_URL).
 */

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

/** Explicit class map — never trust names embedded in the model file. */
export const CLASS_LABELS: Record<number, string> = {
  0: "NO HELMET",
  1: "HELMET",
};

export type Detection = {
  class_id: number;
  label: string;
  confidence: number;
  box: [number, number, number, number];
};

export type PredictResponse = {
  detections: Detection[];
  /** Size of the frame the backend ran inference on. */
  width?: number;
  height?: number;
};

export type HealthResponse = {
  status: string;
  model_loaded: boolean;
  device: string;
};

export class DetectionApiError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "model" | "server",
  ) {
    super(message);
    this.name = "DetectionApiError";
  }
}

export async function getHealth(signal?: AbortSignal | null): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: signal ?? null });
    if (!res.ok) throw new DetectionApiError("Detection server returned an error.", "server");
    return (await res.json()) as HealthResponse;
  } catch (err) {
    if (err instanceof DetectionApiError) throw err;
    throw new DetectionApiError(
      "Detection server is unavailable. Please start the AI backend.",
      "network",
    );
  }
}

export async function predict(
  blob: Blob,
  confidence: number,
  signal?: AbortSignal | null,
): Promise<PredictResponse> {
  const form = new FormData();
  form.append("file", blob, "frame.jpg");
  form.append("conf", String(confidence));

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/predict`, { method: "POST", body: form, signal: signal ?? null });
  } catch {
    throw new DetectionApiError(
      "Detection server is unavailable. Please start the AI backend.",
      "network",
    );
  }

  if (res.status === 503) throw new DetectionApiError("AI model could not be loaded.", "model");
  if (!res.ok) throw new DetectionApiError("Inference failed on the detection server.", "server");

  const data = (await res.json()) as PredictResponse;
  return {
    ...data,
    detections: (data.detections ?? []).map((d) => ({
      ...d,
      label: CLASS_LABELS[d.class_id] ?? d.label ?? "UNKNOWN",
    })),
  };
}
