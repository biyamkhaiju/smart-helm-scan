import { type Detection } from "@/lib/detection";

type Props = {
  detections: Detection[];
  frameWidth: number;
  frameHeight: number;
  showBoxes: boolean;
  showConfidence: boolean;
};

/** Transparent SVG overlay — never draws onto the camera image itself. */
export function DetectionOverlay({
  detections,
  frameWidth,
  frameHeight,
  showBoxes,
  showConfidence,
}: Props) {
  if (!showBoxes || !frameWidth || !frameHeight) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${frameWidth} ${frameHeight}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${detections.length} detections drawn over the camera feed`}
    >
      {detections.map((d, i) => {
        const [x1, y1, x2, y2] = d.box;
        const safe = d.class_id === 1;
        const stroke = safe ? "var(--safe)" : "var(--warn)";
        const labelH = Math.max(frameHeight * 0.055, 18);
        const fontSize = labelH * 0.42;
        const text = showConfidence
          ? `${d.label} · ${Math.round(d.confidence * 100)}%`
          : d.label;
        const labelW = Math.max(text.length * fontSize * 0.62 + fontSize, 60);
        const labelY = Math.max(y1 - labelH - 2, 0);
        return (
          <g key={`${i}-${d.class_id}`}>
            <rect
              x={x1}
              y={y1}
              width={Math.max(x2 - x1, 1)}
              height={Math.max(y2 - y1, 1)}
              fill="none"
              stroke={stroke}
              strokeWidth={Math.max(frameWidth * 0.004, 2)}
              rx={6}
            />
            <rect x={x1} y={labelY} width={labelW} height={labelH} fill={stroke} rx={4} />
            <text
              x={x1 + fontSize * 0.5}
              y={labelY + labelH * 0.68}
              fontSize={fontSize}
              fontWeight={700}
              fill="var(--background)"
              fontFamily="var(--font-mono)"
            >
              {text}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
