import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HardHat, Lock, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CameraPanel } from "@/components/detection/CameraPanel";
import { CameraSelect } from "@/components/detection/CameraSelect";
import { MetricsGrid, type Metric } from "@/components/detection/MetricsGrid";
import {
  SettingsPanel,
  type DetectionSettings,
} from "@/components/detection/SettingsPanel";
import { StatusCard } from "@/components/detection/StatusCard";
import { useCamera } from "@/hooks/useCamera";
import { useDetectionLoop } from "@/hooks/useDetectionLoop";
import { getHealth, type HealthResponse } from "@/lib/detection";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HelmetVision AI — Real-Time Helmet Detection" },
      {
        name: "description",
        content:
          "AI-powered safety monitoring: real-time YOLO helmet detection from your camera with confidence scores, FPS and latency metrics.",
      },
      { property: "og:title", content: "HelmetVision AI — Real-Time Helmet Detection" },
      {
        property: "og:description",
        content:
          "AI-powered safety monitoring: real-time YOLO helmet detection from your camera with confidence scores, FPS and latency metrics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const camera = useCamera();
  const [settings, setSettings] = useState<DetectionSettings>({
    confidence: 0.5,
    targetFps: 12,
    showConfidence: true,
    showBoxes: true,
  });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const active = camera.status === "live";
  const detection = useDetectionLoop({
    active,
    videoRef: camera.videoRef,
    targetFps: settings.targetFps,
    confidence: settings.confidence,
  });

  const updateSettings = useCallback(
    (next: Partial<DetectionSettings>) => setSettings((p) => ({ ...p, ...next })),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await getHealth();
        if (!cancelled) {
          setHealth(res);
          setHealthError(res.model_loaded ? null : "AI model could not be loaded.");
        }
      } catch (err) {
        if (!cancelled) {
          setHealth(null);
          setHealthError(
            err instanceof Error
              ? err.message
              : "Detection server is unavailable. Please start the AI backend.",
          );
        }
      }
    };
    void check();
    const id = window.setInterval(() => void check(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const top = useMemo(
    () =>
      detection.detections.find((d) => d.class_id === 0) ??
      [...detection.detections].sort((a, b) => b.confidence - a.confidence)[0],
    [detection.detections],
  );

  const metrics: Metric[] = [
    {
      label: "Status",
      value: active ? (top ? top.label : "SCANNING") : "OFFLINE",
      tone: top ? (top.class_id === 1 ? "safe" : "warn") : "neutral",
    },
    { label: "Confidence", value: top ? `${Math.round(top.confidence * 100)}%` : "—" },
    { label: "Objects", value: active ? String(detection.detections.length) : "—" },
    { label: "FPS", value: active ? String(detection.fps) : "—" },
    { label: "Latency", value: active && detection.latencyMs ? `${detection.latencyMs} ms` : "—" },
    { label: "Device", value: health?.device?.toUpperCase() ?? "—" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
              <HardHat className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-[0.14em] uppercase">
              HelmetVision AI
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Primary">
            <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground sm:inline">
              Live Detection
            </span>
            <span
              className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground"
              aria-label={`Camera status: ${active ? "live" : "offline"}`}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  active ? "animate-pulse-soft bg-safe" : "bg-muted-foreground",
                )}
                aria-hidden="true"
              />
              {active ? "Camera live" : "Camera off"}
            </span>
            <SettingsPanel
              settings={settings}
              onChange={updateSettings}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDeviceChange={camera.setDeviceId}
            />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <section className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.26em] text-primary">
            Computer vision safety
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gradient sm:text-5xl">
            Real-Time Helmet Detection
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            AI-powered safety monitoring using computer vision.
          </p>
        </section>

        {healthError ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-[color:var(--warn)]/40 bg-warn/10 px-4 py-3 text-sm text-warn"
          >
            {healthError}
          </p>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <CameraPanel
            videoRef={camera.videoRef}
            status={camera.status}
            cameraError={camera.error}
            detectionError={detection.error}
            detections={detection.detections}
            frameWidth={detection.frameWidth}
            frameHeight={detection.frameHeight}
            fps={detection.fps}
            latencyMs={detection.latencyMs}
            showBoxes={settings.showBoxes}
            showConfidence={settings.showConfidence}
          />

          <div className="space-y-5">
            <StatusCard detections={detection.detections} active={active} />
            <MetricsGrid metrics={metrics} />

            <section className="glass-panel space-y-5 rounded-2xl p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-11 flex-1"
                  onClick={() => void camera.start()}
                  disabled={active || camera.status === "requesting"}
                >
                  <Play className="size-4" aria-hidden="true" />
                  Start Camera
                </Button>
                <Button
                  variant="secondary"
                  className="h-11 flex-1"
                  onClick={camera.stop}
                  disabled={!active}
                >
                  <Square className="size-4" aria-hidden="true" />
                  Stop Camera
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidence">Confidence threshold</Label>
                  <span className="font-mono text-sm text-muted-foreground">
                    {Math.round(settings.confidence * 100)}%
                  </span>
                </div>
                <Slider
                  id="confidence"
                  min={10}
                  max={95}
                  step={1}
                  value={[Math.round(settings.confidence * 100)]}
                  onValueChange={([v]) => updateSettings({ confidence: (v ?? 50) / 100 })}
                />
              </div>

              <CameraSelect
                devices={camera.devices}
                deviceId={camera.deviceId}
                onChange={camera.setDeviceId}
              />

              <p className="flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Camera frames are processed for detection and are not stored.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
