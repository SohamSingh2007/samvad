"""
FastAPI Server — Real-Time ASL Recognition
Endpoints:
  GET  /               → serves client_example.html
  GET  /health         → {"status","model_loaded","vocab_size","device"}
  GET  /asl_*.jpg      → static image assets for the UI
  POST /recognize/npz  → batch recognition from .npz feature file
  POST /recognize/video→ batch recognition from uploaded video file
  WS   /ws/live        → real-time frame-by-frame recognition
"""

import asyncio
import base64
import io
import json
import os
import tempfile
from typing import Dict, List, Optional

import cv2
import numpy as np
import torch
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from model import PoseTransformerCSLR
from pipeline import HolisticFeatureExtractor, prepare_input_tensor, extract_video_features
from meeting_recognizer import MeetingSignRecognizer
from gesture_recognizer import GestureClassifier, NameAndNumberAggregator


# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ASL Recognition Service",
    description="Real-time CSLR backend for video meeting applications.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

global_model: Optional[PoseTransformerCSLR] = None


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
def startup_event():
    global global_model
    device = (
        "cuda" if torch.cuda.is_available()
        else "mps" if torch.backends.mps.is_available()
        else "cpu"
    )
    print(f"Loading PoseTransformerCSLR model on {device}...")
    global_model = PoseTransformerCSLR.from_pretrained(
        repo_id="manohonsy/how2sign-pose-cslr", device=device
    )
    print("Model loaded successfully!")


# ---------------------------------------------------------------------------
# Static file helpers
# ---------------------------------------------------------------------------
def _asset(filename: str) -> str:
    """Absolute path to a file in the same directory as server.py."""
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)


@app.get("/")
def serve_index():
    return FileResponse(_asset("client_example.html"))


@app.get("/asl_model_guide.jpg")
@app.get("/asl_guide.jpg")
def serve_model_guide():
    return FileResponse(_asset("asl_model_guide.jpg"), media_type="image/jpeg")


@app.get("/asl_full_chart.jpg")
def serve_full_chart():
    return FileResponse(_asset("asl_full_chart.jpg"), media_type="image/jpeg")


@app.get("/asl_numbers_guide.jpg")
def serve_numbers_guide():
    return FileResponse(_asset("asl_numbers_guide.jpg"), media_type="image/jpeg")


@app.get("/asl_how_are_you.jpg")
def serve_how_are_you():
    return FileResponse(_asset("asl_how_are_you.jpg"), media_type="image/jpeg")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "model_loaded": global_model is not None,
        "vocab_size": global_model.vocab_size if global_model else None,
        "device": str(next(global_model.parameters()).device) if global_model else None,
    }


# ---------------------------------------------------------------------------
# Batch endpoints
# ---------------------------------------------------------------------------
class RecognitionResponse(BaseModel):
    glosses: List[str]
    sentence: str
    tokens_count: int


def _decode_features(features: np.ndarray, masks: np.ndarray) -> RecognitionResponse:
    """Run CTC decoding on feature tensor restricted strictly to target signs."""
    device = next(global_model.parameters()).device
    x_tensor = prepare_input_tensor(features, masks, device=device)

    allowed_ids = None
    if hasattr(global_model, "vocab") and global_model.vocab:
        from meeting_recognizer import TARGET_GLOSSES, _PHRASE_MAP
        allowed_ids = {
            idx for word, idx in global_model.vocab.items()
            if word in _PHRASE_MAP or word.upper().replace("-", "_") in _PHRASE_MAP
        }

    with torch.no_grad():
        log_probs, _ = global_model(x_tensor)
        decoded_ids  = global_model.decode_ctc(log_probs, allowed_ids=allowed_ids)[0]
        glosses      = global_model.ids_to_words(decoded_ids)

    cleaned  = [g for g in glosses if g in TARGET_GLOSSES]
    sentence = MeetingSignRecognizer.format_glosses_to_readable(cleaned)
    return RecognitionResponse(glosses=cleaned, sentence=sentence, tokens_count=len(cleaned))


@app.post("/recognize/npz", response_model=RecognitionResponse)
async def recognize_npz(file: UploadFile = File(...)):
    """Accept an .npz with 'features' (T,150) and 'mask' (T,3) arrays."""
    if global_model is None:
        return {"error": "Model not loaded"}
    content = await file.read()
    with np.load(io.BytesIO(content)) as data:
        features = data["features"].astype(np.float32)
        masks    = data["mask"].astype(bool)
    return _decode_features(features, masks)


@app.post("/recognize/video", response_model=RecognitionResponse)
async def recognize_video(file: UploadFile = File(...)):
    """Accept a video file, extract holistic features, run CSLR."""
    if global_model is None:
        return {"error": "Model not loaded"}

    suffix = os.path.splitext(file.filename or "video.mp4")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        features, masks = extract_video_features(tmp_path, target_fps=8.0)
        if len(features) == 0:
            return RecognitionResponse(glosses=[], sentence="", tokens_count=0)
        return _decode_features(features, masks)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# ---------------------------------------------------------------------------
# TTS Endpoint (OpenAI Voice API with Web Speech fallback)
# ---------------------------------------------------------------------------
@app.post("/api/tts")
async def tts_endpoint(payload: dict):
    """
    OpenAI TTS endpoint: generates speech audio from subtitle text using tts-1.
    Falls back gracefully if OPENAI_API_KEY is not configured.
    """
    text = payload.get("text", "").strip()
    if not text:
        return {"status": "error", "message": "Text is empty"}

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"status": "fallback", "message": "No OPENAI_API_KEY set; using browser Web Speech API"}

    import httpx
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "tts-1",
                    "input": text,
                    "voice": payload.get("voice", "alloy"),
                },
            )
            if resp.status_code == 200:
                audio_b64 = base64.b64encode(resp.content).decode("utf-8")
                return {"status": "ok", "audio_base64": audio_b64}
            else:
                return {"status": "fallback", "error": resp.text}
    except Exception as e:
        return {"status": "fallback", "error": str(e)}


# ---------------------------------------------------------------------------
# WebSocket — real-time live stream
# ---------------------------------------------------------------------------
@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    """
    Accept binary JPEG frames or JSON payloads.

    Client → server message types:
      Binary bytes         : raw JPEG frame (fastest path)
      {"type":"frame","data":"<b64>"}   : base64-encoded JPEG
      {"type":"keypoints","features":[…150],"mask":[…3]}
      {"type":"reset"}     : clear all buffers

    Server → client messages:
      {"type":"partial","new_gloss":"…","current_sentence":"…"}
      {"type":"commit","final_sentence":"…"}
      {"type":"tracking","pose":bool,"left_hand":bool,"right_hand":bool,
       "landmarks":{…},"active_gesture":"…","fingers":{…}}
      {"type":"status","message":"reset_complete"}
    """
    await websocket.accept()

    # ── Per-connection objects ─────────────────────────────────────────────
    out_queue: asyncio.Queue = asyncio.Queue()

    def on_new_gloss(gloss: str):
        asyncio.create_task(out_queue.put({
            "type": "partial",
            "new_gloss": gloss,
            "current_sentence": recognizer.get_live_subtitle(),
        }))

    def on_sentence_commit(sentence: str):
        asyncio.create_task(out_queue.put({
            "type": "commit",
            "final_sentence": sentence,
        }))

    device = str(next(global_model.parameters()).device) if global_model else "cpu"
    recognizer  = MeetingSignRecognizer(
        model=global_model, device=device,
        window_size=32, hop_size=6, silence_timeout_sec=0.8,
        on_new_gloss=on_new_gloss, on_sentence_commit=on_sentence_commit,
    )
    extractor   = HolisticFeatureExtractor()
    aggregator  = NameAndNumberAggregator(window_size=8, min_votes=4, hold_duration_required=1.0)

    async def sender():
        try:
            while True:
                await websocket.send_json(await out_queue.get())
        except Exception:
            pass

    sender_task = asyncio.create_task(sender())

    # ── Main receive loop ──────────────────────────────────────────────────
    try:
        while True:
            msg = await websocket.receive()

            if msg.get("type") == "websocket.disconnect":
                break

            frame = None

            # ── Binary path (fastest: browser sends raw JPEG bytes) ────────
            if msg.get("bytes"):
                arr   = np.frombuffer(msg["bytes"], np.uint8)
                frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

            # ── Text / JSON path ───────────────────────────────────────────
            elif msg.get("text"):
                payload  = json.loads(msg["text"])
                msg_type = payload.get("type")

                if msg_type == "frame":
                    arr   = np.frombuffer(base64.b64decode(payload["data"]), np.uint8)
                    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

                elif msg_type == "keypoints":
                    feat = np.array(payload["features"], dtype=np.float32)
                    mask = np.array(payload["mask"], dtype=bool)
                    recognizer.push_frame_features(feat, mask)

                elif msg_type == "reset":
                    recognizer.reset()
                    aggregator.reset()
                    await websocket.send_json({"type": "status", "message": "reset_complete"})

            # ── Process decoded frame ──────────────────────────────────────
            if frame is None:
                continue

            feat, mask, results = extractor.process_frame(frame)

            # ── Geometric gesture detection ────────────────────────────────
            instant      = None
            active_label = None
            fingers      = None

            has_hands = (
                results.left_hand_landmarks is not None
                or results.right_hand_landmarks is not None
            )
            if has_hands:
                instant, event = aggregator.process_hands(
                    left_landmarks=results.left_hand_landmarks,
                    right_landmarks=results.right_hand_landmarks,
                    pose_landmarks=results.pose_landmarks,
                )
                if instant:
                    active_label = instant["label"]
                    fingers      = instant.get("fingers")

                if event:
                    etype = event["event"]
                    if etype == "phrase_detected":
                        token = event["phrase"]
                    else:
                        token = None

                    if token and token in recognizer.target_glosses:
                        last = recognizer.current_sentence_glosses
                        if not last or last[-1] != token:
                            recognizer.current_sentence_glosses.append(token)
                            recognizer.last_emitted_gloss = token
                            on_new_gloss(token)

            # Run continuous CSLR only when not holding an active or candidate discrete gesture
            is_holding_discrete = instant is not None or bool(getattr(aggregator, "candidate_gesture", None))
            if not is_holding_discrete:
                recognizer.push_frame_features(feat, mask)
            else:
                recognizer.feature_buffer.append(feat)
                recognizer.mask_buffer.append(mask)

            # ── Build and send tracking frame ──────────────────────────────
            landmarks_data: Dict = {}
            if results.pose_landmarks:
                landmarks_data["pose"] = [
                    {"x": round(lm.x, 4), "y": round(lm.y, 4)}
                    for lm in results.pose_landmarks.landmark[:25]
                ]
            if results.left_hand_landmarks:
                landmarks_data["left_hand"] = [
                    {"x": round(lm.x, 4), "y": round(lm.y, 4)}
                    for lm in results.left_hand_landmarks.landmark
                ]
            if results.right_hand_landmarks:
                landmarks_data["right_hand"] = [
                    {"x": round(lm.x, 4), "y": round(lm.y, 4)}
                    for lm in results.right_hand_landmarks.landmark
                ]

            raw_code = instant["gesture"] if instant else None
            await websocket.send_json({
                "type":              "tracking",
                "pose":              bool(mask[0]),
                "left_hand":         bool(mask[1]),
                "right_hand":        bool(mask[2]),
                "landmarks":         landmarks_data,
                "active_gesture":    active_label,
                "gesture_code":      raw_code,
                "fingers":           fingers,
                "candidate_gesture": getattr(aggregator, "candidate_gesture", None),
                "hold_seconds":      round(float(getattr(aggregator, "current_hold_elapsed", 0.0)), 2),
                "hold_progress":     round(float(getattr(aggregator, "hold_progress", 0.0)), 2),
            })

    except WebSocketDisconnect:
        pass
    finally:
        sender_task.cancel()
        extractor.close()


# ---------------------------------------------------------------------------
# Dev entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
