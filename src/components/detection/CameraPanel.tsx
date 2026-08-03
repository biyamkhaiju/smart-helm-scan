import { CameraOff, Loader2, ShieldAlert, Video } from "lucide-react";
import { DetectionOverlay } from "./DetectionOverlay";
import type { CameraStatus } from "@/hooks/useCamera";
import type { Detection } from "@/lib/detection";
import { cn } from "@/lib/utils";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  cameraError: string | null;
  detectionError: string | null;
  detections: Detection[];
  frameWidth: number;
  frameHeight: number;
  fps: number;
  latencyMs: number;
  showBoxes: boolean;
  showConfidence: boolean;
};

export function CameraPanel({
  videoRef,
  status,
  cameraError,
  detectionError,
  detections,
  frameWidth,
  frameHeight,
  fps,
  latencyMs,
  showBoxes,
  showConfidence,
}: Props) {
  const live = status === "live";

  return (
    <section className="glass-panel overflow-hidden rounded-2xl p-3 sm:p-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className={cn(
            "h-full w-full object-contain transition-opacity duration-500",
            live ? "opacity-100" : "opacity-0",
          )}
          playsInline
          muted
          autoPlay
          aria-label="Live camera feed"
        />

        {live ? (
          <>
            <DetectionOverlay
              detections={detections}
              frameWidth={frameWidth}
              frameHeight={frameHeight}
              showBoxes={showBoxes}
              showConfidence={showConfidence}
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-primary/20 to-transparent"
              aria-hidden="true"
            />
          </>
        ) : null}

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] backdrop-blur",
              live
                ? "border-[color:var(--warn)]/40 bg-background/60 text-warn"
                : "border-border bg-background/60 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                live ? "animate-pulse-soft bg-warn" : "bg-muted-foreground",
              )}
              aria-hidden="true"
            />
            {live ? "Live" : "Offline"}
          </span>
          {live ? (
            <div className="flex gap-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              <span className="rounded-md border border-border bg-background/60 px-2 py-1 backdrop-blur">
                {fps} fps
              </span>
              <span className="rounded-md border border-border bg-background/60 px-2 py-1 backdrop-blur">
                {latencyMs} ms
              </span>
            </div>
          ) : null}
        </div>

        {/* States */}
        {!live ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            {status === "requesting" ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Waiting for camera permission…
                </p>
              </>
            ) : status === "error" || status === "unsupported" ? (
              <>
                <CameraOff className="size-8 text-warn" aria-hidden="true" />
                <p className="max-w-sm text-sm text-warn">{cameraError}</p>
              </>
            ) : (
              <>
                <Video className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Camera stopped. Press “Start Camera” to begin live detection.
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>

      {detectionError && live ? (
        <p
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-lg border border-[color:var(--warn)]/40 bg-warn/10 px-3 py-2 text-sm text-warn"
        >
          <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
          {detectionError}
        </p>
      ) : null}
    </section>
  );
}
