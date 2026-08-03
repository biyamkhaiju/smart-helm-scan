import { cn } from "@/lib/utils";

export type Metric = { label: string; value: string; tone?: "safe" | "warn" | "neutral" };

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {metrics.map((m) => (
        <div key={m.label} className="glass-panel rounded-xl px-4 py-3">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            {m.label}
          </p>
          <p
            className={cn(
              "mt-1 truncate font-mono text-lg font-semibold tabular-nums",
              m.tone === "safe" && "text-safe",
              m.tone === "warn" && "text-warn",
            )}
          >
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}
