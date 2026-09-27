"""
PoseTransformerCSLR: Continuous Sign Language Recognition Model
Architecture:
- Input: 153-D per frame (150-D MediaPipe Holistic keypoints + 3-D presence mask)
- Stem: Linear(153 -> 256) + LayerNorm + GELU + Dropout
- Positional Encoding: Sinusoidal
- Encoder: 4 x TransformerEncoderLayer (d=256, heads=4, FF=1024, pre-norm GELU)
- Head: Linear(256 -> 1354)
- Loss / Decoding: CTC
"""

import json
import math
from typing import Dict, List, Optional, Set, Tuple, Union

import torch
import torch.nn as nn
import torch.nn.functional as F
from huggingface_hub import hf_hub_download
from safetensors.torch import load_file as load_safetensors


class SinusoidalPositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer("pe", pe.unsqueeze(0))  # (1, max_len, d_model)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (B, T, d_model)
        return x + self.pe[:, : x.size(1)]


class PoseTransformerCSLR(nn.Module):
    def __init__(
        self,
        input_dim: int = 153,
        d_model: int = 256,
        n_heads: int = 4,
        n_layers: int = 4,
        ff_dim: int = 1024,
        dropout: float = 0.1,
        vocab_size: int = 1354,
    ):
        super().__init__()
        self.input_dim = input_dim
        self.d_model = d_model
        self.vocab_size = vocab_size

        # Stem: Linear(153 -> 256) + LayerNorm + GELU + Dropout
        self.stem = nn.Sequential(
            nn.Linear(input_dim, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout),
        )

        # Sinusoidal Positional Encoding
        self.pos_encoder = SinusoidalPositionalEncoding(d_model)

        # 4 x TransformerEncoderLayer (d=256, heads=4, FF=1024, pre-norm GELU)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=ff_dim,
            dropout=dropout,
            activation=F.gelu,
            norm_first=True,  # Pre-norm
            batch_first=True,
        )
        self.encoder = nn.TransformerEncoder(
            encoder_layer,
            num_layers=n_layers,
            norm=nn.LayerNorm(d_model),
        )

        # Classification Head: Linear(256 -> 1354)
        self.head = nn.Linear(d_model, vocab_size)

        # Vocabulary metadata (populated when loaded from pretrained)
        self.vocab: Dict[str, int] = {}
        self.id_to_token: Dict[int, str] = {}
        self.blank_id: int = 1

    def forward(
        self,
        x: torch.Tensor,
        lens: Optional[torch.Tensor] = None,
        src_key_padding_mask: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.
        Args:
            x: Tensor of shape (Batch, SeqLen, 153)
            lens: Tensor of sequence lengths (Batch,)
            src_key_padding_mask: Optional boolean mask where True indicates padding.
        Returns:
            log_probs: Tensor of shape (Batch, SeqLen, vocab_size)
            lens: Tensor of sequence lengths (Batch,)
        """
        if lens is None:
            lens = torch.full(
                (x.size(0),), x.size(1), dtype=torch.long, device=x.device
            )

        # Stem projection: (B, T, 153) -> (B, T, 256)
        h = self.stem(x)
        h = self.pos_encoder(h)

        # Transformer encoder
        h = self.encoder(h, src_key_padding_mask=src_key_padding_mask)

        # Head logits -> log probabilities for CTC
        logits = self.head(h)
        log_probs = F.log_softmax(logits, dim=-1)

        return log_probs, lens

    def decode_ctc(
        self,
        log_probs: torch.Tensor,
        blank_id: Optional[int] = None,
        min_prob_threshold: float = 0.0,
        allowed_ids: Optional[Set[int]] = None,
    ) -> List[List[int]]:
        """
        Greedy CTC decoding with optional minimum probability threshold and vocab masking:
        Mask non-allowed classes -> Argmax over allowed vocab -> mask low-confidence predictions as blank -> collapse consecutive duplicates -> remove blank tokens.
        """
        if blank_id is None:
            blank_id = self.blank_id

        # Convert log_probs to probabilities for thresholding
        probs = torch.softmax(log_probs, dim=-1)

        # Restrict argmax strictly to target vocabulary IDs if provided
        if allowed_ids is not None:
            mask = torch.ones_like(probs, dtype=torch.bool)
            allowed_list = list(allowed_ids | {blank_id})
            mask[..., allowed_list] = False
            probs = probs.masked_fill(mask, 0.0)

        max_probs, preds = probs.max(dim=-1)

        # Suppress predictions where confidence is below the threshold
        if min_prob_threshold > 0.0:
            preds = torch.where(
                max_probs >= min_prob_threshold,
                preds,
                torch.full_like(preds, blank_id)
            )

        preds_np = preds.detach().cpu().numpy()
        results = []
        for batch_pred in preds_np:
            collapsed = []
            prev = None
            for p in batch_pred:
                p_int = int(p)
                if p_int != prev:
                    collapsed.append(p_int)
                    prev = p_int
            gloss_ids = [p for p in collapsed if p != blank_id]
            results.append(gloss_ids)
        return results

    def ids_to_words(self, gloss_ids: List[int]) -> List[str]:
        """Convert token IDs to gloss strings."""
        if not self.id_to_token:
            return [str(idx) for idx in gloss_ids]
        return [self.id_to_token.get(idx, f"<unk_{idx}>") for idx in gloss_ids]

    @classmethod
    def from_pretrained(
        cls,
        repo_id: str = "manohonsy/how2sign-pose-cslr",
        device: Optional[Union[str, torch.device]] = None,
    ) -> "PoseTransformerCSLR":
        """
        Downloads config.json, vocab.json, and model.safetensors from HuggingFace
        and initializes the PoseTransformerCSLR model.
        """
        if device is None:
            device = "cuda" if torch.cuda.is_available() else (
                "mps" if torch.backends.mps.is_available() else "cpu"
            )

        # 1. Download configuration and vocab
        config_path = hf_hub_download(repo_id, "config.json")
        vocab_path = hf_hub_download(repo_id, "vocab.json")
        weights_path = hf_hub_download(repo_id, "model.safetensors")

        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        with open(vocab_path, "r", encoding="utf-8") as f:
            vocab_data = json.load(f)

        token_to_id = vocab_data.get("token_to_id", vocab_data)
        id_to_token = {int(i): t for t, i in token_to_id.items()}
        blank_id = token_to_id.get("<blank>", 1)

        # 2. Instantiate model with config
        model = cls(
            input_dim=config.get("input_dim", 153),
            d_model=config.get("d_model", 256),
            n_heads=config.get("n_heads", 4),
            n_layers=config.get("n_layers", 4),
            ff_dim=config.get("ff_dim", 1024),
            dropout=config.get("dropout", 0.1),
            vocab_size=config.get("vocab_size", len(token_to_id)),
        )

        model.vocab = token_to_id
        model.id_to_token = id_to_token
        model.blank_id = blank_id

        # 3. Load state dict from safetensors
        state_dict = load_safetensors(weights_path)

        # Flexible state_dict key adaptation in case of prefix differences
        model_state = model.state_dict()
        adapted_dict = {}

        # Strip any "model." prefix if present
        cleaned_weights = {
            (k[6:] if k.startswith("model.") else k): v
            for k, v in state_dict.items()
        }

        for k, v in model_state.items():
            if k in cleaned_weights:
                adapted_dict[k] = cleaned_weights[k]
            elif f"module.{k}" in cleaned_weights:
                adapted_dict[k] = cleaned_weights[f"module.{k}"]
            else:
                adapted_dict[k] = v

        model.load_state_dict(adapted_dict, strict=False)
        model.to(device)
        model.eval()

        return model
