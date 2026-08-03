import { AlertTriangle, ShieldCheck, ScanLine } from "lucide-react";
import { type Detection } from "@/lib/detection";
import { cn } from "@/lib/utils";

export function StatusCard({
  detections,
  active,
}: {
  detections: Detection[];
  active: boolean;
}) {
  const top = [...detections].sort((a, b) => b.confidence - a.confidence)[0];
  const noHelmet = detections.find((d) => d.class_id === 0);
  const primary = noHelmet ?? top;
  const state = !active || !primary ? "idle" : primary.class_id === 1 ? "safe" : "warn";

  const copy = {
    idle: {
      title: active ? "No helmet/object detected." : "Camera stopped",
      sub: active ? "Scanning frames…" : "Start the camera to begin monitoring",
    },
    safe: { title: "HELMET DETECTED", sub: "Confidence" },
    warn: { title: "NO HELMET DETECTED", sub: "Confidence" },
  }[state];

  const Icon = state === "safe" ? ShieldCheck : state === "warn" ? AlertTriangle : ScanLine;

  return (
    <section
      aria-live="polite"
      className={cn(
        "glass-panel relative overflow-hidden rounded-2xl p-6 transition-all duration-500",
        state === "safe" && "border-[color:var(--safe)]/40",
        state === "warn" && "border-[color:var(--warn)]/40",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px",
          state === "safe" && "bg-safe",
          state === "warn" && "bg-warn",
          state === "idle" && "bg-border",
        )}
      />
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl border",
            state === "safe" && "border-[color:var(--safe)]/40 bg-safe/10 text-safe",
            state === "warn" &&
              "animate-pulse-soft border-[color:var(--warn)]/40 bg-warn/10 text-warn",
            state === "idle" && "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-xl font-semibold tracking-tight sm:text-2xl",
              state === "safe" && "text-safe",
              state === "warn" && "text-warn",
              state === "idle" && "text-muted-foreground",
            )}
          >
            {copy.title}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {copy.sub}
          </p>
          {primary && active ? (
            <p className="mt-2 font-mono text-4xl font-bold tabular-nums">
              {Math.round(primary.confidence * 100)}%
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
