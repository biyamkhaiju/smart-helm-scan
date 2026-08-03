# HelmetVision AI

Real-time helmet detection: a React + TypeScript dashboard (TanStack Start / Vite) talking to a
local FastAPI + Ultralytics YOLO inference server running your **already-trained** `best.pt`.

```
Browser → camera → frontend → FastAPI → Ultralytics YOLO → best.pt → JSON → overlay
```

Class map (fixed, never inferred from the weights):

| ID | Label     |
|----|-----------|
| 0  | NO HELMET |
| 1  | HELMET    |

> Note on stack: this project's frontend is **TanStack Start on Vite**, not Next.js — the same
> React + TypeScript + Tailwind code, with `VITE_API_URL` in place of `NEXT_PUBLIC_API_URL`.

## Project structure

```
.
├── backend/            # FastAPI inference service
│   ├── main.py         # /health and /predict endpoints
│   ├── detector.py     # loads best.pt once, CUDA→CPU fallback
│   ├── requirements.txt
│   └── best.pt         # YOU provide this (git-ignored)
├── src/                # frontend (routes, components, hooks, lib)
├── .env.example
└── README.md
```

## 1. Prerequisites

- **Python 3.10–3.12** — `python --version` (download: https://www.python.org/downloads/)
- **Node.js 20+** — `node --version` (download: https://nodejs.org/)
- An NVIDIA GPU (e.g. RTX 3050) with a recent driver for CUDA; otherwise the backend runs on CPU.

## 2. Where to put `best.pt`

Copy your trained model into the backend folder:

```bash
cp /path/to/best.pt backend/best.pt
```

`best.pt` is listed in `.gitignore` and is **not** committed. Every developer must supply their own
copy (or set `MODEL_PATH=/absolute/path/best.pt` before starting the server). The model is never
retrained or modified by this project.

## 3. Backend setup

```bash
cd backend
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install -r requirements.txt
```

### Enable CUDA (RTX 3050)

Install the CUDA build of PyTorch **before** the rest, or reinstall over the CPU wheels:

```bash
pip uninstall -y torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```

`True NVIDIA GeForce RTX 3050` means CUDA is ready. The detector selects CUDA automatically and
falls back to CPU when it is unavailable.

### Start FastAPI

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Startup log:

```
Using device: CUDA
Model: best.pt
```

Verify:

```bash
curl http://localhost:8000/health
# {"status":"ok","model_loaded":true,"device":"cuda"}
```

Test inference with a still image:

```bash
curl -X POST http://localhost:8000/predict -F "file=@test.jpg" -F "conf=0.5"
```

## 4. Frontend setup

```bash
cp .env.example .env    # VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Open http://localhost:8080 and click **Start Camera**.

## 5. API

`GET /health` → `{ "status": "ok", "model_loaded": true, "device": "cuda" }`

`POST /predict` (multipart: `file` = JPEG frame, `conf` = 0.05–0.95)

```json
{
  "detections": [
    { "class_id": 0, "label": "NO HELMET", "confidence": 0.57, "box": [100, 50, 300, 250] }
  ],
  "width": 640,
  "height": 360
}
```

## 6. Testing the webcam

1. Start the backend, then the frontend.
2. Click **Start Camera** and allow the permission prompt.
3. You should see the live feed, a LIVE badge, FPS and latency, plus green/red boxes.
4. On mobile the front camera (`facingMode: "user"`) is preferred; multiple cameras appear in the
   Camera dropdown and in Settings.

## 7. Troubleshooting camera permissions

- **Chrome/Edge:** click the camera icon in the address bar → *Always allow* → reload. Reset via
  `chrome://settings/content/camera`.
- **Firefox:** padlock icon → *Connection secure* → *Clear permission*.
- **Safari (macOS/iOS):** Settings → Websites → Camera → set to *Allow*; also check
  System Settings → Privacy & Security → Camera.
- getUserMedia only works on `http://localhost` or an **HTTPS** origin. Serving the dev build to a
  phone over plain LAN HTTP will block the camera — use a tunnel (e.g. `ngrok http 8080`).
- "Camera is unavailable": another app (Zoom/Teams/OBS) holds the device — close it and retry.

## 8. Changing the confidence threshold

- **UI:** the *Confidence threshold* slider on the dashboard, or the Settings drawer (10–95%).
  It is sent with every frame as the `conf` form field.
- **API:** `-F "conf=0.35"`.
- **Default:** change the initial `confidence` value in `src/routes/index.tsx`, or the `conf`
  default in `backend/main.py`.

Inference rate (default ~12 fps) is adjustable in the Settings drawer; requests never overlap —
a new frame is skipped while one is still in flight.

## 9. Privacy

Frames are JPEG-encoded in the browser and POSTed only to your configured inference backend. They
are never written to disk, never queued, and never sent to third-party services. No footage is
stored on either side.

## 10. Deployment notes

Keep the local setup working first. When deploying, host the backend on a GPU machine, set
`ALLOWED_ORIGINS` to your frontend origin, and point `VITE_API_URL` at the public backend URL over
HTTPS (browsers block camera access and mixed content otherwise).
