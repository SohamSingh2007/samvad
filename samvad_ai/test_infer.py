"""
Test script to verify PoseTransformerCSLR loading, forward pass, and CTC decoding.
"""

import numpy as np
import torch
from model import PoseTransformerCSLR
from pipeline import prepare_input_tensor


def test_model():
    print("Testing PoseTransformerCSLR instantiation & download...")
    device = "cuda" if torch.cuda.is_available() else (
        "mps" if torch.backends.mps.is_available() else "cpu"
    )

    try:
        model = PoseTransformerCSLR.from_pretrained("manohonsy/how2sign-pose-cslr", device=device)
        print(f"Model loaded successfully!")
        print(f"- Vocab size: {model.vocab_size}")
        print(f"- Blank token ID: {model.blank_id}")
        print(f"- Device: {device}")
    except Exception as e:
        print(f"Warning: Remote download failed or offline ({e}). Testing with local init...")
        model = PoseTransformerCSLR(input_dim=153, d_model=256, n_heads=4, n_layers=4, vocab_size=1354)
        model.to(device)

    # Simulate sequence: T=32 frames, 150 landmarks, 3 mask
    T = 32
    dummy_features = np.random.randn(T, 150).astype(np.float32)
    dummy_mask = np.ones((T, 3), dtype=bool)

    # Process and normalize
    x_tensor = prepare_input_tensor(dummy_features, dummy_mask, device=device)
    print(f"Input tensor shape: {x_tensor.shape}")

    # Forward pass
    with torch.no_grad():
        log_probs, lens = model(x_tensor)
        print(f"Log probs shape: {log_probs.shape}")  # (1, T, vocab_size)

        # CTC greedy decoding
        decoded_ids = model.decode_ctc(log_probs)[0]
        words = model.ids_to_words(decoded_ids)
        print(f"Decoded token IDs: {decoded_ids}")
        print(f"Decoded glosses: {' '.join(words) if words else '[blank / silence]'}")

    print("\nAll pipeline checks passed successfully!")


if __name__ == "__main__":
    test_model()
