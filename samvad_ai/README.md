# Continuous Sign Language Recognition (CSLR) for Meeting Applications

This repository provides an end-to-end, production-ready implementation of **Continuous Sign Language Recognition (CSLR)** based on the [`manohonsy/how2sign-pose-cslr`](https://huggingface.co/manohonsy/how2sign-pose-cslr) model for live video meeting applications (e.g., Google Meet, Zoom, Samvad).

---

## 🌟 Features

- **Exact PyTorch Architecture**: Complete implementation of `PoseTransformerCSLR` (Linear Stem + Sinusoidal Positional Encoding + 4-Layer Pre-norm Transformer Encoder + Head) compatible with Hugging Face `model.safetensors`.
- **MediaPipe Holistic Pipeline**: Extracts 50 landmarks (8 upper-body pose + 21 left hand + 21 right hand) $\times$ 3D coordinates (150-D) + 3-D presence mask = **153-D feature vector**.
- **Robust Normalization (`normalize_features`)**: Mid-shoulder centering and shoulder-distance scaling, ensuring scale/distance invariance across meeting participants.
- **Meeting-Ready Continuous Recognizer**: Sliding-window buffer (8 FPS effective frame rate), CTC greedy decoding, sign debouncing, and silence/pause sentence committing.
- **FastAPI & WebSocket Server**: Low-latency streaming API (`/ws/live`) and REST endpoints (`/recognize/video`, `/recognize/npz`).
- **Interactive Live Webcam Demo**: Real-time HUD and subtitle overlay with keypoint visualization (`python live_demo.py`).
- **Web Meeting Client Demo**: HTML5/WebSocket frontend (`client_example.html`) showing live subtitles over a meeting video stream.

---

## 📁 Repository Structure

```
ASL/
├── model.py                # PoseTransformerCSLR model & CTC decoder
├── pipeline.py             # MediaPipe feature extractor & coordinate normalizer
├── meeting_recognizer.py   # Real-time sliding-window buffer & sentence aggregator
├── server.py               # FastAPI backend with WebSocket & REST endpoints
├── live_demo.py            # Real-time webcam subtitle demo (OpenCV + MediaPipe)
├── client_example.html     # Web meeting video player with live subtitle overlay
├── test_infer.py           # Verification script for model loading & forward pass
├── requirements.txt        # Python package dependencies
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Verify Model & Pipeline

Run the test script to automatically fetch the Hugging Face weights and test inference:

```bash
python test_infer.py
```

### 3. Run Live Webcam Demo

Test sign recognition directly using your laptop camera:

```bash
python live_demo.py
```

- **Controls**: Press `q` to quit, `c` to reset/clear subtitle history.

---

## 💻 Python Usage in Your Codebase

Here is how to use the model and normalization pipeline directly in Python:

```python
import numpy as np
import torch
from model import PoseTransformerCSLR
from pipeline import prepare_input_tensor

# 1. Load model directly from HuggingFace
device = "cuda" if torch.cuda.is_available() else "cpu"
model = PoseTransformerCSLR.from_pretrained("manohonsy/how2sign-pose-cslr", device=device)

# 2. Load your sample or real-time frames
# features: (T, 150) -> [8 pose + 21 left hand + 21 right hand] * 3
# mask: (T, 3)       -> [pose_present, left_hand_present, right_hand_present]
data = np.load("your_sample.npz")
features = data["features"].astype(np.float32)
mask = data["mask"].astype(bool)

# 3. Apply normalization and append 3-D mask -> shape (1, T, 153)
x = prepare_input_tensor(features, mask, device=device)

# 4. Forward pass
with torch.no_grad():
    log_probs, lens = model(x, torch.tensor([x.shape[1]], device=device))

    # 5. Greedy CTC decoding (collapses repeats & removes blanks)
    decoded_ids = model.decode_ctc(log_probs)[0]
    glosses = model.ids_to_words(decoded_ids)

print("Recognized Sign Glosses:", " ".join(glosses))
```

---

## 🌐 Meeting Application Integration

### 1. Launch the Recognition Server

```bash
python server.py
# or: uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 2. WebSocket Streaming (`/ws/live`)

Meeting frontends (React, Vue, Next.js, Electron, or mobile apps) connect to:
`ws://localhost:8000/ws/live`

#### Send Video Frames:
Send video snapshots at **8 FPS** (every 125ms):
```json
{
  "type": "frame",
  "data": "<base64_encoded_jpeg_image>"
}
```

#### Alternatively, Send Pre-extracted Landmarks:
To eliminate video transmission latency, client browsers can extract landmarks using `@mediapipe/holistic` and send JSON:
```json
{
  "type": "keypoints",
  "features": [/* 150 float values */],
  "mask": [true, true, true]
}
```

#### Receive Live Subtitles:
The server emits updates in real time:
```json
// Partial updates during active signing:
{
  "type": "partial",
  "new_gloss": "HELLO",
  "current_sentence": "Hello how are you"
}

// Sentence committed after a pause:
{
  "type": "commit",
  "final_sentence": "Hello how are you"
}
```

### 3. Open the Web Meeting Demo

Open `client_example.html` in your web browser:
1. Start `python server.py` in your terminal.
2. Double click or open `client_example.html` in Chrome/Firefox/Safari.
3. Click **Start Meeting Stream** to see real-time subtitles overlaid on the video feed.

---

## ⚙️ Model Architecture Specifications

| Component | Specification |
|---|---|
| **Input Shape** | 153-D per frame (150-D MediaPipe Holistic keypoints + 3-D presence mask) |
| **Pose Keypoints** | 8 pose (nose, shoulders, elbows, wrists, hip) + 21 left hand + 21 right hand |
| **Effective Frame Rate** | 8 FPS (stride 3 over 24 FPS video) |
| **Stem** | `Linear(153 -> 256)` + `LayerNorm` + `GELU` + `Dropout(0.1)` |
| **Positional Encoding** | Sinusoidal positional encoding |
| **Backbone** | 4-layer `TransformerEncoder` ($d=256$, heads=4, $d_{\text{ff}}=1024$, pre-norm GELU) |
| **Head** | `Linear(256 -> 1354)` |
| **Loss / Decoding** | Connectionist Temporal Classification (CTC) |
| **Weights** | Hugging Face: `manohonsy/how2sign-pose-cslr` |
