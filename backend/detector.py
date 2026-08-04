"""YOLO helmet detector using ONNX Runtime."""

from __future__ import annotations

from typing import IO

import cv2
import numpy as np
import onnxruntime as ort

CLASS_LABELS = {
    0: "NO HELMET",
    1: "HELMET",
}


class HelmetDetector:
    def __init__(self, model_path: str = "best.onnx") -> None:
        self.model_path = model_path
        self.model = None
        self.device = "cpu"

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        try:
            self.model = ort.InferenceSession(
                self.model_path,
                providers=["CPUExecutionProvider"],
            )
            print(f"Using ONNX Runtime: CPU")
            print(f"Model: {self.model_path}")
        except Exception as exc:
            self.model = None
            print(f"[detector] failed to load {self.model_path}: {exc}")

    def predict(self, stream: IO[bytes], conf: float = 0.5) -> dict:
        if self.model is None:
            raise RuntimeError("Model is not loaded")

        buffer = np.frombuffer(stream.read(), dtype=np.uint8)
        frame = cv2.imdecode(buffer, cv2.IMREAD_COLOR)

        if frame is None:
            raise ValueError("Could not decode frame")

        original_height, original_width = frame.shape[:2]

        # YOLO preprocessing: resize to 640x640 and convert BGR -> RGB.
        resized = cv2.resize(frame, (640, 640))
        image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

        # HWC -> CHW, uint8 -> float32, normalize to [0, 1].
        input_tensor = image.transpose(2, 0, 1)
        input_tensor = np.ascontiguousarray(input_tensor, dtype=np.float32)
        input_tensor /= 255.0
        input_tensor = np.expand_dims(input_tensor, axis=0)

        input_name = self.model.get_inputs()[0].name
        output = self.model.run(None, {input_name: input_tensor})[0]

        # Output shape: [1, 6, 8400]
        predictions = output[0].transpose(1, 0)

        detections = []

        scale_x = original_width / 640.0
        scale_y = original_height / 640.0

        boxes = []
        scores = []
        class_ids = []

        for prediction in predictions:
            cx, cy, width, height = prediction[:4]
            class_scores = prediction[4:]

            class_id = int(np.argmax(class_scores))
            score = float(class_scores[class_id])

            if score < conf:
                continue

            x1 = (cx - width / 2) * scale_x
            y1 = (cy - height / 2) * scale_y
            box_width = width * scale_x
            box_height = height * scale_y

            boxes.append([
                float(x1),
                float(y1),
                float(box_width),
                float(box_height),
            ])
            scores.append(score)
            class_ids.append(class_id)

        # NMS removes overlapping duplicate detections.
        indices = cv2.dnn.NMSBoxes(
            boxes,
            scores,
            score_threshold=conf,
            nms_threshold=0.45,
        )

        for index in indices:
            i = int(index)

            x, y, w, h = boxes[i]

            x1 = max(0, min(original_width, x))
            y1 = max(0, min(original_height, y))
            x2 = max(0, min(original_width, x + w))
            y2 = max(0, min(original_height, y + h))

            detections.append(
                {
                    "class_id": class_ids[i],
                    "label": CLASS_LABELS.get(
                        class_ids[i],
                        "UNKNOWN",
                    ),
                    "confidence": round(scores[i], 4),
                    "box": [
                        round(x1),
                        round(y1),
                        round(x2),
                        round(y2),
                    ],
                }
            )

        return {
            "detections": detections,
            "width": original_width,
            "height": original_height,
        }