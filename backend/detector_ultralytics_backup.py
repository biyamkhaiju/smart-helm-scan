"""YOLO helmet detector: loads best.pt once and runs inference on frames."""

from __future__ import annotations

from pathlib import Path
from typing import IO

import cv2
import numpy as np
import torch
from ultralytics import YOLO
# Class IDs are mapped explicitly — never rely on names baked into the weights.
CLASS_LABELS = {0: "NO HELMET", 1: "HELMET"}


class HelmetDetector:
    def __init__(self, model_path: str | None = None) -> None:
        default_model_path = Path(__file__).resolve().parent / "best.pt"
        self.model_path = model_path or str(default_model_path)
        self.model: YOLO | None = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        """Load the trained weights once at server startup."""
        try:
            self.model = YOLO(self.model_path)
            self.model.to(self.device)
            print(f"Using device: {self.device.upper()}")
            print(f"Model: {self.model_path}")
        except Exception as exc:  # noqa: BLE001
            self.model = None
            print(f"[detector] failed to load {self.model_path}: {exc}")

    def predict(self, stream: IO[bytes], conf: float = 0.5) -> dict:
        if self.model is None:
            raise RuntimeError("Model is not loaded")

        buffer = np.frombuffer(stream.read(), dtype=np.uint8)
        frame = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Could not decode frame")

        height, width = frame.shape[:2]
        results = self.model.predict(
            source=frame, conf=conf, device=self.device, verbose=False
        )

        detections = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
                detections.append(
                    {
                        "class_id": class_id,
                        "label": CLASS_LABELS.get(class_id, "UNKNOWN"),
                        "confidence": round(float(box.conf[0]), 4),
                        "box": [round(x1), round(y1), round(x2), round(y2)],
                    }
                )

        return {"detections": detections, "width": width, "height": height}
