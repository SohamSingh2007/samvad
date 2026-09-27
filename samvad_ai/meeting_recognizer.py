"""
Meeting Sign Language Recogniser
Provides real-time continuous recognition for video meeting applications.
Uses sliding-window pose buffering, CTC decoding, silence/pause segmentation,
and sentence assembly.
"""

import time
from collections import deque
from typing import Callable, List, Optional, Set

import numpy as np
import torch

from model import PoseTransformerCSLR
from pipeline import prepare_input_tensor


# Exact target phrase mappings
_PHRASE_MAP: dict = {
    # Core Conversational Phrases
    "HELLO":       "Hello",
    "HI":          "Hello",
    "YES":         "Yes",
    "NO":          "No",
    "I":           "I",
    "ME":          "I",
    "IX-me":       "I",
    "IX":          "I",
    "YOU":         "You",
    "IX-YOU":      "You",
    "IX-you":      "You",
    "WE":          "We",
    "IX-WE":       "We",
    "IX-we":       "We",
    "LOOK":        "Look",
    "PLEASE":      "Please",
    "THANK_YOU":   "Thank you",
    "THANK-YOU":   "Thank you",
    "THANK":       "Thank you",
    "THANKS":      "Thank you",
    "WELCOME":     "Welcome",
    "WHAT":        "What",
    "HOW":         "How",
    "HOW_ARE_YOU": "How are you?",
}
TARGET_GLOSSES = frozenset(_PHRASE_MAP.keys())
_FILLER = frozenset()
_NOISE_SENTENCES = {""}


class MeetingSignRecognizer:
    """
    Optimised continuous sliding-window ASL recogniser restricted strictly
    to target conversational phrases.
    """

    def __init__(
        self,
        model: Optional[PoseTransformerCSLR] = None,
        model_repo: str = "manohonsy/how2sign-pose-cslr",
        device: Optional[str] = None,
        window_size: int = 32,          # 32 frames @ 8 fps = 4 s context
        hop_size: int = 6,              # infer every 6 frames (optimised for CPU/MPS)
        silence_timeout_sec: float = 0.8,
        on_new_gloss: Optional[Callable[[str], None]] = None,
        on_sentence_commit: Optional[Callable[[str], None]] = None,
    ):
        # ── Device selection ───────────────────────────────────────────────
        if device is None:
            self.device = (
                "cuda" if torch.cuda.is_available()
                else "mps" if torch.backends.mps.is_available()
                else "cpu"
            )
        else:
            self.device = device

        # ── Model loading ──────────────────────────────────────────────────
        if model is None:
            print(f"Loading {model_repo} onto {self.device}...")
            self.model = PoseTransformerCSLR.from_pretrained(model_repo, device=self.device)
        else:
            self.model = model.to(self.device)
            self.model.eval()

        self.window_size        = window_size
        self.hop_size           = hop_size
        self.silence_timeout_sec = silence_timeout_sec
        self.on_new_gloss       = on_new_gloss
        self.on_sentence_commit = on_sentence_commit

        # Target vocabulary constraint
        self.target_glosses = TARGET_GLOSSES
        self.allowed_token_ids: Set[int] = set()
        if self.model and hasattr(self.model, "vocab") and self.model.vocab:
            for word, idx in self.model.vocab.items():
                w_norm = word.upper().replace("-", "_")
                if word in _PHRASE_MAP or w_norm in _PHRASE_MAP:
                    self.allowed_token_ids.add(idx)

        # ── Rolling frame buffers ──────────────────────────────────────────
        self.feature_buffer: deque = deque(maxlen=window_size)
        self.mask_buffer:    deque = deque(maxlen=window_size)

        # ── Transcription state ────────────────────────────────────────────
        self.current_sentence_glosses: List[str] = []
        self.last_emitted_gloss: Optional[str]   = None
        self.last_active_time: float             = time.time()
        self.frames_since_inference: int         = 0

    # Keep public reference for external code that reads FILLER_TOKENS
    FILLER_TOKENS = _FILLER

    # ── Public frame-push API ──────────────────────────────────────────────

    def push_frame_features(self, feat_150: np.ndarray, mask_3: np.ndarray) -> Optional[List[str]]:
        """
        Accept pre-extracted MediaPipe features for one frame (target: 8 fps).
        Returns newly recognised glosses when an inference step fires, else None.
        """
        self.feature_buffer.append(feat_150)
        self.mask_buffer.append(mask_3)
        self.frames_since_inference += 1

        hands_active = bool(mask_3[1] or mask_3[2])
        now = time.time()

        if hands_active:
            self.last_active_time = now
        elif self.current_sentence_glosses and (now - self.last_active_time) > self.silence_timeout_sec:
            self._commit_sentence()

        # Run inference when the buffer is large enough and hop interval elapsed
        if (
            len(self.feature_buffer) >= min(10, self.window_size // 2)
            and self.frames_since_inference >= self.hop_size
        ):
            self.frames_since_inference = 0
            return self._run_inference()

        return None

    # ── Internal inference ─────────────────────────────────────────────────

    def _run_inference(self) -> List[str]:
        feats = np.array(self.feature_buffer, dtype=np.float32)
        masks = np.array(self.mask_buffer,   dtype=bool)

        # Suppress inference on silent/empty frames (no hands)
        if not np.any(masks[:, 1:]):
            return []

        x_tensor = prepare_input_tensor(feats, masks, device=self.device)

        with torch.no_grad():
            log_probs, _ = self.model(x_tensor)
            decoded_ids  = self.model.decode_ctc(
                log_probs,
                min_prob_threshold=0.55,
                allowed_ids=self.allowed_token_ids
            )[0]
            glosses      = self.model.ids_to_words(decoded_ids)

        new_tokens = []
        for g in glosses:
            if g.startswith("<") and g.endswith(">"):
                continue

            if g in ("THANK-YOU", "THANK", "THANKS"):
                g = "THANK_YOU"

            # Strictly allow ONLY target glosses
            if g not in self.target_glosses:
                continue

            # Deduplicate consecutive identical tokens
            if self.current_sentence_glosses and self.current_sentence_glosses[-1] == g:
                continue

            print(f"[ASL] {g}")
            self.current_sentence_glosses.append(g)
            self.last_emitted_gloss = g
            new_tokens.append(g)
            if self.on_new_gloss:
                self.on_new_gloss(g)

        return new_tokens

    def _commit_sentence(self):
        """Finalise and emit the current sentence transcript."""
        if not self.current_sentence_glosses:
            return

        cleaned = self.format_glosses_to_readable(self.current_sentence_glosses)
        if cleaned:
            if self.on_sentence_commit:
                self.on_sentence_commit(cleaned)

        self.current_sentence_glosses.clear()
        self.last_emitted_gloss = None

    # ── Subtitle formatting ────────────────────────────────────────────────

    @classmethod
    def format_glosses_to_readable(cls, glosses: List[str]) -> str:
        """
        Convert a gloss list into human-readable subtitle text.
        Strictly only target phrases (1-10, Yes, No, I, You, We, Look, Please, Thank You, Welcome, What, How Are You?)
        are formatted; all others are ignored.
        """
        if not glosses:
            return ""

        words = []
        for g in glosses:
            mapped = _PHRASE_MAP.get(g)
            if mapped:
                words.append(mapped)

        # Natural ASL combination: "How" + "You" -> "How are you?"
        combined = []
        i = 0
        while i < len(words):
            if i + 1 < len(words) and words[i].lower() == "how" and words[i + 1].lower() == "you":
                combined.append("How are you?")
                i += 2
            else:
                combined.append(words[i])
                i += 1
        words = combined

        text = " ".join(words).strip()
        return text[0].upper() + text[1:] if text else ""

    # ── Live subtitle accessor ─────────────────────────────────────────────

    def get_live_subtitle(self) -> str:
        """Return the current in-progress subtitle string."""
        return self.format_glosses_to_readable(self.current_sentence_glosses)

    # ── Reset ──────────────────────────────────────────────────────────────

    def reset(self):
        """Clear all buffers. Call on WebSocket reconnect or user reset."""
        self.feature_buffer.clear()
        self.mask_buffer.clear()
        self.current_sentence_glosses.clear()
        self.last_emitted_gloss     = None
        self.frames_since_inference = 0
        self.last_active_time       = time.time()
