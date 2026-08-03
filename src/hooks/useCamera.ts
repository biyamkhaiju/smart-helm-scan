import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "live" | "error" | "unsupported";

export type CameraDevice = { deviceId: string; label: string };

type UseCameraResult = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: string | null;
  devices: CameraDevice[];
  deviceId: string | null;
  setDeviceId: (id: string) => void;
  start: () => Promise<void>;
  stop: () => void;
};

const isMobile = () =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const list = await navigator.mediaDevices.enumerateDevices();
    setDevices(
      list
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` })),
    );
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
    setError(null);
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setError("This browser does not support camera access.");
      return;
    }

    setStatus("requesting");
    setError(null);
    try {
      const video: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
      if (deviceId) video.deviceId = { exact: deviceId };
      else if (isMobile()) video.facingMode = "user";
      const constraints: MediaStreamConstraints = { audio: false, video };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      // Track disconnection (unplugged webcam, OS revoked access).
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          setStatus("error");
          setError("The camera was disconnected. Reconnect it and start the camera again.");
        });
      });
      const active = stream.getVideoTracks()[0]?.getSettings().deviceId ?? null;
      if (active) setDeviceId(active);
      await refreshDevices();
      setStatus("live");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setStatus("error");
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Camera permission is required for live detection.");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError("No camera was found. Connect a camera and try again.");
      } else if (name === "NotReadableError") {
        setError("The camera is unavailable — it may be in use by another application.");
      } else {
        setError("The camera could not be started. Please check your device and try again.");
      }
    }
  }, [deviceId, refreshDevices]);

  useEffect(() => {
    void refreshDevices();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [refreshDevices]);

  return { videoRef, status, error, devices, deviceId, setDeviceId, start, stop };
}
