import { Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CameraSelect } from "./CameraSelect";
import type { CameraDevice } from "@/hooks/useCamera";

export type DetectionSettings = {
  confidence: number;
  targetFps: number;
  showConfidence: boolean;
  showBoxes: boolean;
};

type Props = {
  settings: DetectionSettings;
  onChange: (next: Partial<DetectionSettings>) => void;
  devices: CameraDevice[];
  deviceId: string | null;
  onDeviceChange: (id: string) => void;
};

export function SettingsPanel({
  settings,
  onChange,
  devices,
  deviceId,
  onDeviceChange,
}: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open settings">
          <Settings2 className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full border-border bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detection settings</SheetTitle>
          <SheetDescription>Tune how the AI analyses your camera feed.</SheetDescription>
        </SheetHeader>

        <div className="space-y-7 px-4 pb-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="conf-setting">Confidence threshold</Label>
              <span className="font-mono text-sm text-muted-foreground">
                {Math.round(settings.confidence * 100)}%
              </span>
            </div>
            <Slider
              id="conf-setting"
              min={10}
              max={95}
              step={1}
              value={[Math.round(settings.confidence * 100)]}
              onValueChange={([v]) => onChange({ confidence: (v ?? 50) / 100 })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="fps-setting">Inference rate</Label>
              <span className="font-mono text-sm text-muted-foreground">
                {settings.targetFps} fps
              </span>
            </div>
            <Slider
              id="fps-setting"
              min={1}
              max={25}
              step={1}
              value={[settings.targetFps]}
              onValueChange={([v]) => onChange({ targetFps: v ?? 12 })}
            />
          </div>

          <CameraSelect devices={devices} deviceId={deviceId} onChange={onDeviceChange} />

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <Label htmlFor="show-boxes">Show bounding boxes</Label>
            <Switch
              id="show-boxes"
              checked={settings.showBoxes}
              onCheckedChange={(v) => onChange({ showBoxes: v })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <Label htmlFor="show-conf">Show confidence values</Label>
            <Switch
              id="show-conf"
              checked={settings.showConfidence}
              onCheckedChange={(v) => onChange({ showConfidence: v })}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
