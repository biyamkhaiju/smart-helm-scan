"""FastAPI service exposing the trained YOLO helmet-detection model."""

from __future__ import annotations

import io
import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from detector import HelmetDetector

MODEL_PATH = os.getenv("MODEL_PATH", "best.pt")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(title="HelmetVision AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The model is loaded exactly once, at startup — never per request.
detector = HelmetDetector(MODEL_PATH)


@app.on_event("startup")
def _startup() -> None:
    detector.load()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_loaded": detector.is_loaded,
        "device": detector.device,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...), conf: float = Form(0.5)) -> dict:
    if not detector.is_loaded:
        raise HTTPException(status_code=503, detail="AI model could not be loaded.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty frame received.")

    conf = min(max(conf, 0.05), 0.95)
    try:
        return detector.predict(io.BytesIO(raw), conf)
    except Exception as exc:  # noqa: BLE001 - surface a clean message, log the detail
        print(f"[predict] inference error: {exc}")
        raise HTTPException(status_code=500, detail="Inference failed.") from exc
