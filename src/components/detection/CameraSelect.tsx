import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CameraDevice } from "@/hooks/useCamera";

export function CameraSelect({
  devices,
  deviceId,
  onChange,
}: {
  devices: CameraDevice[];
  deviceId: string | null;
  onChange: (id: string) => void;
}) {
  if (devices.length < 2) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor="camera-select">Camera</Label>
      <Select value={deviceId ?? ""} onValueChange={onChange}>
        <SelectTrigger id="camera-select" className="w-full">
          <SelectValue placeholder="Select a camera" />
        </SelectTrigger>
        <SelectContent>
          {devices.map((d) => (
            <SelectItem key={d.deviceId} value={d.deviceId}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
