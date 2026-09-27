"""
MediaPipe Holistic Pose Extraction & Normalization Pipeline for CSLR
Extracts 8 upper-body pose landmarks + 21 left hand + 21 right hand landmarks (150-D)
plus a 3-D presence mask = 153-D feature vector per frame.
"""

from typing import List, Optional, Tuple, Union
import cv2
import numpy as np
import torch

try:
    import mediapipe as mp
    mp_holistic = mp.solutions.holistic
    HAS_MEDIAPIPE = True
except ImportError:
    HAS_MEDIAPIPE = False


# 8 Pose landmark indices from MediaPipe Holistic (Upper Body)
# 0: Nose, 11: Left Shoulder, 12: Right Shoulder, 13: Left Elbow,
# 14: Right Elbow, 15: Left Wrist, 16: Right Wrist, 23: Left Hip (or Mid-Hip)
POSE_LANDMARK_INDICES = [0, 11, 12, 13, 14, 15, 16, 23]


def normalize_features(
    features: np.ndarray,
    mask: np.ndarray,
) -> np.ndarray:
    """
    Normalizes coordinates sequence (T, 150) using shoulder center and shoulder width.
    Args:
        features: numpy array of shape (T, 150) containing (x, y, z) for 50 landmarks
                  (8 pose + 21 left hand + 21 right hand).
        mask: numpy array of shape (T, 3) boolean or float indicating presence of
              [pose, left_hand, right_hand].
    Returns:
        normalized_features: numpy array of shape (T, 150)
    """
    T = features.shape[0]
    # Reshape features to (T, 50, 3)
    coords = features.reshape(T, 50, 3).copy()

    # Pose landmarks: indices 0..7
    # Left shoulder is index 1, Right shoulder is index 2 in our 8-pose layout
    left_shoulder = coords[:, 1, :]
    right_shoulder = coords[:, 2, :]

    # Center: midpoint between shoulders (T, 1, 3)
    mid_shoulder = (left_shoulder + right_shoulder) / 2.0
    mid_shoulder = mid_shoulder[:, np.newaxis, :]

    # Scale: distance between shoulders (T, 1, 1)
    shoulder_dist = np.linalg.norm(left_shoulder - right_shoulder, axis=-1, keepdims=True)
    shoulder_dist = np.where(shoulder_dist < 1e-4, 1.0, shoulder_dist)[:, np.newaxis, :]

    # Normalize landmarks where pose is present
    pose_present = mask[:, 0].reshape(T, 1, 1)
    
    # Translate and scale
    norm_coords = (coords - mid_shoulder) / shoulder_dist

    # Zero out absent body components
    left_present = mask[:, 1].reshape(T, 1, 1)
    right_present = mask[:, 2].reshape(T, 1, 1)

    norm_coords[:, :8, :] = np.where(pose_present, norm_coords[:, :8, :], 0.0)
    norm_coords[:, 8:29, :] = np.where(left_present, norm_coords[:, 8:29, :], 0.0)
    norm_coords[:, 29:50, :] = np.where(right_present, norm_coords[:, 29:50, :], 0.0)

    return norm_coords.reshape(T, 150).astype(np.float32)


def prepare_input_tensor(
    features: np.ndarray,
    mask: np.ndarray,
    device: Optional[Union[str, torch.device]] = None,
) -> torch.Tensor:
    """
    Applies normalization and appends the 3-D presence mask.
    Returns:
        Tensor of shape (1, T, 153)
    """
    if features.ndim == 1:
        features = features[np.newaxis, :]
    if mask.ndim == 1:
        mask = mask[np.newaxis, :]

    # 1. Normalize (T, 150)
    norm_feat = normalize_features(features, mask)

    # 2. Concat 3-D mask: (T, 150) + (T, 3) -> (T, 153)
    mask_float = mask.astype(np.float32)
    x_153 = np.concatenate([norm_feat, mask_float], axis=-1)

    # 3. Add batch dimension: (1, T, 153)
    x_tensor = torch.from_numpy(x_153).unsqueeze(0).float()
    if device is not None:
        x_tensor = x_tensor.to(device)

    return x_tensor


class HolisticFeatureExtractor:
    """
    Extracts 150 keypoints + 3 presence mask values from video frames using MediaPipe Holistic.
    """

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        if not HAS_MEDIAPIPE:
            raise ImportError(
                "mediapipe is required for HolisticFeatureExtractor. Run: pip install mediapipe"
            )
        self.holistic = mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=0,
            smooth_landmarks=True,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def process_frame(
        self, frame_bgr: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, any]:
        """
        Process a single BGR frame.
        Returns:
            features: np.ndarray of shape (150,)
            mask: np.ndarray of shape (3,) [pose_ok, left_hand_ok, right_hand_ok]
            results: MediaPipe raw Holistic results (for drawing overlays)
        """
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.holistic.process(frame_rgb)

        pose_pts = []
        pose_ok = results.pose_landmarks is not None
        if pose_ok:
            for idx in POSE_LANDMARK_INDICES:
                lm = results.pose_landmarks.landmark[idx]
                pose_pts.extend([lm.x, lm.y, lm.z])
        else:
            pose_pts = [0.0] * (len(POSE_LANDMARK_INDICES) * 3)

        left_pts = []
        left_ok = results.left_hand_landmarks is not None
        if left_ok:
            for lm in results.left_hand_landmarks.landmark:
                left_pts.extend([lm.x, lm.y, lm.z])
        else:
            left_pts = [0.0] * (21 * 3)

        right_pts = []
        right_ok = results.right_hand_landmarks is not None
        if right_ok:
            for lm in results.right_hand_landmarks.landmark:
                right_pts.extend([lm.x, lm.y, lm.z])
        else:
            right_pts = [0.0] * (21 * 3)

        features = np.array(pose_pts + left_pts + right_pts, dtype=np.float32)
        mask = np.array([pose_ok, left_ok, right_ok], dtype=bool)

        return features, mask, results

    def close(self):
        self.holistic.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def extract_video_features(
    video_path: str,
    target_fps: float = 8.0,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extracts features and mask from a video file, resampling frames to target_fps (default 8 fps).
    Returns:
        features: (T, 150)
        mask: (T, 3)
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video at: {video_path}")

    source_fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    stride = max(1, int(round(source_fps / target_fps)))

    features_list = []
    mask_list = []

    extractor = HolisticFeatureExtractor()
    frame_idx = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % stride == 0:
                feat, msk, _ = extractor.process_frame(frame)
                features_list.append(feat)
                mask_list.append(msk)
            frame_idx += 1
    finally:
        cap.release()
        extractor.close()

    if not features_list:
        return np.zeros((0, 150), dtype=np.float32), np.zeros((0, 3), dtype=bool)

    return np.array(features_list, dtype=np.float32), np.array(mask_list, dtype=bool)
