import { useCallback, useEffect, useRef, useState } from "react";
import { DetectionApiError, predict, type Detection } from "@/lib/detection";

export type DetectionState = {
  detections: Detection[];
  frameWidth: number;
  frameHeight: number;
  fps: number;
  latencyMs: number;
  error: string | null;
};

const INITIAL: DetectionState = {
  detections: [],
  frameWidth: 0,
  frameHeight: 0,
  fps: 0,
  latencyMs: 0,
  error: null,
};

type Options = {
  active: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  targetFps: number;
  confidence: number;
  /** Longest edge of the JPEG sent to the backend. */
  maxEdge?: number;
};

/**
 * Captures frames on an interval and runs inference against the backend.
 * Never overlaps requests: a new frame is skipped while one is in flight.
 */
export function useDetectionLoop({
  active,
  videoRef,
  targetFps,
  confidence,
  maxEdge = 640,
}: Options): DetectionState {
  const [state, setState] = useState<DetectionState>(INITIAL);
  const inFlight = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timesRef = useRef<number[]>([]);
  const confRef = useRef(confidence);
  confRef.current = confidence;

  const tick = useCallback(async () => {
    const video = videoRef.current;
    if (!video || inFlight.current) return;
    if (video.readyState < 2 || !video.videoWidth) return;

    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const canvas = (canvasRef.current ??= document.createElement("canvas"));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.7),
    );
    if (!blob) return;

    inFlight.current = true;
    const started = performance.now();
    try {
      const result = await predict(blob, confRef.current);
      const latency = Math.round(performance.now() - started);
      const now = performance.now();
      const times = timesRef.current.filter((t) => now - t < 1000);
      times.push(now);
      timesRef.current = times;
      setState({
        detections: result.detections,
        frameWidth: result.width ?? w,
        frameHeight: result.height ?? h,
        fps: times.length,
        latencyMs: latency,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof DetectionApiError
          ? err.message
          : "Detection failed unexpectedly. Please try again.";
      setState((prev) => ({ ...prev, detections: [], fps: 0, error: message }));
    } finally {
      inFlight.current = false;
    }
  }, [maxEdge, videoRef]);

  useEffect(() => {
    if (!active) {
      timesRef.current = [];
      setState(INITIAL);
      return;
    }
    const interval = Math.max(1000 / Math.min(Math.max(targetFps, 1), 30), 33);
    const id = window.setInterval(() => void tick(), interval);
    return () => window.clearInterval(id);
  }, [active, targetFps, tick]);

  return state;
}
